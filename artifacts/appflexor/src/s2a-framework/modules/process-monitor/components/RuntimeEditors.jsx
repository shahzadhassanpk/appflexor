/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../Config";
import { formatDateTimeForUserView } from "../../../utils/utils";
import { PropertyEditorModal } from "../../process-configuration/processes/PropertyEditorModal";

const SLA_KEYS = new Set(["slaConfig", "sla_config", "SLA_CONFIG", "slaDeadline", "sla_deadline", "deadline"]);
const TYPES = ["String", "Boolean", "Integer", "Long", "Double", "Json"];
const isSlaVariable = name => SLA_KEYS.has(name);

function displayValue(variable) {
    return typeof variable?.value === "object" ? JSON.stringify(variable.value) : String(variable?.value ?? "");
}

export function VariableManager({ variables, busy, onSave, onDelete }) {
    const [editor, setEditor] = useState(null);
    const open = (name = "", variable = { type: "String", value: "" }) => setEditor({ originalName: name, name, type: variable.type || "String", value: displayValue(variable) });
    return <>
        <div className="mb-3 flex justify-end"><button type="button" onClick={() => open()} className="rounded-full bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"><i className="fa-solid fa-plus mr-2" />Add variable</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Value</th><th className="p-3">Scope</th><th className="p-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{Object.entries(variables).map(([name, variable]) => { const locked = isSlaVariable(name); return <tr key={name}><td className="p-3 font-semibold">{name}{locked && <span className="ml-2 rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">SLA read-only</span>}</td><td className="p-3">{variable.type || typeof variable.value}</td><td className="max-w-md break-words p-3">{displayValue(variable)}</td><td className="p-3">Process instance</td><td className="p-3"><div className="flex justify-end gap-2"><button type="button" disabled={locked || busy} onClick={() => open(name, variable)} className="grid h-8 w-8 place-items-center rounded bg-indigo-50 text-indigo-600 disabled:opacity-35" aria-label={`Edit ${name}`}><i className="fa-solid fa-pen" /></button><button type="button" disabled={locked || busy} onClick={() => { if (window.confirm(`Delete variable “${name}”?`)) onDelete(name); }} className="grid h-8 w-8 place-items-center rounded bg-red-50 text-red-600 disabled:opacity-35" aria-label={`Delete ${name}`}><i className="fa-solid fa-trash" /></button></div></td></tr>; })}</tbody></table></div>
        {!Object.keys(variables).length && <p className="p-8 text-center text-sm text-slate-500">No variables available.</p>}
        {editor && <EditorModal editor={editor} setEditor={setEditor} busy={busy} onSave={onSave} />}
    </>;
}

function EditorModal({ editor, setEditor, busy, onSave }) {
    const submit = event => { event.preventDefault(); onSave(editor).then(() => setEditor(null)).catch(() => { }); };
    return <div className="fixed inset-0 z-[1090] grid place-items-center bg-slate-950/40 p-2 sm:p-3"><form onSubmit={submit} className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><h3 className="mb-0 text-lg font-bold">{editor.originalName ? "Edit" : "Add"} variable</h3><button type="button" onClick={() => setEditor(null)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"><i className="fa-solid fa-xmark" /></button></div><div className="grid min-w-0 gap-3 sm:grid-cols-[2fr_1fr]"><label className="block min-w-0 text-sm font-semibold">Name<input required disabled={Boolean(editor.originalName)} value={editor.name} onChange={event => setEditor({ ...editor, name: event.target.value })} className="mt-1 block w-full max-w-none rounded-lg border border-slate-300 p-2.5 disabled:bg-slate-100" style={{ width: "100%" }} /></label><label className="block min-w-0 text-sm font-semibold">Type<select value={editor.type} onChange={event => setEditor({ ...editor, type: event.target.value })} className="mt-1 block w-full max-w-none rounded-lg border border-slate-300 p-2.5" style={{ width: "100%" }}>{TYPES.map(type => <option key={type}>{type}</option>)}</select></label><label className="block min-w-0 text-sm font-semibold sm:col-span-2">Value<textarea required value={editor.value} onChange={event => setEditor({ ...editor, value: event.target.value })} rows="8" className="mt-1 block w-full max-w-none rounded-lg border border-slate-300 p-2.5 font-monospace" style={{ width: "100%" }} /></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setEditor(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save</button></div></form></div>;
}

export function TaskManager({ tasks, busy, onAssign }) {
    const [task, setTask] = useState(null);
    const [sort, setSort] = useState({ key: "created", direction: "desc" });
    const columns = [
        { key: "name", label: "Activity" },
        { key: "assignee", label: "Assignee" },
        { key: "owner", label: "Owner" },
        { key: "created", label: "Creation Date" },
        { key: "due", label: "Due Date" },
        { key: "followUp", label: "Follow Up Date" },
        { key: "priority", label: "Priority" },
        { key: "delegationState", label: "Delegation State" },
        { key: "id", label: "Task ID" },
    ];
    const dateKeys = new Set(["created", "due", "followUp"]);
    const valueFor = (item, key) => key === "name" ? item.name || item.taskDefinitionKey : item[key];
    const rows = [...tasks].sort((left, right) => {
        const a = valueFor(left, sort.key);
        const b = valueFor(right, sort.key);
        if (a == null || a === "") return b == null || b === "" ? 0 : 1;
        if (b == null || b === "") return -1;
        const comparison = sort.key === "priority" ? Number(a) - Number(b)
            : dateKeys.has(sort.key) ? (Date.parse(a) || 0) - (Date.parse(b) || 0)
                : String(a).localeCompare(String(b));
        return sort.direction === "asc" ? comparison : -comparison;
    });
    const renderValue = (item, key) => {
        const value = valueFor(item, key);
        if (key === "assignee") return <span className="inline-flex items-center gap-1">
            {value || "Unassigned"}
            <button type="button" disabled={busy} onClick={() => setTask(item)}
                title="Edit assignee" aria-label={`Edit assignee for ${item.name || item.taskDefinitionKey || item.id}`}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50 md:h-8 md:w-8">
                <i className="fa-solid fa-pen" aria-hidden="true" />
            </button>
        </span>;
        if(key === "created") return formatDateTimeForUserView(value) || "—";
        if (value == null || value === "") return "—";
        if (dateKeys.has(key)) return <time dateTime={value} title={value}>{value}</time>;
        return value;
    };
    return <>
        {!tasks.length ? <p className="p-8 text-center text-sm text-slate-500">No open user tasks.</p> : <>
            <div className="grid gap-3 md:hidden">
                {rows.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-4 text-sm">
                    <h3 className="mb-3 break-words text-base font-semibold text-indigo-600">{valueFor(item, "name") || "Unnamed activity"}</h3>
                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2">
                        {columns.slice(1).map(column => <div key={column.key} className="contents">
                            <dt className="text-slate-500">{column.label}</dt>
                            <dd className="mb-0 break-words text-slate-800">{renderValue(item, column.key)}</dd>
                        </div>)}
                    </dl>
                </article>)}
            </div>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] text-left text-sm">
                    <caption className="sr-only">User tasks for this process instance</caption>
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                        <tr>{columns.map(column => <th key={column.key} scope="col" className="whitespace-nowrap px-3 py-2.5"
                            aria-sort={sort.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
                            <button type="button" className="inline-flex items-center gap-1 py-1 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                                onClick={() => setSort(previous => ({ key: column.key, direction: previous.key === column.key && previous.direction === "asc" ? "desc" : "asc" }))}>
                                {column.label}<i aria-hidden="true" className={`fa-solid text-indigo-600 ${sort.key === column.key ? sort.direction === "asc" ? "fa-chevron-up" : "fa-chevron-down" : "fa-sort"}`} />
                            </button>
                        </th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map(item => <tr key={item.id} className="hover:bg-slate-50">
                            {columns.map(column => <td key={column.key} className={`px-3 py-2 ${column.key === "name" || column.key === "id" ? "font-medium text-indigo-600" : "text-slate-700"} ${dateKeys.has(column.key) ? "whitespace-nowrap" : "break-words"}`}>
                                {renderValue(item, column.key)}
                            </td>)}
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </>}
        {task && <RuntimeAssignmentDialog task={task} busy={busy} onClose={() => setTask(null)} onAssign={(type, value) => onAssign(task, type, value).then(() => setTask(null)).catch(() => { })} />}
    </>;
}

function RuntimeAssignmentDialog({ task, busy, onClose, onAssign }) {
    const [form, setForm] = useState({ assigneeType: "user", assignee: task.assignee || "" });
    const [options, setOptions] = useState({ users: [], groups: [] });
    const [loading, setLoading] = useState(true);
    useEffect(() => { let active = true; axios.post(API_URL + "?service.key=masterKey.tenantData", { dataKeys: [{ serviceParams: "", dataKey: "groups", serviceKey: "sys.console.dir.group", mode: "formData" }, { serviceParams: "", dataKey: "users", serviceKey: "sys.user.list", mode: "formData" }] }).then(response => { if (active && response.data.C_STATUS === "SUCCESS") setOptions({ groups: (response.data.C_DATA.groups || []).map(group => ({ value: String(group.id), label: group.name })), users: (response.data.C_DATA.users || []).map(user => ({ value: user.username, label: `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username })) }); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
    return <PropertyEditorModal propModal={{ type: "userTasks", subType: "assignee", title: task.name || task.taskDefinitionKey }} propForm={form} propLoading={loading || busy} refDataLoaded={!loading} groups={options.groups} users={options.users} formList={[]} aiAgents={[]} aiAgentTasks={[]} aiTasksLoading={false} onClose={onClose} onFormChange={setForm} onSave={() => { if (form.assignee) onAssign(form.assigneeType, form.assignee); }} onAgentChange={() => { }} zIndex={1090} />;
}
