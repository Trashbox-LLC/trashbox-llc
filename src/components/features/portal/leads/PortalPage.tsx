"use client";

import { useEffect, useState } from "react";
import { LeadDetail } from "@/components/features/portal/leads/LeadDetail";
import { LeadInboxEmptyDetail } from "@/components/features/portal/leads/LeadInboxEmptyDetail";
import {
  INBOX_SIDEBAR_MIN_WIDTH,
  INBOX_SIDEBAR_SNAP_WIDTH,
  LeadInboxOpenHandle,
  LeadInboxResizeHandle,
  LeadInboxSidebar,
} from "@/components/features/portal/leads/LeadInboxSidebar";
import { LeadThreadTabs } from "@/components/features/portal/leads/LeadThreadTabs";
import {
  closeLeadTab,
  loadLeadThreadTabs,
  openLeadTab,
  saveLeadThreadTabs,
} from "@/components/features/portal/leads/lead-thread-tabs";
import { PortalSkeleton } from "@/components/features/portal/PortalSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  displayPlanTier,
  planDisplayName,
  showManageBilling,
  showStripeCheckout,
  showUpgradeToTeam,
} from "@/lib/form-plans";
import { usePortal, type PortalTab } from "@/lib/portal";
import { PORTAL_PATHS } from "@/lib/sites";
import { cn } from "@/lib/utils";

interface PortalAppProps {
  tab: PortalTab;
}

export function PortalApp({ tab }: PortalAppProps) {
  const auth = useAuth();
  const portal = usePortal();
  const [inboxSidebarOpen, setInboxSidebarOpen] = useState(true);
  const [inboxSidebarWidth, setInboxSidebarWidth] = useState(
    INBOX_SIDEBAR_SNAP_WIDTH,
  );
  const [inboxResizing, setInboxResizing] = useState(false);
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [tabsReady, setTabsReady] = useState(false);

  const accountLinked = portal.account?.linked;
  const setSelectedId = portal.setSelectedId;

  useEffect(() => {
    if (!portal.ready) return;
    if (portal.account && !accountLinked) {
      window.location.assign(PORTAL_PATHS.home);
      return;
    }
    const stored = loadLeadThreadTabs();
    if (stored.openTabIds.length > 0) {
      setOpenTabIds(stored.openTabIds);
      setSelectedId(stored.activeId);
    }
    setTabsReady(true);
  }, [portal.ready, portal.account, accountLinked, setSelectedId]);

  useEffect(() => {
    if (!tabsReady || !portal.ready) return;
    saveLeadThreadTabs({
      openTabIds,
      activeId: portal.selectedId,
    });
  }, [openTabIds, portal.selectedId, portal.ready, tabsReady]);

  function onInboxSidebarOpenChange(next: boolean) {
    if (next) {
      setInboxSidebarWidth((width) =>
        width >= INBOX_SIDEBAR_MIN_WIDTH ? width : INBOX_SIDEBAR_SNAP_WIDTH,
      );
    }
    setInboxSidebarOpen(next);
  }

  function openLead(id: string) {
    setOpenTabIds((ids) => {
      let next = ids;
      if (portal.selectedId) next = openLeadTab(next, portal.selectedId);
      return openLeadTab(next, id);
    });
    portal.setSelectedId(id);
  }

  function closeLead(id: string) {
    const sourceIds =
      openTabIds.length > 0
        ? openTabIds
        : portal.selectedId
          ? [portal.selectedId]
          : [];
    const result = closeLeadTab(sourceIds, portal.selectedId, id);
    setOpenTabIds(result.openTabIds);
    portal.setSelectedId(result.activeId);
  }

  const displayTabIds =
    openTabIds.length > 0
      ? openTabIds
      : portal.selectedId
        ? [portal.selectedId]
        : [];
  // Drop stale tab ids (e.g. previous session / other filter) so the empty
  // detail graphic can show in the main pane when nothing is openable.
  const visibleTabIds = displayTabIds.filter((id) =>
    portal.items.some((entry) => entry.submissionId === id),
  );

  if (!auth.configured) {
    return (
      <p className="border-outline-variant/20 bg-surface-container-low text-on-surface-variant border p-6">
        Portal auth is not configured. Set `NEXT_PUBLIC_API_URL`,
        `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, and `NEXT_PUBLIC_COGNITO_CLIENT_ID`
        then rebuild.
      </p>
    );
  }

  const tabMeta =
    tab === "inbox"
      ? null
      : {
          eyebrow: "Membership",
          title: (
            <>
              Plan & <span className="text-outline">Billing.</span>
            </>
          ),
        };

  const contentPending =
    auth.status === "loading" ||
    auth.status === "signedOut" ||
    !portal.ready ||
    (tab === "inbox" && portal.listBusy && portal.items.length === 0);

  return (
    <div className="space-y-10">
      {tabMeta && (
        <header>
          <p className="font-label text-outline mb-6 text-xs tracking-[0.4em] uppercase">
            {tabMeta.eyebrow}
          </p>
          <h1 className="font-headline max-w-4xl text-4xl leading-tight font-bold tracking-tighter text-white md:text-6xl">
            {tabMeta.title}
          </h1>
        </header>
      )}

      {contentPending ? (
        <PortalSkeleton variant={tab} />
      ) : (
        <>
          {tab === "membership" &&
            portal.account?.linked &&
            portal.account.role === "owner" && (
              <section className="border-outline-variant/10 bg-surface-container-low border p-6 md:p-8">
                <p className="font-label text-outline text-[10px] tracking-widest uppercase">
                  Subscription
                </p>
                <h2 className="font-headline mt-3 text-2xl font-bold text-white md:text-3xl">
                  {planDisplayName(displayPlanTier(portal.account.tier))}
                </h2>
                <p className="text-on-surface-variant mt-3 max-w-2xl text-sm leading-relaxed">
                  {displayPlanTier(portal.account.tier) === "team"
                    ? "Team includes up to 5 seats, 5,000 submissions / month, and submitter confirmations."
                    : displayPlanTier(portal.account.tier) === "solo"
                      ? "Solo includes 1 seat and 500 submissions / month. Upgrade to Team for more seats and confirmations."
                      : "Free includes 10 submissions / month. Add Solo or Team when you need more."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {showStripeCheckout(
                    portal.account.tier,
                    Boolean(portal.account.hasBilling),
                  ) && (
                    <>
                      <Button
                        type="button"
                        disabled={portal.billingBusy}
                        onClick={() => void portal.onUpgrade("team")}
                      >
                        {portal.billingBusy ? "Redirecting…" : "Add Team plan"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={portal.billingBusy}
                        onClick={() => void portal.onUpgrade("solo")}
                      >
                        {portal.billingBusy ? "Redirecting…" : "Add Solo plan"}
                      </Button>
                    </>
                  )}
                  {showUpgradeToTeam(
                    portal.account.tier,
                    Boolean(portal.account.hasBilling),
                  ) && (
                    <Button
                      type="button"
                      disabled={portal.billingBusy}
                      onClick={() => void portal.onUpgrade("team")}
                    >
                      {portal.billingBusy ? "Redirecting…" : "Upgrade to Team"}
                    </Button>
                  )}
                  {showManageBilling(Boolean(portal.account.hasBilling)) && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={portal.billingBusy}
                      onClick={() => void portal.onManageBilling()}
                    >
                      {portal.billingBusy ? "Redirecting…" : "Manage billing"}
                    </Button>
                  )}
                </div>
                {portal.billingError && (
                  <p className="mt-4 text-sm text-red-300">
                    {portal.billingError}
                  </p>
                )}
              </section>
            )}

          {tab === "inbox" && portal.account?.linked && (
            <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-0">
              {visibleTabIds.length > 0 && (
                <div
                  className="hidden lg:col-start-1 lg:row-start-1 lg:block"
                  aria-hidden
                />
              )}
              <div
                className={cn(
                  "order-1 shrink-0 lg:col-start-1 lg:self-start",
                  visibleTabIds.length > 0
                    ? "lg:row-start-2"
                    : "lg:row-start-1",
                  inboxSidebarOpen &&
                    "lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]",
                )}
              >
                <div
                  className={cn(
                    inboxSidebarOpen &&
                      "lg:max-h-[calc(100vh-7rem)] lg:scrollbar-none lg:overflow-y-auto",
                  )}
                >
                  <LeadInboxSidebar
                    open={inboxSidebarOpen}
                    onOpenChange={onInboxSidebarOpenChange}
                    filters={portal.filters}
                    members={portal.members}
                    forms={portal.forms}
                    onFiltersChange={portal.setFilters}
                    onApplyFilters={portal.applyFilters}
                    items={portal.items}
                    selectedId={portal.selectedId}
                    onSelect={openLead}
                    listBusy={portal.listBusy}
                    listError={portal.listError}
                    hasMore={Boolean(portal.nextCursor)}
                    onLoadMore={() => void portal.loadMore()}
                    onAssign={(submissionId, assignedTo) =>
                      portal.onLeadUpdate({ assignedTo }, submissionId)
                    }
                    assignBusy={portal.crmBusy}
                    width={inboxSidebarWidth}
                    resizing={inboxResizing}
                  />
                </div>
              </div>

              {visibleTabIds.length > 0 && (
                <div className="order-2 pb-2 lg:col-start-2 lg:row-start-1">
                  <LeadThreadTabs
                    tabs={visibleTabIds.flatMap((id) => {
                      const item = portal.items.find(
                        (entry) => entry.submissionId === id,
                      );
                      if (!item) return [];
                      return [{ id, label: item.senderName }];
                    })}
                    activeId={portal.selectedId}
                    onSelect={openLead}
                    onClose={closeLead}
                  />
                </div>
              )}

              <div
                className={cn(
                  "relative order-3 min-w-0 lg:col-start-2",
                  visibleTabIds.length > 0
                    ? "lg:row-start-2"
                    : "lg:row-start-1",
                )}
              >
                {inboxSidebarOpen && (
                  <LeadInboxResizeHandle
                    width={inboxSidebarWidth}
                    onWidthChange={setInboxSidebarWidth}
                    onOpenChange={onInboxSidebarOpenChange}
                    onDraggingChange={setInboxResizing}
                    className="hidden lg:flex"
                  />
                )}
                {!inboxSidebarOpen && (
                  <LeadInboxOpenHandle
                    onWidthChange={setInboxSidebarWidth}
                    onOpenChange={onInboxSidebarOpenChange}
                    onDraggingChange={setInboxResizing}
                  />
                )}
                {visibleTabIds.length > 0 ? (
                  <div>
                    {visibleTabIds.map((id) => {
                        const submission = portal.items.find(
                          (entry) => entry.submissionId === id,
                        );
                        if (!submission) return null;
                        const active = id === portal.selectedId;
                        return (
                          <div
                            key={id}
                            className={cn(!active && "hidden")}
                            aria-hidden={!active}
                          >
                            <LeadDetail
                              submission={submission}
                              members={portal.members}
                              busy={portal.crmBusy}
                              mailboxConnected={Boolean(
                                portal.mailbox?.connected,
                              )}
                              fromAddress={portal.mailbox?.email}
                              fromOptions={portal.mailbox?.fromOptions}
                              businessName={portal.clientName ?? undefined}
                              messages={
                                portal.messagesById[submission.submissionId] ??
                                []
                              }
                              messageError={active ? portal.messageError : null}
                              availableChannels={
                                portal.channelsById[
                                  submission.submissionId
                                ] ?? ["email"]
                              }
                              smsFromPhone={portal.sms?.phoneNumber}
                              onUpdate={portal.onLeadUpdate}
                              onAddNote={portal.onLeadNote}
                              onSendMessage={portal.onSendLeadMessage}
                              onSendSms={portal.onSendLeadSms}
                            />
                          </div>
                        );
                      })}
                  </div>
                ) : portal.items.length === 0 && !portal.listBusy ? (
                  <LeadInboxEmptyDetail
                    filtered={Boolean(
                      portal.filters.q.trim() ||
                      portal.filters.status ||
                      portal.filters.tag ||
                      portal.filters.assignedTo ||
                      portal.filters.formId,
                    )}
                  />
                ) : (
                  <LeadInboxEmptyDetail variant="select" />
                )}
              </div>
            </div>
          )}

          {tab === "membership" &&
            portal.account?.linked &&
            portal.account.role !== "owner" && (
              <p className="text-on-surface-variant">
                Only the account owner can manage billing.
              </p>
            )}
        </>
      )}
    </div>
  );
}
