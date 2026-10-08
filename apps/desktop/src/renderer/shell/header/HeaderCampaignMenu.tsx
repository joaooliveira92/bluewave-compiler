import { ChevronDown, Copy, DoorOpen, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog.js";
import { Button } from "../../components/ui/button.js";

export interface HeaderCampaignMenuProps {
  readonly saving: boolean;
  readonly onSave: () => void;
  readonly onCopy: () => void;
  readonly onCloseCampaign: () => void;
}

/** The header's Campaign menu (CC-6): file-level actions. Advance Month stays the only Turn control. */
export function HeaderCampaignMenu({
  saving,
  onSave,
  onCopy,
  onCloseCampaign,
}: HeaderCampaignMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  // A plain disclosure (no portal): closes on outside press and Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const run = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <>
      <div ref={rootRef} className="relative">
        <Button
          variant="outline"
          aria-label="Campaign menu"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          title="Save, copy or close the campaign"
          className="h-8 shrink-0 gap-1 px-3"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Campaign
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 flex w-52 flex-col gap-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            <Button
              variant="ghost"
              className="justify-start gap-2"
              disabled={saving}
              onClick={run(onSave)}
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-2"
              disabled={saving}
              onClick={run(onCopy)}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy game…
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={run(() => setConfirmOpen(true))}
            >
              <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Close campaign…
            </Button>
          </div>
        )}
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be returned to the campaign file screen. Unsaved progress may be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onCloseCampaign}>Close campaign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
