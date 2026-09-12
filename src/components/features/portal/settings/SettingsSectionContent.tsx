"use client";

import {
  EmailContentSettingsSection,
  type EmailContentSectionInitialState,
} from "@/components/features/portal/settings/EmailContentSettingsSection";
import type { EmailContentKind } from "@/components/features/portal/settings/EmailContentSettings";
import { MailboxSettings } from "@/components/features/portal/settings/MailboxSettings";
import { SendingPreferencesSettings } from "@/components/features/portal/settings/SendingPreferencesSettings";
import { SmsNumberApplicationSection } from "@/components/features/portal/settings/SmsNumberApplicationSection";
import {
  SmsSettingsSection,
  type SmsSettingsInitialState,
} from "@/components/features/portal/settings/SmsSettingsSection";
import { SettingsPlaceholder } from "@/components/features/portal/settings/SettingsPlaceholder";
import { ApiDocsSettings } from "@/components/features/portal/settings/ApiDocsSettings";
import {
  ApiKeysSettings,
  type ApiKeysSettingsInitialState,
} from "@/components/features/portal/settings/ApiKeysSettings";
import { GeneralSettings } from "@/components/features/portal/settings/GeneralSettings";
import { PortalSkeleton } from "@/components/features/portal/PortalSkeleton";
import { useAuth } from "@/lib/auth";
import { usePortal } from "@/lib/portal";
import {
  getSettingsSection,
  type SettingsSectionId,
} from "@/lib/portal-settings";

const EMAIL_CONTENT_SECTIONS: Partial<
  Record<SettingsSectionId, EmailContentKind>
> = {
  templates: "template",
  signatures: "signature",
  snippets: "snippet",
};

interface SettingsSectionContentProps {
  sectionId: SettingsSectionId;
  /** Storybook/demo seed for nested API-backed sections. */
  apiKeysInitialState?: ApiKeysSettingsInitialState;
  emailContentInitialState?: EmailContentSectionInitialState;
  smsInitialState?: SmsSettingsInitialState;
}

export function SettingsSectionContent({
  sectionId,
  apiKeysInitialState,
  emailContentInitialState,
  smsInitialState,
}: SettingsSectionContentProps) {
  const auth = useAuth();
  const portal = usePortal();
  const section = getSettingsSection(sectionId);

  if (!auth.configured) {
    return (
      <p className="border-outline-variant/20 bg-surface-container-low text-on-surface-variant border p-6">
        Portal auth is not configured. Set `NEXT_PUBLIC_API_URL`,
        `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, and `NEXT_PUBLIC_COGNITO_CLIENT_ID`
        then rebuild.
      </p>
    );
  }

  const contentPending =
    auth.status === "loading" || auth.status === "signedOut" || !portal.ready;

  if (contentPending) {
    return <PortalSkeleton variant="settings" />;
  }

  if (!portal.account?.linked) {
    return (
      <p className="text-on-surface-variant">
        Select a project before managing project settings. Team and billing live
        under organization settings.
      </p>
    );
  }

  if (sectionId === "general") {
    return (
      <GeneralSettings
        email={auth.email || portal.account.email || ""}
        clientName={portal.clientName || portal.account.clientName}
        tier={portal.account.tier}
        active={portal.account.active}
        submissionsUsed={portal.account.submissionsUsed}
        submissionLimit={portal.account.submissionLimit}
        emailsUsed={portal.account.emailsUsed}
        emailLimit={portal.account.emailLimit}
      />
    );
  }

  if (sectionId === "email-accounts") {
    return (
      <MailboxSettings
        canManage={portal.hasPermission("manage_sender_display_names")}
        mailbox={portal.mailbox}
        busy={portal.mailboxBusy}
        error={portal.mailboxError}
        onConnect={portal.onMailboxConnect}
        onDisconnect={portal.onMailboxDisconnect}
        onSync={portal.onMailboxSync}
      />
    );
  }

  if (sectionId === "text-messaging") {
    return (
      <div className="space-y-6">
        <SmsNumberApplicationSection />
        {portal.sms?.phoneNumber ? (
          <SmsSettingsSection initialState={smsInitialState} />
        ) : null}
      </div>
    );
  }

  if (sectionId === "sending-preferences") {
    return (
      <SendingPreferencesSettings
        canManage={portal.hasPermission("manage_sender_display_names")}
        mailbox={portal.mailbox}
        busy={portal.mailboxBusy}
        error={portal.mailboxError}
        onPatch={portal.onMailboxPatch}
      />
    );
  }

  const emailContentKind = EMAIL_CONTENT_SECTIONS[sectionId];
  if (emailContentKind) {
    return (
      <EmailContentSettingsSection
        kind={emailContentKind}
        businessName={portal.account.clientName}
      />
    );
  }

  if (sectionId === "api-keys") {
    return <ApiKeysSettings initialState={apiKeysInitialState} />;
  }

  if (sectionId === "api-documentation") {
    return <ApiDocsSettings />;
  }

  return (
    <SettingsPlaceholder
      sectionId={sectionId}
      title={section?.label ?? "This"}
    />
  );
}
