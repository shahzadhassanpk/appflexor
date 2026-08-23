/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";

const SORT_VALUE = {
    state: row => row.failedJobs.length ? 1 : 0,
    incidents: row => row.failedJobs.length,
    running: row => row.running.length,
    key: row => row.definition.key || "",
    name: row => row.definition.name || row.definition.key || "",
    version: row => Number(row.definition.version) || 0,
};

function SortHeader({ column, label, sort, onSort }) {
    const active = sort.column === column;
    return <th className="px-4 py-3" aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide hover:text-indigo-600 focus:text-indigo-600"><span>{label}</span><i className={`fa-solid ${active ? (sort.direction === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort"} text-[10px] ${active ? "text-indigo-600" : "text-slate-300"}`} aria-hidden="true" /></button></th>;
}

export default function DeployedProcesses({ definitions, instances, jobs, onSelectDefinition }) {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState({ column: "name", direction: "asc" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const rows = useMemo(() => definitions.map(definition => {
        const running = instances.filter(instance => instance.definitionId === definition.id);
        const failedJobs = jobs.filter(job =>
            job.processDefinitionId === definition.id &&
            (job.exceptionMessage || job.retries === 0),
        );
        return { definition, running, failedJobs };
    }).filter(({ definition }) => {
        const term = search.trim().toLowerCase();
        return !term || [definition.name, definition.key, definition.tenantId]
            .some(value => String(value || "").toLowerCase().includes(term));
    }).sort((left, right) => {
        const leftValue = SORT_VALUE[sort.column](left);
        const rightValue = SORT_VALUE[sort.column](right);
        const comparison = typeof leftValue === "number"
            ? leftValue - rightValue
            : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: "base" });
        return sort.direction === "asc" ? comparison : -comparison;
    }), [definitions, instances, jobs, search, sort]);
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const paginatedRows = useMemo(() => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [currentPage, pageSize, rows]);

    useEffect(() => { setPage(1); }, [search, sort, pageSize]);
    useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

    function handleSort(column) {
        setSort(previous => ({
            column,
            direction: previous.column === column && previous.direction === "asc" ? "desc" : "asc",
        }));
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="deployed-processes-title">
            <div className="border-b border-slate-200 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 id="deployed-processes-title" className="mb-1 text-lg font-bold text-slate-900">
                            {definitions.length} process definitions deployed
                        </h2>
                        <p className="mb-0 text-sm text-slate-500">Latest deployed version for the active tenant</p>
                    </div>
                    <label className="relative w-full sm:w-72">
                        <span className="sr-only">Search deployed processes</span>
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true" />
                        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, key, or tenant"
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                    </label>
                </div>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
                {paginatedRows.map(({ definition, running, failedJobs }) => (
                    <button key={definition.id} type="button" onClick={() => onSelectDefinition(definition)}
                        className="block w-full p-4 text-left hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0"><p className="mb-1 truncate font-semibold text-slate-900">{definition.name || definition.key}</p><p className="mb-0 truncate text-xs text-indigo-600">{definition.key}</p></div>
                            <i className={`fa-solid ${failedJobs.length ? "fa-circle-exclamation text-red-500" : "fa-circle-check text-emerald-500"}`} aria-label={failedJobs.length ? "Has failed jobs" : "Healthy"} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{running.length} running</span><span>{failedJobs.length} incidents</span><span>v{definition.version}</span><span>{definition.tenantId || "No tenant"}</span></div>
                    </button>
                ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><SortHeader column="state" label="State" sort={sort} onSort={handleSort} /><SortHeader column="name" label="Name" sort={sort} onSort={handleSort} /><SortHeader column="incidents" label="Incidents" sort={sort} onSort={handleSort} /><SortHeader column="running" label="Running" sort={sort} onSort={handleSort} /><SortHeader column="key" label="Key" sort={sort} onSort={handleSort} /><SortHeader column="version" label="Version" sort={sort} onSort={handleSort} />{/* <th className="px-4 py-3">Tenant ID</th> */}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedRows.map(({ definition, running, failedJobs }) => <tr key={definition.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onSelectDefinition(definition)}>
                            <td className="px-4 py-3"><i className={`fa-solid ${failedJobs.length ? "fa-circle-exclamation text-red-500" : "fa-circle-check text-emerald-500"}`} aria-label={failedJobs.length ? "Has failed jobs" : "Healthy"} /></td>
                            <td className="px-4 py-3 text-slate-900">{definition.name || definition.key}</td>
                            <td className="px-4 py-3 font-medium">{failedJobs.length}</td>
                            <td className="px-4 py-3 font-semibold text-indigo-600">{running.length}</td>
                            <td className="px-4 py-3 font-medium text-indigo-600">{definition.key}</td><td className="px-4 py-3">{definition.version}</td>{/* <td className="px-4 py-3">{definition.tenantId || "—"}</td> */}
                        </tr>)}
                    </tbody>
                </table>
            </div>
            {!rows.length && <div className="p-10 text-center text-sm text-slate-500">No deployed process definitions match your search.</div>}
            {!!rows.length && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><span>Rows per page</span><select value={pageSize} onChange={event => setPageSize(Number(event.target.value))} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5" aria-label="Rows per page">{[5, 10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}</select><span className="hidden sm:inline">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} of {rows.length}</span></div>
                <div className="flex items-center gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage(previous => Math.max(1, previous - 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40" aria-label="Previous page"><i className="fa-solid fa-chevron-left" /></button><span className="min-w-20 text-center font-medium text-slate-700">{currentPage} / {pageCount}</span><button type="button" disabled={currentPage === pageCount} onClick={() => setPage(previous => Math.min(pageCount, previous + 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40" aria-label="Next page"><i className="fa-solid fa-chevron-right" /></button></div>
            </div>}
        </section>
    );
}
