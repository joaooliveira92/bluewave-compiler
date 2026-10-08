import type { ReactNode } from "react";
import { Alert, AlertDescription } from "../components/ui/alert.js";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar.js";
import { BottomNav } from "./BottomNav.js";
import type { Screen } from "./campaign-screen-registry.js";
import { StatusStrip } from "./StatusStrip.js";

export interface AppFrameProps {
  readonly campaignSessionId: string | null;
  readonly campaignRevision: number | null;
  readonly activeAlertsCount: number | null;
  readonly screen: Screen;
  readonly saveMessage: string | null;
  readonly header: ReactNode;
  readonly children: ReactNode;
  readonly onSelectScreen: (screen: Screen) => void;
}

/**
 * The static chrome around every screen: sidebar shell, header slot, save
 * notice, status strip and bottom navigation. Pure layout — it owns no
 * campaign state and no routing decisions.
 */
export function AppFrame({
  campaignSessionId,
  campaignRevision,
  activeAlertsCount,
  screen,
  saveMessage,
  header,
  children,
  onSelectScreen,
}: AppFrameProps) {
  return (
    <SidebarProvider className="h-svh flex-col overflow-hidden bg-transparent">
      {header}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SidebarInset className="relative min-h-0 overflow-auto bg-transparent">
          {saveMessage !== null && (
            <Alert
              variant="default"
              className="absolute left-4 right-4 top-2 z-50 border backdrop-blur-sm"
            >
              <AlertDescription>{saveMessage}</AlertDescription>
            </Alert>
          )}
          {children}
        </SidebarInset>
      </div>
      {campaignSessionId !== null && campaignRevision !== null && (
        <StatusStrip
          sessionId={campaignSessionId}
          revision={campaignRevision}
          alertsCount={activeAlertsCount}
        />
      )}
      {campaignSessionId !== null && (
        <BottomNav screen={screen} onSelect={onSelectScreen} footer={campaignSessionId} />
      )}
    </SidebarProvider>
  );
}
