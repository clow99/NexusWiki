"use client";

import { useState } from "react";

import { createSpace } from "@/app/actions/wiki";
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

type CreateSpaceDialogProps = {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateSpaceDialog({
  children,
  open,
  onOpenChange,
}: CreateSpaceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <form
          action={async (formData) => {
            setIsOpen(false);
            await createSpace(formData);
          }}
        >
          <DialogHeader>
            <DialogTitle>Create a new space</DialogTitle>
            <DialogDescription>
              Spaces help you organize related documentation together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="space-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="space-name"
                name="name"
                placeholder="e.g., Engineering, Product, Design"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="space-description" className="text-sm font-medium">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="space-description"
                name="description"
                placeholder="What is this space for?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create space</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
