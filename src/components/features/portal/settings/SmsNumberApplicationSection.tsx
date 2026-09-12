"use client";

import { useCallback, useEffect, useState } from "react";
import { SmsNumberApplication } from "@/components/features/portal/settings/SmsNumberApplication";
import {
  ApiError,
  applyForSmsNumber,
  getSmsApplication,
  withdrawSmsApplication,
  type SmsApplication,
  type SmsApplicationBusiness,
} from "@/lib/api";
import { usePortal } from "@/lib/portal";

export interface SmsNumberApplicationSectionProps {
  /** Storybook/tests: seed the application without hitting the API. */
  initialApplication?: SmsApplication | null;
}

/** Field names returned alongside a 400 from the apply route. */
function fieldsOf(err: unknown): string[] {
  if (!(err instanceof ApiError)) return [];
  const fields = err.data?.fields;
  return Array.isArray(fields)
    ? fields.filter((field): field is string => typeof field === "string")
    : [];
}

export function SmsNumberApplicationSection({
  initialApplication,
}: SmsNumberApplicationSectionProps) {
  const portal = usePortal();
  const [application, setApplication] = useState<SmsApplication | null>(
    initialApplication ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const availableOnPlan = Boolean(portal.sms?.availableOnPlan);
  const canManage = Boolean(portal.sms?.canManage);

  useEffect(() => {
    if (initialApplication !== undefined || !availableOnPlan) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await getSmsApplication();
        if (!cancelled) setApplication(res.application);
      } catch {
        if (!cancelled) setApplication(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialApplication, availableOnPlan]);

  const refreshSms = portal.refreshSms;

  const onApply = useCallback(
    async (business: SmsApplicationBusiness) => {
      setBusy(true);
      setError(null);
      setFieldErrors([]);
      try {
        const res = await applyForSmsNumber(business);
        setApplication(res.application);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to send the application",
        );
        setFieldErrors(fieldsOf(err));
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const onWithdraw = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await withdrawSmsApplication();
      setApplication(res.application);
      // Withdrawing releases the number, so the SMS panel is stale now.
      await refreshSms();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to withdraw the application",
      );
    } finally {
      setBusy(false);
    }
  }, [refreshSms]);

  return (
    <SmsNumberApplication
      application={application}
      availableOnPlan={availableOnPlan}
      canManage={canManage}
      busy={busy}
      error={error}
      fieldErrors={fieldErrors}
      onApply={onApply}
      onWithdraw={onWithdraw}
    />
  );
}
