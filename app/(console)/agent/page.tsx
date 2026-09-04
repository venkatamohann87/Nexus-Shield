import { redirect } from "next/navigation";

/** The chat surface lives only in the separate anonymous local Phi client. */
export default function LegacyAgentPage(): never {
  redirect("/dashboard");
}
