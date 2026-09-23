"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FadeIn } from "@/components/atoms/FadeIn";
import { ContactDetail } from "@/components/features/portal/contacts/ContactDetail";
import { ContactForm } from "@/components/features/portal/contacts/ContactForm";
import {
  contactFormToInput,
  contactToForm,
  emptyContactForm,
  type ContactFormValues,
} from "@/components/features/portal/contacts/contact-display";
import {
  ContactsList,
  type ContactsListFilters,
} from "@/components/features/portal/contacts/ContactsList";
import {
  addContactNote,
  ApiError,
  createContact,
  deleteContact,
  getContact,
  listContacts,
  searchOrgContacts,
  sendContactMessage,
  updateContact,
  type Contact,
  type ContactDetailResponse,
  type MessageChannel,
  type OrgContactMatch,
} from "@/lib/api";
import { usePortal } from "@/lib/portal";
import { portalNavigate, portalWorkspacePath } from "@/lib/portal-routes";
import type { SettingsSectionId } from "@/lib/portal-settings";

const PAGE_SIZE = 50;

const emptyFilters: ContactsListFilters = {
  q: "",
  sort: "name",
  ownerEmail: "",
  tag: "",
};

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** Tagged with the contact it belongs to so a stale fetch never renders. */
interface DetailState {
  contactId: string;
  data?: ContactDetailResponse;
  error?: string;
}

export interface ContactsPageInitialState {
  contacts?: Contact[];
  total?: number;
  detail?: ContactDetailResponse;
}

interface ContactsPageProps {
  orgSlug: string;
  projectSlug: string;
  /** Present on a contact detail route. */
  contactId?: string;
  /** Storybook/tests: seed without hitting the API. */
  initialState?: ContactsPageInitialState;
}

export function ContactsPage({
  orgSlug,
  projectSlug,
  contactId,
  initialState,
}: ContactsPageProps) {
  const portal = usePortal();
  const [contacts, setContacts] = useState<Contact[]>(
    initialState?.contacts ?? [],
  );
  const [total, setTotal] = useState(
    initialState?.total ?? initialState?.contacts?.length ?? 0,
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<ContactsListFilters>(emptyFilters);
  const [applied, setApplied] = useState<ContactsListFilters>(emptyFilters);
  const [loading, setLoading] = useState(!initialState);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [orgMatches, setOrgMatches] = useState<OrgContactMatch[] | null>(null);
  const [orgSearchBusy, setOrgSearchBusy] = useState(false);

  const [detailState, setDetailState] = useState<DetailState | null>(
    initialState?.detail
      ? {
          contactId: initialState.detail.contact.contactId,
          data: initialState.detail,
        }
      : null,
  );
  const [detailBusy, setDetailBusy] = useState(false);

  const [mode, setMode] = useState<"view" | "new" | "edit">("view");
  const [form, setForm] = useState<ContactFormValues>(emptyContactForm());
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const detail = detailState?.contactId === contactId ? detailState : null;

  const listPath = portalWorkspacePath({
    orgSlug,
    projectSlug,
    surface: "contacts",
  });

  const tags = useMemo(() => {
    const seen = new Set<string>();
    for (const contact of contacts) {
      for (const tag of contact.tags) seen.add(tag);
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  useEffect(() => {
    if (initialState || contactId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setListError(null);
      try {
        const res = await listContacts({
          q: applied.q || undefined,
          tag: applied.tag || undefined,
          ownerEmail: applied.ownerEmail || undefined,
          sort: applied.sort,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setContacts(res.items);
        setTotal(res.total);
        setCursor(res.nextCursor);
      } catch (err) {
        if (!cancelled) setListError(messageOf(err, "Failed to load contacts"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialState, contactId, applied]);

  useEffect(() => {
    if (!contactId || detailState?.contactId === contactId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await getContact(contactId);
        if (!cancelled) setDetailState({ contactId, data: res });
      } catch (err) {
        if (!cancelled) {
          setDetailState({
            contactId,
            error: messageOf(err, "Contact not found"),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactId, detailState?.contactId]);

  const onLoadMore = useCallback(async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await listContacts({
        q: applied.q || undefined,
        tag: applied.tag || undefined,
        ownerEmail: applied.ownerEmail || undefined,
        sort: applied.sort,
        limit: PAGE_SIZE,
        cursor,
      });
      setContacts((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    } catch (err) {
      setListError(messageOf(err, "Failed to load more contacts"));
    } finally {
      setLoadingMore(false);
    }
  }, [applied, cursor]);

  const onSearchOrg = useCallback(async () => {
    const q = filters.q.trim();
    if (!q) return;
    setOrgSearchBusy(true);
    try {
      const res = await searchOrgContacts(q);
      setOrgMatches(res.items);
    } catch (err) {
      setListError(messageOf(err, "Organization search failed"));
    } finally {
      setOrgSearchBusy(false);
    }
  }, [filters.q]);

  const onCreate = useCallback(async () => {
    setFormBusy(true);
    setFormError(null);
    try {
      const res = await createContact(contactFormToInput(form));
      setMode("view");
      setForm(emptyContactForm());
      setDetailState({
        contactId: res.contact.contactId,
        data: { contact: res.contact, leads: [] },
      });
      portalNavigate(
        portalWorkspacePath({
          orgSlug,
          projectSlug,
          surface: "contacts",
          contactId: res.contact.contactId,
        }),
      );
    } catch (err) {
      setFormError(messageOf(err, "Failed to save the contact"));
    } finally {
      setFormBusy(false);
    }
  }, [form, orgSlug, projectSlug]);

  const patchDetail = useCallback((contact: Contact) => {
    setDetailState((prev) =>
      prev?.data
        ? { ...prev, data: { ...prev.data, contact }, error: undefined }
        : prev,
    );
  }, []);

  const failDetail = useCallback((contactKey: string, message: string) => {
    setDetailState((prev) =>
      prev?.contactId === contactKey ? { ...prev, error: message } : prev,
    );
  }, []);

  const onSaveEdit = useCallback(async () => {
    if (!detail?.data) return;
    const id = detail.data.contact.contactId;
    setFormBusy(true);
    setFormError(null);
    try {
      const res = await updateContact(id, contactFormToInput(form));
      patchDetail(res.contact);
      setMode("view");
    } catch (err) {
      setFormError(messageOf(err, "Failed to save the contact"));
    } finally {
      setFormBusy(false);
    }
  }, [detail, form, patchDetail]);

  const onOwnerChange = useCallback(
    async (ownerEmail: string | null) => {
      if (!detail?.data) return;
      const id = detail.data.contact.contactId;
      setDetailBusy(true);
      try {
        const res = await updateContact(id, { ownerEmail });
        patchDetail(res.contact);
      } catch (err) {
        failDetail(id, messageOf(err, "Failed to change the owner"));
      } finally {
        setDetailBusy(false);
      }
    },
    [detail, patchDetail, failDetail],
  );

  const onAddNote = useCallback(
    async (body: string) => {
      if (!detail?.data) return;
      const id = detail.data.contact.contactId;
      setDetailBusy(true);
      try {
        const res = await addContactNote(id, body);
        patchDetail(res.contact);
      } catch (err) {
        failDetail(id, messageOf(err, "Failed to save the note"));
        throw err;
      } finally {
        setDetailBusy(false);
      }
    },
    [detail, patchDetail, failDetail],
  );

  const onSendMessage = useCallback(
    async (input: {
      channel: MessageChannel;
      body: string;
      subject?: string;
    }) => {
      if (!detail?.data) return;
      const id = detail.data.contact.contactId;
      setDetailBusy(true);
      try {
        await sendContactMessage(id, input);
        // Sending can open the contact's first thread, so re-read the leads.
        const fresh = await getContact(id);
        setDetailState({ contactId: id, data: fresh });
      } catch (err) {
        failDetail(id, messageOf(err, "Failed to send the message"));
        throw err;
      } finally {
        setDetailBusy(false);
      }
    },
    [detail, failDetail],
  );

  const onDelete = useCallback(async () => {
    if (!detail?.data) return;
    const id = detail.data.contact.contactId;
    setDetailBusy(true);
    try {
      await deleteContact(id);
      setDetailState(null);
      portalNavigate(listPath);
    } catch (err) {
      failDetail(id, messageOf(err, "Failed to delete the contact"));
    } finally {
      setDetailBusy(false);
    }
  }, [detail, listPath, failDetail]);

  const openLead = useCallback(
    (submissionId: string) => {
      portal.setSelectedId(submissionId);
      portalNavigate(
        portalWorkspacePath({ orgSlug, projectSlug, surface: "inbox" }),
      );
    },
    [orgSlug, projectSlug, portal],
  );

  const openSettings = useCallback(
    (section: SettingsSectionId) => {
      portalNavigate(
        portalWorkspacePath({
          orgSlug,
          projectSlug,
          surface: "settings",
          settingsRest: section,
        }),
      );
    },
    [orgSlug, projectSlug],
  );

  if (mode === "new") {
    return (
      <FadeIn className="space-y-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
          New contact
        </h1>
        <ContactForm
          values={form}
          members={portal.members}
          busy={formBusy}
          error={formError}
          submitLabel="Create contact"
          onChange={setForm}
          onSubmit={() => void onCreate()}
          onCancel={() => {
            setMode("view");
            setFormError(null);
          }}
        />
      </FadeIn>
    );
  }

  if (contactId) {
    if (!detail) {
      return (
        <p className="text-on-surface-variant text-sm">Loading contact…</p>
      );
    }
    if (!detail.data) {
      return (
        <div className="space-y-6">
          <p className="border-error/40 bg-error/10 text-error rounded border p-3 text-sm">
            {detail.error}
          </p>
          <button
            type="button"
            onClick={() => portalNavigate(listPath)}
            className="font-label text-outline text-[10px] tracking-widest uppercase hover:text-white"
          >
            All contacts
          </button>
        </div>
      );
    }
    if (mode === "edit") {
      return (
        <FadeIn className="space-y-8">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
            {detail.data.contact.displayName}
          </h1>
          <ContactForm
            values={form}
            members={portal.members}
            busy={formBusy}
            error={formError}
            submitLabel="Save changes"
            onChange={setForm}
            onSubmit={() => void onSaveEdit()}
            onCancel={() => {
              setMode("view");
              setFormError(null);
            }}
          />
        </FadeIn>
      );
    }
    const loaded = detail.data;
    return (
      <FadeIn>
        <ContactDetail
          contact={loaded.contact}
          leads={loaded.leads}
          members={portal.members}
          busy={detailBusy}
          error={detail.error ?? null}
          canDelete={portal.hasPermission("delete_contacts")}
          availableChannels={loaded.availableChannels}
          smsFromPhone={portal.sms?.phoneNumber ?? null}
          smsOptedOut={loaded.smsOptedOut}
          onSendMessage={onSendMessage}
          onConfigureSms={() => openSettings("text-messaging")}
          onConfigureEmail={
            portal.isOwner ? () => openSettings("email-accounts") : undefined
          }
          onEdit={() => {
            setForm(contactToForm(loaded.contact));
            setFormError(null);
            setMode("edit");
          }}
          onBack={() => portalNavigate(listPath)}
          onOwnerChange={(ownerEmail) => void onOwnerChange(ownerEmail)}
          onAddNote={onAddNote}
          onDelete={() => void onDelete()}
          onOpenLead={openLead}
        />
      </FadeIn>
    );
  }

  return (
    <FadeIn className="space-y-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight text-white md:text-4xl">
        Contacts.
      </h1>
      <ContactsList
        contacts={contacts}
        total={total}
        members={portal.members}
        tags={tags}
        filters={filters}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={Boolean(cursor)}
        error={listError}
        orgMatches={orgMatches}
        orgSearchBusy={orgSearchBusy}
        canSearchOrg={portal.orgs.some((org) => org.projects.length > 1)}
        onFiltersChange={setFilters}
        onApply={() => setApplied(filters)}
        onSelect={(id) =>
          portalNavigate(
            portalWorkspacePath({
              orgSlug,
              projectSlug,
              surface: "contacts",
              contactId: id,
            }),
          )
        }
        onNew={() => {
          setForm(emptyContactForm());
          setFormError(null);
          setMode("new");
        }}
        onLoadMore={() => void onLoadMore()}
        onSearchOrg={() => void onSearchOrg()}
        onClearOrgSearch={() => setOrgMatches(null)}
      />
    </FadeIn>
  );
}
