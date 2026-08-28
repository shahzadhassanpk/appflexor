/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import SlaBadge from "./SlaBadge";
import { camundaApi } from "../services/camundaApi";
import { TaskManager, VariableManager } from "./RuntimeEditors";

const TABS = ["Variables", "Incidents", "User Tasks", "Jobs", "External Tasks"];
function leafIds(activity, result = []) { (activity?.childActivityInstances || []).forEach(child => { const nested = child.childActivityInstances || []; if (!nested.length && child.activityId) result.push(child.activityId); else leafIds(child, result); }); return result; }
function counts(activity, tasks = []) {
    const result = leafIds(activity).reduce((all, id) => ({ ...all, [id]: (all[id] || 0) + 1 }), {});
    const taskCounts = tasks.reduce((all, task) => {
        if (task.taskDefinitionKey) all[task.taskDefinitionKey] = (all[task.taskDefinitionKey] || 0) + 1;
        return all;
    }, {});
    Object.entries(taskCounts).forEach(([id, count]) => { result[id] = Math.max(result[id] || 0, count); });
    return result;
}
function countBadge(count) { const node = document.createElement("span"); node.className = "process-monitor-activity-count"; node.textContent = String(count); node.title = `${count} active activity instance${count === 1 ? "" : "s"}`; return node; }

export default function InstanceDetail({ instance, selectedTaskId, jobs, onClose, onRefresh }) {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const [tab, setTab] = useState(selectedTaskId ? "User Tasks" : "Variables");
    const [diagramError, setDiagramError] = useState("");
    const [variables, setVariables] = useState({});
    const [tasks, setTasks] = useState([]);
    const [externalTasks, setExternalTasks] = useState([]);
    const [externalTasksLoading, setExternalTasksLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [retryTarget, setRetryTarget] = useState(null);
    const [retryCount, setRetryCount] = useState(1);
    const [retryingJob, setRetryingJob] = useState(false);
    const [operationError, setOperationError] = useState("");
    const instanceJobs = jobs.filter(job => job.processInstanceId === instance?.id);
    const incidents = instanceJobs.filter(job => job.exceptionMessage || job.retries === 0);

    useEffect(() => {
        if (instance) {
            setTab(selectedTaskId ? "User Tasks" : "Variables");
            setVariables(instance.variables || {});
            setTasks(instance.tasks || []);
            setExternalTasksLoading(true);
            let active = true;
            Promise.all([
                Promise.all((instance.tasks || []).map(async task => {
                    const links = await camundaApi.getTaskIdentityLinks(task.id).catch(() => []);
                    const candidateGroups = links.filter(link => link.type === "candidate" && link.groupId).map(link => link.groupId);
                    return { ...task, candidateGroups, candidateGroup: candidateGroups.join(", ") };
                })),
                camundaApi.getExternalTasksByInstance(instance.id).catch(() => []),
            ]).then(([enrichedTasks, latestExternalTasks]) => {
                if (active) {
                    setTasks(enrichedTasks);
                    setExternalTasks(latestExternalTasks || []);
                    setExternalTasksLoading(false);
                }
            });
            return () => { active = false; };
        }
        return undefined;
    }, [instance, selectedTaskId]);

    function typedValue(value, type) {
        if (type === "Boolean") return value === "true";
        if (["Integer", "Long", "Double"].includes(type)) return Number(value);
        if (type === "Json") return JSON.stringify(JSON.parse(value));
        return value;
    }

    async function saveVariable(editor) {
        setBusy(true); setOperationError("");
        try {
            const variable = { type: editor.type, value: typedValue(editor.value, editor.type) };
            let mutationError = null;
            try { await camundaApi.setInstanceVariable(instance.id, editor.name, variable); }
            catch (error) { mutationError = error; }
            const storedVariable = editor.type === "Json"
                ? await camundaApi.getSerializedInstanceVariable(instance.id, editor.name)
                : await camundaApi.getInstanceVariable(instance.id, editor.name);
            if (editor.type === "Json" && typeof storedVariable?.value === "string") {
                try { storedVariable.value = JSON.parse(storedVariable.value); } catch { /* Display raw invalid JSON. */ }
            }
            const stored = storedVariable?.value;
            const normalize = value => {
                if (typeof value !== "string") return JSON.stringify(value);
                try { return JSON.stringify(JSON.parse(value)); } catch { return value; }
            };
            if (mutationError && normalize(stored) !== normalize(variable.value)) throw mutationError;
            setVariables(previous => ({ ...previous, [editor.name]: storedVariable }));
        } catch (error) { setOperationError(error.message || "Unable to save variable."); throw error; }
        finally { setBusy(false); }
    }

    async function deleteVariable(name) {
        setBusy(true); setOperationError("");
        try { let mutationError = null; try { await camundaApi.deleteInstanceVariable(instance.id, name); } catch (error) { mutationError = error; } const updatedVariables = await camundaApi.getInstanceVariables(instance.id); if (mutationError && updatedVariables?.[name] !== undefined) throw mutationError; setVariables(updatedVariables || {}); }
        catch (error) { setOperationError(error.message || "Unable to delete variable."); }
        finally { setBusy(false); }
    }

    async function assignTask(task, type, value) {
        setBusy(true); setOperationError("");
        try {
            let mutationError = null;
            try {
                if (type === "group") await camundaApi.addTaskCandidateGroup(task.id, value);
                else await camundaApi.assignTaskUser(task.id, value);
            } catch (error) { mutationError = error; }
            const [updatedTask, identityLinks] = await Promise.all([
                camundaApi.getTask(task.id),
                camundaApi.getTaskIdentityLinks(task.id),
            ]);
            const candidateGroups = (identityLinks || []).filter(link => link.type === "candidate" && link.groupId).map(link => link.groupId);
            const assignmentUpdated = type === "group" ? candidateGroups.includes(value) : updatedTask?.assignee === value;
            if (mutationError && !assignmentUpdated) throw mutationError;
            setTasks(previous => previous.map(item => item.id === task.id ? { ...item, ...updatedTask, candidateGroups, candidateGroup: candidateGroups.join(", ") } : item));
            await onRefresh?.();
        } catch (error) { setOperationError(error.message || "Unable to assign task."); throw error; }
        finally { setBusy(false); }
    }

    async function refreshInstance() {
        setRefreshing(true);
        setOperationError("");
        try {
            const [, latestExternalTasks] = await Promise.all([
                onRefresh?.(),
                camundaApi.getExternalTasksByInstance(instance.id),
            ]);
            setExternalTasks(latestExternalTasks || []);
        }
        catch (error) { setOperationError(error.message || "Unable to refresh instance details."); }
        finally { setRefreshing(false); }
    }

    async function retryFailedJob() {
        if (!retryTarget) return;
        setRetryingJob(true);
        setOperationError("");
        try {
            await camundaApi.setJobRetries(retryTarget.id, Math.max(1, Number(retryCount) || 1));
            await onRefresh?.();
            setRetryTarget(null);
        } catch (error) {
            setOperationError(error.message || "Unable to retry the failed job.");
        } finally {
            setRetryingJob(false);
        }
    }

    useEffect(() => {
        if (!instance) return undefined;
        let disposed = false;
        async function renderDiagram() {
            try {
                const xml = await camundaApi.getProcessDefinitionXml(instance.definitionId);
                if (disposed || !containerRef.current) return;
                viewerRef.current = new BpmnViewer({ container: containerRef.current });
                await viewerRef.current.importXML(xml.bpmn20Xml);
                const canvas = viewerRef.current.get("canvas");
                const registry = viewerRef.current.get("elementRegistry");
                const overlays = viewerRef.current.get("overlays");
                canvas.zoom("fit-viewport");
                Object.entries(counts(instance.activity, instance.tasks)).forEach(([id, count]) => {
                    if (!registry.get(id)) return;
                    canvas.addMarker(id, "process-monitor-active");
                    overlays.add(id, { position: { bottom: -11, left: -11 }, html: countBadge(count) });
                });
            } catch (error) { if (!disposed) setDiagramError(error.message || "Unable to load BPMN diagram."); }
        }
        renderDiagram();
        return () => { disposed = true; viewerRef.current?.destroy(); viewerRef.current = null; };
    }, [instance]);

    if (!instance) return null;
    return <aside className="fixed inset-0 z-[1080] overflow-y-auto bg-slate-50" aria-labelledby="instance-detail-title">
        <style>{`.process-monitor-active .djs-visual > :first-child{stroke:#0284c7!important;stroke-width:4px!important;fill:#e0f2fe!important}.process-monitor-activity-count{display:grid;place-items:center;min-width:25px;height:25px;padding:0 6px;border:2px solid #0369a1;border-radius:9999px;background:#7dd3fc;color:#0c4a6e;font:700 13px/1 sans-serif;box-shadow:0 1px 3px rgba(15,23,42,.25)}`}</style>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
            <nav className="min-w-0 truncate text-sm"><span className="font-semibold text-indigo-600">Dashboard</span><i className="fa-solid fa-angle-right mx-2 text-slate-400" /><span className="font-semibold text-indigo-600">Processes</span><i className="fa-solid fa-angle-right mx-2 text-slate-400" /><span id="instance-detail-title">{instance.definitionName || instance.definitionId}: {instance.id}: Runtime</span></nav>
            <div className="ml-3 flex shrink-0 items-center gap-2">
                <button type="button" onClick={refreshInstance} disabled={refreshing} className="inline-flex h-10 items-center rounded-full bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                    <i className={`fa-solid fa-rotate mr-2 ${refreshing ? "fa-spin" : ""}`} />Refresh
                </button>
                <button type="button" onClick={onClose} title="Close instance details" className="inline-flex h-10 items-center rounded-full bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1" aria-label="Close instance details">
                    <i className="fa-solid fa-xmark mr-2" aria-hidden="true" />Close
                </button>
            </div>
        </header>
        <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[300px_1fr]">            
            <aside className="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r"><div className="mb-5"><SlaBadge instance={instance} /></div><dl className="space-y-4 text-sm"><Meta label="Instance ID" value={instance.id} /><Meta label="Business Key" value={instance.businessKey || "—"} /><Meta label="Definition Version" value={instance.definition?.version || "—"} /><Meta label="Definition ID" value={instance.definitionId} /><Meta label="Definition Key" value={instance.definition?.key || "—"} /><Meta label="Definition Name" value={instance.definitionName || "—"} /><Meta label="Tenant ID" value={instance.tenantId || "—"} /><Meta label="Deployment ID" value={instance.definition?.deploymentId || "—"} /></dl></aside>
            <main className="min-w-0 bg-white"><div className="h-[360px] border-b border-slate-200 sm:h-[460px]">{diagramError ? <div className="grid h-full place-items-center text-sm text-red-600">{diagramError}</div> : <div ref={containerRef} className="h-full w-full" />}</div>
                <div className="sticky top-[65px] z-10 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3" role="tablist">{TABS.map(item => <button key={item} type="button" onClick={() => setTab(item)} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab === item ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}>{item}</button>)}</div>
                <div className="p-4">{operationError && <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{operationError}</div>}{tab === "Variables" && <VariableManager variables={variables} busy={busy} onSave={saveVariable} onDelete={deleteVariable} />}{tab === "Incidents" && <List rows={incidents} empty="No open incidents." render={item => item.exceptionMessage || "Job retries exhausted"} />}{tab === "User Tasks" && <TaskManager tasks={tasks} busy={busy} onAssign={assignTask} />}{tab === "Jobs" && <JobTable rows={instanceJobs} onRetry={job => { setRetryCount(1); setRetryTarget(job); }} />}{tab === "External Tasks" && <ExternalTaskTable rows={externalTasks} loading={externalTasksLoading} />}</div>
            </main>
        </div>
        {retryTarget && <div className="fixed inset-0 z-[1100] grid place-items-center bg-slate-950/50 p-4" role="presentation"><section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="retry-job-title"><div className="flex items-start gap-3 p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><i className="fa-solid fa-rotate-right" aria-hidden="true" /></span><div className="min-w-0"><h2 id="retry-job-title" className="mb-1 text-base font-bold text-slate-900">Retry failed job?</h2><p className="mb-1 text-sm text-slate-600">Set the retry count to make this job executable again.</p><p className="mb-0 break-all text-xs text-slate-500">{retryTarget.id}</p></div></div><div className="px-5 pb-5"><label className="block text-sm font-semibold text-slate-700">Retries<input type="number" min="1" step="1" value={retryCount} onChange={event => setRetryCount(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label></div><div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3"><button type="button" disabled={retryingJob} onClick={() => setRetryTarget(null)} className="!rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Cancel</button><button type="button" disabled={retryingJob} onClick={retryFailedJob} className="!rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"><i className={`fa-solid ${retryingJob ? "fa-spinner fa-spin" : "fa-rotate-right"} mr-2`} />{retryingJob ? "Retrying…" : "Retry job"}</button></div></section></div>}
    </aside>;
}

function Meta({ label, value }) { return <div><dt className="font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-all text-slate-900">{value}</dd></div>; }
function List({ rows, empty, render }) { if (!rows.length) return <p className="p-8 text-center text-sm text-slate-500">{empty}</p>; return <div className="divide-y divide-slate-100">{rows.map(item => <div key={item.id} className="p-4 text-sm text-slate-700">{render(item)}</div>)}</div>; }

function JobTable({ rows, onRetry }) {
    if (!rows.length) return <p className="p-8 text-center text-sm text-slate-500">No jobs for this instance.</p>;
    return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600"><tr><th className="px-3 py-2.5">Job ID</th><th className="px-3 py-2.5">Retries</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Exception</th><th className="px-3 py-2.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(job => { const failed = Boolean(job.exceptionMessage) || job.retries === 0; return <tr key={job.id} className="hover:bg-slate-50"><td className="px-3 py-3 break-all">{job.id}</td><td className="px-3 py-3">{job.retries ?? "—"}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${failed ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{failed ? "Failed" : "Ready"}</span></td><td className="max-w-xs truncate px-3 py-3 text-slate-600" title={job.exceptionMessage || ""}>{job.exceptionMessage || "—"}</td><td className="px-3 py-3 text-right">{failed && <button type="button" onClick={() => onRetry(job)} className="!rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"><i className="fa-solid fa-rotate-right mr-1.5" />Retry</button>}</td></tr>; })}</tbody></table></div>;
}

function ExternalTaskTable({ rows, loading }) {
    if (loading) return <p className="p-8 text-center text-sm text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2" />Loading external tasks…</p>;
    if (!rows.length) return <p className="p-8 text-center text-sm text-slate-500">No external tasks for this instance.</p>;
    return <><div className="grid gap-3 md:hidden">{rows.map(task => <article key={task.id} className="rounded-xl border border-slate-200 p-3 text-sm"><div className="mb-2 flex items-start justify-between gap-2"><strong className="break-all text-slate-800">{task.id}</strong><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Priority {task.priority ?? 0}</span></div><dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs"><dt className="text-slate-500">Activity</dt><dd className="text-indigo-600">{task.activityId || "—"}</dd><dt className="text-slate-500">Retries</dt><dd>{task.retries ?? "—"}</dd><dt className="text-slate-500">Worker</dt><dd className="break-all">{task.workerId || "—"}</dd><dt className="text-slate-500">Topic</dt><dd className="break-all">{task.topicName || "—"}</dd><dt className="text-slate-500">Lock expires</dt><dd>{task.lockExpirationTime || "—"}</dd></dl></article>)}</div><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600"><tr><th className="px-3 py-2.5">External Task ID</th><th className="px-3 py-2.5">Activity</th><th className="px-3 py-2.5">Retries</th><th className="px-3 py-2.5">Worker ID</th><th className="px-3 py-2.5">Lock Expiration Time</th><th className="px-3 py-2.5">Topic</th><th className="px-3 py-2.5">Priority</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(task => <tr key={task.id} className="hover:bg-slate-50"><td className="px-3 py-3 text-slate-600">{task.id}</td><td className="px-3 py-3 font-medium text-indigo-600">{task.activityId || "—"}</td><td className="px-3 py-3">{task.retries ?? "—"}</td><td className="px-3 py-3">{task.workerId || "—"}</td><td className="px-3 py-3">{task.lockExpirationTime || "—"}</td><td className="px-3 py-3">{task.topicName || "—"}</td><td className="px-3 py-3">{task.priority ?? 0}</td></tr>)}</tbody></table></div></>;
}
