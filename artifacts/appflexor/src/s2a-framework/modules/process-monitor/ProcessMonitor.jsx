/* eslint-disable react/prop-types */
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../../AppContext";
import Dashboard from "./components/Dashboard";
import DeployedProcesses from "./components/DeployedProcesses";
import InstanceDetail from "./components/InstanceDetail";
import ProcessExecutionView from "./components/ProcessExecutionView";
import { camundaApi } from "./services/camundaApi";
import { calculateSla } from "./utils/sla";
import "../process-configuration/process-theme.css";

async function hydrateJsonVariables(instanceId, variables) {
    const hydrated = { ...(variables || {}) };
    await Promise.all(Object.entries(hydrated).map(async ([name, variable]) => {
        if (variable?.type !== "Json") return;
        const raw = await camundaApi.getSerializedInstanceVariable(instanceId, name).catch(() => null);
        if (!raw) return;
        let value = raw.value;
        if (typeof value === "string") {
            try { value = JSON.parse(value); } catch { /* Keep malformed engine value visible as-is. */ }
        }
        hydrated[name] = { ...variable, ...raw, value };
    }));
    return hydrated;
}

async function mapWithConcurrency(items, concurrency, mapper) {
    const results = [];
    for (let index = 0; index < items.length; index += concurrency) {
        const batch = items.slice(index, index + concurrency);
        results.push(...await Promise.all(batch.map(mapper)));
    }
    return results;
}

export default function ProcessMonitor({ activeTab = "PROCESS_MONITOR" }) {
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id || "";
    const [state, setState] = useState({ definitions: [], instances: [], tasks: [], jobs: [], history: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState({ instanceId: "", taskId: "" });
    const [selectedDefinition, setSelectedDefinition] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [definitions, rawInstances, tasks, history, jobs] = await Promise.all([
                camundaApi.getProcessDefinitions(tenantId), camundaApi.getProcessInstances(tenantId),
                camundaApi.getTasks(tenantId),
                camundaApi.getHistoricInstances(tenantId).catch(() => []),
                camundaApi.getJobs(tenantId).catch(() => []),
            ]);
            const definitionMap = Object.fromEntries((definitions || []).map(item => [item.id, item]));
            const historyMap = Object.fromEntries((history || []).map(item => [item.id, item]));
            const details = await mapWithConcurrency(rawInstances || [], 8, async instance => {
                const [rawVariables, activity] = await Promise.all([
                    camundaApi.getInstanceVariables(instance.id).catch(() => ({})),
                    camundaApi.getActivityInstances(instance.id).catch(() => null),
                ]);
                const variables = await hydrateJsonVariables(instance.id, rawVariables);
                const definition = definitionMap[instance.definitionId];
                const startTime = instance.startTime || historyMap[instance.id]?.startTime;
                return { ...instance, startTime, history: historyMap[instance.id], definition, definitionName: definition?.name || definition?.key, variables, activity, sla: calculateSla(variables, new Date(), startTime), tasks: (tasks || []).filter(task => task.processInstanceId === instance.id) };
            });
            setState({ definitions: definitions || [], instances: details, tasks: tasks || [], jobs: jobs || [], history: history || [] });
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Unable to load process engine monitor data.");
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    async function refreshInstance(instanceId) {
        const [rawInstance, rawVariables, activity, instanceTasks, instanceJobs] = await Promise.all([
            camundaApi.getProcessInstance(instanceId),
            camundaApi.getInstanceVariables(instanceId),
            camundaApi.getActivityInstances(instanceId),
            camundaApi.getTasksByInstance(instanceId),
            camundaApi.getJobsByInstance(instanceId),
        ]);
        const variables = await hydrateJsonVariables(instanceId, rawVariables);
        setState(previous => {
            const existing = previous.instances.find(item => item.id === instanceId);
            const definition = previous.definitions.find(item => item.id === rawInstance.definitionId) || existing?.definition;
            const updated = {
                ...existing,
                ...rawInstance,
                definition,
                definitionName: definition?.name || definition?.key,
                variables,
                activity,
                tasks: instanceTasks || [],
                sla: calculateSla(variables, new Date(), existing?.startTime),
            };
            return {
                ...previous,
                instances: previous.instances.map(item => item.id === instanceId ? updated : item),
                tasks: [...previous.tasks.filter(item => item.processInstanceId !== instanceId), ...(instanceTasks || [])],
                jobs: [...previous.jobs.filter(item => item.processInstanceId !== instanceId), ...(instanceJobs || [])],
            };
        });
    }

    function removeInstance(instanceId) {
        setState(previous => ({
            ...previous,
            instances: previous.instances.filter(item => item.id !== instanceId),
            tasks: previous.tasks.filter(item => item.processInstanceId !== instanceId),
            jobs: previous.jobs.filter(item => item.processInstanceId !== instanceId),
        }));
        setSelected(current => current.instanceId === instanceId ? { instanceId: "", taskId: "" } : current);
    }

    useEffect(() => { if (activeTab === "PROCESS_MONITOR") load(); }, [activeTab, load]);
    const instanceMap = useMemo(() => Object.fromEntries(state.instances.map(item => [item.id, item])), [state.instances]);
    const selectedInstance = instanceMap[selected.instanceId];

    return (
        <main className="process-theme-surface min-h-full bg-slate-50 p-3 text-slate-900 sm:p-5">
            <div className="mx-auto max-w-7xl space-y-5">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <p className="mb-0 text-sm text-slate-500">Live running processes, tasks, SLA health, and job status.</p>
                    <button type="button" onClick={load} disabled={loading} className="!rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"><i className={`fa-solid fa-rotate mr-2 ${loading ? "fa-spin" : ""}`} />Refresh</button>
                </header>
                {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                {loading ? <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white py-20"><div className="text-center"><i className="fa-solid fa-circle-notch fa-spin text-2xl text-indigo-600" /><p className="mt-3 text-sm text-slate-500">Loading process operations…</p></div></div> : <>
                    <Dashboard {...state} tenantId={tenantId} />
                    <DeployedProcesses definitions={state.definitions} instances={state.instances} jobs={state.jobs} onSelectDefinition={setSelectedDefinition} />
                    {/* <div className="grid gap-5 xl:grid-cols-[1.3fr_.9fr]">
                        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="mb-0 text-lg font-bold">Running instances</h2></div><div className="divide-y divide-slate-100">{state.instances.map(instance => <button key={instance.id} type="button" onClick={() => setSelected({ instanceId: instance.id, taskId: "" })} className="block w-full p-4 text-left hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="mb-1 truncate font-semibold">{instance.definitionName || instance.definitionId}</p><p className="mb-0 truncate text-xs text-slate-500">{instance.businessKey || instance.id} · Tenant {instance.tenantId || "none"}</p></div><SlaBadge instance={instance} /></div></button>)}{!state.instances.length && <div className="p-10 text-center text-sm text-slate-500">No running instances in this tenant.</div>}</div></section>
                        <TaskList tasks={state.tasks} currentUser={currentUser} instanceMap={instanceMap} onSelectInstance={(instanceId, taskId) => setSelected({ instanceId, taskId })} />
                    </div> */}
                </>}
            </div>
            {selectedDefinition && (
                <div className="fixed inset-0 z-[1070] overflow-y-auto bg-slate-50 p-3 sm:p-5">
                    <ProcessExecutionView definition={selectedDefinition} instances={state.instances} tasks={state.tasks} jobs={state.jobs} onBack={() => setSelectedDefinition(null)} onSelectInstance={instanceId => setSelected({ instanceId, taskId: "" })} onInstanceDeleted={removeInstance} />
                </div>
            )}
            <InstanceDetail instance={selectedInstance} selectedTaskId={selected.taskId} jobs={state.jobs} onRefresh={() => refreshInstance(selected.instanceId)} onClose={() => setSelected({ instanceId: "", taskId: "" })} />
        </main>
    );
}
