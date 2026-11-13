import { EmailStudio, type EmailOverview } from "@/components/admin/email-studio";
import { api } from "@/lib/api";

export const metadata = { title: "Emails" };

export default async function AdminEmails() {
  const data = await api<EmailOverview>("/api/admin/emails");
  return <EmailStudio data={data} />;
}
