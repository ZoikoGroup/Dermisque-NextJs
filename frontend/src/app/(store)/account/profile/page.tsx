import { ProfileForms } from "@/components/account/profile-forms";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export const metadata = { title: "Profile & security" };

export default async function ProfilePage() {
  const me = await api<User>("/api/auth/me");
  return <ProfileForms user={me} />;
}
