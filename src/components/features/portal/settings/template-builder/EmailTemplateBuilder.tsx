"use client";

import { useState } from "react";
import { BuilderCanvas } from "@/components/features/portal/settings/template-builder/BuilderCanvas";
import { BuilderCodeSplit } from "@/components/features/portal/settings/template-builder/BuilderCodeSplit";
import { BuilderInspector } from "@/components/features/portal/settings/template-builder/BuilderInspector";
import { BuilderLeftSidebar } from "@/components/features/portal/settings/template-builder/BuilderLeftSidebar";
import { BuilderPreview } from "@/components/features/portal/settings/template-builder/BuilderPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  appendVariant,
  documentToEmailHtml,
  documentToPlainText,
  duplicateBlock,
  emptyDocument,
  gridCellIndex,
  withDefaultSection,
  insertVariantAt,
  insertVariantIntoColumn,
  insertVariantIntoGridCell,
  moveBlock,
  moveBlockIntoColumn,
  moveBlockIntoGridCell,
  moveBlockToIndex,
  parseColumnItems,
  removeBlock,
  removePageBand,
  updateBlock,
  updateColumnItem,
  updateGridCellItem,
  updatePageBand,
  type ColumnItem,
  type EmailTemplateBlock,
  type EmailTemplateDocument,
  type EmailTemplatePageBand,
  type ImageTextImageChild,
} from "@/lib/email-template-document";
import { isMergeFieldVariant, renderPreviewTemplate } from "@/lib/email-content";
import type { BuilderDragPayload } from "@/lib/email-template-dnd";
import {
  selectBlock,
  selectColumnItem,
  selectionBlockId,
  selectionColumnItem,
  selectionImageTextChild,
  selectionPageBand,
  selectPageBand,
  type BuilderSelection,
} from "@/lib/email-template-selection";
import { cn } from "@/lib/utils";

export interface EmailTemplateBuilderSavePayload {
  name: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

export interface EmailTemplateBuilderProps {
  /** library = Settings save; compose = draft-only Insert (no name/subject). */
  mode?: "library" | "compose";
  initialName?: string;
  initialSubject?: string;
  initialDocument?: EmailTemplateDocument;
  busy?: boolean;
  error?: string | null;
  onSave: (payload: EmailTemplateBuilderSavePayload) => Promise<void> | void;
  onCancel: () => void;
  className?: string;
}

type BuilderViewMode = "edit" | "preview" | "code";

export function EmailTemplateBuilder({
  mode = "library",
  initialName = "",
  initialSubject = "",
  initialDocument,
  busy = false,
  error = null,
  onSave,
  onCancel,
  className,
}: EmailTemplateBuilderProps): React.ReactElement {
  const isCompose = mode === "compose";
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject);
  const [doc, setDoc] = useState<EmailTemplateDocument>(() =>
    withDefaultSection(initialDocument ?? emptyDocument()),
  );
  const [selection, setSelection] = useState<BuilderSelection>({
    kind: "none",
  });
  const [viewMode, setViewMode] = useState<BuilderViewMode>("edit");

  const selectedBlockId = selectionBlockId(selection);
  const selectedColumnItemCoords = selectionColumnItem(selection);
  const selectedPageBand = selectionPageBand(selection);
  const selectedImageTextChild = selectionImageTextChild(selection);
  const selectedColumnIndex =
    selection.kind === "column" ? selection.columnIndex : null;
  const selectedGridCell =
    selection.kind === "gridCell"
      ? { rowIndex: selection.rowIndex, columnIndex: selection.columnIndex }
      : null;

  function enterEdit() {
    setViewMode("edit");
  }

  function addVariant(variantId: string) {
    // Merge fields only insert into rich text, never as standalone blocks.
    if (isMergeFieldVariant(variantId)) return;
    setDoc((current) => {
      const next = appendVariant(current, variantId);
      if (variantId.startsWith("header")) {
        setSelection(selectPageBand("header"));
      } else if (variantId.startsWith("footer")) {
        setSelection(selectPageBand("footer"));
      } else {
        const added = next.blocks[next.blocks.length - 1];
        setSelection(added ? selectBlock(added.id) : { kind: "none" });
      }
      return next;
    });
    enterEdit();
  }

  function handleDropAt(index: number, payload: BuilderDragPayload | null) {
    if (!payload) return;
    if (payload.kind === "variant" && isMergeFieldVariant(payload.variantId)) {
      return;
    }
    enterEdit();
    if (payload.kind === "variant") {
      setDoc((current) => {
        const next = insertVariantAt(current, index, payload.variantId);
        const added = next.blocks[index];
        setSelection(added ? selectBlock(added.id) : { kind: "none" });
        return next;
      });
      return;
    }
    setDoc((current) => moveBlockToIndex(current, payload.blockId, index));
    setSelection(selectBlock(payload.blockId));
  }

  function handleDropInColumn(
    columnsBlockId: string,
    columnIndex: number,
    payload: BuilderDragPayload | null,
  ) {
    if (!payload) return;
    if (payload.kind === "variant" && isMergeFieldVariant(payload.variantId)) {
      return;
    }
    enterEdit();
    if (payload.kind === "variant") {
      setDoc((current) => {
        const next = insertVariantIntoColumn(
          current,
          columnsBlockId,
          columnIndex,
          payload.variantId,
        );
        const columnsBlock = next.blocks.find(
          (block) => block.id === columnsBlockId,
        );
        const items =
          columnsBlock?.type === "columns"
            ? parseColumnItems(columnsBlock.columns[columnIndex] ?? "")
            : [];
        if (items.length > 0) {
          setSelection(
            selectColumnItem(columnsBlockId, {
              columnIndex,
              itemIndex: items.length - 1,
            }),
          );
        } else {
          setSelection(selectBlock(columnsBlockId));
        }
        return next;
      });
      return;
    }
    setDoc((current) =>
      moveBlockIntoColumn(
        current,
        payload.blockId,
        columnsBlockId,
        columnIndex,
      ),
    );
    setSelection(selectBlock(columnsBlockId));
  }

  function handleDropInGridCell(
    gridBlockId: string,
    rowIndex: number,
    columnIndex: number,
    payload: BuilderDragPayload | null,
  ) {
    if (!payload) return;
    if (payload.kind === "variant" && isMergeFieldVariant(payload.variantId)) {
      return;
    }
    enterEdit();
    if (payload.kind === "variant") {
      setDoc((current) => {
        const next = insertVariantIntoGridCell(
          current,
          gridBlockId,
          rowIndex,
          columnIndex,
          payload.variantId,
        );
        const grid = next.blocks.find((block) => block.id === gridBlockId);
        if (grid?.type === "grid") {
          const flat = gridCellIndex(rowIndex, columnIndex, grid.columns);
          const items = parseColumnItems(grid.cells[flat] ?? "");
          if (items.length > 0) {
            setSelection(
              selectColumnItem(gridBlockId, {
                rowIndex,
                columnIndex,
                itemIndex: items.length - 1,
              }),
            );
          } else {
            setSelection(selectBlock(gridBlockId));
          }
        }
        return next;
      });
      return;
    }
    setDoc((current) =>
      moveBlockIntoGridCell(
        current,
        payload.blockId,
        gridBlockId,
        rowIndex,
        columnIndex,
      ),
    );
    setSelection(selectBlock(gridBlockId));
  }

  function changeBlock(id: string, patch: Partial<EmailTemplateBlock>) {
    setDoc((current) => updateBlock(current, id, patch));
  }

  function changeColumnItem(patch: Partial<ColumnItem>) {
    if (selection.kind !== "columnItem") return;
    if (selection.rowIndex != null) {
      setDoc((current) =>
        updateGridCellItem(
          current,
          selection.blockId,
          selection.rowIndex!,
          selection.columnIndex,
          selection.itemIndex,
          patch,
        ),
      );
      return;
    }
    setDoc((current) =>
      updateColumnItem(
        current,
        selection.blockId,
        selection.columnIndex,
        selection.itemIndex,
        patch,
      ),
    );
  }

  function changePageBand(patch: Partial<EmailTemplatePageBand>) {
    if (!selectedPageBand) return;
    setDoc((current) => updatePageBand(current, selectedPageBand, patch));
  }

  function changeImageTextImage(patch: Partial<ImageTextImageChild>) {
    if (selection.kind !== "imageTextChild" || selection.child !== "image") {
      return;
    }
    const block = doc.blocks.find((b) => b.id === selection.blockId);
    if (block?.type !== "imageText") return;
    changeBlock(selection.blockId, {
      image: { ...block.image, ...patch },
    } as Partial<EmailTemplateBlock>);
  }

  async function save() {
    const bodyHtml = documentToEmailHtml(doc);
    const bodyText = documentToPlainText(doc) || name.trim() || " ";
    await onSave({
      name: isCompose ? "" : name.trim(),
      subject: isCompose ? "" : subject.trim(),
      bodyText,
      bodyHtml,
    });
  }

  const hasDocumentContent =
    doc.blocks.length > 0 || Boolean(doc.header) || Boolean(doc.footer);
  const canSave = isCompose
    ? hasDocumentContent
    : Boolean(name.trim()) && hasDocumentContent;
  const selectedBlock =
    doc.blocks.find((block) => block.id === selectedBlockId) ?? null;
  const selectedBand =
    selectedPageBand === "header"
      ? doc.header
      : selectedPageBand === "footer"
        ? doc.footer
        : null;
  const selectedNestedItem =
    selectedBlock && selectedColumnItemCoords
      ? selectedBlock.type === "columns"
        ? (parseColumnItems(
            selectedBlock.columns[selectedColumnItemCoords.columnIndex] ?? "",
          )[selectedColumnItemCoords.itemIndex] ?? null)
        : selectedBlock.type === "grid" &&
            selectedColumnItemCoords.rowIndex != null
          ? (parseColumnItems(
              selectedBlock.cells[
                gridCellIndex(
                  selectedColumnItemCoords.rowIndex,
                  selectedColumnItemCoords.columnIndex,
                  selectedBlock.columns,
                )
              ] ?? "",
            )[selectedColumnItemCoords.itemIndex] ?? null)
          : null
      : null;

  return (
    <div
      className={cn(
        "bg-background flex h-full min-h-0 flex-1 flex-col",
        className,
      )}
    >
      <header className="border-outline-variant/20 bg-surface-container-low flex flex-wrap items-center gap-3 border-b px-4 py-3">
        {isCompose ? (
          <div className="min-w-0 flex-1" />
        ) : (
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="builder-name" className="sr-only">
                Template name
              </Label>
              <Input
                id="builder-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={busy}
                placeholder="Template name"
                className="py-2"
              />
            </div>
            <div>
              <Label htmlFor="builder-subject" className="sr-only">
                Subject
              </Label>
              <Input
                id="builder-subject"
                value={
                  viewMode === "preview"
                    ? renderPreviewTemplate(subject)
                    : subject
                }
                onChange={(event) => setSubject(event.target.value)}
                readOnly={viewMode === "preview"}
                disabled={busy}
                placeholder="Email subject"
                className="py-2"
              />
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
          {viewMode === "edit" ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setViewMode("preview")}
              >
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setViewMode("code")}
              >
                Code
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={enterEdit}
              >
                Edit
              </Button>
              {viewMode === "preview" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setViewMode("code")}
                >
                  Code
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setViewMode("preview")}
                >
                  Preview
                </Button>
              )}
            </>
          )}
          <Button
            type="button"
            disabled={busy || !canSave}
            onClick={() => void save()}
          >
            {isCompose ? "Insert" : "Save"}
          </Button>
        </div>
      </header>

      {error && (
        <p className="border-error/40 bg-error/10 text-error border-b px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {viewMode === "edit" && (
          <BuilderLeftSidebar
            document={doc}
            selection={selection}
            onSelect={setSelection}
            onAdd={addVariant}
            disabled={busy}
          />
        )}
        {viewMode === "preview" ? (
          <BuilderPreview document={doc} className="flex-1" />
        ) : viewMode === "code" ? (
          <BuilderCodeSplit
            document={doc}
            onApply={(next) => {
              setDoc(next);
              setSelection({ kind: "none" });
            }}
            className="flex-1"
          />
        ) : (
          <BuilderCanvas
            document={doc}
            selectedBlockId={selectedBlockId}
            onSelectBlock={(id) => setSelection(selectBlock(id))}
            onChangeBlock={changeBlock}
            onDuplicateBlock={(id) =>
              setDoc((current) => duplicateBlock(current, id))
            }
            onDeleteBlock={(id) => {
              setDoc((current) => removeBlock(current, id));
              setSelection((current) =>
                selectionBlockId(current) === id ? { kind: "none" } : current,
              );
            }}
            onMoveBlock={(id, direction) =>
              setDoc((current) => moveBlock(current, id, direction))
            }
            onDropAt={handleDropAt}
            onDropInColumn={handleDropInColumn}
            onDropInGridCell={handleDropInGridCell}
            selectedColumnItem={selectedColumnItemCoords}
            onSelectColumnItem={(blockId, itemSelection) => {
              if (!itemSelection) {
                setSelection(selectBlock(blockId));
                return;
              }
              setSelection(selectColumnItem(blockId, itemSelection));
            }}
            selectedColumnIndex={selectedColumnIndex}
            onSelectColumn={(blockId, columnIndex) =>
              setSelection({ kind: "column", blockId, columnIndex })
            }
            selectedGridCell={selectedGridCell}
            onSelectGridCell={(blockId, rowIndex, columnIndex) =>
              setSelection({
                kind: "gridCell",
                blockId,
                rowIndex,
                columnIndex,
              })
            }
            selectedImageTextChild={selectedImageTextChild}
            onSelectImageTextChild={(blockId, child) =>
              setSelection({ kind: "imageTextChild", blockId, child })
            }
            selectedPageBand={selectedPageBand}
            onSelectPageBand={(band) =>
              setSelection(band ? selectPageBand(band) : { kind: "none" })
            }
            onChangePageBand={(role, patch) =>
              setDoc((current) => updatePageBand(current, role, patch))
            }
            onChangeDocument={(patch) =>
              setDoc((current) => ({ ...current, ...patch }))
            }
          />
        )}
        {viewMode === "edit" && (
          <BuilderInspector
            block={selectedPageBand ? null : selectedBlock}
            selectedColumnItem={selectedNestedItem}
            selectedColumnIndex={selectedColumnIndex}
            selectedGridCell={selectedGridCell}
            selectedImageTextChild={selectedImageTextChild}
            selectedPageBand={selectedPageBand}
            pageBand={selectedBand}
            document={doc}
            onChange={(patch) => {
              if (!selectedBlockId) return;
              changeBlock(selectedBlockId, patch);
            }}
            onChangeColumnItem={changeColumnItem}
            onChangeImageTextImage={changeImageTextImage}
            onChangePageBand={changePageBand}
            onRemovePageBand={() => {
              if (!selectedPageBand) return;
              setDoc((current) => removePageBand(current, selectedPageBand));
              setSelection({ kind: "none" });
            }}
            onChangeDocument={(patch) =>
              setDoc((current) => ({ ...current, ...patch }))
            }
          />
        )}
      </div>
    </div>
  );
}
