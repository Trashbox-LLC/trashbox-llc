"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import { SettingsSidebar } from "@/components/features/portal/settings/SettingsSidebar";
import { subscribePortalNavigate } from "@/lib/portal-routes";
import {
  DEFAULT_SETTINGS_SECTION,
  getSettingsSection,
  isSettingsSectionId,
  isSignatureBuilderPath,
  isSnippetBuilderPath,
  isTemplateBuilderImmersivePath,
  type SettingsScope,
} from "@/lib/portal-settings";

const SettingsHeaderActionsContext =
  createContext<Dispatch<SetStateAction<ReactNode>> | null>(null);

/** Renders into the section title row when a settings shell is present. */
export function SettingsHeaderAction({ children }: { children: ReactNode }) {
  const setActions = useContext(SettingsHeaderActionsContext);
  useLayoutEffect(() => {
    if (!setActions) return;
    setActions(children);
    return () => setActions(null);
  }, [children, setActions]);
  if (setActions) return null;
  return children;
}

export function useHasSettingsHeader(): boolean {
  return useContext(SettingsHeaderActionsContext) !== null;
}

interface SettingsShellProps {
  children: ReactNode;
  scope?: SettingsScope;
}

function sectionIdFromPath(
  pathname: string | null | undefined,
  scope: SettingsScope,
) {
  if (!pathname) return DEFAULT_SETTINGS_SECTION;
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  const settingsIndex = parts.indexOf("settings");
  if (settingsIndex >= 0) {
    const after = parts[settingsIndex + 1];
    if (after && isSettingsSectionId(after, scope)) return after;
  }
  const maybe = parts[parts.length - 1];
  if (maybe && isSettingsSectionId(maybe, scope)) return maybe;
  if (maybe === "settings") return DEFAULT_SETTINGS_SECTION;
  return DEFAULT_SETTINGS_SECTION;
}

export function SettingsShell({
  children,
  scope = "project",
}: SettingsShellProps) {
  const nextPath = usePathname() ?? "";
  const [pathname, setPathname] = useState(nextPath);
  const [headerActions, setHeaderActions] = useState<ReactNode>(null);

  useEffect(() => {
    const win = window.location.pathname;
    setPathname(win.includes("/settings/") ? win : nextPath || win);
    return subscribePortalNavigate(setPathname);
  }, [nextPath]);

  const sectionId = sectionIdFromPath(pathname, scope);
  const section = getSettingsSection(sectionId, scope);
  const title = scope === "org" ? "Organization settings" : "Settings";
  const signatureBuilder = isSignatureBuilderPath(pathname);
  const snippetBuilder = isSnippetBuilderPath(pathname);

  if (isTemplateBuilderImmersivePath(pathname)) {
    return (
      <div className="fixed inset-x-0 top-11 bottom-0 z-40 flex flex-col bg-background">
        {children}
      </div>
    );
  }

  return (
    <SettingsHeaderActionsContext.Provider value={setHeaderActions}>
      <div className="space-y-10">
        <header>
          <p className="mb-6 font-label text-xs uppercase tracking-[0.4em] text-outline">
            Settings
          </p>
          <h1 className="max-w-4xl font-headline text-4xl font-bold leading-tight tracking-tighter text-white md:text-6xl">
            {title}
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low/40 p-2 lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
              <SettingsSidebar scope={scope} />
            </div>
          </aside>

          <div className="min-w-0 space-y-6 lg:col-span-9">
            {!signatureBuilder && (
              <div>
                {section?.groupLabel && (
                  <p className="mb-2 font-label text-[10px] uppercase tracking-widest text-outline">
                    {section.groupLabel}
                  </p>
                )}
                {!snippetBuilder && (
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-headline text-2xl font-bold tracking-tight text-white md:text-3xl">
                      {section?.label ?? "Settings"}
                    </h2>
                    {headerActions}
                  </div>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </SettingsHeaderActionsContext.Provider>
  );
}
