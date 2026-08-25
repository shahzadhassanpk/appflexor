/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import { camundaApi } from "../services/camundaApi";

const TABS = ["Process Instances", "Incidents", "Human Tasks", "Jobs"];

function collectActivityIds(activity, result = []) {
    if (!activity) return result;
    (activity.childActivityInstances || []).forEach(child => {
        const children = child.childActivityInstances || [];
        if (!children.length && child.activityId) {
            result.push(child.activityId);
        } else {
            collectActivityIds(child, result);
        }
    });
    return result;
}

function activityCounts(instances, tasks) {
    const treeCounts = instances.flatMap(item => collectActivityIds(item.activity)).reduce((counts, activityId) => {
        counts[activityId] = (counts[activityId] || 0) + 1;
        return counts;
    }, {});
    const taskCounts = tasks.reduce((counts, task) => {
        if (task.taskDefinitionKey) counts[task.taskDefinitionKey] = (counts[task.taskDefinitionKey] || 0) + 1;
        return counts;
    }, {});
    Object.entries(taskCounts).forEach(([id, count]) => { treeCounts[id] = Math.max(treeCounts[id] || 0, count); });
    return treeCounts;
}

function createCountBadge(count) {
    const badge = document.createElement("span");
    badge.className = "process-monitor-activity-count";
    badge.textContent = String(count);
    badge.title = `${count} active activity instance${count === 1 ? "" : "s"}`;
    badge.setAttribute("aria-label", badge.title);
    return badge;
}

export default function ProcessExecutionView({ definition, instances, tasks, jobs, onBack, onSelectInstance, onInstanceDeleted }) {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const [activeTab, setActiveTab] = useState("Process Instances");
    const [diagramError, setDiagramError] = useState("");
    const [versions, setVersions] = useState([definition]);
    const [viewDefinition, setViewDefinition] = useState(definition);
    const [runtimeState, setRuntimeState] = useState({ instances, tasks, jobs });
    const [runtimeRefresh, setRuntimeRefresh] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const definitionInstances = useMemo(() => runtimeState.instances.filter(item => item.definitionId === viewDefinition.id), [runtimeState.instances, viewDefinition.id]);
    const definitionTasks = useMemo(() => runtimeState.tasks.filter(item => item.processDefinitionId === viewDefinition.id), [runtimeState.tasks, viewDefinition.id]);
    const definitionJobs = useMemo(() => runtimeState.jobs.filter(item => item.processDefinitionId === viewDefinition.id), [runtimeState.jobs, viewDefinition.id]);
    const incidents = useMemo(() => definitionJobs.filter(item => item.exceptionMessage || item.retries === 0), [definitionJobs]);

    useEffect(() => {
        setViewDefinition(definition);
        camundaApi.getProcessDefinitionVersions(definition.key, definition.tenantId)
            .then(items => setVersions(items?.length ? items : [definition]))
            .catch(() => setVersions([definition]));
    }, [definition]);

    useEffect(() => {
        let disposed = false;
        async function loadLatestRuntimeState() {
            setRefreshing(true);
            try {
                const [latestInstances, latestTasks, latestJobs] = await Promise.all([
                    camundaApi.getProcessInstancesByDefinition(viewDefinition.id),
                    camundaApi.getTasksByDefinition(viewDefinition.id),
                    camundaApi.getJobsByDefinition(viewDefinition.id),
                ]);
                const hydratedInstances = await Promise.all((latestInstances || []).map(async instance => ({
                    ...instance,
                    activity: await camundaApi.getActivityInstances(instance.id).catch(() => null),
                })));
                if (!disposed) setRuntimeState({
                    instances: hydratedInstances,
                    tasks: latestTasks || [],
                    jobs: latestJobs || [],
                });
            } catch {
                // Preserve the parent snapshot when a runtime refresh is temporarily unavailable.
            } finally {
                if (!disposed) setRefreshing(false);
            }
        }
        loadLatestRuntimeState();
        return () => { disposed = true; };
    }, [viewDefinition.id, viewDefinition.tenantId, runtimeRefresh]);

    async function deleteInstance() {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await camundaApi.deleteProcessInstance(deleteTarget.id);
            setRuntimeState(previous => ({
                instances: previous.instances.filter(item => item.id !== deleteTarget.id),
                tasks: previous.tasks.filter(item => item.processInstanceId !== deleteTarget.id),
                jobs: previous.jobs.filter(item => item.processInstanceId !== deleteTarget.id),
            }));
            onInstanceDeleted?.(deleteTarget.id);
            setDeleteTarget(null);
        } catch (error) {
            setDeleteError(error.message || "Unable to delete the process instance.");
        } finally {
            setDeleting(false);
        }
    }

    useEffect(() => {
        let disposed = false;
        async function renderDiagram() {
            setDiagramError("");
            try {
                const xmlResult = await camundaApi.getProcessDefinitionXml(viewDefinition.id);
                if (disposed || !containerRef.current) return;
                if (!viewerRef.current) viewerRef.current = new BpmnViewer({ container: containerRef.current });
                await viewerRef.current.importXML(xmlResult.bpmn20Xml);
                const canvas = viewerRef.current.get("canvas");
                const overlays = viewerRef.current.get("overlays");
                const elementRegistry = viewerRef.current.get("elementRegistry");
                canvas.zoom("fit-viewport");
                Object.entries(activityCounts(definitionInstances, definitionTasks)).forEach(([id, count]) => {
                    if (!elementRegistry.get(id)) return;
                    canvas.addMarker(id, "process-monitor-active");
                    overlays.add(id, {
                        position: { bottom: -11, left: -11 },
                        html: createCountBadge(count),
                    });
                });
            } catch (error) {
                if (!disposed) setDiagramError(error.message || "Unable to load BPMN diagram.");
            }
        }
        renderDiagram();
        return () => {
            disposed = true;
            viewerRef.current?.destroy();
            viewerRef.current = null;
        };
    }, [definitionInstances, definitionTasks, viewDefinition.id]);

    return (
        <div className="space-y-4">
            <style>{`
                .process-monitor-active .djs-visual > :first-child { stroke: #0284c7 !important; stroke-width: 4px !important; fill: #e0f2fe !important; }
                .process-monitor-activity-count { display: grid; place-items: center; min-width: 25px; height: 25px; padding: 0 6px; border: 2px solid #0369a1; border-radius: 9999px; background: #7dd3fc; color: #0c4a6e; font: 700 13px/1 sans-serif; box-shadow: 0 1px 3px rgba(15, 23, 42, .25); }
            `}</style>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
                    <button type="button" onClick={onBack} className="font-semibold text-indigo-600 hover:underline">Dashboard</button><i className="fa-solid fa-angle-right text-slate-400" /><span className="text-slate-500">Processes</span><i className="fa-solid fa-angle-right text-slate-400" /><span className="font-medium text-slate-800">{viewDefinition.name || viewDefinition.key}: Version {viewDefinition.version}</span>
                </nav>
                <button type="button" onClick={() => setRuntimeRefresh(value => value + 1)} disabled={refreshing} className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
                    <i className={`fa-solid fa-rotate mr-2 ${refreshing ? "fa-spin" : ""}`} />Refresh
                </button>
            </div>
            <div className="grid min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[260px_1fr]">
                <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
                    <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><i className="fa-solid fa-arrow-left" />All processes</button>
                    <dl className="space-y-4 text-sm">
                        <div><dt className="font-semibold text-slate-500">Definition Version</dt><dd className="mt-1"><select value={viewDefinition.id} onChange={event => setViewDefinition(versions.find(item => item.id === event.target.value) || definition)} className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900">{versions.map(item => <option key={item.id} value={item.id}>Version {item.version}{item.versionTag ? ` · ${item.versionTag}` : ""}</option>)}</select></dd></div>
                        <div><dt className="font-semibold text-slate-500">Version Tag</dt><dd className="mt-1 text-slate-900">{viewDefinition.versionTag || "—"}</dd></div>
                        <div><dt className="font-semibold text-slate-500">Definition ID</dt><dd className="mt-1 break-all text-slate-900">{viewDefinition.id}</dd></div>
                        <div><dt className="font-semibold text-slate-500">Definition Key</dt><dd className="mt-1 text-slate-900">{viewDefinition.key}</dd></div>
                        <div><dt className="font-semibold text-slate-500">Definition Name</dt><dd className="mt-1 text-slate-900">{viewDefinition.name || viewDefinition.key}</dd></div>
                        <div><dt className="font-semibold text-slate-500">Tenant ID</dt><dd className="mt-1 text-slate-900">{viewDefinition.tenantId || "—"}</dd></div>
                        <div><dt className="font-semibold text-slate-500">Deployment ID</dt><dd className="mt-1 break-all text-indigo-600">{viewDefinition.deploymentId || "—"}</dd></div>
                        <div><dt className="font-semibold text-slate-500">Instances Running</dt><dd className="mt-1 text-xl font-bold text-indigo-600">{definitionInstances.length}</dd></div>
                    </dl>
                </aside>
                <div className="min-w-0">
                    <div className="relative h-[330px] border-b border-slate-200 bg-white sm:h-[420px]">
                        {diagramError ? <div className="grid h-full place-items-center p-6 text-sm text-red-600">{diagramError}</div> : <div ref={containerRef} className="h-full w-full" />}
                        <span className="absolute right-4 top-4 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">Active activities highlighted</span>
                    </div>
                    <div className="p-4">
                        <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">{TABS.map(tab => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}>{tab}</button>)}</div>
                        {activeTab === "Process Instances" && <RuntimeTable rows={definitionInstances} onSelect={onSelectInstance} onDelete={setDeleteTarget} />}
                        {activeTab === "Incidents" && <MessageList rows={incidents} empty="No open incidents." render={item => item.exceptionMessage || "Job retries exhausted"} />}
                        {activeTab === "Human Tasks" && <MessageList rows={definitionTasks} empty="No open human tasks." render={item => `${item.name || item.taskDefinitionKey} · ${item.assignee || "Unassigned"}`} />}
                        {activeTab === "Jobs" && <MessageList rows={definitionJobs} empty="No jobs for this definition." render={item => `${item.jobDefinitionId || item.id} · ${item.retries} retries`} />}
                    </div>
                </div>
            </div>
            {deleteTarget && <div className="fixed inset-0 z-[1100] grid place-items-center bg-slate-950/50 p-4" role="presentation" onMouseDown={() => !deleting && setDeleteTarget(null)}><section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-instance-title" onMouseDown={event => event.stopPropagation()}><div className="flex items-start gap-3 p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-100 text-red-600"><i className="fa-solid fa-trash-can" aria-hidden="true" /></span><div className="min-w-0"><h2 id="delete-instance-title" className="mb-1 text-base font-bold text-slate-900">Delete process instance?</h2><p className="mb-1 text-sm text-slate-600">This permanently deletes the running instance and its active tasks.</p><p className="mb-0 break-all text-xs font-medium text-slate-500">{deleteTarget.businessKey || deleteTarget.id}</p></div></div>{deleteError && <div role="alert" className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteError}</div>}<div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="!rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Cancel</button><button type="button" disabled={deleting} onClick={deleteInstance} className="!rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"><i className={`fa-solid ${deleting ? "fa-spinner fa-spin" : "fa-trash-can"} mr-2`} />{deleting ? "Deleting…" : "Delete instance"}</button></div></section></div>}
        </div>
    );
}

function RuntimeTable({ rows, onSelect, onDelete }) {
    if (!rows.length) return <p className="p-8 text-center text-sm text-slate-500">No running process instances.</p>;
    return <div className="overflow-x-auto"><table className="mt-2 w-full min-w-[650px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">State</th><th className="p-3">ID</th><th className="p-3">Business Key</th><th className="p-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(item => <tr key={item.id}><td className="p-3"><i className="fa-solid fa-circle-check text-emerald-500" /></td><td className="p-3"><button type="button" onClick={() => onSelect(item.id)} className="font-medium text-indigo-600 hover:underline">{item.id}</button></td><td className="p-3">{item.businessKey || "—"}</td><td className="p-3 text-right"><button type="button" onClick={() => onDelete(item)} title="Delete process instance" aria-label={`Delete process instance ${item.id}`} className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"><i className="fa-solid fa-trash-can" aria-hidden="true" /></button></td></tr>)}</tbody></table></div>;
}

function MessageList({ rows, empty, render }) {
    if (!rows.length) return <p className="p-8 text-center text-sm text-slate-500">{empty}</p>;
    return <div className="divide-y divide-slate-100">{rows.map(item => <div key={item.id} className="p-4 text-sm text-slate-700">{render(item)}</div>)}</div>;
}
