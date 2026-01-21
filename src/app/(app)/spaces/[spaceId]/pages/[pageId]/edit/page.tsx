import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { updatePage } from "@/app/actions/wiki";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSpaceAccess } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PageEditor } from "@/components/wiki/page-editor";
import { Breadcrumbs } from "@/components/wiki/breadcrumbs";

type PageEditProps = {
  params: Promise<{ spaceId: string; pageId: string }>;
};

export default async function PageEdit({ params: paramsPromise }: PageEditProps) {
  const params = await paramsPromise;
  const user = await requireUser();
  const access = await getSpaceAccess(params.spaceId, user.id);
  if (!access?.permissions.edit) {
    redirect(`/spaces/${params.spaceId}/pages/${params.pageId}`);
  }

  const page = await db.page.findFirst({
    where: {
      spaceId: params.spaceId,
      OR: [{ id: params.pageId }, { slug: params.pageId }],
    },
    include: {
      space: true,
      folder: true,
    },
  });

  if (!page) {
    redirect(`/spaces/${params.spaceId}`);
  }
  if (page.id !== params.pageId) {
    redirect(`/spaces/${params.spaceId}/pages/${page.id}/edit`);
  }

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Spaces", href: "/spaces" },
    { label: page.space.name, href: `/spaces/${page.space.id}` },
  ];
  if (page.folder) {
    breadcrumbItems.push({
      label: page.folder.name,
      href: `/spaces/${page.space.id}/folders/${page.folder.id}`,
    });
  }
  breadcrumbItems.push({
    label: page.title,
    href: `/spaces/${params.spaceId}/pages/${page.id}`,
  });
  breadcrumbItems.push({ label: "Edit" });

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href={`/spaces/${params.spaceId}/pages/${page.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to page
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editing: {page.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/spaces/${params.spaceId}/pages/${page.id}`}>
              Cancel
            </Link>
          </Button>
          <Button type="submit" form="page-editor-form">
            <Save className="h-4 w-4 mr-2" />
            Save changes
          </Button>
        </div>
      </div>

      {/* Editor */}
      <PageEditor
        pageId={page.id}
        spaceId={params.spaceId}
        initialTitle={page.title}
        initialContent={page.content}
        onSubmitAction={updatePage}
      />
    </div>
  );
}
