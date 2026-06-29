"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type ReactNode, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { saveOnboardingNext, isProfileComplete } from "@/lib/onboarding-session";
import { useMeProfile } from "@/lib/api/use-me-profile";
import { DEMO } from "@/lib/demo";

type ProfileGateLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  children: ReactNode;
};

export function ProfileGateLink({ href, children, onClick, ...props }: ProfileGateLinkProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { loading, hasProfile } = useMeProfile();
  const [demoComplete] = useState(DEMO ? isProfileComplete() : false);

  const guestDemo = DEMO && authLoaded && !isSignedIn;
  const complete = guestDemo ? demoComplete : hasProfile;
  const checked = guestDemo || (!loading && authLoaded);

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
