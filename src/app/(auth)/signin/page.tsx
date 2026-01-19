import { SignInButton } from "@/components/auth/signin-button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Nexus Wiki
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to your workspace
          </h1>
        </div>
        <SignInButton />
      </div>
    </div>
  );
}
