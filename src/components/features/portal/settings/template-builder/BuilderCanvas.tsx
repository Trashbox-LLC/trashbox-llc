"use client";

import { useEffect, useRef, useState } from "react";
import {
  RichTextEditor,
  type RichTextValue,
} from "@/components/atoms/RichTextEditor";
import { BuilderBlock } from "@/components/features/portal/settings/template-builder/BuilderBlock";
import type {
  ColumnItemSelection,
  EmailTemplateBlock,
  EmailTemplateDocument,
  EmailTemplatePageBand,
} from "@/lib/email-template-document";
import { decorateMergeFieldsHtml } from "@/lib/email-content";
import {
  documentContentPaddingStyle,
  documentPageBackgroundStyle,
  isFlatPageDocument,
} from "@/lib/email-template-document";
import {
  isBuilderDrag,
  isMergeFieldDrag,
  readBuilderDragData,
  resolveInsertPlacement,
  type InsertPlacement,
} from "@/lib/email-template-dnd";
import { cn } from "@/lib/utils";

export interface BuilderCanvasProps {
  document: EmailTemplateDocument;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onChangeBlock: (id: string, patch: Partial<EmailTemplateBlock>) => void;
  onDuplicateBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: "up" | "down") => void;
  onDropAt: (
    index: number,
    payload: ReturnType<typeof readBuilderDragData>,
  ) => void;
  onDropInColumn?: (
    columnsBlockId: string,
    columnIndex: number,
    payload: ReturnType<typeof readBuilderDragData>,
  ) => void;
  onDropInGridCell?: (
    gridBlockId: string,
    rowIndex: number,
    columnIndex: number,
    payload: ReturnType<typeof readBuilderDragData>,
  ) => void;
  selectedColumnItem?: ColumnItemSelection | null;
  onSelectColumnItem?: (
    blockId: string,
    selection: ColumnItemSelection | null,
  ) => void;
  selectedColumnIndex?: number | null;
  onSelectColumn?: (blockId: string, columnIndex: number) => void;
  selectedGridCell?: { rowIndex: number; columnIndex: number } | null;
  onSelectGridCell?: (
    blockId: string,
    rowIndex: number,
    columnIndex: number,
  ) => void;
  selectedImageTextChild?: "image" | "text" | null;
  onSelectImageTextChild?: (blockId: string, child: "image" | "text") => void;
  selectedPageBand?: "header" | "footer" | null;
  onSelectPageBand?: (band: "header" | "footer" | null) => void;
  onChangePageBand?: (
    role: "header" | "footer",
    patch: Partial<EmailTemplatePageBand>,
  ) => void;
  onChangeDocument: (patch: Partial<EmailTemplateDocument>) => void;
  className?: string;
}

function blockTypeLabel(type: EmailTemplateBlock["type"]): string {
  switch (type) {
    case "columns":
      return "Section";
    case "grid":
      return "Grid";
    case "text":
      return "Text";
    case "button":
      return "Button";
    case "image":
      return "Image";
    case "imageText":
      return "Image text";
    case "spacer":
      return "Spacer";
    case "table":
      return "Table";
    case "html":
      return "HTML";
    default:
      return "Block";
  }
}

function insertSlotLabel(
  placement: InsertPlacement,
  blocks: ReadonlyArray<EmailTemplateBlock>,
): string {
  if (blocks.length === 0) return "Insert here";
  const anchor = blocks[placement.anchorIndex] ?? blocks[0]!;
  const name = blockTypeLabel(anchor.type);
  return placement.relation === "before"
    ? `Insert before ${name}`
    : `Insert after ${name}`;
}

/**
 * Absolutely positioned overlay badge. Parent must be `relative`; this takes
 * no layout height so neighbors never shift while dragging.
 */
function InsertIndicator({
  index,
  label,
}: {
  index: number;
  label: string;
}): React.ReactElement {
  return (
    <div
      data-testid={`builder-drop-slot-${index}`}
      aria-label={label}
      className="pointer-events-none absolute inset-x-1 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center"
    >
      <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-sky-500" />
      <span className="relative z-10 rounded-none bg-sky-500 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white shadow-sm">
        {label}
      </span>
    </div>
  );
}

/**
 * Zero-height insert slot between flush block outlines. The drag badge overlays
 * this without pushing neighbors apart.
 */
function BlockGap({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      data-testid="builder-block-gap"
      className="relative h-0"
      aria-hidden={children == null}
    >
      {children}
    </div>
  );
}

function PageBandEditor({
  role,
  band,
  selected,
  onSelect,
  onChange,
}: {
  role: "header" | "footer";
  band: EmailTemplatePageBand;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<EmailTemplatePageBand>) => void;
}): React.ReactElement {
  const borderStyle =
    role === "header"
      ? {
          borderBottomWidth: band.borderWidth,
          borderBottomStyle:
            band.borderWidth > 0 ? ("solid" as const) : undefined,
          borderBottomColor: band.borderColor,
        }
      : {
          borderTopWidth: band.borderWidth,
          borderTopStyle: band.borderWidth > 0 ? ("solid" as const) : undefined,
          borderTopColor: band.borderColor,
        };

  const [hovered, setHovered] = useState(false);
  const showChrome = selected || hovered;
  const label = role === "header" ? "Header" : "Footer";

  return (
    <div
      data-testid={`builder-page-${role}`}
      role="button"
      tabIndex={0}
      aria-label={role === "header" ? "Email header" : "Email footer"}
      aria-pressed={selected}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement | null;
        if (
          target?.isContentEditable ||
          target?.closest?.('[contenteditable="true"], input, textarea, select')
        ) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onSelect();
        }
      }}
      className={cn(
        "relative rounded-none transition-colors",
        role === "footer" && "mt-0",
        selected
          ? "outline-2 -outline-offset-1 outline-sky-500"
          : hovered
            ? "outline-1 -outline-offset-1 outline-sky-500/40"
            : "outline-none",
      )}
      style={{
        backgroundColor:
          band.backgroundColor === "transparent"
            ? undefined
            : band.backgroundColor,
        padding: `${band.paddingY}px ${band.paddingX}px`,
        textAlign: band.align,
        ...borderStyle,
      }}
    >
      {showChrome ? (
        <div
          data-testid={`builder-page-${role}-tag`}
          data-tb-tag-state={selected ? "selected" : "hover"}
          className={cn(
            "absolute top-0 left-0 z-30 flex h-5 -translate-y-full items-center rounded-none px-1.5 text-[11px] leading-none font-medium whitespace-nowrap text-white",
            selected ? "bg-sky-500" : "bg-sky-500/55",
          )}
        >
          {label}
        </div>
      ) : null}
      {selected ? (
        <div
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <RichTextEditor
            key={`page-band-${role}`}
            ariaLabel={`${role} content`}
            placeholder={`${role === "header" ? "Header" : "Footer"} text…`}
            initialHtml={band.html}
            onChange={(value: RichTextValue) => onChange({ html: value.html })}
            showToolbar
            toolbarOverlay
            acceptMergeFieldDrops
            className="border-0 bg-transparent"
            editorClassName="min-h-[2.5rem] min-w-0 select-text break-words [overflow-wrap:anywhere] px-0 py-0 leading-relaxed"
          />
        </div>
      ) : (
        <div
          className="min-w-0 px-0 py-0 leading-relaxed [overflow-wrap:anywhere] break-words"
          dangerouslySetInnerHTML={{
            __html: decorateMergeFieldsHtml(band.html || "<p><br /></p>"),
          }}
        />
      )}{" "}
    </div>
  );
}

export function BuilderCanvas({
  document: doc,
  selectedBlockId,
  onSelectBlock,
  onChangeBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onMoveBlock,
  onDropAt,
  onDropInColumn,
  onDropInGridCell,
  selectedColumnItem = null,
  onSelectColumnItem,
  selectedColumnIndex = null,
  onSelectColumn,
  selectedGridCell = null,
  onSelectGridCell,
  selectedImageTextChild = null,
  onSelectImageTextChild,
  selectedPageBand = null,
  onSelectPageBand,
  onChangePageBand,
  onChangeDocument,
  className,
}: BuilderCanvasProps): React.ReactElement {
  const [dropPlacement, setDropPlacement] = useState<InsertPlacement | null>(
    null,
  );
  const dropIndexRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const dropIndex = dropPlacement?.index ?? null;

  function clearDropVisual() {
    setDropPlacement(null);
  }

  function clearDropState() {
    dropIndexRef.current = null;
    setDropPlacement(null);
  }

  // Nested column/grid drops stopPropagation, so the page drop handler never
  // runs. Clear the insert bar on any drop under the canvas (capture) and on
  // dragend (covers cancel / drop outside). Keep the ref until handleDrop so
  // page-level drops still know the insert index.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const onDropCapture = () => {
      clearDropVisual();
    };
    const onDragEnd = () => {
      clearDropState();
    };

    surface.addEventListener("drop", onDropCapture, true);
    window.addEventListener("dragend", onDragEnd);
    return () => {
      surface.removeEventListener("drop", onDropCapture, true);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, []);

  function collectBlockRects(): Array<{ top: number; height: number }> {
    if (!listRef.current) return [];
    return Array.from(
      listRef.current.querySelectorAll("[data-builder-block-index]"),
    ).map((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });
  }

  function handleDragOver(event: React.DragEvent) {
    if (!isBuilderDrag(event.dataTransfer)) return;
    if (isMergeFieldDrag(event.dataTransfer)) {
      clearDropState();
      event.dataTransfer.dropEffect = "none";
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect =
      event.dataTransfer.effectAllowed === "move" ? "move" : "copy";
    const next = resolveInsertPlacement(event.clientY, collectBlockRects());
    dropIndexRef.current = next.index;
    setDropPlacement(next);
  }

  function handleDragOverCapture(event: React.DragEvent) {
    if (!isBuilderDrag(event.dataTransfer)) return;
    if (isMergeFieldDrag(event.dataTransfer)) return;
    const nested = (event.target as Element | null)?.closest?.(
      "[data-builder-nested-drop]",
    );
    if (nested) {
      // Nested targets stopPropagation on bubble — clear the page bar here.
      clearDropVisual();
    }
  }

  function handleDrop(event: React.DragEvent) {
    if (!isBuilderDrag(event.dataTransfer)) return;
    if (isMergeFieldDrag(event.dataTransfer)) {
      clearDropState();
      return;
    }
    event.preventDefault();
    const index = dropIndexRef.current ?? doc.blocks.length;
    clearDropState();
    onDropAt(index, readBuilderDragData(event.dataTransfer));
  }

  const dropHandlers = {
    onDragOverCapture: handleDragOverCapture,
    onDragOver: handleDragOver,
    onDragLeave: (event: React.DragEvent) => {
      if (event.currentTarget.contains(event.relatedTarget as Node)) return;
      clearDropState();
    },
    onDrop: handleDrop,
  };

  const margins = documentContentPaddingStyle(doc);
  const flatPage = isFlatPageDocument(doc);
  /** Editor-only backdrop so the white content page reads clearly (not emailed). */
  const EDITOR_SURFACE_CHROME = "#e8e8ec";

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-zinc-100", className)}>
      <style>{`
        [data-tb-merge], .tb-merge-field {
          display: inline;
          border: 0;
          border-bottom: 1px dotted currentColor;
          background: transparent;
          color: inherit;
          border-radius: 0;
          padding: 0;
          margin: 0;
          font: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          line-height: inherit;
          box-shadow: none;
          white-space: nowrap;
        }
        [data-tb-merge]:hover, .tb-merge-field:hover {
          border-bottom-style: solid;
        }
        /* Override site-wide white selection so text is visible on the white paper. */
        [data-tb-selection="invert"]::selection,
        [data-tb-selection="invert"] *::selection {
          background-color: #18181b;
          color: #ffffff;
        }
        /* While picking text/highlight color, show the real paint instead. */
        [data-tb-selection="invert"] [data-tb-color-picking="true"]::selection,
        [data-tb-selection="invert"] [data-tb-color-picking="true"] *::selection {
          background-color: transparent;
          color: inherit;
        }
      `}</style>
      <div className="bg-surface-container-high flex shrink-0 flex-wrap items-center gap-3 border-b border-zinc-300/80 px-3 py-1.5">
        <label className="font-label text-outline flex items-center text-[10px] tracking-widest uppercase">
          Background
          <input
            type="color"
            aria-label="Page background color"
            value={doc.backgroundColor}
            onChange={(event) =>
              onChangeDocument({ backgroundColor: event.target.value })
            }
            className="border-outline-variant/30 ml-2 h-7 w-8 cursor-pointer border bg-transparent"
          />
        </label>
      </div>

      <div
        ref={surfaceRef}
        className="min-h-0 flex-1 overflow-y-auto"
        style={
          flatPage
            ? {
                backgroundColor: EDITOR_SURFACE_CHROME,
                // Extra horizontal room so section outlines can bleed past 600px.
                padding: "24px 48px 48px",
              }
            : {
                ...documentPageBackgroundStyle(doc),
                padding: 0,
              }
        }
        onClick={() => {
          onSelectBlock(null);
          onSelectPageBand?.(null);
        }}
        data-testid="template-canvas-drop-surface"
        {...dropHandlers}
      >
        <div className="relative mx-auto w-full max-w-[600px]">
          <div
            className={cn(
              "relative box-border w-full min-w-0 overflow-visible [overflow-wrap:anywhere] break-words text-[#18181b]",
              "shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5",
              dropIndex != null && "ring-2 ring-sky-500",
            )}
            style={{
              backgroundColor: doc.contentBackgroundColor || "#ffffff",
              maxWidth: 600,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              paddingLeft: 0,
            }}
            onClick={(event) => event.stopPropagation()}
            data-testid="template-paper-page"
            data-tb-flat-page={flatPage ? "true" : "false"}
            data-tb-selection="invert"
          >
            {doc.header ? (
              <div className="mx-auto w-full max-w-[600px]">
                <PageBandEditor
                  role="header"
                  band={doc.header}
                  selected={selectedPageBand === "header"}
                  onSelect={() => {
                    onSelectBlock(null);
                    onSelectPageBand?.("header");
                  }}
                  onChange={(patch) => onChangePageBand?.("header", patch)}
                />
              </div>
            ) : null}

            <div
              ref={listRef}
              className="space-y-0"
              style={margins}
              data-testid="template-content-pad"
            >
              <div className="relative h-0">
                {dropPlacement && dropPlacement.index === 0 ? (
                  <InsertIndicator
                    index={0}
                    label={insertSlotLabel(dropPlacement, doc.blocks)}
                  />
                ) : null}
              </div>
              {doc.blocks.map((block, index) => (
                <div key={block.id}>
                  <div
                    data-builder-block-index={index}
                    data-testid={`builder-block-wrap-${index}`}
                    className="mx-auto w-full max-w-[600px]"
                  >
                    <BuilderBlock
                      block={block}
                      selected={selectedBlockId === block.id}
                      onSelect={() => {
                        onSelectPageBand?.(null);
                        onSelectBlock(block.id);
                      }}
                      onChange={(patch) => onChangeBlock(block.id, patch)}
                      onDuplicate={() => onDuplicateBlock(block.id)}
                      onDelete={() => onDeleteBlock(block.id)}
                      onMoveUp={() => onMoveBlock(block.id, "up")}
                      onMoveDown={() => onMoveBlock(block.id, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < doc.blocks.length - 1}
                      onDropInColumn={
                        onDropInColumn
                          ? (columnIndex, payload) =>
                              onDropInColumn(block.id, columnIndex, payload)
                          : undefined
                      }
                      onDropInGridCell={
                        onDropInGridCell
                          ? (rowIndex, columnIndex, payload) =>
                              onDropInGridCell(
                                block.id,
                                rowIndex,
                                columnIndex,
                                payload,
                              )
                          : undefined
                      }
                      selectedColumnItem={
                        selectedBlockId === block.id ? selectedColumnItem : null
                      }
                      onSelectColumnItem={(selection) => {
                        onSelectPageBand?.(null);
                        onSelectColumnItem?.(block.id, selection);
                      }}
                      selectedColumnIndex={
                        selectedBlockId === block.id
                          ? selectedColumnIndex
                          : null
                      }
                      onSelectColumn={(columnIndex) => {
                        onSelectPageBand?.(null);
                        onSelectColumn?.(block.id, columnIndex);
                      }}
                      selectedGridCell={
                        selectedBlockId === block.id ? selectedGridCell : null
                      }
                      onSelectGridCell={(rowIndex, columnIndex) => {
                        onSelectPageBand?.(null);
                        onSelectGridCell?.(block.id, rowIndex, columnIndex);
                      }}
                      selectedImageTextChild={
                        selectedBlockId === block.id
                          ? selectedImageTextChild
                          : null
                      }
                      onSelectImageTextChild={(child) => {
                        onSelectPageBand?.(null);
                        onSelectImageTextChild?.(block.id, child);
                      }}
                    />
                  </div>
                  {index < doc.blocks.length - 1 ? (
                    <BlockGap>
                      {dropPlacement && dropPlacement.index === index + 1 ? (
                        <InsertIndicator
                          index={index + 1}
                          label={insertSlotLabel(dropPlacement, doc.blocks)}
                        />
                      ) : null}
                    </BlockGap>
                  ) : null}
                </div>
              ))}
              <div className="relative h-0">
                {dropPlacement && dropPlacement.index === doc.blocks.length ? (
                  <InsertIndicator
                    index={doc.blocks.length}
                    label={insertSlotLabel(dropPlacement, doc.blocks)}
                  />
                ) : null}
              </div>
            </div>

            {doc.footer ? (
              <div className="mx-auto w-full max-w-[600px]">
                <PageBandEditor
                  role="footer"
                  band={doc.footer}
                  selected={selectedPageBand === "footer"}
                  onSelect={() => {
                    onSelectBlock(null);
                    onSelectPageBand?.("footer");
                  }}
                  onChange={(patch) => onChangePageBand?.("footer", patch)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
