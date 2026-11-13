"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { login, register, requestPasswordReset, resetPassword, type FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

function Password({ name, label, error, autoComplete }: { name: string; label: string; error?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="relative">
        <input name={name} type={show ? "text" : "password"} required className="input pr-12" autoComplete={autoComplete} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-mute hover:text-ink"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function Field({ name, label, type = "text", error, autoComplete }: { name: string; label: string; type?: string; error?: string; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} type={type} required className="input" autoComplete={autoComplete} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function ErrorBox({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <motion.p
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
      className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <AlertCircle className="size-4" /> {state.error}
    </motion.p>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="font-display text-5xl">Welcome back</h1>
      <p className="mt-3 text-ink-soft">Sign in to track orders, save addresses and check out faster.</p>
      <form action={action} className="mt-10 space-y-5">
        <input type="hidden" name="next" value={next ?? ""} />
        <ErrorBox state={state} />
        <Field name="email" label="Email" type="email" autoComplete="email" />
        <div>
          <Password name="password" label="Password" autoComplete="current-password" />
          <Link href="/forgot-password" className="mt-2 inline-block text-xs text-mute underline-offset-4 transition hover:text-ink hover:underline">
            Forgot your password?
          </Link>
        </div>
        <Button size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Sign in
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-soft">
        New to Dermisque?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </motion.div>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="font-display text-5xl">Create account</h1>
      <p className="mt-3 text-ink-soft">
        Join Dermisque and get <b>30% off</b> your first order with code <b>NEW30</b>.
      </p>
      <form action={action} className="mt-10 space-y-5">
        <input type="hidden" name="next" value={next ?? ""} />
        <ErrorBox state={state} />
        <Field name="name" label="Full name" error={fe.name} autoComplete="name" />
        <Field name="email" label="Email" type="email" error={fe.email} autoComplete="email" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Password name="password" label="Password" error={fe.password} autoComplete="new-password" />
          <Password name="confirm" label="Confirm password" error={fe.confirm} autoComplete="new-password" />
        </div>
        <Button size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Create account
        </Button>
        <p className="text-center text-xs text-mute">
          By creating an account you agree to our <Link href="/policies/privacy" className="underline">privacy policy</Link>.
        </p>
      </form>
      <p className="mt-8 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  if (sent)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <span className="grid size-14 place-items-center rounded-full bg-brand text-ink">
          <MailCheck className="size-6" />
        </span>
        <h1 className="mt-6 font-display text-5xl">Check your inbox</h1>
        <p className="mt-3 text-ink-soft">
          If an account exists for <b className="text-ink">{email}</b>, we&apos;ve sent a link to reset your password. It
          expires in 60 minutes — don&apos;t forget to check your spam folder.
        </p>
        <Link href="/login" className="mt-10 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </motion.div>
    );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="font-display text-5xl">Forgot password?</h1>
      <p className="mt-3 text-ink-soft">Enter the email you shop with and we&apos;ll send you a secure link to choose a new one.</p>
      <form
        className="mt-10 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(undefined);
          const res = await requestPasswordReset(email.trim());
          setPending(false);
          if (res.ok) setSent(true);
          else setError(res.error);
        }}
      >
        <ErrorBox state={error ? { error } : undefined} />
        <label className="block">
          <span className="label">Email</span>
          <input type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <Button size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Send reset link
        </Button>
      </form>
      <Link href="/login" className="mt-8 flex items-center justify-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </motion.div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, setState] = useState<FormState>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token)
    return (
      <div>
        <h1 className="font-display text-5xl">Link missing</h1>
        <p className="mt-3 text-ink-soft">This page needs the link from your reset email.</p>
        <Link href="/forgot-password" className="mt-8 inline-block font-medium underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );

  if (done)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <span className="grid size-14 place-items-center rounded-full bg-brand text-ink">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-6 font-display text-5xl">Password updated</h1>
        <p className="mt-3 text-ink-soft">You can now sign in with your new password.</p>
        <Link href="/login" className="mt-10 inline-flex h-14 items-center rounded-full bg-ink px-8 font-medium text-white transition hover:bg-ink/85">
          Sign in
        </Link>
      </motion.div>
    );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="font-display text-5xl">Choose a new password</h1>
      <p className="mt-3 text-ink-soft">Use at least 8 characters with a letter and a number.</p>
      <form
        className="mt-10 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const password = String(fd.get("password") ?? "");
          const confirm = String(fd.get("confirm") ?? "");
          const fieldErrors: Record<string, string> = {};
          if (password.length < 8) fieldErrors.password = "Use at least 8 characters";
          else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) fieldErrors.password = "Include a letter and a number";
          if (password !== confirm) fieldErrors.confirm = "Passwords don't match";
          if (Object.keys(fieldErrors).length) return setState({ fieldErrors });
          setPending(true);
          const res = await resetPassword(token, password);
          setPending(false);
          if (res.ok) setDone(true);
          else setState({ error: res.error });
        }}
      >
        <ErrorBox state={state} />
        <Password name="password" label="New password" autoComplete="new-password" error={state?.fieldErrors?.password} />
        <Password name="confirm" label="Confirm new password" autoComplete="new-password" error={state?.fieldErrors?.confirm} />
        <Button size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Update password
        </Button>
      </form>
    </motion.div>
  );
}
