import { acceptInvite } from "@/app/actions/invites";
import { SignInButton } from "@/components/auth/signin-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";

type InvitePageProps = {
  searchParams?: { token?: string; code?: string };
};

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const session = await auth();
  const token = searchParams?.token ?? "";
  const code = searchParams?.code ?? "";
  const callbackUrl = `/invite${token ? `?token=${token}` : code ? `?code=${code}` : ""}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Nexus Wiki</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Accept your invite
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to join the organization.
          </p>
        </div>

        {!session && <SignInButton callbackUrl={callbackUrl} />}

        {session && (
          <div className="space-y-4">
            {token && (
              <form action={acceptInvite} className="space-y-3">
                <input type="hidden" name="token" value={token} />
                <Button type="submit">Accept invite</Button>
              </form>
            )}
            <form action={acceptInvite} className="space-y-3">
              <Input
                name="code"
                defaultValue={code}
                placeholder="Invite code"
              />
              <Button type="submit" variant="secondary">
                Accept with code
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
