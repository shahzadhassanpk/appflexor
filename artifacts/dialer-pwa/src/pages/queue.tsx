import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTaskList, getAssignedTask, claimAvailableTask, claimTask, assignedTasksKey, availableTasksKey, taskDetailKey, type DialerSession, type DialerTask, type DialerTaskList } from "@/lib/crm";
import { AlertTriangle, Loader2, MoreVertical, Phone, PhoneOff, RefreshCw, Search, X } from "lucide-react";
import { CallDialog } from "@/components/call-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useOnline } from "@/hooks/use-device";
import { telHref } from "@/lib/dialer";
import { StatusPill } from "@/components/chrome";
import { errMessage, formatDate, isOutcome, isOverdue, sanitizePhone } from "@/lib/dialer";
import { cn } from "@/lib/utils";
import {
  matchesQueueFilters, nextQueueTask, readTaskFilterPreference,
  saveTaskFilterPreference, type TaskFilter as Filter,
} from "@/lib/queue-selection";

function browserSessionStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

const queueFilters: Filter[] = ["OVERDUE", "UNSET", "RECALL", "HOT", "REJECTION", "NO_ANSWER", "INVALID_NUMBER", "ALL"];
const mobileVisibleFilters: Filter[] = ["OVERDUE", "UNSET", "RECALL", "ALL"];
const mobileOverflowFilters: Filter[] = queueFilters.filter((filter) => !mobileVisibleFilters.includes(filter));

function filterLabel(filter: Filter) {
  return filter === "ALL" ? "All" : filter === "OVERDUE" ? "Overdue" : filter === "UNSET" ? "Unset" : filter === "REJECTION" ? "Rejections" : filter === "NO_ANSWER" ? "No Answer" : filter === "INVALID_NUMBER" ? "Invalid Number" : filter.charAt(0) + filter.slice(1).toLowerCase();
}

export default function QueuePage({ session }: { session: DialerSession }) {
  const q = useQuery({ queryKey: assignedTasksKey, queryFn: ({ signal }) => getTaskList(session, "assigned", signal), retry: false, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const available = useQuery({ queryKey: availableTasksKey, queryFn: ({ signal }) => getTaskList(session, "available", signal), retry: false, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const [search, setSearch] = useState("");
  const [filter, setFilterState] = useState<Filter>(() => readTaskFilterPreference(
    session.username, browserSessionStorage(),
  ));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const setFilter = (next: Filter) => {
    setFilterState(next);
    saveTaskFilterPreference(session.username, next, browserSessionStorage());
  };
  const tasks = q.data?.tasks;
  const qc = useQueryClient();
  const [dialogTask, setDialogTask] = useState<DialerTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialHint, setDialHint] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("assigned");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const online = useOnline();
  const availableIds = useMemo(() => available.data?.tasks.map(t => t.id) ?? [], [available.data]);
  const selectedIds = availableIds.filter(id => selected.has(id));
  const allSelected = availableIds.length > 0 && selectedIds.length === availableIds.length;
  useEffect(() => {
    setSelected(old => {
      const next = new Set([...old].filter(id => availableIds.includes(id)));
      return next.size === old.size ? old : next;
    });
  }, [availableIds]);
  const [openError, setOpenError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [autoDialNext, setAutoDialNext] = useState(false);
  const [nextNotice, setNextNotice] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const advancingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const onCompleted = async (completedId: string) => {
    if (!autoDialNext || advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    setNextNotice("Finding the next task to call…");
    try {
      if (!navigator.onLine) throw new Error("You are offline. Reconnect and select the next task manually.");
      const assigned = await getTaskList(session, "assigned");
      if (!mounted.current) return;
      const nextAssigned = nextQueueTask(assigned.tasks, completedId, filter, search, tasks?.map(t => t.id));
      let next: DialerTask;
      if (nextAssigned) {
        next = await getAssignedTask(session, nextAssigned.id);
      } else {
        if (filter !== "ALL") {
          setNextNotice(`No more ${filter === "OVERDUE" ? "Overdue" : filter === "UNSET" ? "Unset" : filter === "REJECTION" ? "Rejection" : filter === "RECALL" ? "Recall" : "Hot"} tasks matching this list with dialable phone numbers. Auto-dial stopped.`);
          return;
        }
        const candidates = await getTaskList(session, "available");
        if (!mounted.current) return;
        const candidate = nextQueueTask(candidates.tasks, completedId, filter, search);
        if (!candidate) {
          setNextNotice("No more tasks with dialable phone numbers. Auto-dial stopped.");
          return;
        }
        // Never dial an available lead before Camunda confirms the claim.
        next = await claimAvailableTask(session, candidate.id);
      }
      if (!mounted.current) return;
      if (!matchesQueueFilters(next, filter, search)) {
        throw new Error("The next task no longer matches your selected status or search. Select another task from this list.");
      }
      const tel = telHref(next.phone);
      if (!tel) throw new Error("The next task no longer has a dialable number. Select another task manually.");
      qc.setQueryData<DialerTaskList>(availableTasksKey, old => old ? { ...old, tasks: old.tasks.filter(t => t.id !== next.id) } : old);
      qc.setQueryData<DialerTaskList>(assignedTasksKey, old => old ? {
        ...old,
        tasks: old.tasks.some(t => t.id === next.id)
          ? old.tasks.map(t => t.id === next.id ? next : t)
          : [...old.tasks, next],
      } : old);
      setDialogTask(next);
      setDialogOpen(true);
      setDialHint("Auto-dial next is enabled. If your phone app did not open, tap Dial again.");
      setNextNotice(null);
      try { window.location.href = tel; } catch { /* Dial again remains a direct user-gesture fallback. */ }
    } catch (error) {
      if (mounted.current) setNextNotice(`Auto-dial stopped: ${error instanceof Error ? error.message : "Could not open the next task."}`);
    } finally {
      advancingRef.current = false;
      if (mounted.current) {
        setAdvancing(false);
        qc.invalidateQueries({ queryKey: assignedTasksKey });
        qc.invalidateQueries({ queryKey: availableTasksKey });
      }
    }
  };

  const claim = useMutation({
    mutationFn: async (ids: string[]) => {
      const succeeded: string[] = [];
      const failed: { id: string; message: string }[] = [];
      for (let offset = 0; offset < ids.length; offset += 5) {
        if (!mounted.current) break;
        await Promise.all(ids.slice(offset, offset + 5).map(async id => {
          try {
            await claimTask(session, id);
            succeeded.push(id);
          } catch (error) {
            failed.push({ id, message: errMessage(error, "Could not claim this task.") });
          }
        }));
      }
      return { succeeded, failed };
    },
    onSuccess: async ({ succeeded, failed }) => {
      if (!mounted.current) return;
      await qc.cancelQueries({ queryKey: availableTasksKey });
      qc.setQueryData<DialerTaskList>(availableTasksKey, old => old ? {
        ...old, tasks: old.tasks.filter(t => !succeeded.includes(t.id)),
      } : old);
      setSelected(new Set(failed.map(item => item.id)));
      setClaimNotice(`${succeeded.length} task${succeeded.length === 1 ? "" : "s"} claimed.`);
      setClaimError(failed.length
        ? `${failed.length} task${failed.length === 1 ? "" : "s"} could not be claimed. ${failed.map(item => `${item.id}: ${item.message}`).join(" ")}`
        : null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: availableTasksKey }),
        qc.invalidateQueries({ queryKey: assignedTasksKey }),
      ]);
    },
    onError: error => setClaimError(errMessage(error, "Could not claim the selected tasks.")),
  });

  const claimSelected = () => {
    if (!online || claim.isPending || advancingRef.current || selectedIds.length === 0) return;
    setClaimError(null);
    setClaimNotice(null);
    claim.mutate([...selectedIds]);
  };

  const openAssigned = async (id: string) => {
    if (openingId || advancingRef.current) return;
    setOpenError(null);
    setOpeningId(id);
    try {
      const task = await qc.fetchQuery({ queryKey: taskDetailKey(id), queryFn: ({ signal }) => getAssignedTask(session, id, signal), staleTime: 0 });
      setDialHint(null);
      setDialogTask(task);
      setDialogOpen(true);
    } catch (err) {
      setOpenError(errMessage(err, "Could not open this task. It may no longer be assigned to you."));
      qc.invalidateQueries({ queryKey: assignedTasksKey });
    } finally {
      setOpeningId(null);
    }
  };

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: 0, HOT: 0, RECALL: 0, REJECTION: 0, NO_ANSWER: 0, INVALID_NUMBER: 0, UNSET: 0, OVERDUE: 0 };
    (tasks ?? []).forEach((t) => { c.ALL++; if (isOverdue(t.dueDate)) c.OVERDUE++; if (isOutcome(t.status)) c[t.status]++; else if (!t.status) c.UNSET++; });
    return c;
  }, [tasks]);

  const visible = useMemo(() => {
    return (tasks ?? []).filter(t => matchesQueueFilters(t, filter, search));
  }, [tasks, search, filter]);

  const assignedSection = (
    <section aria-label="Assigned tasks">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="tabnum text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Assigned tasks</p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {q.data ? <><span data-testid="text-queue-count" className="tabnum">{counts.ALL}</span> to call</> : "Your calls"}
          </h1>
        </div>
        <button data-testid="button-refresh" onClick={() => q.refetch()} disabled={q.isFetching}
          className="press flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-semibold hover:bg-secondary">
          <RefreshCw className={cn("h-3.5 w-3.5", q.isFetching && "animate-spin")} /> {q.isFetching ? "Syncing" : "Refresh"}
        </button>
      </div>

      {q.data && (
        <p className="tabnum mt-1 text-[11px] text-muted-foreground">
          Scanned {q.data.scannedCount} assigned task{q.data.scannedCount === 1 ? "" : "s"}{session.taskDefinitionKey ? ` for ${session.taskDefinitionKey}` : ""}
          {q.dataUpdatedAt ? ` · updated ${new Date(q.dataUpdatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}` : ""}
        </p>
      )}

      {openError && (
        <div data-testid="text-open-error" role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {openError}
        </div>
      )}
      {q.isLoading && <QueueSkeleton />}

      {q.isError && !q.data && (
        <div data-testid="status-queue-error" className="rise mt-6 rounded-2xl border border-destructive/25 bg-card p-6 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-destructive" />
          <p className="mt-3 font-semibold">Could not load your queue</p>
          <p className="mt-1 text-sm text-muted-foreground">{errMessage(q.error)}</p>
          <button data-testid="button-retry" onClick={() => q.refetch()} className="press mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Try again</button>
        </div>
      )}

      {q.isError && q.data && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> Refresh failed, showing last loaded queue. {errMessage(q.error)}
        </div>
      )}

      {q.data && counts.ALL === 0 && (
        <div data-testid="status-queue-empty" className="rise mt-8 rounded-3xl border border-dashed border-input bg-card/60 px-6 py-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary"><PhoneOff className="h-6 w-6 text-muted-foreground" /></div>
          <p className="mt-4 text-lg font-bold">No calls in your queue</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            {q.data.scannedCount > 0
              ? `${q.data.scannedCount} assigned task${q.data.scannedCount === 1 ? " was" : "s were"} checked, but none match your task definition filter.`
              : "Appflexor has no tasks assigned to you right now. New leads appear here automatically."}
          </p>
        </div>
      )}

      {q.data && counts.ALL > 0 && (
        <>
          <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 mt-4 space-y-2.5 bg-background/90 px-4 pb-3 pt-2 backdrop-blur-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input data-testid="input-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone or task"
                className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-10 text-[15px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" />
              {search && <button data-testid="button-clear-search" onClick={() => setSearch("")} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg hover:bg-muted" aria-label="Clear"><X className="h-4 w-4" /></button>}
            </div>
            <div className="-mx-4 flex items-center gap-1.5 px-4">
              <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
                {mobileVisibleFilters.map((f) => (
                  <button key={`mobile-${f}`} data-testid={`button-filter-${f.toLowerCase()}`} onClick={() => setFilter(f)}
                    className={cn("press flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:hidden",
                      filter === f ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-secondary")}>
                    {filterLabel(f)} <span className="tabnum opacity-60">{counts[f]}</span>
                  </button>
                ))}
                {queueFilters.map((f) => (
                  <button key={`desktop-${f}`} data-testid={`button-filter-${f.toLowerCase()}`} onClick={() => setFilter(f)}
                    className={cn("press hidden shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:flex",
                      filter === f ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-secondary")}>
                    {filterLabel(f)} <span className="tabnum opacity-60">{counts[f]}</span>
                  </button>
                ))}
              </div>
              <div className="relative shrink-0 sm:hidden">
                <button type="button" aria-label="More status filters" aria-haspopup="menu" aria-expanded={mobileFiltersOpen}
                  data-testid="button-more-filters" onClick={() => setMobileFiltersOpen(open => !open)}
                  className="press grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-secondary">
                  <MoreVertical className="h-4 w-4" />
                </button>
                {mobileFiltersOpen && (
                  <div role="menu" aria-label="More status filters" className="absolute right-0 top-11 z-40 min-w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                    {mobileOverflowFilters.map((f) => (
                      <button key={`overflow-${f}`} type="button" role="menuitem" data-testid={`button-filter-${f.toLowerCase()}-more`}
                        onClick={() => { setFilter(f); setMobileFiltersOpen(false); }}
                        className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-secondary",
                          filter === f && "bg-secondary")}>
                        {filterLabel(f)} <span className="tabnum ml-3 opacity-60">{counts[f]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-input p-8 text-center text-sm text-muted-foreground" data-testid="status-no-matches">
              No tasks match this search or filter.
              <button className="ml-1 font-semibold text-foreground underline" onClick={() => { setSearch(""); setFilter("ALL"); }} data-testid="button-reset-filters">Reset</button>
            </div>
          ) : (
            <ul className="mt-1 space-y-2">
              {visible.map((t, i) => {
                const phone = sanitizePhone(t.phone);
                const due = formatDate(t.dueDate, true);
                const overdue = isOverdue(t.dueDate);
                return (
                  <li key={t.id} className="rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                    <div className="group flex w-full items-center gap-3 rounded-2xl border border-card-border bg-card p-3.5 transition-shadow hover:shadow-[0_6px_20px_-12px_hsl(var(--primary)/.5)]">
                      <button type="button" onClick={() => openAssigned(t.id)} disabled={!!openingId || advancing} data-testid={`card-task-${t.id}`}
                        className="press flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-70">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-primary">
                        {initials(t.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span data-testid={`text-name-${t.id}`} className="truncate font-bold">{t.name || "Unnamed lead"}</span>
                          <span data-testid={`text-pending-${t.id}`} className="shrink-0 rounded bg-accent/15 px-1.5 text-[10px] font-bold uppercase text-accent">Pending</span>
                        </div>
                        <div data-testid={`text-phone-${t.id}`} className={cn("tabnum truncate text-[13px]", phone ? "text-foreground/80" : "text-destructive")}>
                          {t.phone || "No phone"}{!phone && t.phone ? " (invalid)" : ""}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                          <StatusPill status={t.status} />
                          <span data-testid={`text-due-${t.id}`} className={cn("tabnum", overdue && "font-semibold text-destructive")}>
                            {due ? `${overdue ? "Overdue" : "Due"} ${due}` : "No due date"}
                          </span>
                          {t.taskName && <span className="truncate">· {t.taskName}</span>}
                        </div>
                        {t.comments && (
                          <p data-testid={`text-comments-${t.id}`} className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                            {t.comments}
                          </p>
                        )}
                      </div>
                      </button>
                      {phone ? (
                        <a href={telHref(t.phone)!} data-testid={`button-call-assigned-${t.id}`}
                          onClick={(event) => {
                            if (advancingRef.current) { event.preventDefault(); return; }
                            void openAssigned(t.id);
                          }}
                          aria-disabled={advancing}
                          tabIndex={advancing ? -1 : undefined}
                          aria-label={`Call ${t.name}`}
                          className="press flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground">
                          <Phone className="h-4 w-4" /> Call
                        </a>
                      ) : (
                        <button type="button" disabled data-testid={`button-call-assigned-${t.id}`}
                          title="No dialable phone number"
                          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground opacity-40">
                          <PhoneOff className="h-4 w-4" /> Call
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {q.data.hasMore && (
            <p className="mt-4 text-center text-xs text-muted-foreground" data-testid="text-has-more">
              More assigned tasks exist upstream. Complete some calls and refresh to load the next batch.
            </p>
          )}
        </>
      )}

    </section>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-5">
      {nextNotice && <p role="status" data-testid="text-auto-dial-status" className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm">{nextNotice}</p>}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Task lists" className="mb-5 grid h-12 w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="assigned" data-testid="tab-assigned" className="h-10 rounded-lg">
            Assigned <span className="tabnum ml-2">{q.data?.tasks.length ?? "…"}</span>
          </TabsTrigger>
          <TabsTrigger value="available" data-testid="tab-available" className="h-10 rounded-lg">
            Available <span className="tabnum ml-2">{available.data?.tasks.length ?? "…"}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="available">
      <section aria-labelledby="available-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="tabnum text-[11px] uppercase tracking-[0.2em] text-muted-foreground">DIALER_APP group</p>
            <h2 id="available-heading" className="text-2xl font-extrabold tracking-tight">
              Available <span className="tabnum text-muted-foreground">{available.data?.tasks.length ?? ""}</span>
            </h2>
          </div>
          <button data-testid="button-refresh-available" onClick={() => available.refetch()} disabled={available.isFetching || claim.isPending}
            className="press flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold hover:bg-secondary">
            <RefreshCw className={cn("h-3.5 w-3.5", available.isFetching && "animate-spin")} /> Refresh
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Unassigned tasks available to the DIALER_APP candidate group.</p>
        {availableIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold">
              <input ref={node => { if (node) node.indeterminate = selectedIds.length > 0 && !allSelected; }}
                type="checkbox" data-testid="checkbox-select-all"
                checked={allSelected} disabled={claim.isPending || advancing}
                onChange={event => setSelected(event.target.checked ? new Set(availableIds) : new Set())}
                className="h-5 w-5 accent-primary" />
              {available.data?.hasMore ? "Select all loaded" : "Select all"} <span className="tabnum text-xs text-muted-foreground">({selectedIds.length}/{availableIds.length})</span>
            </label>
            <button type="button" data-testid="button-claim-selected" onClick={claimSelected}
              disabled={!online || selectedIds.length === 0 || claim.isPending || advancing}
              className="press flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-40">
              {claim.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {claim.isPending ? "Claiming…" : `Claim selected (${selectedIds.length})`}
            </button>
          </div>
        )}
        {!online && <p className="mt-2 text-xs text-destructive">Reconnect to claim tasks.</p>}
        {claimNotice && <p role="status" data-testid="text-claim-notice" className="mt-3 text-sm">{claimNotice}</p>}

        {claimError && (
          <div data-testid="text-claim-error" role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {claimError}
          </div>
        )}
        {available.isLoading && <QueueSkeleton />}
        {available.isError && !available.data && (
          <div data-testid="status-available-error" className="mt-4 rounded-2xl border border-destructive/25 bg-card p-5 text-center">
            <p className="font-semibold">Could not load available tasks</p>
            <p className="mt-1 text-sm text-muted-foreground">{errMessage(available.error)}</p>
            <button data-testid="button-retry-available" onClick={() => available.refetch()} className="press mt-3 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Try again</button>
          </div>
        )}
        {available.isError && available.data && (
          <p className="mt-3 text-xs text-destructive">Refresh failed; showing the last loaded available list. {errMessage(available.error)}</p>
        )}
        {available.data && available.data.tasks.length === 0 && (
          <p data-testid="status-available-empty" className="mt-4 rounded-2xl border border-dashed border-input px-5 py-8 text-center text-sm text-muted-foreground">
            No unassigned tasks are available for this group right now.
          </p>
        )}
        {available.data && available.data.tasks.length > 0 && (
          <ul data-testid="list-available-tasks" className="mt-4 space-y-2">
            {available.data.tasks.map((task, i) => {
              const due = formatDate(task.dueDate, true);
              return (
                <li key={task.id} data-testid={`card-available-${task.id}`} className="rise rounded-2xl border border-card-border bg-card p-3.5" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" data-testid={`checkbox-task-${task.id}`}
                      aria-label={`Select ${task.name || task.taskName}`}
                      checked={selected.has(task.id)} disabled={claim.isPending || advancing}
                      onChange={event => setSelected(old => {
                        const next = new Set(old);
                        if (event.target.checked) next.add(task.id); else next.delete(task.id);
                        return next;
                      })}
                      className="mt-3 h-5 w-5 shrink-0 accent-primary" />
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-primary">{initials(task.name)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{task.name || "Unnamed lead"}</p>
                      <p className="tabnum truncate text-[13px] text-foreground/80">{task.phone || "No phone number provided"}</p>
                      {task.detailsError && (
                        <p role="status" className="mt-1 text-xs text-destructive">
                          Task details could not be loaded: {task.detailsError}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <StatusPill status={task.status} />
                        <span className="tabnum">{due ? `Due ${due}` : "No due date"}</span>
                        {task.taskName && <span className="truncate">· {task.taskName}</span>}
                      </div>
                      {task.comments && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{task.comments}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {available.data?.hasMore && (
          <p className="mt-3 text-center text-xs text-muted-foreground" data-testid="text-available-has-more">
            More available tasks exist upstream.
          </p>
        )}
      </section>
        </TabsContent>
        <TabsContent value="assigned">{assignedSection}</TabsContent>
      </Tabs>
      <CallDialog session={session} task={dialogTask} open={dialogOpen} dialHint={dialHint}
        autoDialNext={autoDialNext} onAutoDialNextChange={setAutoDialNext} onCompleted={onCompleted}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setDialHint(null); }} />
    </main>
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "–";
}

function QueueSkeleton() {
  return (
    <ul className="mt-6 space-y-2" data-testid="status-queue-loading">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-card-border bg-card p-3.5" style={{ animationDelay: `${i * 90}ms` }}>
          <div className="h-11 w-11 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2"><div className="h-3.5 w-2/5 rounded bg-muted" /><div className="h-3 w-1/3 rounded bg-muted" /><div className="h-2.5 w-1/2 rounded bg-muted" /></div>
        </li>
      ))}
    </ul>
  );
}
