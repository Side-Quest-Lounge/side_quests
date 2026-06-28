"use client";

import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClerkAuthShell } from "@/components/clerk-auth-shell";
import { DEMO } from "@/lib/demo";
import { DemoSignIn } from "@/components/demo-auth-form";
import { useAuth } from "@clerk/nextjs";

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/after-auth");
  }, [isLoaded, isSignedIn, router]);

  if (DEMO) return <DemoSignIn />;

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
