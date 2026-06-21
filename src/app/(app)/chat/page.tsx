import { redirect } from "next/navigation";
import { DEMO, DEMO_GROUP_ID } from "@/lib/demo";

export default function ChatIndex() {
  // In demo there's a single party; real mode would resolve the user's current group.
  if (DEMO) redirect(`/chat/${DEMO_GROUP_ID}`);
  redirect("/home");
}
