"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, MessageCircle, RotateCcw, ShoppingBag, Sparkles, Star, X } from "lucide-react";
import { askAssistant, type ChatProduct } from "@/app/actions/store";
import Image from "@/components/ui/product-image";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { usePrice } from "./currency-provider";

type Msg = {
  role: "user" | "assistant";
  content: string;
  products?: ChatProduct[];
  suggestions?: string[];
  error?: boolean;
};

const STORE_KEY = "dq-chat";
const ease = [0.22, 1, 0.36, 1] as const;

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm your **Dermisque skin assistant** ✨\n\nAsk me anything — which serum suits your skin, how to use it, ingredients, your order, shipping or discount codes.",
  suggestions: ["Find a serum for my skin", "Where is my order?", "Shipping & delivery", "Any discount codes?"],
};

function load(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Msg[]) : null;
    return parsed?.length ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const [teaser, setTeaser] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  const restored = useRef(false);

  useEffect(() => {
    if (!restored.current) return; // don't overwrite the saved chat before it's been restored
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  // a gentle nudge once per session
  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem("dq-chat-teaser"));
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setTeaser(true), 7000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    setTimeout(() => field.current?.focus(), 250);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // restore this browser session's conversation the first time the panel opens
  const toggle = (value?: boolean) => {
    if (!restored.current) {
      restored.current = true;
      setMessages(load());
    }
    setOpen((o) => value ?? !o);
  };

  // other parts of the site (e.g. the nav's "Talk to a Product Expert") can open the chat
  useEffect(() => {
    const onOpen = () => toggle(true);
    window.addEventListener("dq:open-chat", onOpen);
    return () => window.removeEventListener("dq:open-chat", onOpen);
  });

  const dismissTeaser = () => {
    setTeaser(false);
    try {
      sessionStorage.setItem("dq-chat-teaser", "1");
    } catch {}
  };

  const send = (text: string) => {
    const content = text.trim().slice(0, 1000);
    if (!content || pending) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    start(async () => {
      const history = next
        .filter((m) => !m.error && m !== WELCOME)
        .slice(-12)
        .map(({ role, content }) => ({ role, content }));
      const res = await askAssistant(history);
      setMessages((m) => [
        ...m,
        res.ok
          ? { role: "assistant", content: res.data.reply, products: res.data.products, suggestions: res.data.suggestions }
          : { role: "assistant", content: res.error || "Sorry, something went wrong. Please try again.", error: true },
      ]);
    });
  };

  // checkout has its own sticky pay bar on mobile — keep the screen clear there
  if (pathname?.startsWith("/checkout")) return null;

  const last = messages[messages.length - 1];

  return (
    <>
      {/* launcher */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {teaser && !open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.4, ease }}
              className="relative max-w-[240px] rounded-2xl rounded-br-md bg-white py-3 pl-4 pr-9 text-sm shadow-xl"
            >
              <button
                onClick={() => {
                  dismissTeaser();
                  toggle(true);
                }}
                className="text-left"
              >
                <span className="font-medium">Need help choosing?</span>
                <span className="block text-ink-soft">Ask our skin assistant ✨</span>
              </button>
              <button onClick={dismissTeaser} aria-label="Dismiss" className="absolute right-2 top-2 rounded-full p-1 text-mute hover:text-ink">
                <X className="size-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            dismissTeaser();
            toggle();
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label={open ? "Close chat" : "Chat with the Dermisque assistant"}
          aria-expanded={open}
          className={cn("relative grid size-15 place-items-center rounded-full bg-ink text-white shadow-[0_18px_40px_-12px_rgba(11,11,15,0.6)]", open && "max-sm:hidden")}
        >
          {!open && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-sun/30 [animation-duration:2.4s]" />}
          <span aria-hidden className="absolute -inset-[3px] -z-10 rounded-full bg-brand" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "x" : "chat"}
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
            >
              {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Dermisque shop assistant"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.4, ease }}
            className="fixed inset-0 z-[60] flex origin-bottom-right flex-col overflow-hidden bg-cream sm:inset-auto sm:bottom-28 sm:right-6 sm:h-[min(640px,calc(100svh-9rem))] sm:w-[400px] sm:rounded-[1.75rem] sm:shadow-[0_40px_90px_-30px_rgba(11,11,15,0.55)]"
          >
            {/* header */}
            <header className="relative overflow-hidden bg-ink px-5 pb-5 pt-4 text-white">
              <div aria-hidden className="absolute -right-10 -top-16 size-44 rounded-full bg-sun/45 blur-3xl" />
              <div aria-hidden className="absolute -bottom-20 left-10 size-40 rounded-full bg-aqua/35 blur-3xl" />
              <div className="relative flex items-center gap-3">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-brand font-display text-xl text-ink">
                  Σ
                  <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-ink bg-emerald-400" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-xl leading-tight">Dermisque Assistant</p>
                  <p className="text-xs text-white/60">Skin advice, products & orders · replies instantly</p>
                </div>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => setMessages([WELCOME])}
                    aria-label="Start a new chat"
                    title="New chat"
                    className="grid size-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close chat"
                    className="grid size-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-brand" />
            </header>

            {/* messages */}
            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5" aria-live="polite">
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} />
              ))}
              {pending && <Typing />}
              {!pending && last.role === "assistant" && last.suggestions && last.suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-wrap gap-2 pl-10"
                >
                  {last.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-sun/40 bg-white px-3.5 py-1.5 text-xs font-medium text-ink transition hover:-translate-y-0.5 hover:border-sun hover:bg-sun/10"
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-line bg-white p-3"
            >
              <div className="flex items-end gap-2 rounded-3xl border border-line bg-cream px-2 py-1.5 transition focus-within:border-amber focus-within:shadow-[0_0_0_4px_rgba(255,179,0,0.15)]">
                <textarea
                  ref={field}
                  rows={1}
                  value={input}
                  maxLength={1000}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask about serums, orders, delivery…"
                  aria-label="Message"
                  className="max-h-[120px] min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-mute"
                />
                <button
                  disabled={!input.trim() || pending}
                  aria-label="Send"
                  className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:scale-105 disabled:scale-100 disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-mute">
                General skincare guidance, not medical advice · <Link href="/contact" className="underline">Talk to our team</Link>
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const mine = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease }}
      className={cn("flex gap-2", mine && "justify-end")}
    >
      {!mine && (
        <span className="mt-auto grid size-8 shrink-0 place-items-center rounded-full bg-ink font-display text-sm text-amber">Σ</span>
      )}
      <div className={cn("min-w-0", mine ? "max-w-[85%]" : "max-w-[calc(100%-2.5rem)]")}>
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed",
            mine
              ? "rounded-[1.25rem] rounded-br-md bg-ink text-white"
              : cn("rounded-[1.25rem] rounded-bl-md bg-white text-ink shadow-sm", msg.error && "bg-red-50 text-red-700"),
          )}
        >
          {mine ? <p className="whitespace-pre-wrap">{msg.content}</p> : <ChatMarkdown text={msg.content} />}
        </div>
        {msg.products && msg.products.length > 0 && (
          <div className="-mr-4 mt-2 flex snap-x gap-2.5 overflow-x-auto pb-1 pr-4">
            {msg.products.map((p) => (
              <ProductTile key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChatMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 space-y-1 pl-4 last:mb-0 [list-style:disc] marker:text-sun">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 space-y-1 pl-4 last:mb-0 [list-style:decimal] marker:text-sun">{children}</ol>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        code: ({ children }) => <code className="rounded bg-sand px-1 py-0.5 font-mono text-xs">{children}</code>,
        a: ({ href = "", children }) =>
          href.startsWith("/") ? (
            <Link href={href} className="font-medium text-ink underline decoration-sun decoration-2 underline-offset-2 hover:text-sun">
              {children}
            </Link>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-sun underline-offset-2">
              {children}
            </a>
          ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function ProductTile({ p }: { p: ChatProduct }) {
  const price = usePrice();
  const add = useCart((s) => s.add);
  const soldOut = p.stock <= 0;
  return (
    <div className="group w-[168px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-sand">
        <Image src={p.image} alt={p.name} fill sizes="168px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
        {p.rating && (
          <span className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold">
            <Star className="size-2.5 fill-amber text-amber" /> {p.rating}
          </span>
        )}
      </Link>
      <div className="p-3">
        <Link href={`/product/${p.slug}`} className="line-clamp-2 text-xs font-medium leading-snug hover:underline">
          {p.name.replace(/^Dermisque\s+/, "")}
        </Link>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-semibold">{price(p.price)}</span>
          {p.compareAtPrice && p.compareAtPrice > p.price && <span className="text-[11px] text-mute line-through">{price(p.compareAtPrice)}</span>}
        </div>
        <button
          disabled={soldOut}
          onClick={() => add({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image, stock: p.stock })}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-ink py-2 text-[11px] font-semibold text-white transition hover:bg-brand hover:text-ink disabled:bg-line disabled:text-mute"
        >
          {soldOut ? "Sold out" : (<><ShoppingBag className="size-3" /> Add to bag</>)}
        </button>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
      <span className="grid size-8 place-items-center rounded-full bg-ink font-display text-sm text-amber">Σ</span>
      <div className="flex items-center gap-2 rounded-[1.25rem] rounded-bl-md bg-white px-4 py-3.5 shadow-sm">
        <Sparkles className="size-3.5 text-sun" />
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-ink/40"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
