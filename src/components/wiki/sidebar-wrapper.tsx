"use client";

import { useState } from "react";
import { SpacesSidebar } from "./spaces-sidebar";
import { CreateSpaceDialog } from "./create-space-dialog";
import { CreateFolderDialog } from "./create-folder-dialog";
import { CreatePageDialog } from "./create-page-dialog";

type Page = {
  id: string;
  title: string;
  folderId: string | null;
};

type Folder = {
  id: string;
  name: string;
};

type Space = {
  id: string;
  name: string;
  folders: Folder[];
  pages: Page[];
  canEdit: boolean;
};

type SidebarWrapperProps = {
  spaces: Space[];
  canCreateSpace: boolean;
};

export function SidebarWrapper({ spaces, canCreateSpace }: SidebarWrapperProps) {
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createPageOpen, setCreatePageOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();

  // Transform spaces to include pages grouped by folder
  const transformedSpaces = spaces.map((space) => {
    const foldersWithPages = space.folders.map((folder) => ({
      ...folder,
      pages: space.pages.filter((p) => p.folderId === folder.id),
    }));
    const rootPages = space.pages.filter((p) => !p.folderId);

    return {
      ...space,
      folders: foldersWithPages,
      pages: rootPages,
    };
  });

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);

  return (
    <>
      <SpacesSidebar
        spaces={transformedSpaces}
        canCreateSpace={canCreateSpace}
        onCreateSpace={() => setCreateSpaceOpen(true)}
        onCreateFolder={(spaceId) => {
          setSelectedSpaceId(spaceId);
          setCreateFolderOpen(true);
        }}
        onCreatePage={(spaceId, folderId) => {
          setSelectedSpaceId(spaceId);
          setSelectedFolderId(folderId);
          setCreatePageOpen(true);
        }}
      />

      <CreateSpaceDialog open={createSpaceOpen} onOpenChange={setCreateSpaceOpen} />

      <CreateFolderDialog
        spaceId={selectedSpaceId}
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
      />

      <CreatePageDialog
        spaceId={selectedSpaceId}
        folders={selectedSpace?.folders ?? []}
        defaultFolderId={selectedFolderId}
        open={createPageOpen}
        onOpenChange={setCreatePageOpen}
      />
    </>
  );
}
