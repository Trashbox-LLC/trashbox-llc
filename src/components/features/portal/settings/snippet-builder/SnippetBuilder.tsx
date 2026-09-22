"use client";

import { useRef, useState } from "react";
import {
  RichTextEditor,
  type RichTextEditorHandle,
  type RichTextValue,
} from "@/components/atoms/RichTextEditor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SnippetReplyPreview } from "@/components/features/portal/settings/snippet-builder/SnippetReplyPreview";
import {
  EMAIL_CONTENT_LIMITS,
  TEMPLATE_VARIABLES,
  plainTextToHtml,
  sanitizeShortcutInput,
  type TemplateVariableContext,
} from "@/lib/email-content";

const fieldClass =
  "border border-outline-variant/40 bg-background px-3 py-2.5";

export interface SnippetBuilderSavePayload {
  name: string;
  shortcut: string;
  bodyText: string;
  bodyHtml: string;
}

interface SnippetBuilderProps {
  initialName?: string;
  initialShortcut?: string;
  initialBody?: string;
  initialHtml?: string;
  busy?: boolean;
  error?: string | null;
  previewContext?: TemplateVariableContext;
  onSave: (payload: SnippetBuilderSavePayload) => void;
  onCancel: () => void;
}

function seedHtml(initialBody: string, initialHtml: string): string {
  if (initialHtml.trim()) return initialHtml;
  if (initialBody.trim()) return plainTextToHtml(initialBody);
  return "";
}

export function SnippetBuilder({
  initialName = "",
  initialShortcut = "",
  initialBody = "",
  initialHtml = "",
  busy = false,
  error,
  previewContext,
  onSave,
  onCancel,
}: SnippetBuilderProps) {
  const [name, setName] = useState(initialName);
  const [shortcut, setShortcut] = useState(initialShortcut);
  const [bodyText, setBodyText] = useState(initialBody);
  const [bodyHtml, setBodyHtml] = useState(() => seedHtml(initialBody, initialHtml));
  const editorRef = useRef<RichTextEditorHandle>(null);
  const caretRange = useRef<Range | null>(null);
  const canSave = Boolean(name.trim()) && Boolean(bodyText.trim());

  function onBodyChange(value: RichTextValue) {
    setBodyText(value.text);
    setBodyHtml(value.html);
  }

  function rememberCaret() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      caretRange.current = null;
      return;
    }
    caretRange.current = selection.getRangeAt(0).cloneRange();
  }

  function insertToken(token: string) {
    const root = document.querySelector<HTMLElement>('[aria-label="Body"]');
    if (!root) return;
    root.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const saved = caretRange.current;
    if (saved && root.contains(saved.startContainer)) {
      selection.removeAllRanges();
      selection.addRange(saved);
    } else {
      const end = document.createRange();
      end.selectNodeContents(root);
      end.collapse(false);
      selection.removeAllRanges();
      selection.addRange(end);
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(token);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editorRef.current?.setHtml(root.innerHTML);
  }

  function save() {
    if (!canSave || busy) return;
    const text = bodyText.trim();
    onSave({
      name: name.trim(),
      shortcut,
      bodyText: text,
      bodyHtml: bodyHtml.trim() ? bodyHtml : plainTextToHtml(text),
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
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Snippet name"
          value={name}
          placeholder="Snippet name"
          maxLength={EMAIL_CONTENT_LIMITS.name}
          disabled={busy}
          onChange={(event) => setName(event.target.value)}
          className={`min-w-0 flex-1 ${fieldClass}`}
        />
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

      {error && (
        <p
          role="alert"
          className="border border-error/40 bg-error/10 p-4 text-sm text-error"
        >
          {error}
        </p>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div>
            <Label htmlFor="snippet-shortcut">Shortcut</Label>
            <div className={`flex items-center ${fieldClass}`}>
              <span className="font-mono text-sm text-outline">/</span>
              <input
                id="snippet-shortcut"
                aria-label="Shortcut"
                value={shortcut}
                disabled={busy}
                maxLength={EMAIL_CONTENT_LIMITS.shortcut}
                placeholder="hours"
                onChange={(event) =>
                  setShortcut(sanitizeShortcutInput(event.target.value))
                }
                className="min-w-0 flex-1 bg-transparent py-0 font-mono text-sm text-white outline-none placeholder:text-outline-variant/50 disabled:opacity-40"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 font-label text-[10px] tracking-widest text-outline uppercase">
              Body
            </p>
            <RichTextEditor
              ref={editorRef}
              ariaLabel="Body"
              placeholder="We are open 8am to 5pm, Monday through Friday."
              initialHtml={bodyHtml}
              disabled={busy}
              compactToolbar
              onChange={onBodyChange}
              className="border border-outline-variant/40 bg-background"
              editorClassName="min-h-36 px-3 py-2.5 text-sm"
              toolbarStart={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onMouseDown={(event) => {
                        rememberCaret();
                        event.preventDefault();
                      }}
                    >
                      Insert field
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {TEMPLATE_VARIABLES.map((variable) => (
                      <DropdownMenuItem
                        key={variable.token}
                        onSelect={() => insertToken(variable.token)}
                      >
                        {variable.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          </div>
        </div>

        <SnippetReplyPreview
          bodyText={bodyText}
          bodyHtml={bodyHtml}
          previewContext={previewContext}
        />
      </div>
    </form>
  );
}
