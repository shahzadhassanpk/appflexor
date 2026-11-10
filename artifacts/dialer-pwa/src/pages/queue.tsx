import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getTaskList, assignedTasksKey, availableTasksKey, type DialerSession } from "@/lib/crm";
import { AlertTriangle, ChevronRight, PhoneOff, RefreshCw, Search, X } from "lucide-react";
import { StatusPill } from "@/components/chrome";
import { OUTCOMES, errMessage, formatDate, hasDraft, isOutcome, isOverdue, sanitizePhone } from "@/lib/dialer";
import { cn } from "@/lib/utils";

type Filter = "ALL" | "HOT" | "RECALL" | "REJECTION" | "UNSET";

export default function QueuePage({ session }: { session: DialerSession }) {
  const q = useQuery({ queryKey: assignedTasksKey, queryFn: ({ signal }) => getTaskList(session, "assigned", signal), retry: false, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const available = useQuery({ queryKey: availableTasksKey, queryFn: ({ signal }) => getTaskList(session, "available", signal), retry: false, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const tasks = q.data?.tasks;

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: 0, HOT: 0, RECALL: 0, REJECTION: 0, UNSET: 0 };
    (tasks ?? []).forEach((t) => { c.ALL++; if (isOutcome(t.status)) c[t.status]++; else if (!t.status) c.UNSET++; });
    return c;
  }, [tasks]);

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    const sd = s.replace(/\D/g, "");
    return (tasks ?? []).filter((t) => {
      if (filter === "UNSET" ? !!t.status : filter !== "ALL" && t.status !== filter) return false;
      if (!s) return true;
      return t.name.toLowerCase().includes(s) || t.taskName.toLowerCase().includes(s) || (sd.length > 0 && t.phone.replace(/\D/g, "").includes(sd));
    });
  }, [tasks, search, filter]);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-5">
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
              ? `${q.data.scannedCount} assigned task${q.data.scannedCount === 1 ? " was" : "s were"} checked, but none carry a phone number.`
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
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
              {(["ALL", ...OUTCOMES, "UNSET"] as Filter[]).map((f) => (
                <button key={f} data-testid={`button-filter-${f.toLowerCase()}`} onClick={() => setFilter(f)}
                  className={cn("press flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    filter === f ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-secondary")}>
                  {f === "ALL" ? "All" : f === "UNSET" ? "Unset" : f.charAt(0) + f.slice(1).toLowerCase()}
                  <span className="tabnum opacity-60">{counts[f]}</span>
                </button>
              ))}
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
                const due = formatDate(t.dueDate);
                const overdue = isOverdue(t.dueDate);
                const draft = hasDraft(session.username, t.id);
                return (
                  <li key={t.id} className="rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                    <Link href={`/tasks/${encodeURIComponent(t.id)}`} data-testid={`card-task-${t.id}`}
                      className="press group flex items-center gap-3 rounded-2xl border border-card-border bg-card p-3.5 transition-shadow hover:shadow-[0_6px_20px_-12px_hsl(var(--primary)/.5)]">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-primary">
                        {initials(t.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span data-testid={`text-name-${t.id}`} className="truncate font-bold">{t.name || "Unnamed lead"}</span>
                          {draft && <span className="shrink-0 rounded bg-accent/15 px-1.5 text-[10px] font-bold uppercase text-accent">Draft</span>}
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
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
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

      <section aria-labelledby="available-heading" className="mt-10 border-t border-border pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="tabnum text-[11px] uppercase tracking-[0.2em] text-muted-foreground">DIALER_APP group</p>
            <h2 id="available-heading" className="text-2xl font-extrabold tracking-tight">
              Available <span className="tabnum text-muted-foreground">{available.data?.tasks.length ?? ""}</span>
            </h2>
          </div>
          <button data-testid="button-refresh-available" onClick={() => available.refetch()} disabled={available.isFetching}
            className="press flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold hover:bg-secondary">
            <RefreshCw className={cn("h-3.5 w-3.5", available.isFetching && "animate-spin")} /> Refresh
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Unassigned tasks available to the DIALER_APP candidate group.</p>

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
              const due = formatDate(task.dueDate);
              return (
                <li key={task.id} data-testid={`card-available-${task.id}`} className="rise rounded-2xl border border-card-border bg-card p-3.5" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <div className="flex items-start gap-3">
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
