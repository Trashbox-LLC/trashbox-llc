"use client";

import { Select } from "@/components/atoms/Select";
import { ContactAvatar } from "@/components/features/portal/contacts/ContactAvatar";
import {
  contactSubtitle,
  groupContactsByLetter,
} from "@/components/features/portal/contacts/contact-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  teamMemberDisplayName,
  type Contact,
  type ContactSort,
  type OrgContactMatch,
  type TeamMember,
} from "@/lib/api";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

const labelClass =
  "mb-1 block font-label text-[10px] uppercase tracking-widest text-outline";

export interface ContactsListFilters {
  q: string;
  sort: ContactSort;
  ownerEmail: string;
  tag: string;
}

interface ContactsListProps {
  contacts: Contact[];
  total: number;
  members: TeamMember[];
  tags: string[];
  filters: ContactsListFilters;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  error?: string | null;
  /** Null until an org-wide search has run. */
  orgMatches?: OrgContactMatch[] | null;
  orgSearchBusy?: boolean;
  canSearchOrg?: boolean;
  onFiltersChange: (next: ContactsListFilters) => void;
  onApply: () => void;
  onSelect: (contactId: string) => void;
  onNew: () => void;
  onLoadMore: () => void;
  onSearchOrg: () => void;
  onClearOrgSearch: () => void;
}

export function ContactsList({
  contacts,
  total,
  members,
  tags,
  filters,
  loading = false,
  loadingMore = false,
  hasMore = false,
  error = null,
  orgMatches = null,
  orgSearchBusy = false,
  canSearchOrg = false,
  onFiltersChange,
  onApply,
  onSelect,
  onNew,
  onLoadMore,
  onSearchOrg,
  onClearOrgSearch,
}: ContactsListProps) {
  const groups =
    filters.sort === "name" ? groupContactsByLetter(contacts) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="font-label text-outline text-[10px] tracking-widest uppercase">
          {total} {total === 1 ? "contact" : "contacts"}
        </p>
        <Button
          type="button"
          onClick={onNew}
          className="rounded bg-white font-label font-medium text-background shadow-sm hover:bg-white/90 hover:text-background"
        >
          New contact
        </Button>
      </div>

      <form
        className="grid grid-cols-1 gap-4 rounded bg-surface-container-low p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          onApply();
        }}
      >
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="contact-search">
            Search
          </label>
          <Input
            id="contact-search"
            type="search"
            value={filters.q}
            onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
            className="search-clear-muted py-2 placeholder:text-outline"
            placeholder="Name, email, phone, or company"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="contact-owner">
            Owner
          </label>
          <Select
            id="contact-owner"
            value={filters.ownerEmail}
            onChange={(ownerEmail) =>
              onFiltersChange({ ...filters, ownerEmail })
            }
            options={[
              { value: "", label: "Anyone" },
              ...members.map((member) => {
                const label = teamMemberDisplayName(member);
                return {
                  value: member.email,
                  label,
                  menuLabel:
                    label === member.email
                      ? member.email
                      : `${label} (${member.email})`,
                };
              }),
            ]}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="contact-tag">
            Tag
          </label>
          <Select
            id="contact-tag"
            value={filters.tag}
            onChange={(tag) => onFiltersChange({ ...filters, tag })}
            options={[
              { value: "", label: "All tags" },
              ...tags.map((tag) => ({ value: tag, label: tag })),
            ]}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="contact-sort">
            Sort
          </label>
          <Select
            id="contact-sort"
            value={filters.sort}
            onChange={(sort) =>
              onFiltersChange({ ...filters, sort: sort as ContactSort })
            }
            options={[
              { value: "name", label: "Name" },
              { value: "recent", label: "Recent activity" },
              { value: "created", label: "Newest" },
            ]}
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <Button
            type="submit"
            variant="secondary"
            className="rounded bg-white font-label font-medium text-background shadow-sm hover:bg-white/90 hover:text-background"
          >
            Apply
          </Button>
          {canSearchOrg && (
            <Button
              type="button"
              variant="ghost"
              disabled={!filters.q.trim() || orgSearchBusy}
              onClick={onSearchOrg}
              className="text-on-surface-variant rounded font-label font-medium hover:text-white"
            >
              {orgSearchBusy ? "Searching…" : "Search all projects"}
            </Button>
          )}
        </div>
      </form>

      {error && (
        <p className="border-error/40 bg-error/10 text-error rounded border p-3 text-sm">
          {error}
        </p>
      )}

      {orgMatches && (
        <section className="rounded bg-surface-container-low p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-label text-outline text-[10px] tracking-widest uppercase">
              Across the organization · {orgMatches.length}
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={onClearOrgSearch}
              className="text-outline h-auto rounded p-1 font-label text-[10px] tracking-widest uppercase hover:text-white"
            >
              Clear
            </Button>
          </div>
          {orgMatches.length === 0 ? (
            <p className="text-on-surface-variant text-sm">
              No matches in your other projects.
            </p>
          ) : (
            <ul className="divide-outline-variant/20 divide-y">
              {orgMatches.map((match) => (
                <li
                  key={`${match.projectId}:${match.contact.contactId}`}
                  className="flex items-center gap-3 py-3"
                >
                  <ContactAvatar displayName={match.contact.displayName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {match.contact.displayName}
                    </p>
                    <p className="text-outline truncate text-xs">
                      {match.projectName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {loading ? (
        <p className="text-on-surface-variant text-sm">Loading contacts…</p>
      ) : contacts.length === 0 ? (
        <div className="rounded bg-surface-container-low p-8 text-center shadow-sm">
          <p className="text-on-surface-variant text-sm">
            {filters.q || filters.tag || filters.ownerEmail
              ? "No contacts match those filters."
              : "No contacts yet."}
          </p>
        </div>
      ) : groups ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.letter}>
              <p
                data-testid="contact-group-letter"
                className="font-label text-outline mb-2 text-[10px] tracking-widest uppercase"
              >
                {group.letter}
              </p>
              <ContactRows contacts={group.contacts} onSelect={onSelect} />
            </section>
          ))}
        </div>
      ) : (
        <ContactRows contacts={contacts} onSelect={onSelect} />
      )}

      {hasMore && (
        <Button
          type="button"
          variant="secondary"
          disabled={loadingMore}
          onClick={onLoadMore}
          className="w-full rounded bg-surface-container-low font-label font-medium shadow-sm"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}

function ContactRows({
  contacts,
  onSelect,
}: {
  contacts: Contact[];
  onSelect: (contactId: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {contacts.map((contact) => {
        const subtitle = contactSubtitle(contact);
        const phone = contact.phones[0];
        return (
          <li key={contact.contactId}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onSelect(contact.contactId)}
              className={cn(
                "h-auto w-full items-center justify-start gap-3 rounded bg-surface-container-low p-4 text-left font-normal tracking-normal whitespace-normal text-inherit normal-case shadow-sm",
                "hover:bg-surface-container-high",
              )}
            >
              <ContactAvatar displayName={contact.displayName} />
              <span className="min-w-0 flex-1">
                <span className="font-headline block truncate text-sm font-bold text-white">
                  {contact.displayName}
                </span>
                {subtitle && (
                  <span className="text-outline block truncate text-xs">
                    {subtitle}
                  </span>
                )}
              </span>
              {contact.tags.length > 0 && (
                <span className="hidden shrink-0 gap-1 sm:flex">
                  {contact.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-container-highest text-on-surface-variant font-label rounded-full px-2 py-0.5 text-[10px] tracking-widest uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              )}
              {phone && (
                <span className="text-on-surface-variant hidden shrink-0 text-xs tabular-nums md:block">
                  {formatPhoneDisplay(phone)}
                </span>
              )}
              {contact.leadCount > 0 && (
                <span className="text-on-surface shrink-0 text-sm font-semibold tabular-nums">
                  {contact.leadCount}
                </span>
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
