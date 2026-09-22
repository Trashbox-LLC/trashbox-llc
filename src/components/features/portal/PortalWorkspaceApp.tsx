"use client";

import { useEffect, useMemo } from "react";
import { ContactsPage } from "@/components/features/portal/contacts/ContactsPage";
import { FormsPage } from "@/components/features/portal/forms/FormsPage";
import { PortalHome } from "@/components/features/portal/home/PortalHome";
import { PortalApp } from "@/components/features/portal/leads/PortalPage";
import { OrgSettingsSectionContent } from "@/components/features/portal/orgs/OrgSettingsSectionContent";
import { PortalSkeleton } from "@/components/features/portal/PortalSkeleton";
import { SettingsSectionContent } from "@/components/features/portal/settings/SettingsSectionContent";
import { SettingsShell } from "@/components/features/portal/settings/SettingsShell";
import { SignatureBuilderCreatePage } from "@/components/features/portal/settings/signature-builder/SignatureBuilderCreatePage";
import { SignatureBuilderEditPage } from "@/components/features/portal/settings/signature-builder/SignatureBuilderEditPage";
import { SnippetBuilderCreatePage } from "@/components/features/portal/settings/snippet-builder/SnippetBuilderCreatePage";
import { SnippetBuilderEditPage } from "@/components/features/portal/settings/snippet-builder/SnippetBuilderEditPage";
import { TemplateBuilderCreatePage } from "@/components/features/portal/settings/template-builder/TemplateBuilderCreatePage";
import { TemplateBuilderEditPage } from "@/components/features/portal/settings/template-builder/TemplateBuilderEditPage";
import { TemplateBuilderNewPage } from "@/components/features/portal/settings/template-builder/TemplateBuilderNewPage";
import { useAuth } from "@/lib/auth";
import { usePortal } from "@/lib/portal";
import {
  parsePortalWorkspacePath,
  portalNavigate,
  portalWorkspacePath,
} from "@/lib/portal-routes";
import {
  getSelectedOrgId,
  getSelectedProjectId,
} from "@/lib/portal-selection";
import {
  DEFAULT_SETTINGS_SECTION,
  isSettingsSectionId,
  orgSettingsSectionPath,
  resolveOrgSettingsSection,
  type SettingsSectionId,
} from "@/lib/portal-settings";
import { PORTAL_PATHS } from "@/lib/sites";

type ProjectSettingsSurface =
  | SettingsSectionId
  | "templates/new"
  | "templates/builder"
  | "templates/edit"
  | "signatures/new"
  | "signatures/edit"
  | "snippets/new"
  | "snippets/edit";

function settingsSurface(
  settingsRest: string | undefined,
  scope: "org",
): SettingsSectionId;
function settingsSurface(
  settingsRest: string | undefined,
  scope: "project",
): ProjectSettingsSurface;
function settingsSurface(
  settingsRest: string | undefined,
  scope: "org" | "project",
): ProjectSettingsSurface {
  const rest = (settingsRest || "").replace(/^\/+|\/+$/g, "");
  if (scope === "project") {
    if (rest === "templates/new") return "templates/new";
    if (rest === "templates/builder") return "templates/builder";
    if (rest === "templates/edit") return "templates/edit";
    if (rest === "signatures/new") return "signatures/new";
    if (rest === "signatures/edit") return "signatures/edit";
    if (rest === "snippets/new") return "snippets/new";
    if (rest === "snippets/edit") return "snippets/edit";
  }
  if (!rest) return DEFAULT_SETTINGS_SECTION;
  const section = rest.split("/")[0] || DEFAULT_SETTINGS_SECTION;
  if (scope === "org") return resolveOrgSettingsSection(section);
  return isSettingsSectionId(section, scope) ? section : DEFAULT_SETTINGS_SECTION;
}

interface PortalWorkspaceAppProps {
  pathname?: string;
}

export function PortalWorkspaceApp({ pathname }: PortalWorkspaceAppProps) {
  const auth = useAuth();
  const portal = usePortal();
  const path =
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "");
  const parsed = useMemo(() => parsePortalWorkspacePath(path), [path]);

  useEffect(() => {
    if (auth.status === "signedOut") {
      window.location.replace(PORTAL_PATHS.login);
    }
  }, [auth.status]);

  useEffect(() => {
    if (!portal.ready || !parsed || auth.status !== "signedIn") return;

    const org = portal.orgs.find((entry) => entry.orgSlug === parsed.orgSlug);
    if (!org) {
      // Avoid replace-loops while orgs are still empty between reloads.
      if (portal.orgs.length === 0) return;
      window.location.replace(PORTAL_PATHS.orgs);
      return;
    }

    if (parsed.surface === "membership") {
      const target = portalWorkspacePath({
        orgSlug: org.orgSlug,
        surface: "orgSettings",
        settingsRest: "current-plan",
      });
      if (
        window.location.pathname.replace(/\/$/, "") !==
        target.replace(/\/$/, "")
      ) {
        portalNavigate(target, { replace: true });
      }
      return;
    }

    if (parsed.surface === "orgHome" || parsed.surface === "orgSettings") {
      if (
        getSelectedOrgId() !== org.orgId ||
        getSelectedProjectId() !== null
      ) {
        portal.selectWorkspace(org.orgId, "");
      }
      return;
    }

    const project = org.projects.find(
      (entry) => entry.projectSlug === parsed.projectSlug,
    );
    if (!project) {
      const target = portalWorkspacePath({
        orgSlug: org.orgSlug,
        surface: "orgHome",
      });
      if (window.location.pathname.replace(/\/$/, "") !== target.replace(/\/$/, "")) {
        portalNavigate(target, { replace: true });
      }
      return;
    }

    if (
      getSelectedOrgId() !== org.orgId ||
      getSelectedProjectId() !== project.projectId
    ) {
      portal.selectWorkspace(org.orgId, project.projectId);
    }
  }, [
    auth.status,
    parsed,
    portal.ready,
    portal.orgs,
    portal.selectWorkspace,
  ]);

  if (!auth.configured) {
    return (
      <p className="border-outline-variant/20 bg-surface-container-low text-on-surface-variant border p-6">
        Portal auth is not configured.
      </p>
    );
  }

  if (
    auth.status === "loading" ||
    auth.status === "signedOut" ||
    !portal.ready ||
    !parsed
  ) {
    return <PortalSkeleton />;
  }

  const org = portal.orgs.find((entry) => entry.orgSlug === parsed.orgSlug);
  if (!org) return <PortalSkeleton />;

  if (parsed.surface === "orgHome") {
    return <PortalHome />;
  }

  if (parsed.surface === "membership") {
    return <PortalSkeleton />;
  }

  if (parsed.surface === "orgSettings") {
    const rawSection = (parsed.settingsRest || "")
      .replace(/^\/+|\/+$/g, "")
      .split("/")[0];
    const sectionId = settingsSurface(parsed.settingsRest, "org");
    if (
      rawSection &&
      rawSection !== sectionId &&
      typeof window !== "undefined"
    ) {
      const target = orgSettingsSectionPath(org.orgSlug, sectionId);
      if (
        window.location.pathname.replace(/\/$/, "") !==
        target.replace(/\/$/, "")
      ) {
        portalNavigate(target, { replace: true });
        return <PortalSkeleton />;
      }
    }
    return (
      <SettingsShell scope="org">
        <OrgSettingsSectionContent org={org} sectionId={sectionId} />
      </SettingsShell>
    );
  }

  const project = org.projects.find(
    (entry) => entry.projectSlug === parsed.projectSlug,
  );
  if (!project) return <PortalSkeleton />;

  if (parsed.surface === "projectHome") {
    const inbox = portalWorkspacePath({
      orgSlug: org.orgSlug,
      projectSlug: project.projectSlug,
      surface: "inbox",
    });
    if (
      typeof window !== "undefined" &&
      window.location.pathname.replace(/\/$/, "") !== inbox.replace(/\/$/, "")
    ) {
      portalNavigate(inbox, { replace: true });
    }
    return <PortalSkeleton />;
  }
  if (parsed.surface === "inbox") {
    return <PortalApp tab="inbox" />;
  }

  if (parsed.surface === "contacts") {
    return (
      <ContactsPage
        orgSlug={org.orgSlug}
        projectSlug={project.projectSlug}
        contactId={parsed.contactId}
      />
    );
  }

  if (parsed.surface === "forms") {
    return <FormsPage />;
  }

  // Legacy Settings → Forms deep link.
  const settingsRest = (parsed.settingsRest || "").replace(/^\/+|\/+$/g, "");
  if (
    parsed.surface === "settings" &&
    (settingsRest === "forms" || settingsRest.startsWith("forms/"))
  ) {
    const target = portalWorkspacePath({
      orgSlug: org.orgSlug,
      projectSlug: project.projectSlug,
      surface: "forms",
    });
    if (
      typeof window !== "undefined" &&
      window.location.pathname.replace(/\/$/, "") !== target.replace(/\/$/, "")
    ) {
      portalNavigate(target, { replace: true });
    }
    return <PortalSkeleton />;
  }

  const settingsKind = settingsSurface(parsed.settingsRest, "project");
  if (settingsKind === "templates/new") {
    return (
      <SettingsShell>
        <TemplateBuilderNewPage />
      </SettingsShell>
    );
  }
  if (settingsKind === "templates/builder") {
    return (
      <SettingsShell>
        <TemplateBuilderCreatePage />
      </SettingsShell>
    );
  }
  if (settingsKind === "templates/edit") {
    return (
      <SettingsShell>
        <TemplateBuilderEditPage />
      </SettingsShell>
    );
  }
  if (settingsKind === "signatures/new") {
    return (
      <SettingsShell>
        <SignatureBuilderCreatePage />
      </SettingsShell>
    );
  }
  if (settingsKind === "signatures/edit") {
    return (
      <SettingsShell>
        <SignatureBuilderEditPage />
      </SettingsShell>
    );
  }
  if (settingsKind === "snippets/new") {
    return (
      <SettingsShell>
        <SnippetBuilderCreatePage />
      </SettingsShell>
    );
  }
  if (settingsKind === "snippets/edit") {
    return (
      <SettingsShell>
        <SnippetBuilderEditPage />
      </SettingsShell>
    );
  }

  return (
    <SettingsShell>
      <SettingsSectionContent sectionId={settingsKind as SettingsSectionId} />
    </SettingsShell>
  );
}
