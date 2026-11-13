import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/auth";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const session = await requireUser("/account");
  return (
    <div className="container-luxe py-12">
      <div className="mb-10">
        <p className="eyebrow">My account</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Hello, {session.name.split(" ")[0]}</h1>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[240px_1fr]">
        <AccountNav isAdmin={session.role === "ADMIN"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
