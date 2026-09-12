"use client";

import { useId, useState } from "react";
import { Select } from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmsApplicationProgress } from "@/components/features/portal/settings/SmsApplicationProgress";
import { SmsTextingOffer } from "@/components/features/portal/settings/SmsTextingOffer";
import {
  SMS_MONTHLY_VOLUMES,
  type SmsApplication,
  type SmsApplicationBusiness,
  type SmsApplicationStatus,
  type SmsOptInType,
} from "@/lib/api";

const STATUS_LABELS: Record<SmsApplicationStatus, string> = {
  pending_review: "In review",
  submitted: "With the carriers",
  approved: "Active",
  changes_requested: "Needs changes",
  closed: "Closed",
};

/** Roughly how long each stage takes, so the wait is not a mystery. */
const STATUS_DETAIL: Record<SmsApplicationStatus, string> = {
  pending_review: "We check the details before sending them to the carriers.",
  submitted: "Carrier approval usually takes a few business days.",
  approved: "",
  changes_requested: "",
  closed: "",
};

const OPT_IN_OPTIONS: { value: SmsOptInType; label: string }[] = [
  { value: "digital-form", label: "Checkbox on a web form" },
  { value: "verbal", label: "Spoken agreement" },
  { value: "paper-form", label: "Signed paper form" },
  { value: "text", label: "They text us first" },
  { value: "qr-code", label: "QR code" },
];

const USE_CASE_OPTIONS = [
  "Customer Care",
  "Delivery Notifications",
  "Appointment Reminders",
  "Account Notifications",
];

type Draft = Omit<SmsApplicationBusiness, "sampleMessages"> & {
  sampleMessages: string;
};

function draftFrom(business?: SmsApplicationBusiness): Draft {
  return {
    companyName: business?.companyName ?? "",
    companyWebsite: business?.companyWebsite ?? "",
    taxId: business?.taxId ?? "",
    addressLine1: business?.addressLine1 ?? "",
    addressLine2: business?.addressLine2 ?? "",
    city: business?.city ?? "",
    state: business?.state ?? "",
    postalCode: business?.postalCode ?? "",
    contactName: business?.contactName ?? "",
    contactEmail: business?.contactEmail ?? "",
    contactPhone: business?.contactPhone ?? "",
    useCaseCategory: business?.useCaseCategory ?? USE_CASE_OPTIONS[0],
    useCaseDescription: business?.useCaseDescription ?? "",
    optInType: business?.optInType ?? "digital-form",
    optInDescription: business?.optInDescription ?? "",
    sampleMessages: business?.sampleMessages.join("\n") ?? "",
    monthlyMessageVolume: business?.monthlyMessageVolume ?? "1,000",
  };
}

const REQUIRED_FIELDS = [
  "companyName",
  "companyWebsite",
  "taxId",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "contactName",
  "contactEmail",
  "contactPhone",
  "useCaseDescription",
  "optInDescription",
  "sampleMessages",
] as const;

export interface SmsNumberApplicationProps {
  application: SmsApplication | null;
  availableOnPlan: boolean;
  canManage: boolean;
  busy?: boolean;
  error?: string | null;
  /** Field names the server rejected. */
  fieldErrors?: string[];
  onApply: (business: SmsApplicationBusiness) => Promise<void>;
  onWithdraw: () => Promise<void>;
}

export function SmsNumberApplication({
  application,
  availableOnPlan,
  canManage,
  busy = false,
  error,
  fieldErrors = [],
  onApply,
  onWithdraw,
}: SmsNumberApplicationProps) {
  const [editing, setEditing] = useState(fieldErrors.length > 0);
  const [draft, setDraft] = useState<Draft>(() =>
    draftFrom(application?.business),
  );
  const [missing, setMissing] = useState<string[]>([]);
  const ids = useId();

  const invalid = new Set([...fieldErrors, ...missing]);
  const field = (name: string) => `${ids}-${name}`;

  function set<K extends keyof Draft>(name: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [name]: value }));
    setMissing((current) => current.filter((entry) => entry !== name));
  }

  const showOffer = !application || application.status === "closed";
  const showForm =
    canManage &&
    availableOnPlan &&
    editing &&
    (showOffer || application?.status === "changes_requested");

  async function submit() {
    const blank = REQUIRED_FIELDS.filter((name) => !draft[name].trim());
    if (blank.length > 0) {
      setMissing(blank);
      return;
    }

    const { sampleMessages, addressLine2, ...rest } = draft;
    await onApply({
      ...rest,
      ...(addressLine2?.trim() ? { addressLine2: addressLine2.trim() } : {}),
      sampleMessages: sampleMessages
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    });
    setEditing(false);
  }

  if (showOffer && !showForm) {
    return (
      <div className="border-outline-variant/10 bg-surface-container-low border p-6 md:p-8">
        {error && (
          <p className="border-error/40 bg-error/10 text-error mb-8 border p-4 text-sm">
            {error}
          </p>
        )}
        <SmsTextingOffer
          availableOnPlan={availableOnPlan}
          canManage={canManage}
          onStart={() => setEditing(true)}
        />
      </div>
    );
  }

  return (
    <div className="border-outline-variant/10 bg-surface-container-low space-y-8 border p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Label>Your Own Texting Number</Label>
        {application && application.status !== "closed" && (
          <span className="font-label text-outline text-[10px] tracking-widest uppercase">
            {STATUS_LABELS[application.status]}
          </span>
        )}
      </div>

      {error && (
        <p className="border-error/40 bg-error/10 text-error border p-4 text-sm">
          {error}
        </p>
      )}

      {application && application.status !== "closed" && !editing && (
        <div className="space-y-6">
          {application.phoneNumberDisplay && (
            <p className="text-lg text-white">
              {application.phoneNumberDisplay}
            </p>
          )}

          <SmsApplicationProgress application={application} />

          {STATUS_DETAIL[application.status] && (
            <p className="text-on-surface-variant text-sm">
              {STATUS_DETAIL[application.status]}
            </p>
          )}

          {application.statusReason && (
            <p className="border-outline-variant/20 text-on-surface-variant border-l-2 pl-4 text-sm">
              {application.statusReason}
            </p>
          )}

          {canManage && (
            <div className="flex flex-wrap gap-3">
              {application.canResubmit && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setDraft(draftFrom(application.business));
                    setEditing(true);
                  }}
                >
                  Edit and resubmit
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void onWithdraw()}
              >
                {application.status === "approved"
                  ? "Turn off texting"
                  : "Withdraw"}
              </Button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor={field("companyName")}>
                Legal business name
              </Label>
              <Input
                id={field("companyName")}
                value={draft.companyName}
                aria-invalid={invalid.has("companyName")}
                onChange={(event) => set("companyName", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor={field("companyWebsite")}>Website</Label>
              <Input
                id={field("companyWebsite")}
                inputMode="url"
                placeholder="https://"
                value={draft.companyWebsite}
                aria-invalid={invalid.has("companyWebsite")}
                onChange={(event) => set("companyWebsite", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor={field("taxId")}>EIN</Label>
              <Input
                id={field("taxId")}
                value={draft.taxId}
                aria-invalid={invalid.has("taxId")}
                onChange={(event) => set("taxId", event.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={field("addressLine1")}>Street address</Label>
              <Input
                id={field("addressLine1")}
                value={draft.addressLine1}
                aria-invalid={invalid.has("addressLine1")}
                onChange={(event) => set("addressLine1", event.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={field("addressLine2")}>
                Suite or unit (optional)
              </Label>
              <Input
                id={field("addressLine2")}
                value={draft.addressLine2 ?? ""}
                onChange={(event) => set("addressLine2", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor={field("city")}>City</Label>
              <Input
                id={field("city")}
                value={draft.city}
                aria-invalid={invalid.has("city")}
                onChange={(event) => set("city", event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor={field("state")}>State</Label>
                <Input
                  id={field("state")}
                  value={draft.state}
                  aria-invalid={invalid.has("state")}
                  onChange={(event) => set("state", event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={field("postalCode")}>ZIP</Label>
                <Input
                  id={field("postalCode")}
                  inputMode="numeric"
                  value={draft.postalCode}
                  aria-invalid={invalid.has("postalCode")}
                  onChange={(event) => set("postalCode", event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={field("contactName")}>Contact name</Label>
              <Input
                id={field("contactName")}
                value={draft.contactName}
                aria-invalid={invalid.has("contactName")}
                onChange={(event) => set("contactName", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor={field("contactEmail")}>Contact email</Label>
              <Input
                id={field("contactEmail")}
                type="email"
                value={draft.contactEmail}
                aria-invalid={invalid.has("contactEmail")}
                onChange={(event) => set("contactEmail", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor={field("contactPhone")}>Contact phone</Label>
              <Input
                id={field("contactPhone")}
                inputMode="tel"
                value={draft.contactPhone}
                aria-invalid={invalid.has("contactPhone")}
                onChange={(event) => set("contactPhone", event.target.value)}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                aria-label="Category"
                value={draft.useCaseCategory}
                onChange={(value) => set("useCaseCategory", value)}
                options={USE_CASE_OPTIONS.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={field("useCaseDescription")}>
                What you will text about
              </Label>
              <Textarea
                id={field("useCaseDescription")}
                rows={3}
                value={draft.useCaseDescription}
                aria-invalid={invalid.has("useCaseDescription")}
                onChange={(event) =>
                  set("useCaseDescription", event.target.value)
                }
              />
            </div>

            <div>
              <Label>How customers opt in</Label>
              <Select
                aria-label="How customers opt in"
                value={draft.optInType}
                onChange={(value) => set("optInType", value as SmsOptInType)}
                options={OPT_IN_OPTIONS}
              />
            </div>

            <div>
              <Label>Texts per month</Label>
              <Select
                aria-label="Texts per month"
                value={draft.monthlyMessageVolume}
                onChange={(value) => set("monthlyMessageVolume", value)}
                options={SMS_MONTHLY_VOLUMES.map((volume) => ({
                  value: volume,
                  label: volume,
                }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={field("optInDescription")}>
                Describe the opt-in step
              </Label>
              <Textarea
                id={field("optInDescription")}
                rows={3}
                value={draft.optInDescription}
                aria-invalid={invalid.has("optInDescription")}
                onChange={(event) =>
                  set("optInDescription", event.target.value)
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={field("sampleMessages")}>
                Example texts, one per line
              </Label>
              <Textarea
                id={field("sampleMessages")}
                rows={3}
                value={draft.sampleMessages}
                aria-invalid={invalid.has("sampleMessages")}
                onChange={(event) => set("sampleMessages", event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={busy} onClick={() => void submit()}>
              {application?.status === "changes_requested"
                ? "Resubmit application"
                : "Apply for a number"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                {application?.status === "changes_requested" ? "Cancel" : "Back"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
