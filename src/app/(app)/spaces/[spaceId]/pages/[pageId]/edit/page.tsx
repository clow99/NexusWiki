import Link from "next/link";
import { redirect } from "next/navigation";

import { updatePage } from "@/app/actions/wiki";
import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { canEdit } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PageEditor } from "@/components/wiki/page-editor";

type PageEditProps = {
  params: { spaceId: string; pageId: string };
};

export default async function PageEdit({ params }: PageEditProps) {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }
  if (!canEdit(membership.role)) {
    redirect(`/spaces/${params.spaceId}/pages/${params.pageId}`);
  }

  const page = await db.page.findFirst({
    where: {
      id: params.pageId,
      spaceId: params.spaceId,
      organizationId: membership.organizationId,
    },
  });

  if (!page) {
    redirect(`/spaces/${params.spaceId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Edit page</p>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/spaces/${params.spaceId}/pages/${page.id}`}>
            Back to page
          </Link>
        </Button>
      </div>
      <PageEditor
        pageId={page.id}
        initialTitle={page.title}
        initialContent={page.content}
        onSubmitAction={updatePage}
      />
    </div>
  );
}
