"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FolderClosed,
  FileText,
  Layers,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type Page = {
  id: string;
  title: string;
  folderId: string | null;
};

type Folder = {
  id: string;
  name: string;
  pages: Page[];
};

type Space = {
  id: string;
  name: string;
  folders: Folder[];
  pages: Page[]; // Pages at root level (no folder)
  canEdit: boolean;
};

type SpacesSidebarProps = {
  spaces: Space[];
  canCreateSpace?: boolean;
  onCreateSpace?: () => void;
  onCreateFolder?: (spaceId: string) => void;
  onCreatePage?: (spaceId: string, folderId?: string) => void;
};

export function SpacesSidebar({
  spaces,
  canCreateSpace = false,
  onCreateSpace,
  onCreateFolder,
  onCreatePage,
}: SpacesSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter spaces based on search
  const filteredSpaces = searchQuery
    ? spaces.map((space) => {
        const matchesSpace = space.name.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredFolders = space.folders
          .map((folder) => ({
            ...folder,
            pages: folder.pages.filter((p) =>
              p.title.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          }))
          .filter(
            (folder) =>
              folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              folder.pages.length > 0
          );
        const filteredRootPages = space.pages.filter((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (matchesSpace || filteredFolders.length > 0 || filteredRootPages.length > 0) {
          return {
            ...space,
            folders: matchesSpace ? space.folders : filteredFolders,
            pages: matchesSpace ? space.pages : filteredRootPages,
          };
        }
        return null;
      }).filter(Boolean) as Space[]
    : spaces;

  return (
    <div className="flex flex-col h-full">
      {/* Header with gradient accent */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Spaces</h2>
          </div>
          {canCreateSpace && onCreateSpace && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={onCreateSpace}
              title="Create space"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background rounded-lg"
          />
        </div>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredSpaces.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Layers className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No results found" : "No spaces yet"}
              </p>
              {!searchQuery && canCreateSpace && onCreateSpace && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 text-primary"
                  onClick={onCreateSpace}
                >
                  Create your first space
                </Button>
              )}
            </div>
          )}
          {filteredSpaces.map((space) => (
            <SpaceNode
              key={space.id}
              space={space}
              pathname={pathname}
              canEdit={space.canEdit}
              onCreateFolder={onCreateFolder}
              onCreatePage={onCreatePage}
              defaultOpen={!!searchQuery}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer with quick action */}
      {canCreateSpace && (
        <div className="p-3 border-t bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
            onClick={onCreateSpace}
          >
            <Plus className="h-4 w-4" />
            New Space
          </Button>
        </div>
      )}
    </div>
  );
}

function SpaceNode({
  space,
  pathname,
  canEdit,
  onCreateFolder,
  onCreatePage,
  defaultOpen = false,
}: {
  space: Space;
  pathname: string;
  canEdit: boolean;
  onCreateFolder?: (spaceId: string) => void;
  onCreatePage?: (spaceId: string, folderId?: string) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(
    defaultOpen || pathname.includes(`/spaces/${space.id}`)
  );
  const isActive = pathname === `/spaces/${space.id}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group flex items-center rounded-lg hover:bg-muted/50 transition-colors">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 hover:bg-transparent"
          >
            <div className={cn(
              "transition-transform duration-200",
              isOpen && "rotate-90"
            )}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Button>
        </CollapsibleTrigger>
        <Link
          href={`/spaces/${space.id}`}
          className={cn(
            "flex-1 flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-lg transition-all duration-200",
            isActive
              ? "bg-primary/10 text-primary font-medium shadow-sm"
              : "text-foreground/80 hover:text-foreground"
          )}
        >
          <div className={cn(
            "h-6 w-6 rounded-md flex items-center justify-center transition-colors",
            isActive ? "bg-primary/20" : "bg-muted"
          )}>
            <Layers className={cn(
              "h-3.5 w-3.5",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <span className="truncate font-medium">{space.name}</span>
        </Link>
        {canEdit && (
          <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
            {onCreateFolder && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFolder(space.id);
                }}
                title="New folder"
              >
                <FolderClosed className="h-3.5 w-3.5" />
              </Button>
            )}
            {onCreatePage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatePage(space.id);
                }}
                title="New page"
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
      <CollapsibleContent>
        <div className="ml-5 pl-3 border-l-2 border-border/40 space-y-0.5 mt-0.5">
          {/* Folders */}
          {space.folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              spaceId={space.id}
              pathname={pathname}
              canEdit={canEdit}
              onCreatePage={onCreatePage}
            />
          ))}
          {/* Root level pages */}
          {space.pages.map((page) => (
            <PageNode
              key={page.id}
              page={page}
              spaceId={space.id}
              pathname={pathname}
            />
          ))}
          {space.folders.length === 0 && space.pages.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-2 italic">
              Empty space
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FolderNode({
  folder,
  spaceId,
  pathname,
  canEdit,
  onCreatePage,
}: {
  folder: Folder;
  spaceId: string;
  pathname: string;
  canEdit: boolean;
  onCreatePage?: (spaceId: string, folderId?: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(
    pathname.includes(`/folders/${folder.id}`) ||
      folder.pages.some((p) => pathname.includes(`/pages/${p.id}`))
  );
  const isActive = pathname === `/spaces/${spaceId}/folders/${folder.id}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group flex items-center rounded-lg hover:bg-muted/50 transition-colors">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 hover:bg-transparent"
          >
            <div className={cn(
              "transition-transform duration-200",
              isOpen && "rotate-90"
            )}>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </Button>
        </CollapsibleTrigger>
        <Link
          href={`/spaces/${spaceId}/folders/${folder.id}`}
          className={cn(
            "flex-1 flex items-center gap-2 px-2 py-1 text-sm rounded-lg transition-all duration-200",
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-foreground/70 hover:text-foreground"
          )}
        >
          <div className={cn(
            "transition-colors",
            isActive ? "text-primary" : "text-muted-foreground"
          )}>
            {isOpen ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <FolderClosed className="h-4 w-4" />
            )}
          </div>
          <span className="truncate">{folder.name}</span>
        </Link>
        {canEdit && onCreatePage && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden group-hover:flex h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onCreatePage(spaceId, folder.id);
            }}
            title="New page in folder"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <div className="ml-4 pl-2 border-l-2 border-border/30 space-y-0.5 mt-0.5">
          {folder.pages.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-1 italic">
              Empty folder
            </p>
          )}
          {folder.pages.map((page) => (
            <PageNode
              key={page.id}
              page={page}
              spaceId={spaceId}
              pathname={pathname}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PageNode({
  page,
  spaceId,
  pathname,
}: {
  page: Page;
  spaceId: string;
  pathname: string;
}) {
  const isActive = pathname.includes(`/pages/${page.id}`);

  return (
    <Link
      href={`/spaces/${spaceId}/pages/${page.id}`}
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary font-medium shadow-sm"
          : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
      )}
    >
      <FileText className={cn(
        "h-3.5 w-3.5 shrink-0 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground/70"
      )} />
      <span className="truncate">{page.title}</span>
    </Link>
  );
}
