"use client";

import { useCurrency, usePrice } from "@/components/store/currency-provider";
import Image from "@/components/ui/product-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Banknote,
  Building2,
  Check,
  CreditCard,
  Globe2,
  Hash,
  Loader2,
  Lock,
  Map as MapIcon,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Tag,
  Truck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createPaymentIntent, placeOrder, validateCoupon, type PlaceOrderInput } from "@/app/actions/store";
import {
  PENDING_ORDER_KEY,
  StripeBridge,
  StripeElements,
  StripePaymentFields,
  type PaymentConfig,
} from "@/components/checkout/stripe-payment";
import type { Stripe, StripeElements as StripeElementsInstance } from "@stripe/stripe-js";
import { Button, ButtonLink } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { computeTotals, type AppliedCoupon } from "@/lib/pricing";
import { site } from "@/lib/site";
import type { Address, AddressInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cartSubtotal, useCart } from "@/store/cart";

type IconType = React.ComponentType<{ className?: string }>;
const ease = [0.22, 1, 0.36, 1] as const;

const emptyAddress = (name = "", phone = ""): AddressInput => ({
  fullName: name,
  phone,
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
});

const cardBrand = (n: string) => {
  const d = n.replace(/\D/g, "");
  if (/^4/.test(d)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "AMEX";
  if (/^6/.test(d)) return "Discover";
  return "";
};

export function CheckoutForm({
  addresses,
  user,
  payments,
}: {
  addresses: Address[];
  user: { name: string; phone: string };
  payments: PaymentConfig;
}) {
  const formatPrice = usePrice();
  const { currency, rates } = useCurrency();
  const stripeKey = payments.provider === "stripe" ? payments.publishableKey : null;
  const stripeRef = useRef<{ stripe: Stripe; elements: StripeElementsInstance } | null>(null);
  const onStripeReady = useCallback((s: { stripe: Stripe; elements: StripeElementsInstance } | null) => {
    stripeRef.current = s;
  }, []);
  const intentRef = useRef<string | null>(null);
  const [stripeComplete, setStripeComplete] = useState(false);
  const router = useRouter();
  const mounted = useMounted();
  const { items, clear, coupon: savedCoupon, setCoupon } = useCart();
  const [pending, start] = useTransition();

  const def = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<string | "new">(def?.id ?? "new");
  const [form, setForm] = useState<AddressInput>(emptyAddress(user.name, user.phone));
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [payment, setPayment] = useState<"CARD" | "COD">("CARD");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: user.name });
  const [flipped, setFlipped] = useState(false);
  const [notes, setNotes] = useState("");
  const [code, setCode] = useState(savedCoupon ?? "");
  const [coupon, setApplied] = useState<(AppliedCoupon & { description: string | null }) | null>(null);
  const [checking, startCheck] = useTransition();

  const subtotal = cartSubtotal(items);
  const totals = computeTotals(subtotal, coupon);

  if (!mounted)
    return (
      <div className="container-luxe grid gap-8 py-16 lg:grid-cols-[1fr_420px]">
        <div className="skeleton h-[70vh] !rounded-[2rem]" />
        <div className="skeleton h-[50vh] !rounded-[2rem]" />
      </div>
    );

  if (items.length === 0) {
    return (
      <div className="container-luxe py-28 text-center">
        <h1 className="font-display text-4xl">Your bag is empty</h1>
        <ButtonLink href="/shop" className="mt-8">Shop serums</ButtonLink>
      </div>
    );
  }

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const toFree = Math.max(0, site.freeShippingThreshold - subtotal);
  const addressDone =
    addressId !== "new" ||
    Boolean(form.fullName && form.phone && form.line1 && form.city && form.state && form.postalCode);
  const paymentDone =
    payment === "COD" ||
    (stripeKey ? stripeComplete : false) ||
    (!stripeKey && card.number.replace(/\D/g, "").length >= 13 && card.expiry.length === 5 && card.cvc.length >= 3 && Boolean(card.name));

  const applyCoupon = (value = code) =>
    startCheck(async () => {
      const res = await validateCoupon(value, subtotal);
      if (res.ok) {
        setApplied(res.data);
        setCoupon(res.data.code);
        toast.success(`${res.data.code} applied — ${res.data.description ?? "discount added"}`);
      } else {
        setApplied(null);
        toast.error(res.error);
      }
    });

  const submit = () => {
    const saved = addresses.find((a) => a.id === addressId);
    const address: AddressInput =
      addressId === "new" || !saved
        ? form
        : {
            fullName: saved.fullName,
            phone: saved.phone,
            line1: saved.line1,
            line2: saved.line2,
            city: saved.city,
            state: saved.state,
            postalCode: saved.postalCode,
            country: saved.country,
          };
    const input: PlaceOrderInput = {
      items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
      address,
      saveAddress: addressId === "new" && saveAddress,
      paymentMethod: payment,
      card: payment === "CARD" && !stripeKey ? card : undefined,
      coupon: coupon?.code ?? null,
      notes: notes || undefined,
      currency,
    };
    start(async () => {
      if (payment === "CARD" && stripeKey) {
        const paid = await payWithStripe(input);
        if (!paid) return;
        input.paymentIntentId = paid;
      }
      const res = await placeOrder(input);
      if (res.ok) {
        try {
          sessionStorage.removeItem(PENDING_ORDER_KEY);
        } catch {}
        clear();
        router.push(`/order-success/${res.data.orderNumber}`);
      } else toast.error(res.error);
    });
  };

  /** Confirms the payment with Stripe (3-D Secure included). Returns the paid intent id, or null. */
  const payWithStripe = async (input: PlaceOrderInput): Promise<string | null> => {
    const s = stripeRef.current;
    if (!s) {
      toast.error("The payment form is still loading, please try again");
      return null;
    }
    const checked = await s.elements.submit();
    if (checked.error) {
      toast.error(checked.error.message ?? "Please check your payment details");
      return null;
    }
    const intent = await createPaymentIntent({
      items: input.items,
      coupon: input.coupon,
      currency,
      paymentIntentId: intentRef.current,
    });
    if (!intent.ok) {
      toast.error(intent.error);
      return null;
    }
    intentRef.current = intent.data.paymentIntentId;
    try {
      // some methods (Klarna, bank apps) leave the site; /checkout/complete finishes the order on return
      sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ ...input, paymentIntentId: intent.data.paymentIntentId }));
    } catch {}
    const { error, paymentIntent } = await s.stripe.confirmPayment({
      elements: s.elements,
      clientSecret: intent.data.clientSecret,
      confirmParams: { return_url: `${window.location.origin}/checkout/complete` },
      redirect: "if_required",
    });
    if (error) {
      toast.error(error.message ?? "Your payment could not be completed");
      return null;
    }
    if (paymentIntent?.status === "succeeded") return paymentIntent.id;
    if (paymentIntent?.status === "processing") {
      toast.info("Your bank is still processing this payment. Please don't pay again; we'll be in touch.");
      return null;
    }
    toast.error("Your payment was not completed");
    return null;
  };

  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const payLabel = payment === "CARD" ? `Pay ${formatPrice(totals.total)}` : "Place order";
  const brand = cardBrand(card.number);

  return (
    <div className="relative">
      {/* ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[480px] rounded-full bg-sun/15 blur-[120px]" />
        <div className="absolute -right-40 top-0 size-[440px] rounded-full bg-aqua/20 blur-[120px]" />
      </div>

      <div className="container-luxe relative pb-32 pt-10 lg:pb-20">
        {/* Header + progress */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/cart" className="group inline-flex items-center gap-2 text-sm text-mute transition hover:text-ink">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Back to bag
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease }}
              className="mt-3 font-display text-5xl sm:text-6xl"
            >
              Checkout
            </motion.h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-mute">
              <Lock className="size-3.5" /> Secure, encrypted checkout · {count} {count === 1 ? "item" : "items"}
            </p>
          </div>
          <Progress steps={["Bag", "Shipping", "Payment", "Done"]} current={1 + Number(addressDone) + Number(addressDone && paymentDone)} />
        </div>

        <Wrap stripeKey={stripeKey} amount={Math.round(totals.total * rates[currency])} currency={currency}>
        {stripeKey && <StripeBridge onReady={onStripeReady} />}
        <form
          className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_420px] xl:gap-10"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="relative space-y-5">
            {/* timeline rail */}
            <div aria-hidden className="absolute bottom-10 left-[3.25rem] top-10 hidden w-0.5 bg-gradient-to-b from-sun via-amber to-aqua opacity-30 sm:block" />

            {/* 1. Shipping */}
            <Step n={1} title="Shipping address" sub="Where should we send your serums?" icon={MapPin} done={addressDone}>
              {addresses.length > 0 && (
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <Choice key={a.id} active={addressId === a.id} onClick={() => setAddressId(a.id)}>
                      <p className="flex items-center gap-2 font-medium">
                        {a.fullName}
                        {a.isDefault && <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-soft">Default</span>}
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode}
                      </p>
                      <p className="mt-1 text-sm text-mute">{a.phone}</p>
                    </Choice>
                  ))}
                  <Choice active={addressId === "new"} onClick={() => setAddressId("new")} dashed>
                    <span className="grid size-9 place-items-center rounded-full bg-sand transition group-hover:bg-brand group-hover:text-white">
                      <Plus className="size-4" />
                    </span>
                    <p className="mt-3 font-medium">Use a new address</p>
                    <p className="text-sm text-ink-soft">Ship somewhere else</p>
                  </Choice>
                </div>
              )}

              <AnimatePresence initial={false}>
                {addressId === "new" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-4 p-0.5 sm:grid-cols-2">
                      <Field label="Full name" icon={User}><input className="input" autoComplete="name" required value={form.fullName} onChange={set("fullName")} /></Field>
                      <Field label="Phone" icon={Phone}><input className="input" type="tel" autoComplete="tel" placeholder="+1 555 000 0000" required value={form.phone} onChange={set("phone")} /></Field>
                      <Field label="Address line 1" icon={MapPin} wide><input className="input" autoComplete="address-line1" placeholder="Street address" required value={form.line1} onChange={set("line1")} /></Field>
                      <Field label="Address line 2" optional icon={Building2} wide><input className="input" autoComplete="address-line2" placeholder="Apartment, suite, floor" value={form.line2 ?? ""} onChange={set("line2")} /></Field>
                      <Field label="City" icon={Building2}><input className="input" autoComplete="address-level2" required value={form.city} onChange={set("city")} /></Field>
                      <Field label="State / County" icon={MapIcon}><input className="input" autoComplete="address-level1" required value={form.state} onChange={set("state")} /></Field>
                      <Field label="Postal code" icon={Hash}><input className="input" autoComplete="postal-code" required value={form.postalCode} onChange={set("postalCode")} /></Field>
                      <Field label="Country" icon={Globe2}>
                        <select className="input appearance-none" autoComplete="country-name" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}>
                          <option>United States</option>
                          <option>United Kingdom</option>
                          <option>Canada</option>
                          <option>United Arab Emirates</option>
                          <option>India</option>
                        </select>
                      </Field>
                    </div>
                    <Toggle checked={saveAddress} onChange={setSaveAddress} label="Save this address to my account" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            {/* 2. Payment */}
            <Step n={2} title="Payment" sub="All transactions are secure and encrypted." icon={CreditCard} done={paymentDone}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Choice active={payment === "CARD"} onClick={() => setPayment("CARD")}>
                  <span className="grid size-10 place-items-center rounded-xl bg-sand"><CreditCard className="size-5" /></span>
                  <p className="mt-3 font-medium">{stripeKey ? "Card & more" : "Credit / debit card"}</p>
                  <div className="mt-2 flex gap-1.5">
                    {["VISA", "MC", "AMEX"].map((b) => (
                      <span key={b} className="rounded-md border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-ink-soft">{b}</span>
                    ))}
                  </div>
                </Choice>
                <Choice active={payment === "COD"} onClick={() => setPayment("COD")}>
                  <span className="grid size-10 place-items-center rounded-xl bg-sand"><Banknote className="size-5" /></span>
                  <p className="mt-3 font-medium">Cash on delivery</p>
                  <p className="mt-1 text-sm text-ink-soft">Pay when your order arrives</p>
                </Choice>
              </div>

              <AnimatePresence initial={false} mode="popLayout">
                {payment === "CARD" && stripeKey ? (
                  <motion.div
                    key="stripe"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 p-0.5">
                      <StripePaymentFields onComplete={setStripeComplete} />
                    </div>
                    {stripeKey.startsWith("pk_test_") ? (
                      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-amber/10 px-4 py-3 text-xs text-[#7a4a00]">
                        <ShieldCheck className="mt-px size-4 shrink-0" />
                        Stripe test mode: no real money moves. Use card 4242 4242 4242 4242 with any future date and any CVC.
                        4000 0027 6000 3184 shows a 3-D Secure check; 4000 0000 0000 0002 is declined.
                      </p>
                    ) : (
                      <p className="mt-5 flex items-center gap-2 text-xs text-mute">
                        <Lock className="size-3.5 shrink-0" /> Payments are processed securely by Stripe. We never see or store your card number.
                      </p>
                    )}
                  </motion.div>
                ) : payment === "CARD" ? (
                  <motion.div
                    key="card"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 grid items-center gap-6 md:grid-cols-[minmax(0,300px)_1fr]">
                      <CardPreview card={card} brand={brand} flipped={flipped} />
                      <div className="grid gap-4 p-0.5 sm:grid-cols-2">
                        <Field label="Card number" icon={CreditCard} wide>
                          <input
                            className="input font-mono tracking-wider"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="4242 4242 4242 4242"
                            required
                            value={card.number}
                            onChange={(e) =>
                              setCard((c) => ({
                                ...c,
                                number: e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "),
                              }))
                            }
                          />
                        </Field>
                        <Field label="Name on card" icon={User} wide>
                          <input className="input" autoComplete="cc-name" required value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} />
                        </Field>
                        <Field label="Expiry" icon={Hash}>
                          <input
                            className="input font-mono"
                            placeholder="MM/YY"
                            autoComplete="cc-exp"
                            required
                            value={card.expiry}
                            onChange={(e) => {
                              const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                              setCard((c) => ({ ...c, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
                            }}
                          />
                        </Field>
                        <Field label="CVC" icon={Lock}>
                          <input
                            className="input font-mono"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder="123"
                            required
                            value={card.cvc}
                            onFocus={() => setFlipped(true)}
                            onBlur={() => setFlipped(false)}
                            onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                          />
                        </Field>
                      </div>
                    </div>
                    <p className="mt-5 flex items-start gap-2 rounded-2xl bg-amber/10 px-4 py-3 text-xs text-[#7a4a00]">
                      <ShieldCheck className="mt-px size-4 shrink-0" />
                      Demo payment mode — no real charge is made. Use any future expiry; card 4000 0000 0000 0002 simulates a decline.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cod"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 flex items-center gap-4 rounded-2xl border border-dashed border-line bg-cream p-5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-white"><Banknote className="size-5" /></span>
                      <p className="text-sm text-ink-soft">
                        Pay <b className="text-ink">{formatPrice(totals.total)}</b> in cash when your order is delivered. Please keep the exact amount ready.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            {/* 3. Notes */}
            <Step n={3} title="Order notes" sub="Optional — delivery instructions or a gift message." icon={MessageSquareText} done={notes.length > 0}>
              <div className="relative">
                <textarea
                  className="input min-h-28 resize-y"
                  placeholder="Leave at the front desk, gift wrap please…"
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-mute tabular-nums">{notes.length}/500</span>
              </div>
            </Step>
          </div>

          {/* Summary */}
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            className="lg:sticky lg:top-24"
          >
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-40px_rgba(11,11,15,0.3)]">
              <div className="h-1.5 bg-brand animate-gradient" />
              <div className="p-6 sm:p-7">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-2xl">Order summary</p>
                  <Link href="/cart" className="text-xs text-mute underline-offset-4 hover:text-ink hover:underline">Edit bag</Link>
                </div>

                <ul className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                  {items.map((i, idx) => (
                    <motion.li
                      key={i.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + idx * 0.06, ease }}
                      className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-cream"
                    >
                      <div className="relative size-16 shrink-0">
                        <div className="size-full overflow-hidden rounded-xl bg-sand">
                          <Image src={i.image} alt="" fill sizes="64px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-white ring-2 ring-white">
                          {i.quantity}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm leading-snug">{i.name}</p>
                        <p className="mt-0.5 text-xs text-mute">{formatPrice(i.price)} each</p>
                      </div>
                      <span className="text-sm font-medium tabular-nums">{formatPrice(i.price * i.quantity)}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* free shipping meter */}
                <div className="mt-5 rounded-2xl bg-cream p-4">
                  <p className="flex items-center gap-2 text-xs font-medium">
                    <Truck className="size-4 text-sun" />
                    {toFree > 0 ? <>Add <b>{formatPrice(toFree)}</b> more for free shipping</> : "You've unlocked free shipping 🎉"}
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className="h-full rounded-full bg-brand"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (subtotal / site.freeShippingThreshold) * 100)}%` }}
                      transition={{ duration: 1, ease }}
                    />
                  </div>
                </div>

                {/* coupon */}
                <div className="mt-5">
                  <AnimatePresence mode="wait" initial={false}>
                    {coupon ? (
                      <motion.div
                        key="applied"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                      >
                        <span className="flex items-center gap-2">
                          <Tag className="size-4" /> <b>{coupon.code}</b> — you save {formatPrice(totals.discount)}
                        </span>
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-full transition hover:bg-emerald-100"
                          onClick={() => {
                            setApplied(null);
                            setCoupon(null);
                            setCode("");
                          }}
                          aria-label="Remove code"
                        >
                          <X className="size-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex items-center gap-1 rounded-full border border-line bg-white p-1 pl-4 transition focus-within:border-amber focus-within:shadow-[0_0_0_4px_rgba(255,179,0,0.15)]">
                          <Tag className="size-4 shrink-0 text-mute" />
                          <input
                            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm uppercase outline-none placeholder:normal-case"
                            placeholder="Discount code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (code) applyCoupon();
                              }
                            }}
                          />
                          <button
                            type="button"
                            disabled={!code || checking}
                            onClick={() => applyCoupon()}
                            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition hover:bg-ink/85 disabled:opacity-40"
                          >
                            {checking ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                          </button>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                          {["NEW30", "DERMISQUE"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setCode(c);
                                applyCoupon(c);
                              }}
                              className="rounded-full border border-dashed border-sun/50 px-3 py-1 font-medium text-[#b35500] transition hover:border-sun hover:bg-sun/10"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <dl className="mt-6 space-y-2.5 text-sm">
                  <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
                  {totals.discount > 0 && <Row label={`Discount (${coupon?.code})`} value={`−${formatPrice(totals.discount)}`} accent />}
                  <Row label="Shipping" value={totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)} accent={totals.shipping === 0} />
                  {totals.tax > 0 && <Row label="Tax" value={formatPrice(totals.tax)} />}
                  <div className="flex items-end justify-between border-t border-dashed border-line pt-4">
                    <dt className="font-medium">Total</dt>
                    <motion.dd
                      key={totals.total}
                      initial={{ scale: 1.15, color: "#ff7a00" }}
                      animate={{ scale: 1, color: "#0b0b0f" }}
                      className="font-display text-3xl tabular-nums"
                    >
                      {formatPrice(totals.total)}
                    </motion.dd>
                  </div>
                </dl>

                <PayButton pending={pending} label={payLabel} className="mt-6 hidden lg:flex" />

                <p className="mt-3 text-center text-xs text-mute">
                  By placing your order you agree to our{" "}
                  <Link href="/policies/replacement" className="underline">replacement</Link> &{" "}
                  <Link href="/policies/privacy" className="underline">privacy</Link> policies.
                </p>
              </div>

              <div className="grid grid-cols-3 border-t border-line bg-cream/60 text-center text-[11px] text-ink-soft">
                {[
                  [ShieldCheck, "Secure payment"],
                  [Truck, "Ships in 2–7 days"],
                  [RefreshCcw, "Easy replacement"],
                ].map(([Icon, l], i) => {
                  const I = Icon as IconType;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 px-2 py-4 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-line">
                      <I className="size-4 text-sun" />
                      {l as string}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.aside>

          {/* mobile sticky pay bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 p-3 backdrop-blur-xl lg:hidden">
            <div className="container-luxe flex items-center gap-3">
              <div className="shrink-0">
                <p className="text-[11px] uppercase tracking-wider text-mute">Total</p>
                <p className="font-display text-2xl tabular-nums">{formatPrice(totals.total)}</p>
              </div>
              <PayButton pending={pending} label={payLabel} className="flex-1" />
            </div>
          </div>
        </form>
        </Wrap>
      </div>
    </div>
  );
}

function Wrap({
  stripeKey,
  amount,
  currency,
  children,
}: {
  stripeKey: string | null;
  amount: number;
  currency: string;
  children: React.ReactNode;
}) {
  if (!stripeKey) return <>{children}</>;
  return (
    <StripeElements publishableKey={stripeKey} amount={amount} currency={currency}>
      {children}
    </StripeElements>
  );
}

function PayButton({ pending, label, className }: { pending: boolean; label: string; className?: string }) {
  return (
    <Button size="lg" className={cn("group/pay relative w-full overflow-hidden", className)} disabled={pending}>
      <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover/pay:translate-x-full" />
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
      {pending ? "Processing…" : label}
    </Button>
  );
}

function Progress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current && i < steps.length - 1;
        return (
          <li key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-xs font-semibold transition-all duration-500",
                  done ? "bg-ink text-white" : active ? "bg-brand text-ink shadow-[0_8px_20px_-6px_rgba(255,122,0,0.6)]" : "border border-line bg-white text-mute",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("text-[11px] font-medium", active || done ? "text-ink" : "text-mute")}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="mx-2 mb-5 h-0.5 w-8 overflow-hidden rounded-full bg-line sm:w-14">
                <motion.span
                  className="block h-full bg-brand"
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.6, ease }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CardPreview({ card, brand, flipped }: { card: { number: string; expiry: string; cvc: string; name: string }; brand: string; flipped: boolean }) {
  const digits = card.number.replace(/\D/g, "").padEnd(16, "•");
  const shown = digits.slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  return (
    <div className="mx-auto w-full max-w-[300px] [perspective:1200px]">
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease }}
        className="relative aspect-[1.586] w-full [transform-style:preserve-3d]"
      >
        {/* front */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-ink p-5 text-white shadow-[0_25px_50px_-20px_rgba(11,11,15,0.6)] [backface-visibility:hidden]">
          <div aria-hidden className="absolute -right-10 -top-16 size-48 rounded-full bg-sun/60 blur-3xl" />
          <div aria-hidden className="absolute -bottom-20 -left-10 size-48 rounded-full bg-aqua/50 blur-3xl" />
          <span aria-hidden className="absolute -bottom-6 right-3 font-display text-[7rem] leading-none text-white/[0.07]">Σ</span>
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="h-7 w-10 rounded-md bg-gradient-to-br from-amber to-lemon opacity-90" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={brand || "none"}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="text-sm font-bold italic tracking-wider"
                >
                  {brand || "DΣRMISQUΣ"}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="font-mono text-[1.05rem] tracking-[0.12em]">{shown}</p>
            <div className="flex items-end justify-between text-[10px] uppercase tracking-wider">
              <div className="min-w-0">
                <p className="text-white/50">Card holder</p>
                <p className="mt-0.5 truncate text-xs">{card.name || "Your name"}</p>
              </div>
              <div className="text-right">
                <p className="text-white/50">Expires</p>
                <p className="mt-0.5 font-mono text-xs">{card.expiry || "MM/YY"}</p>
              </div>
            </div>
          </div>
        </div>
        {/* back */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-ink text-white shadow-[0_25px_50px_-20px_rgba(11,11,15,0.6)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="mt-6 h-10 bg-black/80" />
          <div className="mx-5 mt-5 flex items-center justify-end rounded-md bg-white/90 px-3 py-2 font-mono text-sm text-ink">
            {card.cvc.replace(/./g, "•") || "CVC"}
          </div>
          <p className="mx-5 mt-4 text-[10px] text-white/50">The 3–4 digit security code on the back of your card.</p>
        </div>
      </motion.div>
    </div>
  );
}

function Step({
  n,
  title,
  sub,
  icon: Icon,
  done,
  children,
}: {
  n: number;
  title: string;
  sub: string;
  icon: IconType;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: n * 0.1, ease }}
      className="relative rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_20px_60px_-40px_rgba(11,11,15,0.25)] backdrop-blur transition-shadow duration-500 hover:shadow-[0_30px_70px_-40px_rgba(11,11,15,0.35)] sm:p-8"
    >
      <div className="mb-6 flex items-center gap-4">
        <span className="relative grid size-10 shrink-0 place-items-center">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.span
                key="done"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className="absolute inset-0 grid place-items-center rounded-full bg-ink text-white"
              >
                <Check className="size-5" />
              </motion.span>
            ) : (
              <motion.span
                key="n"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute inset-0 grid place-items-center rounded-full bg-brand font-display text-lg text-ink shadow-[0_8px_20px_-6px_rgba(255,122,0,0.6)]"
              >
                {n}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-tight">{title}</h2>
          <p className="text-sm text-mute">{sub}</p>
        </div>
        <span className="ml-auto hidden size-10 place-items-center rounded-full bg-cream sm:grid">
          <Icon className="size-[18px] text-ink-soft" />
        </span>
      </div>
      {children}
    </motion.section>
  );
}

function Choice({
  active,
  onClick,
  dashed,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative rounded-2xl border-2 p-4 text-left transition-all duration-300 hover:-translate-y-0.5",
        active
          ? "border-ink bg-cream shadow-[0_14px_30px_-18px_rgba(11,11,15,0.45)]"
          : cn("border-line bg-white hover:border-ink/30 hover:shadow-[0_14px_30px_-20px_rgba(11,11,15,0.3)]", dashed && "border-dashed"),
      )}
    >
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-brand text-white"
          >
            <Check className="size-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
      {children}
    </button>
  );
}

function Field({
  label,
  icon: Icon,
  wide,
  optional,
  children,
}: {
  label: string;
  icon?: IconType;
  wide?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("group/field block", wide && "sm:col-span-2")}>
      <span className="label">
        {label} {optional && <span className="font-normal text-mute">(optional)</span>}
      </span>
      <span className="relative block [&_.input]:h-12 [&_.input]:pl-11">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-mute transition-colors group-focus-within/field:text-sun" />
        )}
        {children}
      </span>
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-ink peer-focus-visible:ring-4 peer-focus-visible:ring-amber/30">
        <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300", checked && "translate-x-5")} />
      </span>
      {label}
    </label>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={cn("tabular-nums", accent && "font-medium text-emerald-700")}>{value}</dd>
    </div>
  );
}
