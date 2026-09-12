"use client";

import { useState } from "react";
import { Select } from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  AvailableSmsNumber,
  SmsOptOutEntry,
  SmsRegistrationStatus,
  SmsStatusResponse,
} from "@/lib/api";
import { settingsSectionPath } from "@/lib/portal-settings";

const NUMBER_TYPE_LABELS: Record<string, string> = {
  "toll-free": "Toll-free",
  "10dlc": "10DLC",
  "long-code": "Long code",
  simulator: "Simulator",
};

const REGISTRATION_LABELS: Record<SmsRegistrationStatus, string> = {
  pending: "Carrier verification pending",
  verified: "Carrier verified",
  rejected: "Carrier rejected",
};

export interface SmsSettingsProps {
  sms: SmsStatusResponse | null;
  availableNumbers: AvailableSmsNumber[];
  optOuts: SmsOptOutEntry[];
  busy?: boolean;
  error?: string | null;
  onAssign: (phoneNumber: string) => Promise<void>;
  onUpdate: (input: {
    registrationStatus?: SmsRegistrationStatus;
    disabled?: boolean;
  }) => Promise<void>;
  onRelease: () => Promise<void>;
}

export function SmsSettings({
  sms,
  availableNumbers,
  optOuts,
  busy = false,
  error,
  onAssign,
  onUpdate,
  onRelease,
}: SmsSettingsProps) {
  const [pick, setPick] = useState("");

  const canManage = Boolean(sms?.canManage);
  const assignedNumber = sms?.phoneNumber;
  const registration = sms?.registrationStatus ?? "pending";
  const disabled = sms?.status === "disabled";
  const selectedNumber = pick || availableNumbers[0]?.phoneNumber || "";

  function formatWhen(iso: string) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <div className="border-outline-variant/10 bg-surface-container-low space-y-8 border p-6 md:p-8">
      <div>
        <Label>Text Messaging</Label>
      </div>

      {error && (
        <p className="border-error/40 bg-error/10 text-error border p-4 text-sm">
          {error}
        </p>
      )}

      {sms && !sms.availableOnPlan ? (
        <p className="text-on-surface-variant text-sm">
          Texting is included on paid plans.{" "}
          <a
            href={settingsSectionPath("current-plan", "org")}
            className="text-white underline"
          >
            Compare plans
          </a>
          .
        </p>
      ) : assignedNumber ? (
        <div className="space-y-6">
          <div>
            <Label>Number</Label>
            <p className="text-lg text-white">
              {sms?.phoneNumberDisplay ?? assignedNumber}
            </p>
            <p className="font-label text-outline mt-2 text-[10px] tracking-widest uppercase">
              {NUMBER_TYPE_LABELS[sms?.numberType ?? ""] ?? sms?.numberType}
              {" · "}
              {REGISTRATION_LABELS[registration]}
              {disabled ? " · paused" : ""}
              {sms?.twoWayEnabled ? "" : " · replies off"}
            </p>
            {sms?.lastError && (
              <p className="text-error mt-2 text-sm">{sms.lastError}</p>
            )}
          </div>

          {typeof sms?.smsLimit === "number" && (
            <div>
              <Label>This Month</Label>
              <p className="text-lg text-white">
                {sms.smsUsed ?? 0} / {sms.smsLimit}
              </p>
            </div>
          )}

          {canManage && (
            <div className="flex flex-wrap gap-3">
              {registration !== "verified" && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void onUpdate({ registrationStatus: "verified" })
                  }
                >
                  Mark verified
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void onUpdate({ disabled: !disabled })}
              >
                {disabled ? "Enable" : "Disable"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void onRelease()}
              >
                Release number
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {canManage ? (
            <>
              <div className="max-w-sm">
                <Label>Available Number</Label>
                <Select
                  aria-label="Available number"
                  value={selectedNumber}
                  disabled={busy || availableNumbers.length === 0}
                  onChange={setPick}
                  options={availableNumbers.map((number) => ({
                    value: number.phoneNumber,
                    label: `${number.phoneNumberDisplay} · ${
                      NUMBER_TYPE_LABELS[number.numberType] ?? number.numberType
                    }`,
                  }))}
                />
              </div>
              <Button
                type="button"
                disabled={busy || !selectedNumber}
                onClick={() => void onAssign(selectedNumber)}
              >
                Assign to this project
              </Button>
              {availableNumbers.length === 0 && (
                <p className="text-outline text-xs">
                  Claim a toll-free number in AWS End User Messaging, then it
                  appears here.
                </p>
              )}
            </>
          ) : (
            <p className="text-on-surface-variant text-sm">
              No number assigned yet.
            </p>
          )}
        </div>
      )}

      {optOuts.length > 0 && (
        <div>
          <Label>Opted Out</Label>
          <ul className="mt-2 space-y-2">
            {optOuts.map((entry) => (
              <li
                key={entry.phoneNumber}
                className="flex flex-wrap items-baseline gap-3 text-sm"
              >
                <span className="text-white">{entry.phoneNumberDisplay}</span>
                <span className="font-label text-outline text-[10px] tracking-widest uppercase">
                  {entry.keyword ? `${entry.keyword} · ` : ""}
                  {formatWhen(entry.optedOutAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
