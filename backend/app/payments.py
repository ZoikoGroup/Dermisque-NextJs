"""Card payments through Stripe (PaymentIntents + the Payment Element on the storefront).

Flow: the storefront asks /api/checkout/payment-intent for a client secret (amount priced here, never by the
browser), confirms the card with Stripe.js (3-D Secure included), then places the order with the intent id.
place_order verifies the intent with Stripe before creating the order, and refunds it if the order fails.
"""

import logging

import stripe

from .config import settings
from .models import User

log = logging.getLogger("dermisque.payments")


class PaymentError(Exception):
    """A message that is safe to show the customer."""


def _client() -> stripe.StripeClient:
    return stripe.StripeClient(settings.stripe_secret_key, max_network_retries=2)


def _owner(pi: stripe.PaymentIntent) -> str | None:
    return pi.metadata.to_dict().get("user_id") if pi.metadata else None


def to_minor(usd_cents: int, rate: float) -> int:
    """USD cents -> minor units of the checkout currency (matches the storefront's Math.round)."""
    return int(usd_cents * rate + 0.5)


def open_intent(amount: int, currency: str, user: User, reuse_id: str | None = None) -> stripe.PaymentIntent:
    """Creates a card PaymentIntent, or re-prices the customer's unpaid one from an earlier attempt."""
    c = _client()
    try:
        if reuse_id:
            try:
                pi = c.v1.payment_intents.retrieve(reuse_id)
                if _owner(pi) == user.id and pi.status in {
                    "requires_payment_method", "requires_confirmation", "requires_action",
                } and pi.currency == currency.lower():
                    if pi.amount != amount:
                        pi = c.v1.payment_intents.update(pi.id, {"amount": amount})
                    return pi
            except stripe.InvalidRequestError:
                pass  # unknown / foreign intent: start a fresh one
        return c.v1.payment_intents.create({
            "amount": amount,
            "currency": currency.lower(),
            # methods (cards, wallets, ...) come from Dashboard → Settings → Payment methods
            "automatic_payment_methods": {"enabled": True},
            "receipt_email": user.email,
            "description": "Dermisque order",
            "metadata": {"user_id": user.id, "email": user.email},
        })
    except stripe.StripeError as e:
        log.warning("Stripe could not open a payment: %s", e)
        raise PaymentError("We couldn't start the card payment. Please try again.") from e


def verify_paid(intent_id: str, user: User, amount: int, currency: str) -> None:
    """Raises PaymentError unless the intent belongs to this customer and was paid in full for this bag."""
    try:
        pi = _client().v1.payment_intents.retrieve(intent_id)
    except stripe.StripeError as e:
        log.warning("Stripe could not load payment %s: %s", intent_id, e)
        raise PaymentError("We couldn't confirm your card payment. Please try again.") from e
    if _owner(pi) != user.id:
        raise PaymentError("This payment does not belong to your account")
    if pi.status != "succeeded":
        raise PaymentError("Your card payment has not completed")
    if pi.amount_received != amount or pi.currency != currency.lower():
        # the bag or prices changed after paying: never keep money for a different order
        refund(intent_id)
        raise PaymentError("Your bag changed while paying, so the payment was refunded. Please check out again.")


def refund(intent_id: str) -> None:
    try:
        _client().v1.refunds.create({"payment_intent": intent_id})
        log.info("Refunded payment %s", intent_id)
    except stripe.StripeError:
        log.exception("REFUND FAILED for payment %s: refund it in the Stripe dashboard", intent_id)
