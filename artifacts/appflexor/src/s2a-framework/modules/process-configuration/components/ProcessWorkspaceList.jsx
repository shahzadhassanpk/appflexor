/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { camundaApi } from "../../process-monitor/services/camundaApi";
import "../process-theme.css";

function Stat({ icon, label, value, tone }) {
    const cardTone = tone.includes("emerald")
        ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300"
        : tone.includes("amber")
            ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300"
                : tone.includes("red")
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300"
                    : tone.includes("sky")
                        ? "border-sky-200 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300"
                        : tone.includes("slate")
                            ? "border-slate-200 bg-gradient-to-br from-slate-100 to-white hover:border-slate-300"
                            : "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white hover:border-indigo-300";
    return <div className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cardTone}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}><i className={icon} aria-hidden="true" /></span><div className="min-w-0"><p className="mb-0 text-xl font-bold leading-none text-slate-900">{value}</p><span className="mt-1 block truncate text-xs font-semibold text-slate-600">{label}</span></div></div>;
}

function valueFor(item, column) { return column.sortValue ? column.sortValue(item) : item[column.key] ?? ""; }

function definitionKeyFromId(definitionId = "") {
    const value = String(definitionId || "");
    return value ? value.split(":")[0] || value : "";
}

function buildMonitorStats(definitions = [], instances = [], tasks = [], failedJobs = []) {
    const displayedDefinitionIds = new Set(definitions.map(item => item.id).filter(Boolean));
    const deployments = new Set(definitions.map(item => item.deploymentId).filter(Boolean)).size;
    const runningInstanceCount = new Set(instances
        .filter(instance => displayedDefinitionIds.has(instance.definitionId))
        .map(instance => instance.id)
        .filter(Boolean)).size;
    const failedInstanceCount = new Set(failedJobs
        .filter(job => job?.exceptionMessage || job?.retries === 0)
        .map(job => job.processInstanceId || `${definitionKeyFromId(job.processDefinitionId)}:${job.id}`)
        .filter(Boolean)).size;
    const now = new Date();
    const overdue = tasks.filter(task => {
        if (!task.due) return false;
        const due = new Date(task.due);
        return !Number.isNaN(due.getTime()) && due < now;
    }).length;

    return [
        { icon: "fa-solid fa-diagram-project", label: "Process Definitions", value: definitions.length, tone: "bg-indigo-100 text-indigo-700" },
        { icon: "fa-solid fa-rocket", label: "Deployments", value: deployments, tone: "bg-sky-100 text-sky-700" },
        { icon: "fa-solid fa-play", label: "Running Instances", value: runningInstanceCount, tone: "bg-emerald-100 text-emerald-700" },
        { icon: "fa-solid fa-triangle-exclamation", label: "Failed Instances", value: failedInstanceCount, tone: failedInstanceCount ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600" },
        { icon: "fa-solid fa-clock", label: "Overdue Tasks", value: overdue, tone: overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700" },
    ];
}

export default function ProcessWorkspaceList({ title, description, stats, items, loading = false, onRefresh, showArchived = false, setShowArchived, searchTerm, setSearchTerm, searchPlaceholder, columns, page, setPage, pageSize, setPageSize, onAdd, addLabel, renderActions }) {
    const [sort, setSort] = useState({ key: columns[0].key, direction: "asc" });
    const [filterRestored, setFilterRestored] = useState(false);
    const [monitorStats, setMonitorStats] = useState(null);
    const [monitorStatsLoading, setMonitorStatsLoading] = useState(false);
    const filterStorageKey = useMemo(() => {
        const key = `${title || "process-workspace"}-${searchPlaceholder || "search"}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        return `appflexor.processWorkspaceList.${key}`;
    }, [searchPlaceholder, title]);
    const displayStats = monitorStats || stats;

    async function loadMonitorStats() {
        setMonitorStatsLoading(true);
        try {
            const [definitions, instances, tasks, failedJobs] = await Promise.all([
                camundaApi.getProcessDefinitions().catch(() => []),
                camundaApi.getProcessInstances().catch(() => []),
                camundaApi.getTasks().catch(() => []),
                camundaApi.getFailedJobs().catch(() => []),
            ]);
            setMonitorStats(buildMonitorStats(definitions, instances, tasks, failedJobs));
        } catch {
            setMonitorStats(null);
        } finally {
            setMonitorStatsLoading(false);
        }
    }

    function handleRefresh() {
        onRefresh();
        loadMonitorStats();
    }

    useEffect(() => {
        let cancelled = false;
        setMonitorStatsLoading(true);
        Promise.all([
            camundaApi.getProcessDefinitions().catch(() => []),
            camundaApi.getProcessInstances().catch(() => []),
            camundaApi.getTasks().catch(() => []),
            camundaApi.getFailedJobs().catch(() => []),
        ]).then(([definitions, instances, tasks, failedJobs]) => {
            if (!cancelled) setMonitorStats(buildMonitorStats(definitions, instances, tasks, failedJobs));
        }).catch(() => {
            if (!cancelled) setMonitorStats(null);
        }).finally(() => {
            if (!cancelled) setMonitorStatsLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (filterRestored) return;
        if (typeof window === "undefined") {
            setFilterRestored(true);
            return;
        }
        const savedSearch = window.sessionStorage.getItem(filterStorageKey);
        if (savedSearch && !searchTerm) {
            setSearchTerm(savedSearch);
            setPage(1);
        }
        setFilterRestored(true);
    }, [filterRestored, filterStorageKey, searchTerm, setPage, setSearchTerm]);

    useEffect(() => {
        if (!filterRestored || typeof window === "undefined") return;
        const nextSearch = searchTerm || "";
        if (nextSearch) {
            window.sessionStorage.setItem(filterStorageKey, nextSearch);
            return;
        }
        window.sessionStorage.removeItem(filterStorageKey);
    }, [filterRestored, filterStorageKey, searchTerm]);

    const sorted = useMemo(() => [...items].sort((left, right) => {
        const a = valueFor(left, columns.find(column => column.key === sort.key));
        const b = valueFor(right, columns.find(column => column.key === sort.key));
        const result = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
        return sort.direction === "asc" ? result : -result;
    }), [columns, items, sort]);
    const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const current = Math.min(page, pages);
    const visible = sorted.slice((current - 1) * pageSize, current * pageSize);
    function changeSort(key) { setSort(previous => ({ key, direction: previous.key === key && previous.direction === "asc" ? "desc" : "asc" })); setPage(1); }

    function stateMeta(item) {
        const stateColumn = columns.find(column => ["status", "state", "is_active"].includes(column.key));
        const rawState = String(stateColumn ? valueFor(item, stateColumn) : item.status || item.is_active || "").toUpperCase();
        if (["DEPLOYED", "ACTIVE", "YES"].includes(rawState)) {
            return { icon: "fa-circle-check", className: "text-emerald-500", label: "Healthy" };
        }
        if (["ARCHIVED"].includes(rawState)) {
            return { icon: "fa-box-archive", className: "text-slate-500", label: "Archived" };
        }
        if (["UNDEPLOYED", "DRAFT"].includes(rawState)) {
            return { icon: "fa-circle-pause", className: "text-amber-500", label: rawState === "DRAFT" ? "Draft" : "Undeployed" };
        }
        if (["INACTIVE", "NO"].includes(rawState)) {
            return { icon: "fa-circle-pause", className: "text-slate-400", label: "Inactive" };
        }
        return { icon: "fa-circle-check", className: "text-emerald-500", label: "Healthy" };
    }

    function renderCardValue(item, column) {
        return column?.render ? column.render(item) : valueFor(item, column);
    }

    function renderWorkspaceCard(item) {
        const status = stateMeta(item);
        const titleColumn = columns[0];
        const subtitleColumn = columns[1];
        const metaColumns = columns.slice(2).filter(column => !["status", "state", "is_active"].includes(column.key));

        return (
            <article key={item.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="mb-1 truncate font-semibold text-slate-900">
                            {renderCardValue(item, titleColumn)}
                        </p>
                        {subtitleColumn && (
                            <p className="mb-0 truncate text-xs font-medium text-indigo-600">
                                {renderCardValue(item, subtitleColumn)}
                            </p>
                        )}
                    </div>
                    <i className={`fa-solid ${status.icon} ${status.className} mt-1 shrink-0`} aria-label={status.label} title={status.label} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {metaColumns.map(column => (
                        <div key={column.key} className="min-w-0">
                            <span className="font-semibold text-slate-500">{column.label}: </span>
                            <div className="inline-flex align-middle text-slate-600">{renderCardValue(item, column)}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {renderActions(item)}
                </div>
            </article>
        );
    }

    return <div className="process-theme-surface min-h-full bg-slate-50 p-3 sm:p-5"><div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3"><p className="mb-0 text-sm text-slate-500">{description}</p><div className="flex items-center gap-2"><button type="button" onClick={handleRefresh} disabled={loading || monitorStatsLoading} className="!rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60" aria-label="Refresh process list"><i className={`fa-solid fa-rotate mr-2 ${loading || monitorStatsLoading ? "fa-spin" : ""}`} aria-hidden="true" />Refresh</button><button type="button" onClick={onAdd} className="!rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><i className="fa-solid fa-plus mr-2" />{addLabel}</button></div></header>
        <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">{displayStats.map(stat => <Stat key={stat.label} {...stat} />)}</section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-busy={loading}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><div><h2 className="mb-0 text-lg font-bold text-slate-900">{title}</h2><p className="mb-0 text-xs text-slate-500">{items.length} matching records</p></div><div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">{setShowArchived && <label className="mb-0 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={showArchived} onChange={event => { setShowArchived(event.target.checked); setPage(1); }} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /><span className="ms-2">Show archived</span></label>}<label className="relative w-full sm:w-80"><span className="sr-only">Search</span><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={event => { setSearchTerm(event.target.value); setPage(1); }} placeholder={searchPlaceholder} className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />{searchTerm && <button type="button" onClick={() => { setSearchTerm(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-xmark" /></button>}</label></div></div>
            {loading ? <div className="grid min-h-[280px] place-items-center p-8" role="status"><div className="text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-600"><i className="fa-solid fa-circle-notch fa-spin text-xl" aria-hidden="true" /></span><p className="mb-0 mt-3 text-sm font-semibold text-slate-700">Loading processes…</p><p className="mb-0 mt-1 text-xs text-slate-500">Fetching the latest process list</p></div></div> : <>
                <div className="divide-y divide-slate-100 md:hidden">{visible.map(renderWorkspaceCard)}</div>
                <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{columns.map(column => <th key={column.key} className="px-4 py-3"><button type="button" onClick={() => changeSort(column.key)} className="inline-flex items-center gap-1.5 font-semibold uppercase hover:text-indigo-600">{column.label}<i className={`fa-solid ${sort.key === column.key ? (sort.direction === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort"} text-[10px]`} /></button></th>)}<th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map(item => <tr key={item.id} className="hover:bg-slate-50">{columns.map(column => <td key={column.key} className="px-4 py-3">{column.render ? column.render(item) : valueFor(item, column)}</td>)}<td className="px-4 py-3"><div className="flex justify-end gap-2">{renderActions(item)}</div></td></tr>)}</tbody></table></div>
                {!visible.length && <div className="p-10 text-center text-sm text-slate-500">No records match your search.</div>}
                {!!sorted.length && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm"><div className="flex items-center gap-2 text-slate-600">Rows per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5">{[5, 10, 25, 50].map(size => <option key={size}>{size}</option>)}</select><span className="hidden sm:inline">{(current - 1) * pageSize + 1}–{Math.min(current * pageSize, sorted.length)} of {sorted.length}</span></div><div className="flex items-center gap-2"><button type="button" disabled={current === 1} onClick={() => setPage(Math.max(1, current - 1))} className="grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"><i className="fa-solid fa-chevron-left" /></button><span className="min-w-20 text-center font-medium">{current} / {pages}</span><button type="button" disabled={current === pages} onClick={() => setPage(Math.min(pages, current + 1))} className="grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"><i className="fa-solid fa-chevron-right" /></button></div></div>}
            </>}
        </section>
    </div></div>;
}
