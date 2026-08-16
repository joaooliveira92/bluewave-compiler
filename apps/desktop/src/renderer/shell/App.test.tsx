/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { BluewaveDesktopBridge } from "../../preload/index.js";
import type { CampaignCommandClient } from "../../shared/campaign-command-contract.js";
import type { Screen } from "./campaign-screen-registry.js";

const testState = vi.hoisted(() => ({
  background: "none" as "none" | "water" | "stars" | "mesh-citrus" | "mesh-lagoon",
  resolvedTheme: "light" as "light" | "dark",
  shell: {} as Record<string, unknown>,
}));

afterEach(() => {
  cleanup();
});

vi.mock("./BackgroundContext.js", () => ({
  useBackground: () => ({
    background: testState.background,
    setBackground: vi.fn(),
  }),
}));

vi.mock("./ThemeContext.js", () => ({
  useTheme: () => ({
    theme: testState.resolvedTheme,
    resolvedTheme: testState.resolvedTheme,
    setTheme: vi.fn(),
  }),
}));

vi.mock("./useCampaignShell.js", () => ({
  useCampaignShell: () => testState.shell,
}));

vi.mock("./WindowContext.js", async () => {
  const React = await import("react");
  return {
    WindowContextProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

vi.mock("../components/ui/sidebar.js", async () => {
  const React = await import("react");
  return {
    SidebarProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "sidebar-provider" }, children),
    SidebarInset: ({ children }: { children: React.ReactNode }) =>
      React.createElement("main", null, children),
  };
});

vi.mock("../components/ui/alert.js", async () => {
  const React = await import("react");
  return {
    Alert: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { role: "alert" }, children),
    AlertDescription: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

vi.mock("../components/backgrounds/starts.tsx", async () => {
  const React = await import("react");
  return {
    StarsBackground: () => React.createElement("div", { "data-testid": "stars-background" }),
  };
});

vi.mock("../components/motion/shader-background.tsx", async () => {
  const React = await import("react");
  return {
    ShaderBackground: ({ variant }: { variant: string }) =>
      React.createElement("div", {
        "data-testid": "shader-background",
        "data-variant": variant,
      }),
  };
});

vi.mock("../screens/campaign-file/CampaignFileScreen.js", async () => {
  const React = await import("react");
  return {
    CampaignFileScreen: ({
      onOpenCampaign,
      onStartNewGame,
    }: {
      onOpenCampaign: (sessionId: string) => Promise<void>;
      onStartNewGame: () => void;
    }) =>
      React.createElement(
        "section",
        null,
        React.createElement("h1", null, "Campaign files"),
        React.createElement(
          "button",
          { onClick: () => void onOpenCampaign("ses-open") },
          "Open campaign",
        ),
        React.createElement("button", { onClick: onStartNewGame }, "Start new game"),
      ),
  };
});

vi.mock("../screens/new-game/RulesOfTheNavalAgeScreen.js", async () => {
  const React = await import("react");
  return {
    RulesOfTheNavalAgeScreen: ({
      onCancel,
      onNext,
    }: {
      onCancel: () => void;
      onNext: (preferences: Record<string, string>, options: unknown) => void;
      recommendedPreset: unknown;
    }) =>
      React.createElement(
        "section",
        null,
        React.createElement("h1", null, "Campaign preferences"),
        React.createElement("button", { onClick: onCancel }, "Cancel"),
        React.createElement(
          "button",
          {
            onClick: () =>
              onNext(
                { scenarioId: "scen_1900" },
                { scenarios: [], nations: [], supportedValues: {} },
              ),
          },
          "Next",
        ),
      ),
  };
});

vi.mock("../screens/new-game/NewGameNationScreen.js", async () => {
  const React = await import("react");
  return {
    NewGameNationScreen: ({
      error,
      onCancel,
      onConfirm,
    }: {
      error: string | null;
      onCancel: () => void;
      onConfirm: (nationId: string) => void;
    }) =>
      React.createElement(
        "section",
        null,
        React.createElement("h1", null, "Choose nation"),
        error ? React.createElement("p", { role: "alert" }, error) : null,
        React.createElement("button", { onClick: onCancel }, "Back"),
        React.createElement(
          "button",
          { onClick: () => onConfirm("nation_uk") },
          "Confirm nation",
        ),
      ),
  };
});

vi.mock("../screens/new-game/NewGameIdentityScreen.js", async () => {
  const React = await import("react");
  return {
    NewGameIdentityScreen: ({ onNext }: { onNext: (identity: Record<string, string>) => void }) =>
      React.createElement(
        "section",
        null,
        React.createElement("h1", null, "Admiral & campaign identity"),
        React.createElement(
          "button",
          {
            onClick: () =>
              onNext({
                admiralName: "John Fisher",
                campaignName: "Britannia Ascendant",
                namingConvention: "historical",
                shipNameReuse: "disabled",
                measurementSystem: "imperial",
              }),
          },
          "Next",
        ),
      ),
  };
});

vi.mock("../screens/new-game/NewGameFleetMethodScreen.js", async () => {
  const React = await import("react");
  return {
    NewGameFleetMethodScreen: ({
      status,
      error,
      onNext,
    }: {
      status: "ready" | "launching";
      error: string | null;
      onNext: (fleetMethod: Record<string, string>) => void;
    }) =>
      React.createElement(
        "section",
        null,
        React.createElement("h1", null, "Starting-fleet method"),
        status === "launching" ? React.createElement("p", null, "Starting…") : null,
        error ? React.createElement("p", { role: "alert" }, error) : null,
        React.createElement(
          "button",
          { onClick: () => onNext({ legacyFleetModeId: "generated" }) },
          "Continue to review",
        ),
      ),
  };
});

vi.mock("../screens/new-game/NewGameCommissioningReviewScreen.js", async () => {
  const React = await import("react");
  return {
    NewGameCommissioningReviewScreen: ({
      status,
      error,
      onBeginCommission,
    }: {
      status: "ready" | "launching";
      error: string | null;
      onBeginCommission: () => Promise<void>;
    }) =>
      React.createElement(
        "section",
        null,
        React.createElement("h1", null, "Final commissioning review"),
        status === "launching" ? React.createElement("p", null, "Commissioning…") : null,
        error ? React.createElement("p", { role: "alert" }, error) : null,
        React.createElement("button", { onClick: () => void onBeginCommission() }, "Begin Commission"),
      ),
  };
});

vi.mock("./AppSidebar.js", async () => {
  const React = await import("react");
  return {
    AppSidebar: ({ footer }: { footer?: string }) =>
      React.createElement("aside", null, `Sidebar ${footer ?? ""}`),
  };
});

vi.mock("./campaign-screen-registry.js", async () => {
  const React = await import("react");
  return {
    CAMPAIGN_SCREEN_SEARCH_TARGETS: [
      { id: "overview", label: "Overview" },
      { id: "fleet", label: "Fleet" },
    ],
    CampaignScreenOutlet: ({ screen: activeScreen }: { screen: string }) =>
      React.createElement("section", { "data-testid": "campaign-outlet" }, activeScreen),
  };
});

vi.mock("./SiteHeader.js", async () => {
  const React = await import("react");
  return {
    SiteHeader: ({
      title,
      activeView,
      continueAction,
      searchTargets,
    }: {
      title: string;
      activeView: string;
      continueAction?: {
        label: string;
        disabled: boolean;
        onTrigger: () => void;
      };
      searchTargets: readonly unknown[];
    }) =>
      React.createElement(
        "header",
        {
          "data-testid": "site-header",
          "data-active-view": activeView,
          "data-can-continue": String(continueAction !== undefined),
          "data-search-target-count": String(searchTargets.length),
        },
        title,
        continueAction ? React.createElement("span", null, continueAction.label) : null,
      ),
  };
});

import { App } from "./App.js";

function createShell(overrides: Record<string, unknown> = {}) {
  const shell = {
    campaign: null as Record<string, unknown> | null,
    loading: false,
    error: null as string | null,
    saving: false,
    saveMessage: null,
    primaryAction: null,
    screen: "file" as Screen,
    canGoBack: false,
    canGoForward: false,
    openCampaign: vi.fn(async () => undefined),
    closeCampaign: vi.fn(async () => undefined),
    saveCampaign: vi.fn(async () => undefined),
    selectScreen: vi.fn(),
    setPrimaryAction: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    ...overrides,
  };
  const mode = shell.loading
    ? { kind: "opening" as const, screen: shell.screen }
    : shell.error !== null
      ? {
          kind: "open-error" as const,
          screen: shell.screen,
          message: shell.error,
        }
      : shell.campaign !== null
        ? {
            kind: "campaign" as const,
            screen: shell.screen,
            campaign: shell.campaign,
          }
        : shell.screen === "new-game-nation"
          ? { kind: "new-game-nation" as const, screen: shell.screen }
          : shell.screen === "new-game-preferences"
            ? { kind: "new-game-preferences" as const, screen: shell.screen }
            : shell.screen === "new-game-archetype"
              ? { kind: "new-game-archetype" as const, screen: shell.screen }
              : shell.screen === "new-game-identity"
                ? { kind: "new-game-identity" as const, screen: shell.screen }
                : shell.screen === "new-game-fleet-method"
                  ? { kind: "new-game-fleet-method" as const, screen: shell.screen }
                  : shell.screen === "new-game-review"
                    ? { kind: "new-game-review" as const, screen: shell.screen }
                    : { kind: "file" as const, screen: "file" as const };
  return { ...shell, mode };
}

function createCampaignClient(execute?: CampaignCommandClient["execute"]): CampaignCommandClient {
  return {
    execute:
      execute ??
      (vi.fn(async (_name: string) => ({
        outcome: "success" as const,
        value: { sessionId: "ses-created" },
      })) as unknown as CampaignCommandClient["execute"]),
  };
}

function createBridge(overrides: Partial<BluewaveDesktopBridge> = {}): BluewaveDesktopBridge {
  return {
    applicationName: "Bluewave",
    engineContract: "CampaignEngine",
    platform: "linux",
    campaign: createCampaignClient(),
    getWindowState: vi.fn(async () => ({
      platform: "linux",
      isMaximized: false,
      maximizable: true,
      minimizable: true,
    })),
    windowMinimize: vi.fn(),
    windowMaximizeToggle: vi.fn(),
    windowClose: vi.fn(),
    ...overrides,
  } as BluewaveDesktopBridge;
}

describe("App", () => {
  beforeEach(() => {
    testState.background = "none";
    testState.resolvedTheme = "light";
    testState.shell = createShell();
    window.bluewave = createBridge();
  });

  it("renders the file variant when no campaign is open", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Campaign files" })).toBeTruthy();
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByTestId("site-header").dataset.activeView).toBe("menu");
    expect(screen.getByTestId("site-header").dataset.searchTargetCount).toBe("0");
  });

  it("renders a dedicated loading variant", () => {
    testState.shell = createShell({ loading: true });

    render(<App />);

    expect(screen.getByText("Loading campaign…")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Campaign files" })).toBeNull();
  });

  it("renders the file variant together with the opening error", () => {
    testState.shell = createShell({ error: "Inspection failed" });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Campaign files" })).toBeTruthy();
    expect(screen.getByText("Inspection failed")).toBeTruthy();
  });

  it("moves from file selection to the nation-confirmation variant", () => {
    const shell = createShell();
    testState.shell = shell;

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start new game" }));

    expect(shell.selectScreen).toHaveBeenCalledWith("new-game-nation");
  });

  it("composes the active campaign shell, sidebar, outlet, search, and primary action", () => {
    testState.shell = createShell({
      campaign: {
        sessionId: "ses-1",
        month: { year: 1900, month: 1 },
        treasury: 50_000,
      },
      screen: "overview",
      saveMessage: "Campaign saved",
      primaryAction: {
        label: "Advance turn",
        disabled: false,
        onTrigger: vi.fn(),
      },
    });

    render(<App />);

    expect(screen.getByText("Sidebar ses-1")).toBeTruthy();
    expect(screen.getByTestId("campaign-outlet").textContent).toBe("overview");
    expect(screen.getByRole("alert").textContent).toContain("Campaign saved");
    expect(screen.getByTestId("site-header").dataset.activeView).toBe("playing");
    expect(screen.getByTestId("site-header").dataset.canContinue).toBe("true");
    expect(screen.getByTestId("site-header").dataset.searchTargetCount).toBe("2");
    expect(screen.getByText("Advance turn")).toBeTruthy();
  });

  it("renders the selected background as an explicit variant", () => {
    testState.background = "stars";

    const { rerender } = render(<App />);
    expect(screen.getByTestId("stars-background")).toBeTruthy();

    testState.background = "water";
    rerender(<App />);
    expect(screen.getByTestId("shader-background").dataset.variant).toBe("water");
  });

  it("compiles a campaign and opens the returned session", async () => {
    const shell = createShell({ screen: "new-game-nation" });
    testState.shell = shell;
    const execute = vi.fn(async () => ({
      outcome: "success" as const,
      value: { sessionId: "ses-created" },
    })) as unknown as CampaignCommandClient["execute"];
    window.bluewave = createBridge({ campaign: createCampaignClient(execute) });

    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm nation" }));
    expect(shell.selectScreen).toHaveBeenCalledWith("new-game-preferences");

    testState.shell = createShell({ ...shell, screen: "new-game-preferences" });
    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(shell.selectScreen).toHaveBeenCalledWith("new-game-archetype");

    testState.shell = createShell({ ...shell, screen: "new-game-identity" });
    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(shell.selectScreen).toHaveBeenCalledWith("new-game-fleet-method");

    testState.shell = createShell({ ...shell, screen: "new-game-fleet-method" });
    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
    expect(shell.selectScreen).toHaveBeenCalledWith("new-game-review");

    testState.shell = createShell({ ...shell, screen: "new-game-review" });
    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Begin Commission" }));

    await waitFor(() => expect(execute).toHaveBeenCalledWith("compileCampaign", expect.anything()));
    await waitFor(() => expect(shell.openCampaign).toHaveBeenCalledWith("ses-created"));
  });

  it("shows a compilation rejection and does not open a campaign", async () => {
    const shell = createShell({ screen: "new-game-nation" });
    testState.shell = shell;
    const execute = vi.fn(async () => ({
      outcome: "rejected" as const,
      reason: "UNSUPPORTED_CONFIGURATION",
      diagnostics: ["difficulty is invalid"],
    })) as unknown as CampaignCommandClient["execute"];
    window.bluewave = createBridge({ campaign: createCampaignClient(execute) });

    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm nation" }));

    testState.shell = createShell({ ...shell, screen: "new-game-preferences" });
    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    testState.shell = createShell({ ...shell, screen: "new-game-identity" });
    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    testState.shell = createShell({ ...shell, screen: "new-game-fleet-method" });
    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));

    testState.shell = createShell({ ...shell, screen: "new-game-review" });
    rerender(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Begin Commission" }));

    expect(
      await screen.findByText("UNSUPPORTED_CONFIGURATION. difficulty is invalid"),
    ).toBeTruthy();
    expect(shell.openCampaign).not.toHaveBeenCalled();
  });
});
