"use client";

import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClerkAuthShell } from "@/components/clerk-auth-shell";
import { DEMO } from "@/lib/demo";
import { DemoSignUp } from "@/components/demo-auth-form";
import { useAuth } from "@clerk/nextjs";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/after-auth");
  }, [isLoaded, isSignedIn, router]);

  if (DEMO) return <DemoSignUp />;

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
