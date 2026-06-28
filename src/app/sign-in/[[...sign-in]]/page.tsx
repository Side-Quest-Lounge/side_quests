"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClerkAuthShell } from "@/components/clerk-auth-shell";
import { DEMO } from "@/lib/demo";
import { DemoSignIn } from "@/components/demo-auth-form";

function SignInClerk() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/after-auth");
  }, [isLoaded, isSignedIn, router]);

  return (
    <ClerkAuthShell>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/after-auth"
      />
    </ClerkAuthShell>
  );
}

export default function SignInPage() {
  if (DEMO) return <DemoSignIn />;
  return <SignInClerk />;
}
