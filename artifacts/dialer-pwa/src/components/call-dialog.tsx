import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Loader2, Phone, PhoneOff, Save } from "lucide-react";
import {
  saveDialerLog, completeDialerTask, assignedTasksKey, availableTasksKey, taskDetailKey,
  type DialerSession, type DialerTask, type DialerTaskList,
} from "@/lib/crm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOnline } from "@/hooks/use-device";
import { useToast } from "@/hooks/use-toast";
import { OUTCOME_META, errMessage, isOutcome, loadDraft, removeDraft, saveDraft, telHref, type Outcome } from "@/lib/dialer";

type Props = {
  session: DialerSession;
  task: DialerTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown when the automatic native dial after claim may have been blocked. */
  dialHint?: string | null;
  autoDialNext: boolean;
  onAutoDialNextChange: (enabled: boolean) => void;
  onCompleted: (taskId: string) => void;
};

export function CallDialog({ session, task, open, onOpenChange, dialHint, autoDialNext, onAutoDialNextChange, onCompleted }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const online = useOnline();
  const [status, setStatus] = useState<Outcome | "">("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const initFor = useRef<string | null>(null);
  const done = useRef(false);

  const save = useMutation({
    mutationFn: (v: { task: DialerTask; status: Outcome; comments: string }) => saveDialerLog(session, v.task, v.status, v.comments),
  });
  const complete = useMutation({
    mutationFn: (v: { task: DialerTask; status: Outcome; comments: string }) => completeDialerTask(session, v.task, v.status, v.comments),
  });
  const busy = save.isPending || complete.isPending;

  useEffect(() => {
    if (!task || !open) return;
    if (initFor.current === task.id) return;
    initFor.current = task.id;
    done.current = false;
    setError(null); setSavedNote(null);
    const d = loadDraft(session.username, task.id);
    if (d) { setStatus(d.status); setComments(d.comments); }
    else { setStatus(isOutcome(task.status) ? task.status : ""); setComments(task.comments ?? ""); }
  }, [task, open, session.username]);

  useEffect(() => {
    if (!task || initFor.current !== task.id || done.current) return;
    const pristine = status === (isOutcome(task.status) ? task.status : "") && comments === (task.comments ?? "");
    if (pristine) removeDraft(session.username, task.id);
    else saveDraft(session.username, task.id, { status, comments });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, comments, session.username]);

  const tel = telHref(task?.phone);
  const canAct = !!task && !!status && online && !busy;

  const setOpen = (o: boolean) => {
    if (busy) return;
    if (!o) initFor.current = null;
    onOpenChange(o);
  };

  const doSave = () => {
    if (!task || !status || !canAct) return;
    setError(null); setSavedNote(null);
    save.mutate({ task, status, comments }, {
      onSuccess: async () => {
        setSavedNote(`Call log saved as ${status}. Task stays assigned to you.`);
        // Cancel older reads before applying the confirmed write, so an
        // in-flight queue response cannot restore the previous Unset badge.
        await qc.cancelQueries({ queryKey: assignedTasksKey });
        qc.setQueryData<DialerTaskList>(assignedTasksKey, (old) => old ? {
          ...old,
          tasks: old.tasks.map(t => t.id === task.id ? { ...t, status, comments } : t),
        } : old);
        qc.setQueryData<DialerTask>(taskDetailKey(task.id), old => ({ ...(old ?? task), status, comments }));
        qc.invalidateQueries({ queryKey: assignedTasksKey });
        toast({ title: "Call log saved", description: `${task.name || "Lead"} remains in your assigned tasks.` });
      },
      onError: (err) => setError(errMessage(err, "Could not save the call log. Your entries are kept.")),
    });
  };

  const doComplete = () => {
    if (!task || !status || !canAct) return;
    setError(null); setSavedNote(null);
    complete.mutate({ task, status, comments }, {
      onSuccess: (res) => {
        if (!res.completed) { setError("Appflexor did not confirm completion. Your entries are kept; try again."); return; }
        done.current = true;
        removeDraft(session.username, task.id);
        qc.setQueryData<DialerTaskList>(assignedTasksKey, (old) => old ? { ...old, tasks: old.tasks.filter((t) => t.id !== task.id) } : old);
        qc.setQueryData<DialerTaskList>(availableTasksKey, (old) => old ? { ...old, tasks: old.tasks.filter((t) => t.id !== task.id) } : old);
        qc.removeQueries({ queryKey: taskDetailKey(task.id) });
        qc.invalidateQueries({ queryKey: assignedTasksKey });
        qc.invalidateQueries({ queryKey: availableTasksKey });
        toast({ title: `${task.name || "Lead"} logged as ${OUTCOME_META[status].label}`, description: "Task completed in Appflexor." });
        initFor.current = null;
        onOpenChange(false);
        onCompleted(task.id);
      },
      onError: (err) => setError(errMessage(err, "Could not complete the task. Your entries are kept.")),
    });
  };

  return (
    <Dialog open={open && !!task} onOpenChange={setOpen}>
      <DialogContent
        data-testid="dialog-call"
        className="w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-3xl border-card-border bg-background p-0"
        onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (busy) e.preventDefault(); }}
        onInteractOutside={(e) => { if (busy) e.preventDefault(); }}
      >
        {task && (
          <>
            <div className="bg-sidebar p-5 pb-4 text-sidebar-foreground">
              <DialogHeader className="text-left">
                <p className="tabnum text-[11px] uppercase tracking-[0.18em] opacity-60">{task.taskName || "Lead call"}</p>
                <DialogTitle className="text-xl font-extrabold">Call in progress</DialogTitle>
                <DialogDescription className="text-xs text-sidebar-foreground/70">
                  Record the outcome. Closing keeps the task assigned to you.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider opacity-60" htmlFor="call-name">Name</label>
                <input id="call-name" data-testid="input-call-name" readOnly value={task.name || "Unnamed lead"}
                  className="h-10 rounded-lg bg-sidebar-accent px-3 text-sm font-bold outline-none" />
                <label className="text-[10px] font-semibold uppercase tracking-wider opacity-60" htmlFor="call-phone">Phone</label>
                <input id="call-phone" data-testid="input-call-phone" readOnly value={task.phone || "No phone number"}
                  className="tabnum h-10 rounded-lg bg-sidebar-accent px-3 text-sm outline-none" />
              </div>
            </div>
            {tel ? (
              <a href={tel} data-testid="link-dial-again"
                className="press flex items-center justify-center gap-2 bg-accent py-3 text-sm font-bold text-accent-foreground hover:brightness-105">
                <Phone className="h-4 w-4" /> Dial again
              </a>
            ) : (
              <div data-testid="status-call-no-phone" className="flex items-center justify-center gap-2 bg-muted py-3 text-xs font-semibold text-muted-foreground">
                <PhoneOff className="h-4 w-4" /> No dialable number on this task
              </div>
            )}

            <div className="space-y-4 p-5">
              {dialHint && <p data-testid="text-dial-hint" className="rounded-lg bg-accent/10 px-3 py-2 text-xs">{dialHint}</p>}
              <div>
                <label htmlFor="call-outcome" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outcome</label>
                <select id="call-outcome" data-testid="select-call-status" value={status} disabled={busy}
                  onChange={(e) => { setStatus(isOutcome(e.target.value) ? e.target.value : ""); setSavedNote(null); }}
                  className="h-12 w-full rounded-xl border border-input bg-card px-3 text-base font-semibold outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
                  style={status ? { borderColor: `hsl(${OUTCOME_META[status].color})`, color: `hsl(${OUTCOME_META[status].color})` } : undefined}>
                  <option value="">Select outcome</option>
                  <option value="HOT">HOT</option>
                  <option value="RECALL">RECALL</option>
                  <option value="REJECTION">REJECTION</option>
                </select>
              </div>
              <div>
                <label htmlFor="call-comments" className="mb-1.5 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Comments <span className="tabnum normal-case tracking-normal">{comments.length}/10000</span>
                </label>
                <textarea id="call-comments" data-testid="input-call-comments" value={comments} disabled={busy} maxLength={10000} rows={4}
                  onChange={(e) => { setComments(e.target.value); setSavedNote(null); }} placeholder="What was said, best time to call back, next step"
                  className="w-full resize-y rounded-xl border border-input bg-card px-3 py-2.5 text-[15px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60" />
              </div>

              <fieldset disabled={busy} className="rounded-xl border border-border px-3 py-2.5">
                <legend className="px-1 text-xs font-semibold text-muted-foreground">After successful completion</legend>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="auto-dial-next" data-testid="radio-dial-manual"
                      checked={!autoDialNext} onChange={() => onAutoDialNextChange(false)} />
                    Manual
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="auto-dial-next" data-testid="radio-dial-next"
                      checked={autoDialNext} onChange={() => onAutoDialNextChange(true)} />
                    Auto-dial next
                  </label>
                </div>
              </fieldset>

              {!online && <p data-testid="status-call-offline" className="text-xs text-destructive">Offline. Entries are kept on this device; reconnect to save.</p>}
              {savedNote && !error && <p data-testid="text-call-saved" role="status" className="rounded-lg bg-secondary px-3 py-2 text-xs">{savedNote}</p>}
              {error && (
                <div data-testid="text-call-error" role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" data-testid="button-call-save" disabled={!canAct} onClick={doSave}
                  className="press flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card font-bold disabled:opacity-40">
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                </button>
                <button type="button" data-testid="button-call-complete" disabled={!canAct} onClick={doComplete}
                  className="press flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-40">
                  {complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Complete
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
