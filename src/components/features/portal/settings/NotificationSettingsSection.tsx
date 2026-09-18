"use client";

import { useCallback, useEffect, useState } from "react";
import { NotificationSettings } from "@/components/features/portal/settings/NotificationSettings";
import {
  ApiError,
  getNotificationSettings,
  NOTIFICATION_EVENTS,
  updateNotificationSettings,
  type EventToggles,
  type NotificationEvent,
  type NotificationSettings as NotificationSettingsMap,
} from "@/lib/api";

export interface NotificationSettingsInitialState {
  settings: NotificationSettingsMap;
}

interface NotificationSettingsSectionProps {
  /** Storybook/tests: seed without hitting the API. */
  initialState?: NotificationSettingsInitialState;
}

export function NotificationSettingsSection({
  initialState,
}: NotificationSettingsSectionProps) {
  const [settings, setSettings] = useState<NotificationSettingsMap | null>(
    initialState?.settings ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialState) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await getNotificationSettings();
        if (!cancelled) setSettings(res.settings);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load notification settings",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialState]);

  const onToggle = useCallback(
    (
      event: NotificationEvent,
      channel: keyof EventToggles,
      enabled: boolean,
    ) => {
      if (!settings) return;
      const previous = settings;
      const next: NotificationSettingsMap = {
        ...settings,
        [event]: { ...settings[event], [channel]: enabled },
      };
      // Optimistic: the checkbox should not lag a round trip.
      setSettings(next);
      setBusy(true);
      setError(null);
      void updateNotificationSettings({
        settings: { [event]: { [channel]: enabled } },
      })
        .then((res) => setSettings(res.settings))
        .catch((err: unknown) => {
          setSettings(previous);
          setError(
            err instanceof ApiError ? err.message : "Failed to save the change",
          );
        })
        .finally(() => setBusy(false));
    },
    [settings],
  );

  return (
    <NotificationSettings
      settings={settings ?? ALL_OFF}
      loading={!settings && !error}
      busy={busy}
      error={error}
      onToggle={onToggle}
    />
  );
}

/** Stand-in so a failed load still renders a readable (inert) table. */
const ALL_OFF = Object.fromEntries(
  NOTIFICATION_EVENTS.map((event) => [event, { push: false, email: false }]),
) as NotificationSettingsMap;
