"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

type SignInButtonProps = {
  callbackUrl?: string;
};

export function SignInButton({ callbackUrl = "/" }: SignInButtonProps) {
  return (
    <Button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
    >
      Continue with Google
    </Button>
  );
}
