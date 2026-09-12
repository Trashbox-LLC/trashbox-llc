"use client";

import { useCallback, useEffect, useState } from "react";
import { SmsSettings } from "@/components/features/portal/settings/SmsSettings";
import {
  ApiError,
  assignSmsNumber,
  listAvailableSmsNumbers,
  listSmsOptOuts,
  releaseSmsNumber,
  updateSmsNumber,
  type AvailableSmsNumber,
  type SmsOptOutEntry,
  type SmsRegistrationStatus,
} from "@/lib/api";
import { usePortal } from "@/lib/portal";

export interface SmsSettingsInitialState {
  availableNumbers: AvailableSmsNumber[];
  optOuts: SmsOptOutEntry[];
}

export interface SmsSettingsSectionProps {
  /** Storybook/tests: seed the lists without hitting the API. */
  initialState?: SmsSettingsInitialState;
}

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function SmsSettingsSection({ initialState }: SmsSettingsSectionProps) {
  const portal = usePortal();
  const [availableNumbers, setAvailableNumbers] = useState<
    AvailableSmsNumber[]
  >(initialState?.availableNumbers ?? []);
  const [optOuts, setOptOuts] = useState<SmsOptOutEntry[]>(
    initialState?.optOuts ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = Boolean(portal.sms?.canManage);
  const hasNumber = Boolean(portal.sms?.phoneNumber);

  // Only owners/admins can act on the pool, so skip the call for everyone else.
  useEffect(() => {
    if (initialState || !canManage || hasNumber) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await listAvailableSmsNumbers();
        if (!cancelled) setAvailableNumbers(res.items);
      } catch {
        if (!cancelled) setAvailableNumbers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialState, canManage, hasNumber]);

  useEffect(() => {
    if (initialState || !hasNumber) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await listSmsOptOuts();
        if (!cancelled) setOptOuts(res.items);
      } catch {
        if (!cancelled) setOptOuts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialState, hasNumber]);

  const refreshSms = portal.refreshSms;

  const onAssign = useCallback(
    async (phoneNumber: string) => {
      setBusy(true);
      setError(null);
      try {
        await assignSmsNumber(phoneNumber);
        await refreshSms();
      } catch (err) {
        setError(messageOf(err, "Failed to assign the number"));
      } finally {
        setBusy(false);
      }
    },
    [refreshSms],
  );

  const onUpdate = useCallback(
    async (input: {
      registrationStatus?: SmsRegistrationStatus;
      disabled?: boolean;
    }) => {
      setBusy(true);
      setError(null);
      try {
        await updateSmsNumber(input);
        await refreshSms();
      } catch (err) {
        setError(messageOf(err, "Failed to update the number"));
      } finally {
        setBusy(false);
      }
    },
    [refreshSms],
  );

  const onRelease = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await releaseSmsNumber();
      setOptOuts([]);
      await refreshSms();
    } catch (err) {
      setError(messageOf(err, "Failed to release the number"));
    } finally {
      setBusy(false);
    }
  }, [refreshSms]);

  return (
    <SmsSettings
      sms={portal.sms}
      availableNumbers={availableNumbers}
      optOuts={optOuts}
      busy={busy}
      error={error}
      onAssign={onAssign}
      onUpdate={onUpdate}
      onRelease={onRelease}
    />
  );
}
