"use client";

import { useRef, useState } from "react";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EMAIL_CONTENT_LIMITS,
  PREVIEW_SAMPLE_CONTEXT,
  TEMPLATE_VARIABLES,
  unknownTemplateVariables,
  type TemplateVariableContext,
} from "@/lib/email-content";
import {
  createSignatureFieldId,
  filledSignatureFields,
  reorderSignatureFields,
  shrinkSignatureLogo,
  signaturePreviewLines,
  signatureToContent,
  type SignatureDocument,
  type SignatureLayout,
} from "@/lib/email-signature-document";
import { cn } from "@/lib/utils";

export interface SignatureBuilderSavePayload {
  name: string;
  bodyText: string;
  bodyHtml: string;
  isDefault: boolean;
}

export interface SignatureBuilderProps {
  initialName?: string;
  initialDocument: SignatureDocument;
  initialIsDefault?: boolean;
  previewContext?: TemplateVariableContext;
  busy?: boolean;
  error?: string | null;
  onSave: (payload: SignatureBuilderSavePayload) => void | Promise<void>;
  onCancel: () => void;
}

const LAYOUTS: { id: SignatureLayout; label: string }[] = [
  { id: "stacked", label: "Stacked" },
  { id: "side", label: "Side" },
  { id: "banner", label: "Banner" },
];

const fieldInputClass =
  "border border-outline-variant/30 bg-background px-3 py-2";

export function SignatureBuilder({
  initialName = "",
  initialDocument,
  initialIsDefault = false,
  previewContext,
  busy = false,
  error,
  onSave,
  onCancel,
}: SignatureBuilderProps) {
  const [name, setName] = useState(initialName);
  const [doc, setDoc] = useState(initialDocument);
  const [isDefault, setIsDefault] = useState(initialIsDefault);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const context = previewContext ?? PREVIEW_SAMPLE_CONTEXT;
  const lines = signaturePreviewLines(doc, context);
  const unknownTokens = unknownTemplateVariables(
    doc.fields.map((field) => field.value).join(" "),
  );
  const canSave =
    name.trim().length > 0 && filledSignatureFields(doc).length > 0;

  function updateField(
    id: string,
    patch: Partial<{ label: string; value: string }>,
  ) {
    setDoc((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    }));
  }

  function addField(label: string, value: string) {
    setDoc((current) => ({
      ...current,
      fields: [
        ...current.fields,
        { id: createSignatureFieldId(), label, value },
      ],
    }));
  }

  function moveField(fromIndex: number, toIndex: number) {
    setDoc((current) => ({
      ...current,
      fields: reorderSignatureFields(current.fields, fromIndex, toIndex),
    }));
  }

  async function onLogoSelected(file: File | undefined) {
    if (!file) return;
    try {
      const logoUrl = await shrinkSignatureLogo(file);
      setLogoError(null);
      setDoc((current) => ({ ...current, logoUrl }));
    } catch (error) {
      setLogoError(
        error instanceof Error ? error.message : "Could not read that image.",
      );
    }
  }

  function save() {
    if (!canSave || busy) return;
    const content = signatureToContent(doc);
    void onSave({
      name: name.trim().slice(0, EMAIL_CONTENT_LIMITS.name),
      bodyText: content.bodyText,
      bodyHtml: content.bodyHtml,
      isDefault,
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          aria-label="Signature name"
          value={name}
          placeholder="Signature name"
          maxLength={EMAIL_CONTENT_LIMITS.name}
          disabled={busy}
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-headline text-3xl font-bold tracking-tight text-white outline-none placeholder:text-white/35 disabled:opacity-40"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !canSave}>
            Save
          </Button>
        </div>
      </div>

      {(error || logoError) && (
        <p role="alert" className="border border-error/40 bg-error/10 p-4 text-sm text-error">
          {error || logoError}
        </p>
      )}

      <section className="border border-outline-variant/15 bg-surface-container-low p-4 md:p-5">
        <Label>Layout</Label>
        <div
          role="radiogroup"
          aria-label="Layout"
          className="grid gap-3 sm:grid-cols-3"
        >
          {LAYOUTS.map((layout) => {
            const selected = doc.layout === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={busy}
                onClick={() =>
                  setDoc((current) => ({ ...current, layout: layout.id }))
                }
                className={cn(
                  "border bg-background px-3 py-4 text-center text-sm text-white",
                  selected
                    ? "border-white"
                    : "border-outline-variant/25 hover:border-outline-variant",
                )}
              >
                <LayoutThumb layout={layout.id} />
                <span className="mt-3 block text-on-surface-variant">
                  {layout.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-outline-variant/15 bg-surface-container-low p-4 md:p-5">
          <Label>Fields</Label>
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => logoInput.current?.click()}
              className="flex size-16 shrink-0 items-center justify-center border border-outline-variant/30 bg-background"
            >
              {doc.logoUrl ? (
                <img
                  src={doc.logoUrl}
                  alt="Logo"
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                  Logo
                </span>
              )}
            </button>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              aria-label="Logo file"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                onLogoSelected(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => logoInput.current?.click()}
            >
              Replace
            </Button>
          </div>

          <ul className="space-y-2">
            {doc.fields.map((field, index) => {
              const label = field.label.trim() || "Field";
              return (
                <li
                  key={field.id}
                  draggable={!busy}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null) return;
                    moveField(dragIndex, index);
                    setDragIndex(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    aria-label={`Reorder ${label}`}
                    disabled={busy}
                    className="text-outline hover:text-white"
                    onClick={(event) => event.currentTarget.focus()}
                    onKeyDown={(event) => {
                      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
                        return;
                      }
                      event.preventDefault();
                      moveField(index, index + (event.key === "ArrowUp" ? -1 : 1));
                    }}
                  >
                    <GripVertical className="size-4" />
                  </button>
                  <Input
                    aria-label={`${label} label`}
                    value={field.label}
                    disabled={busy}
                    onChange={(event) =>
                      updateField(field.id, { label: event.target.value })
                    }
                    className={cn(fieldInputClass, "max-w-28")}
                  />
                  <Input
                    aria-label={`${label} value`}
                    value={field.value}
                    disabled={busy}
                    onChange={(event) =>
                      updateField(field.id, { value: event.target.value })
                    }
                    className={cn(fieldInputClass, "min-w-0 flex-1")}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${label}`}
                    disabled={busy}
                    onClick={() =>
                      setDoc((current) => ({
                        ...current,
                        fields: current.fields.filter(
                          (item) => item.id !== field.id,
                        ),
                      }))
                    }
                    className="text-outline hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="mt-3 w-full"
              >
                + Add field
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onSelect={() => addField("Field", "")}>
                Custom text
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {TEMPLATE_VARIABLES.map((variable) => (
                <DropdownMenuItem
                  key={variable.token}
                  onSelect={() => addField(variable.label, variable.token)}
                >
                  {variable.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            role="switch"
            aria-checked={isDefault}
            disabled={busy}
            onClick={() => setIsDefault((current) => !current)}
            className="mt-5 flex items-center gap-3 text-sm text-white"
          >
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                isDefault ? "bg-primary" : "bg-outline-variant/40",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
                  isDefault ? "left-4" : "left-0.5",
                )}
              />
            </span>
            Use as default
          </button>
        </section>

        <section className="border border-outline-variant/15 bg-surface-container-low p-4 md:p-5">
          <Label>Preview</Label>
          <div
            role="region"
            aria-label="Preview"
            className={cn(
              "min-h-40 border border-outline-variant/20 bg-background p-5 text-sm text-white",
              doc.layout === "side" && "flex items-center gap-4",
              doc.layout === "banner" && "flex items-center gap-3",
              doc.layout === "stacked" && "flex flex-col items-start gap-3",
            )}
          >
            {doc.logoUrl && (
              <img
                src={doc.logoUrl}
                alt=""
                className={cn(
                  "object-cover",
                  doc.layout === "banner" ? "size-6" : "size-16",
                )}
              />
            )}
            {doc.layout === "banner" ? (
              <p>{lines.join(" · ")}</p>
            ) : (
              <div>
                {lines.map((line, index) => (
                  <p key={`${index}-${line}`}>{line}</p>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {unknownTokens.length > 0 && (
        <p className="text-sm text-on-surface-variant">
          {unknownTokens.map((token) => (
            <code key={token} className="mr-2 font-mono text-xs text-white">
              {token}
            </code>
          ))}
          {unknownTokens.length === 1
            ? "is not a supported merge field and will be sent exactly as typed."
            : "are not supported merge fields and will be sent exactly as typed."}
        </p>
      )}
    </form>
  );
}

function LayoutThumb({ layout }: { layout: SignatureLayout }) {
  const mark = (
    <span className="block size-6 border border-outline-variant/40 bg-surface-container-high" />
  );
  const lines = (
    <span className="flex flex-col gap-1">
      <span className="block h-1.5 w-10 bg-outline-variant/50" />
      <span className="block h-1.5 w-8 bg-outline-variant/30" />
    </span>
  );
  if (layout === "stacked") {
    return (
      <span className="mx-auto flex h-14 w-24 flex-col items-center justify-center gap-2">
        {mark}
        {lines}
      </span>
    );
  }
  if (layout === "banner") {
    return (
      <span className="mx-auto flex h-14 w-24 items-center justify-center gap-2">
        <span className="block size-3 border border-outline-variant/40 bg-surface-container-high" />
        <span className="block h-1.5 w-14 bg-outline-variant/50" />
      </span>
    );
  }
  return (
    <span className="mx-auto flex h-14 w-24 items-center justify-center gap-2">
      {mark}
      {lines}
    </span>
  );
}
