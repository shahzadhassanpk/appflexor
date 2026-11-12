import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAssignedTask, completeAssignedTask, taskDetailKey, assignedTasksKey, availableTasksKey,
  type DialerSession, type DialerTaskList,
} from "@/lib/crm";
import { AlertTriangle, ArrowLeft, CalendarClock, Check, Loader2, Phone, PhoneOff } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusPill } from "@/components/chrome";
import { useOnline } from "@/hooks/use-device";
import { useToast } from "@/hooks/use-toast";
import {
  OUTCOMES, OUTCOME_META, errMessage, errStatus, formatDate, isOutcome, isOverdue, loadDraft, removeDraft, saveDraft, telHref, toDateTimeLocal, type Outcome,
} from "@/lib/dialer";
import { cn } from "@/lib/utils";

export default function TaskPage({ id, session }: { id: string; session: DialerSession }) {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const online = useOnline();
  const q = useQuery({ enabled: !!id, queryKey: taskDetailKey(id), queryFn: ({ signal }) => getAssignedTask(session, id, signal), retry: false, refetchOnWindowFocus: false });
  const complete = useMutation({
    mutationFn: ({ id: taskId, data }: { id: string; data: { status: Outcome; comments: string; recallDateTime: string } }) =>
      completeAssignedTask(session, taskId, data.status, data.comments, data.recallDateTime),
  });
  const task = q.data;

  const [status, setStatus] = useState<Outcome | "">("");
  const [comments, setComments] = useState("");
  const [recallDateTime, setRecallDateTime] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const initFor = useRef<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!task || initFor.current === task.id) return;
    initFor.current = task.id;
    const d = loadDraft(session.username, task.id);
    if (d) {
      setStatus(d.status); setComments(d.comments);
      setRecallDateTime(d.recallDateTime || toDateTimeLocal(task.recallDateTime)); setRestored(true);
    } else {
      setStatus(isOutcome(task.status) ? task.status : ""); setComments(task.comments ?? "");
      setRecallDateTime(toDateTimeLocal(task.recallDateTime));
    }
  }, [task, session.username]);

  useEffect(() => {
    if (!task || initFor.current !== task.id || done.current) return;
    const pristine = status === (isOutcome(task.status) ? task.status : "") &&
      comments === (task.comments ?? "") && recallDateTime === toDateTimeLocal(task.recallDateTime);
    if (pristine) removeDraft(session.username, task.id);
    else saveDraft(session.username, task.id, { status, comments, recallDateTime });
    // task intentionally read for baseline only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, comments, recallDateTime, session.username]);

  const tel = telHref(task?.phone);
  const unknownStatus = !!task?.status && !isOutcome(task.status);
  const requiresSchedule = status === "RECALL" || status === "VISIT" || status === "DEMO";
  const canSubmit = !!status && (!requiresSchedule || !!recallDateTime) && online && !complete.isPending && !!task;

  const doComplete = () => {
    if (!task || !status || complete.isPending || !online || (requiresSchedule && !recallDateTime)) return;
    setSubmitError(null);
    complete.mutate({ id: task.id, data: { status, comments, recallDateTime } }, {
      onSuccess: (res) => {
        if (!res.completed) { setSubmitError("Appflexor did not confirm completion. Your draft is kept; try again."); setConfirm(false); return; }
        done.current = true;
        removeDraft(session.username, task.id);
        qc.setQueryData<DialerTaskList>(assignedTasksKey, (old) => old ? { ...old, tasks: old.tasks.filter((t) => t.id !== task.id) } : old);
        qc.removeQueries({ queryKey: taskDetailKey(task.id) });
        qc.invalidateQueries({ queryKey: assignedTasksKey });
        qc.invalidateQueries({ queryKey: availableTasksKey });
        setConfirm(false);
        toast({ title: `${task.name || "Lead"} logged as ${OUTCOME_META[status].label}`, description: "Task completed in Appflexor." });
        navigate("/", { replace: true });
      },
      onError: (err) => {
        setConfirm(false);
        setSubmitError(errStatus(err) === 404 ? "This task is no longer available. It may have been completed elsewhere." : errMessage(err, "Could not complete the task. Your draft is kept."));
      },
    });
  };

  if (q.isLoading) return <TaskSkeleton />;

  if (q.isError || !task) {
    const nf = errStatus(q.error) === 404;
    return (
      <main className="mx-auto max-w-xl px-4 pt-6">
        <BackLink />
        <div data-testid="status-task-error" className="rise mt-6 rounded-2xl border border-border bg-card p-6 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-destructive" />
          <p className="mt-3 font-semibold">{nf ? "Task not found" : "Could not load this task"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{nf ? "It may have been completed or reassigned." : errMessage(q.error)}</p>
          <div className="mt-4 flex justify-center gap-2">
            {!nf && <button data-testid="button-retry-task" onClick={() => q.refetch()} className="press rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Try again</button>}
            <Link href="/" className="press rounded-full border border-border px-5 py-2.5 text-sm font-semibold" data-testid="link-back-queue">Back to queue</Link>
          </div>
        </div>
      </main>
    );
  }

  const due = formatDate(task.dueDate, true);
  const overdue = isOverdue(task.dueDate);

  return (
    <main className="mx-auto max-w-xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4">
      <BackLink />

      <section className="rise mt-3 overflow-hidden rounded-3xl bg-sidebar text-sidebar-foreground">
        <div className="p-5 pb-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] opacity-60">
            <span className="tabnum truncate">{task.taskName || "Lead task"}</span>
          </div>
          <h1 data-testid="text-task-name" className="mt-1.5 text-[1.9rem] font-extrabold leading-tight tracking-tight">{task.name || "Unnamed lead"}</h1>
          <div data-testid="text-task-phone" className="tabnum mt-1 text-lg opacity-90">{task.phone || "No phone number"}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span data-testid="text-task-due" className={cn("tabnum inline-flex items-center gap-1.5 rounded-full px-2.5 py-1", overdue ? "bg-accent text-accent-foreground" : "bg-sidebar-accent")}>
              <CalendarClock className="h-3.5 w-3.5" /> {due ? `${overdue ? "Overdue · " : "Due "}${due}` : "No due date"}
            </span>
            <StatusPill status={task.status} className="bg-sidebar-accent" />
          </div>
        </div>
        {tel ? (
          <a href={tel} data-testid="button-dial"
            className="press flex items-center justify-center gap-3 bg-accent py-4 text-lg font-bold text-accent-foreground hover:brightness-105">
            <span className="ring-pulse grid h-9 w-9 place-items-center rounded-full bg-accent-foreground/20"><Phone className="h-4.5 w-4.5" /></span>
            Dial {task.phone}
          </a>
        ) : (
          <div data-testid="status-no-phone" className="flex items-center justify-center gap-2 bg-sidebar-accent py-4 text-sm font-semibold opacity-80">
            <PhoneOff className="h-4 w-4" /> No dialable number on this task
          </div>
        )}
      </section>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">Dial opens your phone app. Record the outcome here when the call ends.</p>

      <section className="rise mt-6 space-y-5" style={{ animationDelay: "80ms" }}>
        {restored && (
          <div className="flex items-center justify-between rounded-xl bg-accent/10 px-3 py-2 text-xs text-foreground">
            <span>Draft restored from this session.</span>
            <button data-testid="button-discard-draft" className="font-semibold underline" onClick={() => {
              removeDraft(session.username, task.id);
              setStatus(isOutcome(task.status) ? task.status : "");
              setComments(task.comments ?? "");
              setRecallDateTime(toDateTimeLocal(task.recallDateTime));
              setRestored(false);
            }}>Discard</button>
          </div>
        )}

        {unknownStatus && (
          <div data-testid="status-unknown-current" className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
            Current upstream status <b className="tabnum text-foreground">{task.status}</b> is not a dialer outcome. Choose one below.
          </div>
        )}

        <div>
          <label htmlFor="outcome" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call outcome</label>
          <div className="relative">
            <select id="outcome" data-testid="select-status" value={status}
              onChange={(e) => {
                const nextStatus = isOutcome(e.target.value) ? e.target.value : "";
                setStatus(nextStatus);
                if ((nextStatus === "RECALL" || nextStatus === "VISIT" || nextStatus === "DEMO") && !recallDateTime) setRecallDateTime(toDateTimeLocal(task.recallDateTime));
              }}
              className="h-13 w-full appearance-none rounded-xl border border-input bg-card px-4 py-3 pr-10 text-base font-semibold outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
              style={status ? { borderColor: `hsl(${OUTCOME_META[status].color})`, color: `hsl(${OUTCOME_META[status].color})` } : undefined}>
              <option value="">Select outcome</option>
              <option value="RECALL">RECALL</option>
              <option value="VISIT">Visit</option>
              <option value="DEMO">Demo</option>
              <option value="REJECTION">REJECTION</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="INVALID_NUMBER">Invalid Number</option>
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden>
            {OUTCOMES.map((o) => (
              <button key={o} type="button" tabIndex={-1} data-testid={`button-quick-${o.toLowerCase()}`} onClick={() => {
                setStatus(o);
                if ((o === "RECALL" || o === "VISIT" || o === "DEMO") && !recallDateTime) setRecallDateTime(toDateTimeLocal(task.recallDateTime));
              }}
                className={cn("press rounded-lg border px-2 py-2 text-left transition-colors", status === o ? "border-transparent" : "border-border bg-card")}
                style={status === o ? { background: `hsl(${OUTCOME_META[o].color} / .14)` } : undefined}>
                <div className="text-[11px] font-bold" style={{ color: `hsl(${OUTCOME_META[o].color})` }}>{OUTCOME_META[o].label}</div>
                <div className="text-[10px] leading-tight text-muted-foreground">{OUTCOME_META[o].hint}</div>
              </button>
            ))}
          </div>
        </div>

        {requiresSchedule && (
          <div>
            <label htmlFor="recall-date-time" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {status === "RECALL" ? "Next call date and time" : "Scheduled date and time"}
            </label>
            <input id="recall-date-time" data-testid="input-recall-datetime" type="datetime-local"
              value={recallDateTime} onChange={e => setRecallDateTime(e.target.value)} required
              className="h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" />
          </div>
        )}

        <div>
          <label htmlFor="comments" className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Comments <span className="tabnum normal-case tracking-normal">{comments.length}/10000</span>
          </label>
          <textarea id="comments" data-testid="input-comments" value={comments} onChange={(e) => setComments(e.target.value)} maxLength={10000} rows={5}
            placeholder="What was said, best time to call back, next step"
            className="w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" />
        </div>

        {submitError && (
          <div data-testid="text-submit-error" role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {submitError}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1 text-xs text-muted-foreground">
            {!online ? "Offline. Draft saved on this device." : !status ? "Choose an outcome to complete." : <>Ready: <b style={{ color: `hsl(${OUTCOME_META[status].color})` }}>{status}</b></>}
          </div>
          <button data-testid="button-complete" disabled={!canSubmit} onClick={() => setConfirm(true)}
            className="press flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground disabled:opacity-40">
            {complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Complete
          </button>
        </div>
      </div>

      <AlertDialog open={confirm} onOpenChange={(o) => !complete.isPending && setConfirm(o)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {task.name || "This lead"} will be logged as <b>{status}</b> in Appflexor and removed from your queue. This cannot be undone here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {comments.trim() && <p className="max-h-24 overflow-auto rounded-lg bg-muted p-2.5 text-xs">{comments}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-complete" disabled={complete.isPending}>Keep editing</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-complete" disabled={!canSubmit}
              onClick={(e) => { e.preventDefault(); doComplete(); }} className="bg-primary">
              {complete.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Completing</> : "Complete task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/" data-testid="link-back" className="press inline-flex h-10 items-center gap-1.5 rounded-full pr-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Queue
    </Link>
  );
}

function TaskSkeleton() {
  return (
    <main className="mx-auto max-w-xl animate-pulse px-4 pt-6" data-testid="status-task-loading">
      <div className="h-5 w-20 rounded bg-muted" />
      <div className="mt-4 h-48 rounded-3xl bg-muted" />
      <div className="mt-6 h-12 rounded-xl bg-muted" />
      <div className="mt-4 h-32 rounded-xl bg-muted" />
    </main>
  );
}
