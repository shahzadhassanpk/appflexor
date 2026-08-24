/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import SlaBadge from "./SlaBadge";
import { camundaApi } from "../services/camundaApi";
import { TaskManager, VariableManager } from "./RuntimeEditors";

const TABS = ["Variables", "Incidents", "User Tasks", "Jobs"];
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
    const [busy, setBusy] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [operationError, setOperationError] = useState("");
    const instanceJobs = jobs.filter(job => job.processInstanceId === instance?.id);
    const incidents = instanceJobs.filter(job => job.exceptionMessage || job.retries === 0);

    useEffect(() => {
        if (instance) {
            setTab(selectedTaskId ? "User Tasks" : "Variables");
            setVariables(instance.variables || {});
            setTasks(instance.tasks || []);
            let active = true;
            Promise.all((instance.tasks || []).map(async task => {
                const links = await camundaApi.getTaskIdentityLinks(task.id).catch(() => []);
                const candidateGroups = links.filter(link => link.type === "candidate" && link.groupId).map(link => link.groupId);
                return { ...task, candidateGroups, candidateGroup: candidateGroups.join(", ") };
            })).then(enrichedTasks => { if (active) setTasks(enrichedTasks); });
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
        try { await onRefresh?.(); }
        catch (error) { setOperationError(error.message || "Unable to refresh instance details."); }
        finally { setRefreshing(false); }
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
                <button type="button" onClick={refreshInstance} disabled={refreshing} className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                    <i className={`fa-solid fa-rotate mr-2 ${refreshing ? "fa-spin" : ""}`} />Refresh
                </button>
                <button type="button" onClick={onClose} title="Close instance details" className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1" aria-label="Close instance details">
                    <i className="fa-solid fa-xmark mr-2" aria-hidden="true" />Close
                </button>
            </div>
        </header>
        <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[300px_1fr]">            
            <aside className="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r"><div className="mb-5"><SlaBadge instance={instance} /></div><dl className="space-y-4 text-sm"><Meta label="Instance ID" value={instance.id} /><Meta label="Business Key" value={instance.businessKey || "—"} /><Meta label="Definition Version" value={instance.definition?.version || "—"} /><Meta label="Definition ID" value={instance.definitionId} /><Meta label="Definition Key" value={instance.definition?.key || "—"} /><Meta label="Definition Name" value={instance.definitionName || "—"} /><Meta label="Tenant ID" value={instance.tenantId || "—"} /><Meta label="Deployment ID" value={instance.definition?.deploymentId || "—"} /></dl></aside>
            <main className="min-w-0 bg-white"><div className="h-[360px] border-b border-slate-200 sm:h-[460px]">{diagramError ? <div className="grid h-full place-items-center text-sm text-red-600">{diagramError}</div> : <div ref={containerRef} className="h-full w-full" />}</div>
                <div className="sticky top-[65px] z-10 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3" role="tablist">{TABS.map(item => <button key={item} type="button" onClick={() => setTab(item)} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab === item ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}>{item}</button>)}</div>
                <div className="p-4">{operationError && <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{operationError}</div>}{tab === "Variables" && <VariableManager variables={variables} busy={busy} onSave={saveVariable} onDelete={deleteVariable} />}{tab === "Incidents" && <List rows={incidents} empty="No open incidents." render={item => item.exceptionMessage || "Job retries exhausted"} />}{tab === "User Tasks" && <TaskManager tasks={tasks} busy={busy} onAssign={assignTask} />}{tab === "Jobs" && <List rows={instanceJobs} empty="No jobs for this instance." render={job => `${job.jobDefinitionId || job.id} · ${job.retries} retries`} />}</div>
            </main>
        </div>
    </aside>;
}

function Meta({ label, value }) { return <div><dt className="font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-all text-slate-900">{value}</dd></div>; }
function List({ rows, empty, render }) { if (!rows.length) return <p className="p-8 text-center text-sm text-slate-500">{empty}</p>; return <div className="divide-y divide-slate-100">{rows.map(item => <div key={item.id} className="p-4 text-sm text-slate-700">{render(item)}</div>)}</div>; }
