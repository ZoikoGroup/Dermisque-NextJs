import { AddressManager } from "@/components/account/address-manager";
import { api } from "@/lib/api";
import type { Address } from "@/lib/types";

export const metadata = { title: "My addresses" };

export default async function AddressesPage() {
  const addresses = await api<Address[]>("/api/account/addresses");
  return <AddressManager addresses={addresses} />;
}
