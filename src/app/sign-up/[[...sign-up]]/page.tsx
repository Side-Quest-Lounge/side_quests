"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClerkAuthShell } from "@/components/clerk-auth-shell";
import { DemoGuestEntry } from "@/components/demo-auth-form";
import { DEMO } from "@/lib/demo";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/after-auth");
  }, [isLoaded, isSignedIn, router]);

  return (
    <ClerkAuthShell>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/onboarding"
      />
      {DEMO && <DemoGuestEntry destination="/home" buttonLabel="Explore demo as guest →" />}
    </ClerkAuthShell>
  );
}
