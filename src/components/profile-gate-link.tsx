"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { DEMO } from "@/lib/demo";
import { isProfileComplete, saveOnboardingNext } from "@/lib/onboarding-session";

type ProfileGateLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  children: ReactNode;
};

export function ProfileGateLink({ href, children, onClick, ...props }: ProfileGateLinkProps) {
  const router = useRouter();
  const [complete, setComplete] = useState(DEMO ? isProfileComplete() : false);
  const [checked, setChecked] = useState(DEMO);

  useEffect(() => {
    if (DEMO) {
      setComplete(isProfileComplete());
      setChecked(true);
      return;
    }
    void fetch("/api/me/profile")
      .then((r) => r.json())
      .then((d: { profile: unknown }) => {
        setComplete(!!d.profile || isProfileComplete());
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (!checked) return;
    if (!complete) {
      e.preventDefault();
      saveOnboardingNext(href);
      router.push(`/onboarding?next=${encodeURIComponent(href)}`);
    }
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
