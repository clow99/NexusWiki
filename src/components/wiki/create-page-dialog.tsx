"use client";

import { useState, useEffect } from "react";

import { createPage } from "@/app/actions/wiki";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Folder = {
  id: string;
  name: string;
};

type CreatePageDialogProps = {
  spaceId: string;
  folders?: Folder[];
  defaultFolderId?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreatePageDialog({
  spaceId,
  folders = [],
  defaultFolderId,
  children,
  open,
  onOpenChange,
}: CreatePageDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  // Use "__none__" as sentinel for "no folder" since Radix UI doesn't allow empty string values
  const [folderId, setFolderId] = useState(defaultFolderId || "__none__");
  
  // Sync folderId when defaultFolderId prop changes
  useEffect(() => {
    setFolderId(defaultFolderId || "__none__");
  }, [defaultFolderId]);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <form
          action={async (formData) => {
            setIsOpen(false);
            await createPage(formData);
          }}
        >
          <input type="hidden" name="spaceId" value={spaceId} />
          <input type="hidden" name="folderId" value={folderId === "__none__" ? "" : folderId} />
          <DialogHeader>
            <DialogTitle>Create a new page</DialogTitle>
            <DialogDescription>
              Start writing documentation in markdown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="page-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="page-title"
                name="title"
                placeholder="e.g., Getting Started Guide"
                required
              />
            </div>
            {folders.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Folder <span className="text-muted-foreground">(optional)</span>
                </label>
                <Select value={folderId} onValueChange={setFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="page-content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="page-content"
                name="content"
                placeholder="Start writing in markdown..."
                rows={6}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create page</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
