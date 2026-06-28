"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DEMO, DEMO_GROUP_ID } from "@/lib/demo";
import { useMeGroup } from "@/lib/api/use-me-group";
import { chatPath } from "@/lib/paths";

export default function ChatIndex() {
  const router = useRouter();
  const { loading, groupId } = useMeGroup();

  useEffect(() => {
    if (DEMO) {
      router.replace(chatPath(DEMO_GROUP_ID));
      return;
    }
    if (loading) return;
    if (groupId) {
      router.replace(chatPath(groupId));
      return;
    }
    router.replace("/home");
  }, [loading, groupId, router]);

  return null;
}
