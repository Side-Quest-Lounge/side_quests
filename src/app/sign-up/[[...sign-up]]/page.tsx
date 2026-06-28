"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClerkAuthShell } from "@/components/clerk-auth-shell";
import { DEMO } from "@/lib/demo";
import { DemoSignUp } from "@/components/demo-auth-form";

function SignUpClerk() {
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
    </ClerkAuthShell>
  );
}

export default function SignUpPage() {
  if (DEMO) return <DemoSignUp />;
  return <SignUpClerk />;
}
