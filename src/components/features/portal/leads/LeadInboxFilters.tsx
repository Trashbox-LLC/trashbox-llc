"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Select } from "@/components/atoms/Select";
import { Input } from "@/components/ui/input";
import {
  LEAD_STATUSES,
  LEAD_STATUS_DOT_CLASS,
  LEAD_STATUS_LABELS,
  leadTagLabel,
  teamMemberDisplayName,
  type LeadStatus,
  type LeadTag,
  type ProjectForm,
  type TeamMember,
} from "@/lib/api";

export interface LeadInboxFiltersValue {
  q: string;
  status: LeadStatus | "";
  tag: LeadTag | "";
  assignedTo: string;
  formId: string;
}

interface LeadInboxFiltersProps {
  value: LeadInboxFiltersValue;
  members: TeamMember[];
  forms?: ProjectForm[];
  /** Tags used on leads in this project. */
  tags?: string[];
  onChange: (next: LeadInboxFiltersValue) => void;
  onApply: (next?: LeadInboxFiltersValue) => void;
}

const FILTER_FIELDS = [
  { key: "tag", label: "Tag", removeLabel: "Remove tag" },
  {
    key: "assignedTo",
    label: "Assigned to",
    removeLabel: "Remove assigned to",
  },
  { key: "formId", label: "Form", removeLabel: "Remove form" },
  { key: "status", label: "Status", removeLabel: "Remove status" },
] as const;

type FilterField = (typeof FILTER_FIELDS)[number]["key"];

export function LeadInboxFilters({
  value,
  members,
  forms = [],
  tags = [],
  onChange,
  onApply,
}: LeadInboxFiltersProps) {
  const [pinned, setPinned] = useState<FilterField[]>([]);
  const [justAdded, setJustAdded] = useState<FilterField | null>(null);

  function commit(next: LeadInboxFiltersValue) {
    onChange(next);
    onApply(next);
  }

  function add(key: FilterField) {
    setPinned((current) => (current.includes(key) ? current : [...current, key]));
    setJustAdded(key);
  }

  function remove(key: FilterField) {
    setPinned((current) => current.filter((item) => item !== key));
    setJustAdded((current) => (current === key ? null : current));
    commit({ ...value, [key]: "" });
  }

  const visible = FILTER_FIELDS.filter(
    (field) => pinned.includes(field.key) || value[field.key] !== "",
  );
  const available = FILTER_FIELDS.filter(
    (field) => !visible.some((item) => item.key === field.key),
  );

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="flex h-8 min-w-0 rounded-lg border border-white/15 bg-surface-container">
        <Input
          id="lead-search"
          type="search"
          aria-label="Search"
          value={value.q}
          onChange={(event) => onChange({ ...value, q: event.target.value })}
          className="search-clear-muted h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 py-0 placeholder:text-outline focus-visible:border-transparent"
          placeholder="Name, email, or message"
        />
        {available.length > 0 && (
          <AddFilterMenu options={available} onAdd={add} />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 empty:hidden">
        {visible.map((field) => (
          <div
            key={field.key}
            className="inline-flex h-8 max-w-full items-center rounded-lg border border-white/15 bg-surface-container pl-2.5"
          >
            <Select
              id={fieldId(field.key)}
              aria-label={field.label}
              variant="inline"
              initialOpen={justAdded === field.key}
              value={value[field.key]}
              onChange={(next) =>
                commit({ ...value, [field.key]: next })
              }
              options={optionsFor(field.key, members, forms, tags, value)}
            />
            <button
              type="button"
              aria-label={field.removeLabel}
              onClick={() => remove(field.key)}
              className="text-outline hover:text-white inline-flex h-8 items-center px-1.5"
            >
              <MaterialIcon name="close" className="text-base" />
            </button>
          </div>
        ))}
      </div>
    </form>
  );
}

function fieldId(key: FilterField): string {
  if (key === "tag") return "lead-tag";
  if (key === "assignedTo") return "lead-assignee";
  if (key === "formId") return "lead-form";
  return "lead-status";
}

function optionsFor(
  key: FilterField,
  members: TeamMember[],
  forms: ProjectForm[],
  tags: string[],
  value: LeadInboxFiltersValue,
) {
  if (key === "tag") {
    const choices = [...tags];
    if (
      value.tag &&
      !choices.some((tag) => tag.toLowerCase() === value.tag.toLowerCase())
    ) {
      choices.unshift(value.tag);
    }
    return [
      { value: "", label: "All tags" },
      ...choices.map((tag) => ({
        value: tag,
        label: leadTagLabel(tag),
      })),
    ];
  }

  if (key === "assignedTo") {
    return [
      { value: "", label: "Anyone" },
      ...members.map((member) => {
        const label = teamMemberDisplayName(member);
        return {
          value: member.email,
          label:
            label === member.email ? member.email : `${label} (${member.email})`,
        };
      }),
    ];
  }

  if (key === "formId") {
    return [
      { value: "", label: "All forms" },
      ...forms.map((form) => ({
        value: form.formId,
        label: form.active ? form.name : `${form.name} (inactive)`,
      })),
    ];
  }

  return [
    { value: "", label: "All statuses" },
    ...LEAD_STATUSES.map((status) => ({
      value: status,
      label: LEAD_STATUS_LABELS[status],
      indicatorClassName: LEAD_STATUS_DOT_CLASS[status],
    })),
  ];
}

function AddFilterMenu({
  options,
  onAdd,
}: {
  options: (typeof FILTER_FIELDS)[number][];
  onAdd: (key: FilterField) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative flex shrink-0">
      <button
        type="button"
        aria-label="Add filter"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="text-outline hover:bg-white/10 hover:text-white inline-flex h-full items-center gap-1 rounded-r-lg border-l border-white/15 px-2.5 text-sm"
      >
        <MaterialIcon name="add" className="text-base" />
        Filter
      </button>
      {open && (
        <ul
          role="menu"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          ref={(node) => node?.focus()}
          className="absolute top-full right-0 z-50 mt-1.5 max-h-60 w-max overflow-auto rounded-lg border border-white/15 bg-surface-container-high py-1 shadow-lg focus:outline-none"
        >
          {options.map((option) => (
            <li key={option.key}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onAdd(option.key);
                  setOpen(false);
                }}
                className="hover:bg-surface-bright w-full px-3 py-2 text-left text-sm text-white"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
