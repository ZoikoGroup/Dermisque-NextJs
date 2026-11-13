import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
