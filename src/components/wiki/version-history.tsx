"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Revision = {
  id: string;
  version: number;
  createdAt: Date;
};

type VersionHistoryProps = {
  revisions: Revision[];
  pageId: string;
  canEdit: boolean;
  restoreAction: (formData: FormData) => Promise<void>;
};

export function VersionHistory({
  revisions,
  pageId,
  canEdit,
  restoreAction,
}: VersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Version History</span>
          <Badge variant="secondary" className="text-xs">
            {revisions.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 pl-6 animate-in slide-in-from-top-2 duration-200">
          {revisions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No revisions yet.</p>
          ) : (
            revisions.map((revision, index) => (
              <div key={revision.id}>
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <div className="text-sm font-medium">
                      Version {revision.version}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {revision.createdAt.toLocaleString()}
                    </div>
                  </div>
                  {canEdit && (
                    <form action={restoreAction}>
                      <input type="hidden" name="pageId" value={pageId} />
                      <input
                        type="hidden"
                        name="revisionId"
                        value={revision.id}
                      />
                      <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs">
                        Restore
                      </Button>
                    </form>
                  )}
                </div>
                {index < revisions.length - 1 && <Separator className="my-1" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
