"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  isMergeFieldDrag,
  readBuilderDragData,
} from "@/lib/email-template-dnd";
import {
  isMergeFieldVariant,
  mergeFieldChipHtmlFromVariant,
} from "@/lib/email-content";
import { HexAlphaColorPicker } from "react-colorful";

export interface RichTextValue {
  html: string;
  text: string;
}

export interface RichTextEditorHandle {
  /** Replace the entire document and emit onChange. */
  setHtml: (html: string) => void;
  /** Insert HTML at the caret (or at the end when there is no selection). */
  insertHtml: (html: string) => void;
  focus: () => void;
  /** Plain text from the start of the document through the caret. */
  textBeforeCursor: () => string;
  /** Delete the last `count` characters before the caret, then insert HTML. */
  replaceCharsBeforeCursor: (count: number, html: string) => void;
}

interface RichTextEditorProps {
  onChange: (value: RichTextValue) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Classes applied to the contenteditable surface only. */
  editorClassName?: string;
  /**
   * When false, the formatting toolbar is omitted (useful when a shared
   * toolbar is rendered elsewhere). Defaults to true.
   */
  showToolbar?: boolean;
  /**
   * When set, the formatting toolbar is portaled into this element instead of
   * rendering above the editor (e.g. builder chrome at the top of the canvas).
   */
  toolbarPortal?: HTMLElement | null;
  /**
   * Float the toolbar as a fixed overlay popup above the editor (does not take
   * layout space). Takes precedence over `toolbarPortal`.
   */
  toolbarOverlay?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  /**
   * Content to seed the editor with on mount. The editor stays uncontrolled
   * afterwards, so callers that need to replace the content later should
   * change `key` or call `setHtml` on the handle. No `onChange` fires for the
   * seeded value — seed the caller's state to match. Updating this prop after
   * mount is ignored.
   */
  initialHtml?: string;
  /** Inserted at the start of the formatting toolbar (e.g. library menus). */
  toolbarStart?: ReactNode;
  /** Inserted at the end of the formatting toolbar. */
  toolbarEnd?: ReactNode;
  /**
   * When true, dropping a builder merge-field variant inserts a chip at the
   * caret (or at the end).
   */
  acceptMergeFieldDrops?: boolean;
}

interface ToolbarButton {
  label: string;
  icon: string;
  command: string;
  value?: string;
  prompt?: "url" | "image";
}

const FONT_OPTIONS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
] as const;

/** Common sizes shown in the dropdown; any integer px is allowed via the input. */
const FONT_SIZE_PRESETS = [10, 12, 14, 16, 18, 24, 32, 48] as const;
const DEFAULT_FONT_SIZE_PX = 14;
const MIN_FONT_SIZE_PX = 8;
const MAX_FONT_SIZE_PX = 200;

const COLOR_PALETTE = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#ffffff",
  "#e53935",
  "#fb8c00",
  "#fdd835",
  "#43a047",
  "#1e88e5",
  "#8e24aa",
  "#00acc1",
] as const;

const DEFAULT_TEXT_COLOR = "#ffffffff";
const DEFAULT_HIGHLIGHT_COLOR = "#fdd835ff";

type ColorFormat = "css" | "hex" | "rgb" | "hsl";

const COLOR_FORMATS: { id: ColorFormat; label: string }[] = [
  { id: "css", label: "CSS" },
  { id: "hex", label: "Hex" },
  { id: "rgb", label: "RGB" },
  { id: "hsl", label: "HSL" },
];

type Rgba = { r: number; g: number; b: number; a: number };

function clampChannel(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampAlpha(value: number): number {
  if (Number.isNaN(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{8}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return `${withHash.toLowerCase()}ff`;
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}ff`.toLowerCase();
  }
  return null;
}

function hexToRgba(hex: string): Rgba {
  const normalized = normalizeHexColor(hex) ?? DEFAULT_TEXT_COLOR;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
    a: Number.parseInt(normalized.slice(7, 9), 16) / 255,
  };
}

function rgbaToHex({ r, g, b, a }: Rgba): string {
  const toHex = (channel: number) =>
    clampChannel(channel, 0, 255).toString(16).padStart(2, "0");
  const alpha = Math.round(clampAlpha(a) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha}`;
}

function solidHex(hex: string): string {
  return (normalizeHexColor(hex) ?? DEFAULT_TEXT_COLOR).slice(0, 7);
}

function colorToCss(hex: string): string {
  const { r, g, b, a } = hexToRgba(hex);
  const alpha = Math.round(a * 1000) / 1000;
  if (alpha >= 1) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 1000) / 10 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
      break;
  }
  return {
    h: Math.round(h * 60),
    s: Math.round(s * 1000) / 10,
    l: Math.round(l * 1000) / 10,
  };
}

function formatColorValue(hex: string, format: ColorFormat): string {
  const { r, g, b, a } = hexToRgba(hex);
  const alpha = Math.round(a * 1000) / 1000;
  const hsl = rgbToHsl(r, g, b);
  switch (format) {
    case "hex":
      return alpha >= 1 ? solidHex(hex) : (normalizeHexColor(hex) ?? hex);
    case "rgb":
      return alpha >= 1
        ? `rgb(${r}, ${g}, ${b})`
        : `rgba(${r}, ${g}, ${b}, ${alpha})`;
    case "hsl":
      return alpha >= 1
        ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
        : `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`;
    case "css":
    default:
      return colorToCss(hex);
  }
}

function parseColorInput(raw: string): string | null {
  const trimmed = raw.trim();
  const asHex = normalizeHexColor(trimmed);
  if (asHex) return asHex;

  const rgbaMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (rgbaMatch) {
    return rgbaToHex({
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
      a: rgbaMatch[4] === undefined ? 1 : Number(rgbaMatch[4]),
    });
  }

  const hslMatch = trimmed.match(
    /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    const s = Number(hslMatch[2]) / 100;
    const l = Number(hslMatch[3]) / 100;
    const a = hslMatch[4] === undefined ? 1 : Number(hslMatch[4]);
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const hk = (((h % 360) + 360) % 360) / 360;
    return rgbaToHex({
      r: Math.round(hue2rgb(hk + 1 / 3) * 255),
      g: Math.round(hue2rgb(hk) * 255),
      b: Math.round(hue2rgb(hk - 1 / 3) * 255),
      a,
    });
  }

  return null;
}

async function pickScreenColor(): Promise<string | null> {
  const EyeDropperCtor = (
    window as Window & {
      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    }
  ).EyeDropper;
  if (!EyeDropperCtor) return null;
  try {
    const result = await new EyeDropperCtor().open();
    return normalizeHexColor(result.sRGBHex);
  } catch {
    return null;
  }
}

const EMOJIS = [
  "👍",
  "👎",
  "✅",
  "❌",
  "🙏",
  "😊",
  "😂",
  "😮",
  "😢",
  "🔥",
  "🎉",
  "💡",
  "📅",
  "📎",
  "✉️",
  "🚚",
] as const;

const ALIGN_OPTIONS = [
  { label: "Align left", command: "justifyLeft", icon: "format_align_left" },
  {
    label: "Align center",
    command: "justifyCenter",
    icon: "format_align_center",
  },
  { label: "Align right", command: "justifyRight", icon: "format_align_right" },
] as const;

const STYLE_BUTTONS: ToolbarButton[] = [
  { label: "Bold", icon: "format_bold", command: "bold" },
  { label: "Italic", icon: "format_italic", command: "italic" },
  { label: "Underline", icon: "format_underlined", command: "underline" },
  {
    label: "Strikethrough",
    icon: "format_strikethrough",
    command: "strikeThrough",
  },
];

const LIST_BUTTONS: ToolbarButton[] = [
  {
    label: "Bulleted list",
    icon: "format_list_bulleted",
    command: "insertUnorderedList",
  },
  {
    label: "Numbered list",
    icon: "format_list_numbered",
    command: "insertOrderedList",
  },
];

const INDENT_BUTTONS: ToolbarButton[] = [
  {
    label: "Decrease indent",
    icon: "format_indent_decrease",
    command: "outdent",
  },
  {
    label: "Increase indent",
    icon: "format_indent_increase",
    command: "indent",
  },
];

const INSERT_BUTTONS: ToolbarButton[] = [
  { label: "Link", icon: "link", command: "createLink", prompt: "url" },
  {
    label: "Insert image",
    icon: "image",
    command: "insertImage",
    prompt: "image",
  },
  {
    label: "Blockquote",
    icon: "format_quote",
    command: "formatBlock",
    value: "blockquote",
  },
  { label: "Clear formatting", icon: "format_clear", command: "removeFormat" },
];

const toolbarBtnClass =
  "rounded text-outline hover:bg-surface-variant hover:text-white";

function readValue(el: HTMLDivElement): RichTextValue {
  return { html: el.innerHTML, text: el.textContent ?? "" };
}

function isVisuallyEmpty(el: HTMLDivElement): boolean {
  return (
    (el.textContent ?? "").trim().length === 0 && !el.querySelector("li, img")
  );
}

/** Prefer execCommand; fall back to Range APIs for jsdom / older engines. */
function insertHtmlAtSelection(html: string): boolean {
  if (typeof document.execCommand === "function") {
    const ok = document.execCommand("insertHTML", false, html);
    if (ok) return true;
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  return true;
}

function previousTextNode(node: Node, root: Node): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  if (node.nodeType === Node.TEXT_NODE) {
    const index = nodes.indexOf(node as Text);
    return index > 0 ? nodes[index - 1]! : null;
  }
  return nodes.at(-1) ?? null;
}

/** Select `count` characters immediately before the caret. */
function extendSelectionBackward(
  selection: Selection,
  root: Node,
  count: number,
): void {
  if (selection.rangeCount === 0 || count <= 0) return;
  const caret = selection.getRangeAt(0);
  let remaining = count;
  let endNode: Node = caret.startContainer;
  let endOffset = caret.startOffset;
  let startNode: Node = endNode;
  let startOffset = endOffset;

  while (remaining > 0) {
    if (startNode.nodeType === Node.TEXT_NODE) {
      const take = Math.min(startOffset, remaining);
      startOffset -= take;
      remaining -= take;
      if (remaining === 0) break;
    }
    const previous = previousTextNode(startNode, root);
    if (!previous) break;
    startNode = previous;
    startOffset = previous.length;
  }

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  selection.removeAllRanges();
  selection.addRange(range);
}

function clampFontSizePx(value: number): number {
  return Math.min(
    MAX_FONT_SIZE_PX,
    Math.max(MIN_FONT_SIZE_PX, Math.round(value)),
  );
}

/** Apply an arbitrary pixel font size to the current selection. */
function applyFontSizeToSelection(px: number): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const size = `${px}px`;

  if (range.collapsed) {
    const span = document.createElement("span");
    span.style.fontSize = size;
    span.appendChild(document.createTextNode("\u200b"));
    range.insertNode(span);
    const next = document.createRange();
    next.setStart(span.firstChild!, 1);
    next.collapse(true);
    selection.removeAllRanges();
    selection.addRange(next);
    return;
  }

  const span = document.createElement("span");
  span.style.fontSize = size;
  try {
    range.surroundContents(span);
  } catch {
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }
  selection.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(span);
  next.collapse(false);
  selection.addRange(next);
}

const LIVE_COLOR_ATTR = "data-tb-live-color";

/** Wrap a range once so later drag updates only change the span style. */
function wrapRangeForLiveColor(
  range: Range,
  mode: "color" | "highlight",
): HTMLSpanElement {
  const span = document.createElement("span");
  span.setAttribute(LIVE_COLOR_ATTR, mode);
  if (range.collapsed) {
    span.appendChild(document.createTextNode("\u200b"));
    range.insertNode(span);
    return span;
  }
  try {
    range.surroundContents(span);
  } catch {
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }
  return span;
}

function selectNodeContents(rangeTarget: Node): Range {
  const next = document.createRange();
  next.selectNodeContents(rangeTarget);
  return next;
}

function ToolbarIconButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={toolbarBtnClass}
    >
      <MaterialIcon name={icon} className="text-lg" />
    </Button>
  );
}

/** Trigger for menus/popovers — always shows a dropdown chevron. */
const ToolbarMenuButton = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    icon?: string;
    text?: string;
    textStyle?: CSSProperties;
    /** Optional color chip under the icon (text/highlight tools). */
    swatchColor?: string;
    disabled?: boolean;
    className?: string;
  } & ComponentPropsWithoutRef<"button">
>(function ToolbarMenuButton(
  {
    label,
    icon,
    text,
    textStyle,
    swatchColor,
    disabled,
    className,
    type = "button",
    onMouseDown,
    ...props
  },
  ref,
) {
  return (
    <Button
      ref={ref}
      type={type}
      variant="ghost"
      size="sm"
      aria-label={label}
      title={label}
      disabled={disabled}
      // Keep editor selection when opening menus (color/highlight apply to it).
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown?.(event);
      }}
      className={cn(
        toolbarBtnClass,
        "font-body h-8 gap-0.5 px-1.5 text-xs font-normal tracking-normal normal-case",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="relative inline-flex flex-col items-center">
          <MaterialIcon name={icon} className="text-lg" />
          {swatchColor ? (
            <span
              aria-hidden="true"
              className="border-outline-variant/40 absolute -bottom-0.5 h-0.5 w-3.5 rounded-full border"
              style={{ backgroundColor: swatchColor }}
            />
          ) : null}
        </span>
      ) : null}
      {text ? (
        <span className="max-w-[7.5rem] truncate" style={textStyle}>
          {text}
        </span>
      ) : null}
      <MaterialIcon name="arrow_drop_down" className="text-base opacity-70" />
    </Button>
  );
});

function ToolbarGroup({
  children,
  withDivider,
}: {
  children: ReactNode;
  withDivider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        withDivider && "border-outline-variant/10 mr-2 border-r pr-2",
      )}
    >
      {children}
    </div>
  );
}

function ColorPickerPanel({
  labelPrefix,
  value,
  onChange,
}: {
  labelPrefix: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const initial = normalizeHexColor(value) ?? DEFAULT_TEXT_COLOR;
  const [draft, setDraft] = useState(initial);
  const [format, setFormat] = useState<ColorFormat>("css");
  const [inputValue, setInputValue] = useState(
    formatColorValue(initial, "css"),
  );
  const [eyedropperSupported, setEyedropperSupported] = useState(false);

  useEffect(() => {
    setEyedropperSupported(
      typeof window !== "undefined" && "EyeDropper" in window,
    );
  }, []);

  useEffect(() => {
    const next = normalizeHexColor(value) ?? DEFAULT_TEXT_COLOR;
    setDraft(next);
    setInputValue(formatColorValue(next, format));
  }, [value]);

  useEffect(() => {
    setInputValue(formatColorValue(draft, format));
  }, [draft, format]);

  function applyColor(next: string) {
    const normalized = normalizeHexColor(next);
    if (!normalized) return;
    setDraft(normalized);
    onChange(normalized);
  }

  async function onEyedropper() {
    const picked = await pickScreenColor();
    if (picked) applyColor(picked);
  }

  function onInputCommit() {
    const parsed = parseColorInput(inputValue);
    if (parsed) applyColor(parsed);
    else setInputValue(formatColorValue(draft, format));
  }

  return (
    <div className="space-y-3">
      <div aria-label={`${labelPrefix} color picker`} className="space-y-3">
        <div className="chrome-color-sat-only">
          <HexAlphaColorPicker color={draft} onChange={applyColor} />
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label={`${labelPrefix} eyedropper`}
            disabled={!eyedropperSupported}
            className="text-on-surface hover:bg-surface-bright flex size-8 shrink-0 items-center justify-center rounded-sm disabled:opacity-40"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void onEyedropper()}
          >
            <MaterialIcon name="colorize" className="text-[20px]" />
          </button>
          <div className="chrome-color-sliders-only min-w-0 flex-1">
            <HexAlphaColorPicker color={draft} onChange={applyColor} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="relative shrink-0">
          <span className="sr-only">{labelPrefix} color format</span>
          <select
            aria-label={`${labelPrefix} color format`}
            value={format}
            onChange={(event) => setFormat(event.target.value as ColorFormat)}
            className="bg-surface-bright text-on-surface h-8 appearance-none rounded-md border-0 py-1 pr-7 pl-2.5 text-xs outline-none"
          >
            {COLOR_FORMATS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <MaterialIcon
            name="arrow_drop_down"
            className="text-outline pointer-events-none absolute top-1/2 right-0.5 -translate-y-1/2 text-base"
          />
        </label>
        <Input
          aria-label={`${labelPrefix} color value`}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onBlur={onInputCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onInputCommit();
            }
          }}
          className="bg-surface-bright text-on-surface h-8 flex-1 rounded-md border-0 px-2.5 py-1 font-mono text-xs shadow-none"
        />
      </div>

      <div className="border-outline-variant/20 border-t pt-3">
        <div className="relative mb-2">
          <select
            aria-label={`${labelPrefix} palette`}
            defaultValue="presets"
            className="bg-surface-bright text-on-surface h-8 w-full appearance-none rounded-md border-0 py-1 pr-7 pl-2.5 text-xs outline-none"
          >
            <option value="presets">Presets</option>
          </select>
          <MaterialIcon
            name="arrow_drop_down"
            className="text-outline pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-base"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PALETTE.map((color) => (
            <button
              key={`${labelPrefix}-${color}`}
              type="button"
              aria-label={`${labelPrefix} ${color}`}
              title={color}
              className={cn(
                "border-outline-variant/40 size-6 rounded-[4px] border shadow-sm",
                solidHex(draft).toLowerCase() === color.toLowerCase() &&
                  "ring-primary ring-offset-surface-container-high ring-1 ring-offset-1",
              )}
              style={{ backgroundColor: color }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyColor(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  {
    onChange,
    ariaLabel,
    placeholder = "Write a message…",
    disabled = false,
    className,
    editorClassName,
    showToolbar = true,
    toolbarPortal = null,
    toolbarOverlay = false,
    onKeyDown,
    initialHtml,
    toolbarStart,
    toolbarEnd,
    acceptMergeFieldDrops = false,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    transform: "translateY(-100%)",
    zIndex: 60,
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    if (!toolbarOverlay || !showToolbar) return;
    const anchor = rootRef.current;
    if (!anchor) return;

    function updatePosition() {
      const rect = anchor!.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - 24);
      setOverlayStyle({
        position: "fixed",
        top: Math.max(8, rect.top - 8),
        left: Math.min(Math.max(8, rect.left), maxLeft),
        transform: "translateY(-100%)",
        zIndex: 60,
        visibility: "visible",
        maxWidth: `min(560px, calc(100vw - 16px))`,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    // Capture scroll from nested canvas containers.
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [toolbarOverlay, showToolbar]);
  const savedRangeRef = useRef<Range | null>(null);
  /** Stable span updated while the color/highlight picker is open (drag-friendly). */
  const liveColorSpanRef = useRef<HTMLSpanElement | null>(null);
  const liveColorEmitRafRef = useRef<number | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [font, setFont] = useState<(typeof FONT_OPTIONS)[number]>("Arial");
  const [fontSizePx, setFontSizePx] = useState(DEFAULT_FONT_SIZE_PX);
  const [fontSizeDraft, setFontSizeDraft] = useState(
    String(DEFAULT_FONT_SIZE_PX),
  );
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    setIsEmpty(isVisuallyEmpty(el));
    onChange(readValue(el));
  }, [onChange]);

  const saveSelection = useCallback(() => {
    const el = editorRef.current;
    const selection = window.getSelection();
    if (!el || !selection || selection.rangeCount === 0) return;
    const node = selection.anchorNode;
    if (!node || !el.contains(node)) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    const range = savedRangeRef.current;
    if (!el || !range) return;
    el.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const scheduleLiveEmit = useCallback(() => {
    if (liveColorEmitRafRef.current != null) return;
    liveColorEmitRafRef.current = window.requestAnimationFrame(() => {
      liveColorEmitRafRef.current = null;
      emit();
    });
  }, [emit]);

  const ensureLiveColorSpan = useCallback(
    (mode: "color" | "highlight"): HTMLSpanElement | null => {
      const existing = liveColorSpanRef.current;
      if (
        existing?.isConnected &&
        existing.getAttribute(LIVE_COLOR_ATTR) === mode
      ) {
        return existing;
      }

      const el = editorRef.current;
      const range = savedRangeRef.current;
      if (!el || !range) return null;

      el.focus();
      const selection = window.getSelection();
      if (!selection) return null;
      try {
        selection.removeAllRanges();
        selection.addRange(range);
      } catch {
        return null;
      }

      const active = selection.getRangeAt(0);
      const span = wrapRangeForLiveColor(active, mode);
      liveColorSpanRef.current = span;
      const next = selectNodeContents(span);
      savedRangeRef.current = next;
      selection.removeAllRanges();
      selection.addRange(next);
      return span;
    },
    [],
  );

  const clearLiveColorSpan = useCallback(() => {
    liveColorSpanRef.current = null;
    if (liveColorEmitRafRef.current != null) {
      window.cancelAnimationFrame(liveColorEmitRafRef.current);
      liveColorEmitRafRef.current = null;
      emit();
    }
  }, [emit]);

  const onMenuOpenChange = useCallback(
    (open: boolean) => {
      if (open) saveSelection();
    },
    [saveSelection],
  );

  // Seed once on mount. Re-applying when `initialHtml` changes (e.g. parent
  // mirroring onChange) resets the caret and types characters in reverse.
  useEffect(() => {
    const el = editorRef.current;
    if (!el || initialHtml === undefined) return;
    el.innerHTML = initialHtml;
    setIsEmpty(isVisuallyEmpty(el));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount seed only
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setHtml(html: string) {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = html;
        setIsEmpty(isVisuallyEmpty(el));
        onChange(readValue(el));
      },
      insertHtml(html: string) {
        const el = editorRef.current;
        if (!el || disabled) return;
        el.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          el.innerHTML = `${el.innerHTML}${html}`;
          emit();
          return;
        }
        insertHtmlAtSelection(html);
        emit();
      },
      focus() {
        editorRef.current?.focus();
      },
      textBeforeCursor() {
        const el = editorRef.current;
        if (!el) return "";
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return el.textContent ?? "";
        }
        const range = selection.getRangeAt(0).cloneRange();
        range.selectNodeContents(el);
        range.setEnd(
          selection.getRangeAt(0).endContainer,
          selection.getRangeAt(0).endOffset,
        );
        return range.toString();
      },
      replaceCharsBeforeCursor(count: number, html: string) {
        const el = editorRef.current;
        if (!el || disabled || count <= 0) return;
        el.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        selection.collapseToEnd();
        extendSelectionBackward(selection, el, count);
        insertHtmlAtSelection(html);
        emit();
      },
    }),
    [disabled, emit, onChange],
  );

  const runCommand = useCallback(
    (command: string, value?: string) => {
      if (disabled) return;
      restoreSelection();
      editorRef.current?.focus();
      // execCommand is deprecated but remains the only cross-browser way to do
      // inline rich-text formatting without pulling in a heavy editor library.
      if (typeof document.execCommand === "function") {
        document.execCommand(command, false, value);
      }
      emit();
    },
    [disabled, emit, restoreSelection],
  );

  const runToolbarButton = useCallback(
    (button: ToolbarButton) => {
      if (disabled) return;
      let value = button.value;
      if (button.prompt === "url") {
        const url = window.prompt("Enter a URL");
        if (!url) return;
        value = url;
      } else if (button.prompt === "image") {
        const url = window.prompt("Enter an image URL");
        if (!url) return;
        value = url;
      }
      runCommand(button.command, value);
    },
    [disabled, runCommand],
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      if (disabled) return;
      restoreSelection();
      editorRef.current?.focus();
      insertHtmlAtSelection(emoji);
      emit();
    },
    [disabled, emit, restoreSelection],
  );

  const applyFontSize = useCallback(
    (raw: number) => {
      if (disabled || Number.isNaN(raw)) return;
      const px = clampFontSizePx(raw);
      setFontSizePx(px);
      setFontSizeDraft(String(px));
      restoreSelection();
      editorRef.current?.focus();
      applyFontSizeToSelection(px);
      emit();
      setFontSizeOpen(false);
    },
    [disabled, emit, restoreSelection],
  );

  const onFontSizeOpenChange = useCallback(
    (open: boolean) => {
      onMenuOpenChange(open);
      setFontSizeOpen(open);
      if (open) setFontSizeDraft(String(fontSizePx));
    },
    [fontSizePx, onMenuOpenChange],
  );

  const applyTextColor = useCallback(
    (color: string) => {
      const css = colorToCss(color);
      setTextColor(color);
      const span = ensureLiveColorSpan("color");
      if (span) {
        span.style.color = css;
        scheduleLiveEmit();
        return;
      }
      restoreSelection();
      if (typeof document.execCommand === "function") {
        document.execCommand("foreColor", false, css);
      }
      emit();
      saveSelection();
    },
    [
      emit,
      ensureLiveColorSpan,
      restoreSelection,
      saveSelection,
      scheduleLiveEmit,
    ],
  );

  const applyHighlightColor = useCallback(
    (color: string) => {
      const css = colorToCss(color);
      setHighlightColor(color);
      const span = ensureLiveColorSpan("highlight");
      if (span) {
        span.style.backgroundColor = css;
        scheduleLiveEmit();
        return;
      }
      restoreSelection();
      if (typeof document.execCommand === "function") {
        const ok = document.execCommand("hiliteColor", false, css);
        if (!ok) document.execCommand("backColor", false, css);
      }
      emit();
      saveSelection();
    },
    [
      emit,
      ensureLiveColorSpan,
      restoreSelection,
      saveSelection,
      scheduleLiveEmit,
    ],
  );

  const onTextColorOpenChange = useCallback(
    (open: boolean) => {
      onMenuOpenChange(open);
      setTextColorOpen(open);
      if (!open) clearLiveColorSpan();
      else liveColorSpanRef.current = null;
    },
    [clearLiveColorSpan, onMenuOpenChange],
  );

  const onHighlightOpenChange = useCallback(
    (open: boolean) => {
      onMenuOpenChange(open);
      setHighlightOpen(open);
      if (!open) clearLiveColorSpan();
      else liveColorSpanRef.current = null;
    },
    [clearLiveColorSpan, onMenuOpenChange],
  );

  const colorPicking = textColorOpen || highlightOpen;

  return (
    <div
      ref={rootRef}
      className={cn(
        "border-outline-variant/20 bg-surface-container-low overflow-hidden rounded border",
        (!showToolbar || toolbarOverlay) && "border-0 bg-transparent",
        toolbarOverlay && "overflow-visible",
        className,
      )}
    >
      <style>{`
        /* Let live text/highlight colors show through while the picker is open. */
        [data-tb-color-picking="true"]::selection,
        [data-tb-color-picking="true"] *::selection {
          background-color: transparent !important;
          color: inherit !important;
        }
      `}</style>
      {showToolbar
        ? (() => {
            const toolbar = (
              <div
                className={cn(
                  "border-outline-variant/15 bg-surface-container-high flex flex-wrap items-center gap-1 px-3 py-2",
                  toolbarOverlay &&
                    "rounded-md border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
                  !toolbarPortal && !toolbarOverlay && "border-b",
                )}
                role="toolbar"
                aria-label="Formatting"
              >
                {toolbarStart && (
                  <ToolbarGroup withDivider>{toolbarStart}</ToolbarGroup>
                )}

                <ToolbarGroup withDivider>
                  {STYLE_BUTTONS.map((button) => (
                    <ToolbarIconButton
                      key={button.command}
                      label={button.label}
                      icon={button.icon}
                      disabled={disabled}
                      onClick={() => runToolbarButton(button)}
                    />
                  ))}
                </ToolbarGroup>

                <ToolbarGroup withDivider>
                  <DropdownMenu onOpenChange={onMenuOpenChange}>
                    <DropdownMenuTrigger asChild>
                      <ToolbarMenuButton
                        label="Font"
                        text={font}
                        textStyle={{ fontFamily: font }}
                        disabled={disabled}
                        className="min-w-[8.5rem] justify-between"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="border-outline-variant/20 bg-surface-container-high text-on-surface z-[100]"
                    >
                      {FONT_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onSelect={() => {
                            setFont(option);
                            runCommand("fontName", option);
                          }}
                          style={{ fontFamily: option }}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Popover
                    open={fontSizeOpen}
                    onOpenChange={onFontSizeOpenChange}
                  >
                    <PopoverTrigger asChild>
                      <ToolbarMenuButton
                        label="Font size"
                        text={`${fontSizePx}`}
                        disabled={disabled}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="border-outline-variant/20 bg-surface-container-high text-on-surface z-[100] w-44 p-2"
                      onOpenAutoFocus={(event) => event.preventDefault()}
                    >
                      <form
                        className="mb-2 flex items-center gap-1"
                        onSubmit={(event) => {
                          event.preventDefault();
                          applyFontSize(Number(fontSizeDraft));
                        }}
                      >
                        <Input
                          aria-label="Custom font size"
                          type="number"
                          min={MIN_FONT_SIZE_PX}
                          max={MAX_FONT_SIZE_PX}
                          value={fontSizeDraft}
                          onChange={(event) =>
                            setFontSizeDraft(event.target.value)
                          }
                          className="border-outline-variant/30 bg-surface-container-lowest h-8 px-2 py-1 text-sm"
                        />
                        <span className="font-label text-outline text-[10px] tracking-widest uppercase">
                          px
                        </span>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="xs"
                          className="tracking-normal text-white normal-case"
                        >
                          Apply
                        </Button>
                      </form>
                      <ul className="max-h-48 space-y-0.5 overflow-auto">
                        {FONT_SIZE_PRESETS.map((size) => (
                          <li key={size}>
                            <button
                              type="button"
                              aria-label={`${size} pixels`}
                              className={cn(
                                "hover:bg-surface-bright flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:text-white",
                                size === fontSizePx &&
                                  "bg-surface-bright text-white",
                              )}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyFontSize(size)}
                            >
                              <span style={{ fontSize: Math.min(size, 18) }}>
                                {size}
                              </span>
                              <span className="font-label text-outline text-[10px] tracking-widest uppercase">
                                px
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>

                  <Popover
                    open={textColorOpen}
                    onOpenChange={onTextColorOpenChange}
                  >
                    <PopoverTrigger asChild>
                      <ToolbarMenuButton
                        label="Text color"
                        icon="format_color_text"
                        swatchColor={solidHex(textColor)}
                        disabled={disabled}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="border-outline-variant/20 bg-surface-container-high text-on-surface z-[100] w-[240px] p-3 shadow-xl"
                      onOpenAutoFocus={(event) => event.preventDefault()}
                      // Live color apply focuses the editor; don't dismiss for that.
                      onFocusOutside={(event) => event.preventDefault()}
                      onCloseAutoFocus={(event) => event.preventDefault()}
                    >
                      <ColorPickerPanel
                        labelPrefix="Text color"
                        value={textColor}
                        onChange={applyTextColor}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover
                    open={highlightOpen}
                    onOpenChange={onHighlightOpenChange}
                  >
                    <PopoverTrigger asChild>
                      <ToolbarMenuButton
                        label="Highlight"
                        icon="border_color"
                        swatchColor={solidHex(highlightColor)}
                        disabled={disabled}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="border-outline-variant/20 bg-surface-container-high text-on-surface z-[100] w-[240px] p-3 shadow-xl"
                      onOpenAutoFocus={(event) => event.preventDefault()}
                      onFocusOutside={(event) => event.preventDefault()}
                      onCloseAutoFocus={(event) => event.preventDefault()}
                    >
                      <ColorPickerPanel
                        labelPrefix="Highlight"
                        value={highlightColor}
                        onChange={applyHighlightColor}
                      />
                    </PopoverContent>
                  </Popover>
                </ToolbarGroup>

                <ToolbarGroup withDivider>
                  <DropdownMenu onOpenChange={onMenuOpenChange}>
                    <DropdownMenuTrigger asChild>
                      <ToolbarMenuButton
                        label="Align"
                        icon="format_align_left"
                        disabled={disabled}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="border-outline-variant/20 bg-surface-container-high text-on-surface z-[100]"
                    >
                      {ALIGN_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.command}
                          onSelect={() => runCommand(option.command)}
                        >
                          <MaterialIcon
                            name={option.icon}
                            className="text-base"
                          />
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {LIST_BUTTONS.map((button) => (
                    <ToolbarIconButton
                      key={button.command}
                      label={button.label}
                      icon={button.icon}
                      disabled={disabled}
                      onClick={() => runToolbarButton(button)}
                    />
                  ))}

                  {INDENT_BUTTONS.map((button) => (
                    <ToolbarIconButton
                      key={button.command}
                      label={button.label}
                      icon={button.icon}
                      disabled={disabled}
                      onClick={() => runToolbarButton(button)}
                    />
                  ))}
                </ToolbarGroup>

                <ToolbarGroup withDivider>
                  {INSERT_BUTTONS.map((button) => (
                    <ToolbarIconButton
                      key={button.label}
                      label={button.label}
                      icon={button.icon}
                      disabled={disabled}
                      onClick={() => runToolbarButton(button)}
                    />
                  ))}

                  <Popover onOpenChange={onMenuOpenChange}>
                    <PopoverTrigger asChild>
                      <ToolbarMenuButton
                        label="Emoji"
                        icon="mood"
                        disabled={disabled}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="border-outline-variant/20 bg-surface-container-high z-[100] w-auto p-2"
                    >
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            aria-label={`Insert ${emoji}`}
                            className="hover:bg-surface-variant size-8 rounded text-lg"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </ToolbarGroup>

                {toolbarEnd}
              </div>
            );
            if (toolbarOverlay && typeof document !== "undefined") {
              return createPortal(
                <div
                  data-testid="rich-text-toolbar-overlay"
                  style={overlayStyle}
                >
                  {toolbar}
                </div>,
                document.body,
              );
            }
            return toolbarPortal
              ? createPortal(toolbar, toolbarPortal)
              : toolbar;
          })()
        : null}

      <div className="relative">
        {isEmpty && (
          <p
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 px-4 py-3 text-sm leading-relaxed italic",
              editorClassName,
              "text-outline",
            )}
          >
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-label={ariaLabel}
          aria-multiline="true"
          tabIndex={disabled ? -1 : 0}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emit}
          onKeyDown={onKeyDown}
          onDragOver={(event) => {
            if (!acceptMergeFieldDrops || disabled) return;
            // Use types-only check — getData is often empty during dragover.
            if (!isMergeFieldDrag(event.dataTransfer)) return;
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            if (!acceptMergeFieldDrops || disabled) return;
            if (!isMergeFieldDrag(event.dataTransfer)) return;
            const payload = readBuilderDragData(event.dataTransfer);
            if (
              payload?.kind !== "variant" ||
              !isMergeFieldVariant(payload.variantId)
            ) {
              return;
            }
            const chip = mergeFieldChipHtmlFromVariant(payload.variantId);
            if (!chip) return;
            event.preventDefault();
            event.stopPropagation();
            editorRef.current?.focus();
            if (!insertHtmlAtSelection(chip)) {
              const el = editorRef.current;
              if (el) el.innerHTML = `${el.innerHTML}${chip}`;
            }
            emit();
          }}
          data-tb-color-picking={colorPicking ? "true" : undefined}
          className={cn(
            "text-on-surface min-h-40 w-full px-4 py-3 text-sm leading-relaxed focus:outline-none",
            "[&_a]:text-primary [&_a]:underline",
            "[&_blockquote]:border-outline-variant/40 [&_blockquote]:text-on-surface-variant [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3",
            "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
            "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
            "[&_img]:max-w-full [&_img]:rounded",
            disabled && "opacity-60",
            editorClassName,
          )}
        />
      </div>
    </div>
  );
});

export type { RichTextEditorProps };
