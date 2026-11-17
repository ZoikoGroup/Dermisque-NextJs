"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { login, register, requestPasswordReset, resetPassword, type FormState } from "@/app/actions/auth";

const enter = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

const inputCls =
  "h-14 sm:h-[min(3.5rem,5.8vh)] w-full rounded-2xl border border-[#ddd2c0] bg-white pl-14 pr-4 text-[1.02rem] text-ink outline-none transition placeholder:text-[#8a8478] focus:border-[#0f3d35] focus:ring-4 focus:ring-[#0f3d35]/10";

function Heading({ title, text }: { title: string; text: React.ReactNode }) {
  return (
    <>
      <h1 className="font-display text-[clamp(2.4rem,3.6vw,3.6rem)] leading-tight sm:text-[min(3.6rem,5.6vh)] lg:text-[min(3.4vw,5.6vh)] text-ink">{title}</h1>
      <p className="mt-2 text-[1.05rem] leading-snug text-ink-soft sm:mt-[0.8vh] sm:text-[min(1.125rem,2.05vh)]">{text}</p>
    </>
  );
}

function Field({
  name,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  error,
  autoComplete,
  value,
  onChange,
}: {
  name: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  placeholder: string;
  error?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[1.05rem] font-semibold text-ink sm:mb-[0.6vh] sm:text-[min(1.05rem,1.95vh)]">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-soft" strokeWidth={1.6} />
        <input
          name={name}
          type={type}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={inputCls}
          {...(onChange ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})}
        />
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function Password({ name, label, placeholder, error, autoComplete }: { name: string; label: string; placeholder: string; error?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[1.05rem] font-semibold text-ink sm:mb-[0.6vh] sm:text-[min(1.05rem,1.95vh)]">{label}</span>
      <span className="relative block">
        <LockKeyhole className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-soft" strokeWidth={1.6} />
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${inputCls} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink transition hover:bg-[#0f3d35]/5"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-5" strokeWidth={1.6} /> : <Eye className="size-5" strokeWidth={1.6} />}
        </button>
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      disabled={pending}
      className="group flex h-16 w-full items-center justify-center gap-3 rounded-full bg-[#0f3d35] text-xl sm:h-[min(4rem,6.6vh)] sm:text-[min(1.25rem,2.3vh)] font-semibold text-white shadow-[0_18px_40px_-20px_rgba(15,61,53,0.9)] transition hover:bg-[#145046] disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-5 animate-spin" /> : null}
      {children}
      {!pending && <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />}
    </button>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 flex items-center gap-4 text-[1.05rem] text-ink sm:mt-[2.2vh] sm:text-[min(1.05rem,1.95vh)]">
      <span className="h-px flex-1 bg-[#ddd2c0]" />
      <span className="text-center">{children}</span>
      <span className="h-px flex-1 bg-[#ddd2c0]" />
    </div>
  );
}

const linkCls = "font-semibold text-[#0f3d35] underline underline-offset-4 hover:text-[#145046]";

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

const withNext = (path: string, next?: string) => (next ? `${path}?next=${encodeURIComponent(next)}` : path);

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <motion.div {...enter}>
      <Heading title="Welcome back" text="Sign in to track orders, save your favorites, and get personalized skincare recommendations." />
      <form action={action} className="mt-5 space-y-4 sm:mt-[2vh] sm:space-y-[1.5vh]">
        <input type="hidden" name="next" value={next ?? ""} />
        <ErrorBox state={state} />
        <Field name="email" label="Email" icon={Mail} type="email" placeholder="Enter your email address" autoComplete="email" />
        <Password name="password" label="Password" placeholder="Enter your password" autoComplete="current-password" />
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <label className="flex cursor-pointer items-center gap-3 text-[1.05rem] text-ink">
            <input type="checkbox" name="remember" className="size-5 cursor-pointer rounded accent-[#0f3d35]" />
            Remember me
          </label>
          <Link href="/forgot-password" className={linkCls}>
            Forgot your password?
          </Link>
        </div>
        <Submit pending={pending}>Log In</Submit>
      </form>
      <Divider>
        New to Dermisque?{" "}
        <Link href={withNext("/register", next)} className={linkCls}>
          Create an account
        </Link>
      </Divider>
    </motion.div>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <motion.div {...enter}>
      <Heading
        title="Create account"
        text={
          <>
            Join Dermisque and get <b>30% off</b> your first order with code <b>NEW30</b>.
          </>
        }
      />
      <form action={action} className="mt-5 space-y-4 sm:mt-[1.4vh] sm:space-y-[1.1vh]">
        <input type="hidden" name="next" value={next ?? ""} />
        <ErrorBox state={state} />
        <Field name="name" label="Full name" icon={UserRound} placeholder="Enter your full name" error={fe.name} autoComplete="name" />
        <Field name="email" label="Email" icon={Mail} type="email" placeholder="Enter your email address" error={fe.email} autoComplete="email" />
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-[1.1vh_1rem]">
          <Password name="password" label="Password" placeholder="Create a password" error={fe.password} autoComplete="new-password" />
          <Password name="confirm" label="Confirm password" placeholder="Repeat password" error={fe.confirm} autoComplete="new-password" />
        </div>
        <p className="text-sm text-ink-soft sm:text-[min(0.875rem,1.7vh)]">
          By creating an account you agree to our{" "}
          <Link href="/policies/terms" className="underline">terms</Link> and{" "}
          <Link href="/policies/privacy" className="underline">privacy policy</Link>.
        </p>
        <Submit pending={pending}>Create Account</Submit>
      </form>
      <Divider>
        Already have an account?{" "}
        <Link href={withNext("/login", next)} className={linkCls}>
          Log in
        </Link>
      </Divider>
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
      <motion.div {...enter}>
        <span className="grid size-14 place-items-center rounded-full bg-[#e3efe9] text-[#0f3d35]">
          <MailCheck className="size-6" />
        </span>
        <div className="mt-5">
          <Heading
            title="Check your inbox"
            text={
              <>
                If an account exists for <b className="text-ink">{email}</b>, we&apos;ve sent a link to reset your password.
                It expires in 60 minutes. Don&apos;t forget to check your spam folder.
              </>
            }
          />
        </div>
        <Link href="/login" className={`${linkCls} mt-8 inline-flex items-center gap-2`}>
          <ArrowLeft className="size-4" /> Back to login
        </Link>
      </motion.div>
    );

  return (
    <motion.div {...enter}>
      <Heading title="Reset password" text="Enter the email you shop with and we'll send you a secure link to choose a new one." />
      <form
        className="mt-5 space-y-5"
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
        <Field
          name="email"
          label="Email"
          icon={Mail}
          type="email"
          placeholder="Enter your email address"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <Submit pending={pending}>Send Reset Link</Submit>
      </form>
      <Divider>
        Remembered it?{" "}
        <Link href="/login" className={linkCls}>
          Back to login
        </Link>
      </Divider>
    </motion.div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, setState] = useState<FormState>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token)
    return (
      <motion.div {...enter}>
        <Heading title="Link missing" text="This page needs the link from your password reset email." />
        <Link href="/forgot-password" className={`${linkCls} mt-8 inline-block`}>
          Request a new link
        </Link>
      </motion.div>
    );

  if (done)
    return (
      <motion.div {...enter}>
        <span className="grid size-14 place-items-center rounded-full bg-[#e3efe9] text-[#0f3d35]">
          <ShieldCheck className="size-6" />
        </span>
        <div className="mt-5">
          <Heading title="Password updated" text="You can now log in with your new password." />
        </div>
        <Link
          href="/login"
          className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-[#0f3d35] px-8 font-semibold text-white transition hover:bg-[#145046]"
        >
          Log In <ArrowRight className="size-4" />
        </Link>
      </motion.div>
    );

  return (
    <motion.div {...enter}>
      <Heading title="Choose a new password" text="Use at least 8 characters with a letter and a number." />
      <form
        className="mt-5 space-y-4"
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
        <Password name="password" label="New password" placeholder="Enter a new password" autoComplete="new-password" error={state?.fieldErrors?.password} />
        <Password name="confirm" label="Confirm new password" placeholder="Repeat the new password" autoComplete="new-password" error={state?.fieldErrors?.confirm} />
        <Submit pending={pending}>Update Password</Submit>
      </form>
    </motion.div>
  );
}
