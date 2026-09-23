"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LeadInboxFiltersValue } from "@/components/features/portal/leads/LeadInboxFilters";
import { applyContactPhoneToLeads } from "@/lib/lead-messages";
import { labeledContactPhones, type ContactPhone } from "@/lib/phone-labels";
import { toast } from "@/components/ui/sonner";
import {
  ApiError,
  acceptTeamInvite,
  addSubmissionNote,
  collectLeadTags,
  deleteSubmissionNote,
  connectMailbox,
  createOrganization,
  createProject,
  disconnectMailbox,
  getAccount,
  getContact,
  getAccountProfile,
  getMailbox,
  getSmsStatus,
  getTeam,
  leadStatusOf,
  listForms,
  listLeadMessages,
  listProjectTags,
  listOrgs,
  listSubmissions,
  openBillingPortal,
  sendLeadMessage,
  startCheckout,
  syncMailbox,
  updateMailboxSettings,
  updateSubmission,
  type AccountResponse,
  type ClientRole,
  type LeadMessage,
  type LeadStatus,
  type LeadTag,
  type MailboxProvider,
  type MailboxStatusResponse,
  type MessageChannel,
  type OrgSummary,
  type PatchMailboxInput,
  type Permission,
  type ProjectForm,
  type SmsStatusResponse,
  type Submission,
  teamMemberWithAccountName,
  type TeamMember,
  type TeamRole,
  type UserProfile,
  hasPermission as permissionsInclude,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  isPortalProductPath,
  portalOrgGateRedirect,
} from "@/lib/portal-org-gate";
import { portalSignedOutRedirect } from "@/lib/portal-redirects";
import {
  portalNavigate,
  portalWorkspacePath,
  subscribePortalNavigate,
} from "@/lib/portal-routes";
import {
  getSelectedOrgId,
  getSelectedOrgName,
  getSelectedProjectId,
  setSelectedWorkspace,
} from "@/lib/portal-selection";

export type PortalTab = "inbox" | "membership";

/** One-time issued key for Settings → API Keys after provision. */
export const PORTAL_ISSUED_API_KEY_STORAGE = "portalIssuedApiKey";

const emptyFilters: LeadInboxFiltersValue = {
  q: "",
  status: "",
  tag: "",
  assignedTo: "",
  formId: "",
};

/** Deep-link filters from `?formId=` (kept in the URL for shareable inbox links). */
function filtersFromFormIdSearch(search: string): LeadInboxFiltersValue | null {
  const formId = new URLSearchParams(search).get("formId")?.trim();
  if (!formId) return null;
  return { ...emptyFilters, formId };
}

function filtersFromWindowFormId(): LeadInboxFiltersValue | null {
  if (typeof window === "undefined") return null;
  return filtersFromFormIdSearch(window.location.search);
}

/** Fill reply counts for inbox stacks without requiring each lead to be opened. */
async function fetchMessageCounts(
  items: Submission[],
): Promise<Map<string, number>> {
  const entries = await Promise.all(
    items.map(async (item) => {
      try {
        const res = await listLeadMessages(item.submissionId);
        return [item.submissionId, res.items.length] as const;
      } catch {
        return [item.submissionId, item.messageCount ?? 0] as const;
      }
    }),
  );
  return new Map(entries);
}

function mergeMessageCounts(
  items: Submission[],
  counts: Map<string, number>,
): Submission[] {
  return items.map((item) => {
    const messageCount = counts.get(item.submissionId);
    if (
      messageCount === undefined ||
      messageCount === (item.messageCount ?? 0)
    ) {
      return item;
    }
    return { ...item, messageCount };
  });
}

function redirect(path: string) {
  window.location.assign(path);
}

export interface PortalContextValue {
  ready: boolean;
  items: Submission[];
  clientName: string | null;
  account: AccountResponse | null;
  orgs: OrgSummary[];
  nextCursor: string | undefined;
  listError: string | null;
  listBusy: boolean;
  crmBusy: boolean;
  billingBusy: boolean;
  billingError: string | null;
  businessName: string;
  setBusinessName: (value: string) => void;
  projectNameDraft: string;
  setProjectNameDraft: (value: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selected: Submission | null;
  filters: LeadInboxFiltersValue;
  setFilters: (value: LeadInboxFiltersValue) => void;
  applyFilters: (next?: LeadInboxFiltersValue) => void;
  members: TeamMember[];
  forms: ProjectForm[];
  /** Project tag catalog, including tags not yet on a loaded lead. */
  leadTags: string[];
  setLeadTags: (tags: string[]) => void;
  /** Palette id for each catalog tag. */
  leadTagColors: Record<string, string>;
  setLeadTagColors: (colors: Record<string, string>) => void;
  /** Rename or drop a tag on leads already loaded in the inbox. */
  rewriteLeadTag: (from: string, to: string | null) => void;
  /** Copy a contact's current phone onto their open conversations. */
  applyContactPhone: (contactId: string, phone: string | null) => void;
  /** Phones on the contact linked to the open lead. */
  contactPhones: ContactPhone[];
  teamRole: TeamRole;
  permissions: Permission[];
  roles: ClientRole[];
  isOwner: boolean;
  hasPermission: (permission: Permission) => boolean;
  mailbox: MailboxStatusResponse | null;
  mailboxBusy: boolean;
  mailboxError: string | null;
  /** Cached message threads keyed by submission id (survives tab switches). */
  messagesById: Record<string, LeadMessage[]>;
  /** Messages for the currently selected lead (convenience over messagesById). */
  leadMessages: LeadMessage[];
  messageError: string | null;
  /** Sendable channels per submission, as reported by the messages endpoint. */
  channelsById: Record<string, MessageChannel[]>;
  /** Project text messaging status; null until loaded or when unavailable. */
  sms: SmsStatusResponse | null;
  refreshSms: () => Promise<void>;
  loadMore: () => Promise<void>;
  onLeadUpdate: (
    patch: {
      status?: LeadStatus;
      tags?: LeadTag[];
      assignedTo?: string | null;
    },
    /** Defaults to the currently selected lead when omitted. */
    submissionId?: string,
  ) => Promise<void>;
  onLeadNote: (body: string) => Promise<void>;
  onLeadDeleteNote: (noteId: string) => Promise<void>;
  onSendLeadMessage: (
    body: string,
    bodyHtml?: string,
    from?: { fromIdentityId?: string },
  ) => Promise<void>;
  onSendLeadSms: (body: string) => Promise<void>;
  onMailboxConnect: (provider: MailboxProvider) => Promise<void>;
  onMailboxDisconnect: () => Promise<void>;
  onMailboxSync: () => Promise<void>;
  onMailboxPatch: (input: PatchMailboxInput) => Promise<void>;
  /** @deprecated Prefer onCreateOrganization */
  onProvisionAccount: () => Promise<void>;
  onCreateOrganization: () => Promise<void>;
  onCreateProject: (orgId: string) => Promise<void>;
  selectWorkspace: (orgId: string, projectId: string) => void;
  /** Reload account/orgs (e.g. after renaming an organization). */
  refreshWorkspace: () => void;
  onUpgrade: (plan: "solo" | "team") => Promise<void>;
  onManageBilling: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

const portalNoop = async () => {};

/** Side-effect-free portal context for Storybook/Chromatic (no login redirects). */
export function StubPortalProvider({
  value,
  children,
}: {
  value?: Partial<PortalContextValue>;
  children: ReactNode;
}) {
  const merged: PortalContextValue = {
    ready: false,
    items: [],
    clientName: null,
    account: null,
    orgs: [],
    nextCursor: undefined,
    listError: null,
    listBusy: false,
    crmBusy: false,
    billingBusy: false,
    billingError: null,
    businessName: "",
    setBusinessName: () => {},
    projectNameDraft: "",
    setProjectNameDraft: () => {},
    selectedId: null,
    setSelectedId: () => {},
    selected: null,
    filters: emptyFilters,
    setFilters: () => {},
    applyFilters: () => {},
    members: [],
    forms: [],
    leadTags: [],
    setLeadTags: () => {},
    leadTagColors: {},
    setLeadTagColors: () => {},
    rewriteLeadTag: () => {},
    applyContactPhone: () => {},
    contactPhones: [],
    teamRole: "member",
    permissions: [],
    roles: [],
    isOwner: false,
    hasPermission: () => false,
    mailbox: null,
    mailboxBusy: false,
    mailboxError: null,
    messagesById: {},
    leadMessages: [],
    messageError: null,
    channelsById: {},
    sms: null,
    refreshSms: portalNoop,
    loadMore: portalNoop,
    onLeadUpdate: portalNoop,
    onLeadNote: portalNoop,
    onLeadDeleteNote: portalNoop,
    onSendLeadMessage: portalNoop,
    onSendLeadSms: portalNoop,
    onMailboxConnect: portalNoop,
    onMailboxDisconnect: portalNoop,
    onMailboxSync: portalNoop,
    onMailboxPatch: portalNoop,
    onProvisionAccount: portalNoop,
    onCreateOrganization: portalNoop,
    onCreateProject: portalNoop,
    selectWorkspace: () => {},
    refreshWorkspace: () => {},
    onUpgrade: portalNoop,
    onManageBilling: portalNoop,
    ...value,
  };
  return (
    <PortalContext.Provider value={merged}>{children}</PortalContext.Provider>
  );
}

export type PortalProviderProps = {
  children: ReactNode;
  /** Skip login redirect (Storybook/Chromatic — avoid destroying the capture iframe). */
  disableAuthRedirect?: boolean;
};

export function PortalProvider({
  children,
  disableAuthRedirect = false,
}: PortalProviderProps) {
  const auth = useAuth();
  const [items, setItems] = useState<Submission[]>([]);
  const [clientName, setClientName] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [listError, setListError] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(false);
  const [crmBusy, setCrmBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [workspaceEpoch, setWorkspaceEpoch] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [filters, setFilters] = useState<LeadInboxFiltersValue>(
    () => filtersFromWindowFormId() ?? emptyFilters,
  );
  const [appliedFilters, setAppliedFilters] = useState<LeadInboxFiltersValue>(
    () => filtersFromWindowFormId() ?? emptyFilters,
  );
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [accountProfile, setAccountProfile] = useState<UserProfile | null>(
    null,
  );
  const [forms, setForms] = useState<ProjectForm[]>([]);
  const [leadTags, setLeadTags] = useState<string[]>([]);
  const [leadTagColors, setLeadTagColors] = useState<Record<string, string>>(
    {},
  );
  const [teamRole, setTeamRole] = useState<TeamRole>("member");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<ClientRole[]>([]);
  const [mailbox, setMailbox] = useState<MailboxStatusResponse | null>(null);
  const [mailboxBusy, setMailboxBusy] = useState(false);
  const [mailboxError, setMailboxError] = useState<string | null>(null);
  const [messagesById, setMessagesById] = useState<
    Record<string, LeadMessage[]>
  >({});
  const [messageError, setMessageError] = useState<string | null>(null);
  const [channelsById, setChannelsById] = useState<
    Record<string, MessageChannel[]>
  >({});
  const [contactPhones, setContactPhones] = useState<ContactPhone[]>([]);
  const [sms, setSms] = useState<SmsStatusResponse | null>(null);
  const [portalPath, setPortalPath] = useState(() =>
    typeof window === "undefined" ? "" : window.location.pathname,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    const mailboxParam = params.get("mailbox");
    const mailboxMessage = params.get("message");

    if (billing === "success") {
      toast.success(
        "Billing updated. Plan status refreshes after Stripe confirms payment.",
      );
    } else if (billing === "cancel") {
      toast.message("Checkout canceled. Your plan was not changed.");
    }

    if (mailboxParam === "connected") {
      toast.success("Mailbox connected successfully.");
    } else if (mailboxParam === "error") {
      setMailboxError(
        mailboxMessage || "Mailbox connection failed. Try again.",
      );
    }

    // Flash params only — keep `formId` so inbox deep links survive Strict Mode
    // remounts and stay shareable.
    if (billing || mailboxParam) {
      params.delete("billing");
      params.delete("mailbox");
      params.delete("message");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  useEffect(() => {
    function syncPathAndFormId() {
      setPortalPath(window.location.pathname);
      const nextFilters = filtersFromWindowFormId();
      if (!nextFilters) return;
      setFilters(nextFilters);
      setAppliedFilters(nextFilters);
    }

    syncPathAndFormId();
    return subscribePortalNavigate(syncPathAndFormId);
  }, []);

  useEffect(() => {
    if (auth.status === "signedOut") {
      const invite = new URLSearchParams(window.location.search).get("invite");
      if (invite) {
        sessionStorage.setItem("portalInviteToken", invite);
      }
      if (!disableAuthRedirect) {
        const target = portalSignedOutRedirect(window.location.pathname);
        if (target) redirect(target);
      }
      return;
    }
    if (auth.status !== "signedIn") {
      setItems([]);
      setClientName(null);
      setAccount(null);
      setNextCursor(undefined);
      setListError(null);
      setBillingError(null);
      setSelectedId(null);
      setMembers([]);
      setAccountProfile(null);
      setForms([]);
      setLeadTags([]);
      setLeadTagColors({});
      setPermissions([]);
      setRoles([]);
      setMessagesById({});
      setReady(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setListBusy(true);
      setListError(null);
      try {
        const params = new URLSearchParams(window.location.search);
        const inviteToken =
          params.get("invite") || sessionStorage.getItem("portalInviteToken");
        if (inviteToken) {
          sessionStorage.removeItem("portalInviteToken");
          try {
            const accepted = await acceptTeamInvite(inviteToken);
            if (!cancelled && accepted.success) {
              sessionStorage.setItem(
                "portalTeamNotice",
                accepted.clientName
                  ? `Joined ${accepted.clientName}.`
                  : "Invite accepted.",
              );
            }
          } catch (err) {
            if (!cancelled) {
              sessionStorage.setItem(
                "portalTeamNotice",
                err instanceof ApiError
                  ? err.message
                  : "Could not accept invite",
              );
            }
          } finally {
            params.delete("invite");
            const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
            window.history.replaceState({}, "", next);
          }
        }

        const [orgList, acct] = await Promise.all([
          listOrgs().catch(() => ({ orgs: [] as OrgSummary[] })),
          getAccount(),
        ]);
        if (cancelled) return;

        setOrgs(orgList.orgs);
        const selectedOrg = orgList.orgs.find(
          (entry) => entry.orgId === getSelectedOrgId(),
        );
        if (selectedOrg?.orgName) {
          setSelectedWorkspace(
            selectedOrg.orgId,
            getSelectedProjectId(),
            selectedOrg.orgName,
          );
        }

        setAccount(acct);
        const projectLabel = acct.projectName || acct.clientName || null;
        setClientName(projectLabel);
        if (acct.role) setTeamRole(acct.role);
        setReady(true);

        if (!acct.linked) {
          setItems([]);
          setClientName(null);
          setNextCursor(undefined);
          setMembers([]);
          setForms([]);
          setLeadTags([]);
          setLeadTagColors({});
          setPermissions([]);
          setRoles([]);
          setMailbox({ connected: false });
          return;
        }

        if (!isPortalProductPath(portalPath)) {
          return;
        }

        const submissionQuery = {
          limit: 50,
          ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
          ...(appliedFilters.tag ? { tag: appliedFilters.tag } : {}),
          ...(appliedFilters.assignedTo
            ? { assignedTo: appliedFilters.assignedTo }
            : {}),
          ...(appliedFilters.formId ? { formId: appliedFilters.formId } : {}),
          ...(appliedFilters.q.trim() ? { q: appliedFilters.q.trim() } : {}),
        };

        await Promise.all([
          getTeam()
            .then((team) => {
              if (cancelled) return;
              setMembers(team.members);
              setTeamRole(team.role);
              setPermissions(team.permissions ?? []);
              setRoles(team.roles ?? []);
            })
            .catch(() => {
              if (cancelled) return;
              setMembers([]);
              setPermissions([]);
              setRoles([]);
            }),
          getAccountProfile()
            .then((profile) => {
              if (!cancelled) setAccountProfile(profile.profile);
            })
            .catch(() => {
              if (!cancelled) setAccountProfile(null);
            }),
          listForms()
            .then((formList) => {
              if (!cancelled) setForms(formList.forms);
            })
            .catch(() => {
              if (!cancelled) setForms([]);
            }),
          listProjectTags()
            .then((catalog) => {
              if (cancelled) return;
              setLeadTags(catalog.tags);
              setLeadTagColors(catalog.colors ?? {});
            })
            .catch(() => {
              if (cancelled) return;
              setLeadTags([]);
              setLeadTagColors({});
            }),
          getMailbox()
            .then((box) => {
              if (!cancelled) setMailbox(box);
            })
            .catch(() => {
              if (!cancelled) setMailbox({ connected: false });
            }),
          getSmsStatus()
            .then((smsStatus) => {
              if (!cancelled) setSms(smsStatus);
            })
            .catch(() => {
              if (!cancelled) setSms(null);
            }),
          listSubmissions(submissionQuery)
            .then((subs) => {
              if (cancelled) return;
              setItems(subs.items);
              setNextCursor(subs.nextCursor);
              setSelectedId(subs.items[0]?.submissionId ?? null);
              void fetchMessageCounts(subs.items).then((counts) => {
                if (!cancelled) {
                  setItems((prev) => mergeMessageCounts(prev, counts));
                }
              });
            })
            .catch((err: unknown) => {
              if (cancelled) return;
              if (err instanceof ApiError && err.status === 403) {
                setItems([]);
                setListError(null);
              } else {
                setListError(
                  err instanceof ApiError
                    ? err.message
                    : "Failed to load submissions",
                );
              }
            }),
        ]);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.message : "Failed to load account";
        setListError(message);
      } finally {
        if (!cancelled) {
          setListBusy(false);
          setReady(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    auth.status,
    appliedFilters,
    disableAuthRedirect,
    workspaceEpoch,
    portalPath,
  ]);

  useEffect(() => {
    if (disableAuthRedirect) return;
    if (auth.status !== "signedIn" || !ready) return;
    const hasSelectedOrg = Boolean(getSelectedOrgId());
    const orgGate = portalOrgGateRedirect(
      window.location.pathname,
      hasSelectedOrg,
    );
    if (orgGate) redirect(orgGate);
  }, [auth.status, ready, disableAuthRedirect, workspaceEpoch]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    setListBusy(true);
    setListError(null);
    try {
      const data = await listSubmissions({
        limit: 50,
        cursor: nextCursor,
        ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
        ...(appliedFilters.tag ? { tag: appliedFilters.tag } : {}),
        ...(appliedFilters.assignedTo
          ? { assignedTo: appliedFilters.assignedTo }
          : {}),
        ...(appliedFilters.formId ? { formId: appliedFilters.formId } : {}),
        ...(appliedFilters.q.trim() ? { q: appliedFilters.q.trim() } : {}),
      });
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
      const counts = await fetchMessageCounts(data.items);
      setItems((prev) => mergeMessageCounts(prev, counts));
    } catch (err) {
      setListError(
        err instanceof ApiError ? err.message : "Failed to load more",
      );
    } finally {
      setListBusy(false);
    }
  }, [nextCursor, appliedFilters]);

  const replaceItem = useCallback((updated: Submission) => {
    setItems((prev) =>
      prev.map((item) =>
        item.submissionId === updated.submissionId ? updated : item,
      ),
    );
  }, []);

  const onLeadUpdate = useCallback(
    async (
      patch: {
        status?: LeadStatus;
        tags?: LeadTag[];
        assignedTo?: string | null;
        senderPhone?: string;
      },
      submissionId?: string,
    ) => {
      const id = submissionId ?? selectedId;
      if (!id) return;
      setCrmBusy(true);
      setListError(null);
      try {
        const updated = await updateSubmission(id, patch);
        replaceItem(updated);
        if (updated.tags) {
          setLeadTags((prev) =>
            collectLeadTags([{ tags: prev }, { tags: updated.tags }]),
          );
        }
      } catch (err) {
        setListError(
          err instanceof ApiError ? err.message : "Failed to update lead",
        );
      } finally {
        setCrmBusy(false);
      }
    },
    [selectedId, replaceItem],
  );

  const onLeadNote = useCallback(
    async (body: string) => {
      if (!selectedId) return;
      setCrmBusy(true);
      setListError(null);
      try {
        const updated = await addSubmissionNote(selectedId, body);
        replaceItem(updated);
      } catch (err) {
        setListError(
          err instanceof ApiError ? err.message : "Failed to add note",
        );
      } finally {
        setCrmBusy(false);
      }
    },
    [selectedId, replaceItem],
  );

  const onLeadDeleteNote = useCallback(
    async (noteId: string) => {
      if (!selectedId) return;
      setCrmBusy(true);
      setListError(null);
      try {
        const updated = await deleteSubmissionNote(selectedId, noteId);
        replaceItem(updated);
      } catch (err) {
        setListError(
          err instanceof ApiError ? err.message : "Failed to delete note",
        );
      } finally {
        setCrmBusy(false);
      }
    },
    [selectedId, replaceItem],
  );

  useEffect(() => {
    if (!selectedId || !account?.linked) {
      setMessageError(null);
      return;
    }
    let cancelled = false;
    async function loadMessages() {
      setMessageError(null);
      try {
        const res = await listLeadMessages(selectedId!);
        if (!cancelled) {
          setMessagesById((prev) => ({
            ...prev,
            [selectedId!]: res.items,
          }));
          setChannelsById((prev) => ({
            ...prev,
            [selectedId!]: res.availableChannels ?? ["email"],
          }));
          setItems((prev) =>
            prev.map((item) =>
              item.submissionId === selectedId
                ? { ...item, messageCount: res.items.length }
                : item,
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMessageError(
            err instanceof ApiError ? err.message : "Failed to load messages",
          );
        }
      }
    }
    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedId, account?.linked]);

  const onSendLeadMessage = useCallback(
    async (
      body: string,
      bodyHtml?: string,
      from?: { fromIdentityId?: string },
    ) => {
      if (!selectedId) return;
      setCrmBusy(true);
      setMessageError(null);
      try {
        const message = await sendLeadMessage(selectedId, {
          body,
          ...(bodyHtml ? { bodyHtml } : {}),
          ...(from?.fromIdentityId
            ? { fromIdentityId: from.fromIdentityId }
            : {}),
        });
        setMessagesById((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] ?? []), message],
        }));
        setItems((items) =>
          items.map((item) => {
            if (item.submissionId !== selectedId) return item;
            return {
              ...item,
              status: leadStatusOf(item) === "new" ? "contacted" : item.status,
              messageCount: (item.messageCount ?? 0) + 1,
            };
          }),
        );
      } catch (err) {
        setMessageError(
          err instanceof ApiError ? err.message : "Failed to send reply",
        );
      } finally {
        setCrmBusy(false);
      }
    },
    [selectedId],
  );

  const onSendLeadSms = useCallback(
    async (body: string) => {
      if (!selectedId) return;
      setCrmBusy(true);
      setMessageError(null);
      try {
        const message = await sendLeadMessage(selectedId, {
          body,
          channel: "sms",
        });
        setMessagesById((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] ?? []), message],
        }));
        setItems((items) =>
          items.map((item) => {
            if (item.submissionId !== selectedId) return item;
            return {
              ...item,
              status: leadStatusOf(item) === "new" ? "contacted" : item.status,
              messageCount: (item.messageCount ?? 0) + 1,
            };
          }),
        );
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to send text";
        setMessageError(message);
        // Rethrown so the composer keeps the draft for a retry.
        throw err;
      } finally {
        setCrmBusy(false);
      }
    },
    [selectedId],
  );

  const refreshSms = useCallback(async () => {
    try {
      setSms(await getSmsStatus());
    } catch {
      setSms(null);
    }
  }, []);

  const onMailboxConnect = useCallback(async (provider: MailboxProvider) => {
    setMailboxBusy(true);
    setMailboxError(null);
    try {
      const { authUrl } = await connectMailbox(provider);
      window.location.assign(authUrl);
    } catch (err) {
      setMailboxError(
        err instanceof ApiError
          ? err.message
          : "Failed to start mailbox connect",
      );
      setMailboxBusy(false);
    }
  }, []);

  const onMailboxDisconnect = useCallback(async () => {
    setMailboxBusy(true);
    setMailboxError(null);
    try {
      await disconnectMailbox();
      setMailbox({ connected: false });
      toast.success("Mailbox disconnected.");
    } catch (err) {
      setMailboxError(
        err instanceof ApiError ? err.message : "Failed to disconnect mailbox",
      );
    } finally {
      setMailboxBusy(false);
    }
  }, []);

  const onMailboxSync = useCallback(async () => {
    setMailboxBusy(true);
    setMailboxError(null);
    try {
      const result = await syncMailbox();
      const box = await getMailbox();
      setMailbox(box);
      if (result.imported > 0) {
        toast.success(
          `Synced ${result.imported} new message${result.imported === 1 ? "" : "s"}.`,
        );
      } else {
        toast.message("Sync complete. No new replies.");
      }
      if (selectedId) {
        try {
          const res = await listLeadMessages(selectedId);
          setMessagesById((prev) => ({
            ...prev,
            [selectedId]: res.items,
          }));
          setItems((prev) =>
            prev.map((item) =>
              item.submissionId === selectedId
                ? { ...item, messageCount: res.items.length }
                : item,
            ),
          );
        } catch {
          // Sync succeeded; thread refresh is best-effort.
        }
      }
    } catch (err) {
      setMailboxError(
        err instanceof ApiError ? err.message : "Failed to sync mailbox",
      );
    } finally {
      setMailboxBusy(false);
    }
  }, [selectedId]);

  const onMailboxPatch = useCallback(async (input: PatchMailboxInput) => {
    setMailboxBusy(true);
    setMailboxError(null);
    try {
      const box = await updateMailboxSettings(input);
      setMailbox((prev) => ({
        ...(prev ?? { connected: false }),
        ...box,
      }));
      toast.success("Sending Preferences updated.");
    } catch (err) {
      setMailboxError(
        err instanceof ApiError
          ? err.message
          : "Failed to update outbound identity settings",
      );
    } finally {
      setMailboxBusy(false);
    }
  }, []);

  const selectWorkspace = useCallback(
    (orgId: string, projectId: string) => {
      const nextProjectId = projectId.trim() ? projectId.trim() : null;
      const currentOrgId = getSelectedOrgId();
      const currentProjectId = getSelectedProjectId();
      const orgName = orgs.find((entry) => entry.orgId === orgId)?.orgName;
      if (
        currentOrgId === orgId &&
        currentProjectId === nextProjectId &&
        (!orgName || getSelectedOrgName() === orgName)
      ) {
        return;
      }
      setSelectedWorkspace(orgId, nextProjectId, orgName);
      setWorkspaceEpoch((n) => n + 1);
    },
    [orgs],
  );

  const refreshWorkspace = useCallback(() => {
    setWorkspaceEpoch((n) => n + 1);
  }, []);

  const onCreateOrganization = useCallback(async () => {
    const name = businessName.trim();
    if (!name) {
      setBillingError("Enter an organization name");
      return;
    }
    setBillingBusy(true);
    setBillingError(null);
    try {
      const result = await createOrganization({ orgName: name });
      toast.success(
        result.message ||
          "Organization created. Add a project to get an API key and inbox.",
      );
      setSelectedWorkspace(result.orgId, null, name);
      setBusinessName("");
      setWorkspaceEpoch((n) => n + 1);
      if (result.orgSlug) {
        portalNavigate(
          portalWorkspacePath({
            orgSlug: result.orgSlug,
            surface: "orgHome",
          }),
        );
      }
    } catch (err) {
      setBillingError(
        err instanceof ApiError ? err.message : "Could not create organization",
      );
    } finally {
      setBillingBusy(false);
    }
  }, [businessName]);

  const onCreateProject = useCallback(
    async (orgId: string) => {
      const name = projectNameDraft.trim();
      if (!name) {
        setBillingError("Enter a project name");
        return;
      }
      setBillingBusy(true);
      setBillingError(null);
      try {
        const result = await createProject({ orgId, projectName: name });
        if (result.apiKey) {
          sessionStorage.setItem(PORTAL_ISSUED_API_KEY_STORAGE, result.apiKey);
          toast.success(
            "Project created. Open Settings → Developers → API Keys to copy your new key (shown once).",
          );
        }
        const orgName = orgs.find(
          (entry) => entry.orgId === result.orgId,
        )?.orgName;
        setSelectedWorkspace(result.orgId, result.projectId, orgName);
        setProjectNameDraft("");
        setWorkspaceEpoch((n) => n + 1);
        const orgSlug =
          result.orgSlug ||
          orgs.find((entry) => entry.orgId === result.orgId)?.orgSlug;
        if (orgSlug && result.projectSlug) {
          portalNavigate(
            portalWorkspacePath({
              orgSlug,
              projectSlug: result.projectSlug,
              surface: "inbox",
            }),
          );
        }
      } catch (err) {
        setBillingError(
          err instanceof ApiError ? err.message : "Could not create project",
        );
      } finally {
        setBillingBusy(false);
      }
    },
    [projectNameDraft, orgs],
  );

  const onProvisionAccount = onCreateOrganization;

  const onUpgrade = useCallback(async (plan: "solo" | "team") => {
    setBillingBusy(true);
    setBillingError(null);
    try {
      const url = await startCheckout(plan);
      window.location.href = url;
    } catch (err) {
      setBillingError(
        err instanceof ApiError ? err.message : "Checkout failed",
      );
      setBillingBusy(false);
    }
  }, []);

  const onManageBilling = useCallback(async () => {
    setBillingBusy(true);
    setBillingError(null);
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setBillingError(
        err instanceof ApiError ? err.message : "Could not open billing portal",
      );
      setBillingBusy(false);
    }
  }, []);

  const applyContactPhone = useCallback(
    (contactId: string, phone: string | null) => {
      setItems((prev) => applyContactPhoneToLeads(prev, contactId, phone));
    },
    [],
  );

  const rewriteLeadTag = useCallback((from: string, to: string | null) => {
    const source = from.trim().toLowerCase();
    const target = to?.trim().toLowerCase() || null;
    if (!source || target === source) return;
    setItems((prev) =>
      prev.map((item) => {
        const tags = item.tags ?? [];
        if (!tags.some((tag) => tag.toLowerCase() === source)) return item;
        const next: string[] = [];
        for (const tag of tags) {
          const value = tag.toLowerCase() === source ? target : tag;
          if (!value || next.includes(value)) continue;
          next.push(value);
        }
        return { ...item, tags: next };
      }),
    );
  }, []);

  const applyFilters = useCallback((next?: LeadInboxFiltersValue) => {
    setAppliedFilters(next ?? filters);
  }, [filters]);

  const selected = items.find((s) => s.submissionId === selectedId) ?? null;
  const leadMessages = selectedId ? (messagesById[selectedId] ?? []) : [];
  const selectedContactId = selected?.contactId ?? null;

  useEffect(() => {
    if (!selectedContactId) {
      setContactPhones([]);
      return;
    }
    let cancelled = false;
    void getContact(selectedContactId)
      .then((detail) => {
        if (!cancelled) setContactPhones(labeledContactPhones(detail.contact));
      })
      .catch(() => {
        if (!cancelled) setContactPhones([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedContactId, portalPath]);
  const isOwner = teamRole === "owner";
  const checkPermission = useCallback(
    (permission: Permission) =>
      isOwner || permissionsInclude(permissions, permission),
    [isOwner, permissions],
  );

  const displayMembers = useMemo(
    () =>
      members.map((member) =>
        teamMemberWithAccountName(member, accountProfile),
      ),
    [members, accountProfile],
  );

  const value = useMemo<PortalContextValue>(
    () => ({
      ready,
      items,
      clientName,
      account,
      orgs,
      nextCursor,
      listError,
      listBusy,
      crmBusy,
      billingBusy,
      billingError,
      businessName,
      setBusinessName,
      projectNameDraft,
      setProjectNameDraft,
      selectedId,
      setSelectedId,
      selected,
      filters,
      setFilters,
      applyFilters,
      members: displayMembers,
      forms,
      leadTags,
      setLeadTags,
      leadTagColors,
      setLeadTagColors,
      rewriteLeadTag,
      applyContactPhone,
      contactPhones,
      teamRole,
      permissions,
      roles,
      isOwner,
      hasPermission: checkPermission,
      mailbox,
      mailboxBusy,
      mailboxError,
      messagesById,
      leadMessages,
      messageError,
      channelsById,
      sms,
      refreshSms,
      loadMore,
      onLeadUpdate,
      onLeadNote,
      onLeadDeleteNote,
      onSendLeadMessage,
      onSendLeadSms,
      onMailboxConnect,
      onMailboxDisconnect,
      onMailboxSync,
      onMailboxPatch,
      onProvisionAccount,
      onCreateOrganization,
      onCreateProject,
      selectWorkspace,
      refreshWorkspace,
      onUpgrade,
      onManageBilling,
    }),
    [
      ready,
      items,
      clientName,
      account,
      orgs,
      nextCursor,
      listError,
      listBusy,
      crmBusy,
      billingBusy,
      billingError,
      businessName,
      projectNameDraft,
      selectedId,
      selected,
      filters,
      applyFilters,
      displayMembers,
      forms,
      leadTags,
      setLeadTags,
      leadTagColors,
      setLeadTagColors,
      rewriteLeadTag,
      applyContactPhone,
      contactPhones,
      teamRole,
      permissions,
      roles,
      isOwner,
      checkPermission,
      mailbox,
      mailboxBusy,
      mailboxError,
      messagesById,
      leadMessages,
      messageError,
      channelsById,
      sms,
      refreshSms,
      loadMore,
      onLeadUpdate,
      onLeadNote,
      onLeadDeleteNote,
      onSendLeadMessage,
      onSendLeadSms,
      onMailboxConnect,
      onMailboxDisconnect,
      onMailboxSync,
      onMailboxPatch,
      onProvisionAccount,
      onCreateOrganization,
      onCreateProject,
      selectWorkspace,
      refreshWorkspace,
      onUpgrade,
      onManageBilling,
    ],
  );

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}

/** Portal state when a provider is present. Settings chrome can render without one. */
export function useOptionalPortal(): PortalContextValue | null {
  return useContext(PortalContext);
}
