"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { DEMO } from "@/lib/demo";
import { isProfileComplete, saveOnboardingNext } from "@/lib/onboarding-session";
import { useMeProfile } from "@/lib/api/use-me-profile";

type ProfileGateLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  children: ReactNode;
};

export function ProfileGateLink({ href, children, onClick, ...props }: ProfileGateLinkProps) {
  const router = useRouter();
  const { loading, hasProfile } = useMeProfile();
  const [demoComplete] = useState(DEMO ? isProfileComplete() : false);

  const complete = DEMO ? demoComplete : hasProfile;
  const checked = DEMO || !loading;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || !checked || complete) return;
    e.preventDefault();
    saveOnboardingNext(href);
    router.push(`/onboarding?next=${encodeURIComponent(href)}`);
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
