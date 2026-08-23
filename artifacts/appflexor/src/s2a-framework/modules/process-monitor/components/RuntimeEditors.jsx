/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../Config";
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
        <div className="mb-3 flex justify-end"><button type="button" onClick={() => open()} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"><i className="fa-solid fa-plus mr-2" />Add variable</button></div>
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
    return <><div className="divide-y divide-slate-100">{tasks.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="mb-1 font-semibold text-slate-900">{item.name || item.taskDefinitionKey}</p><p className="mb-0 text-sm text-slate-500">{item.assignee ? `Assigned to ${item.assignee}` : item.candidateGroup ? `Candidate group ${item.candidateGroup}` : "Unassigned"} · {item.due ? new Date(item.due).toLocaleString() : "No due date"}</p></div><button type="button" disabled={busy} onClick={() => setTask(item)} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"><i className="fa-solid fa-user-plus mr-2" />Assign</button></div>)}</div>{!tasks.length && <p className="p-8 text-center text-sm text-slate-500">No open user tasks.</p>}{task && <RuntimeAssignmentDialog task={task} busy={busy} onClose={() => setTask(null)} onAssign={(type, value) => onAssign(task, type, value).then(() => setTask(null)).catch(() => { })} />}</>;
}

function RuntimeAssignmentDialog({ task, busy, onClose, onAssign }) {
    const [form, setForm] = useState({ assigneeType: "user", assignee: task.assignee || "" });
    const [options, setOptions] = useState({ users: [], groups: [] });
    const [loading, setLoading] = useState(true);
    useEffect(() => { let active = true; axios.post(API_URL + "?service.key=masterKey.tenantData", { dataKeys: [{ serviceParams: "", dataKey: "groups", serviceKey: "sys.console.dir.group", mode: "formData" }, { serviceParams: "", dataKey: "users", serviceKey: "sys.user.list", mode: "formData" }] }).then(response => { if (active && response.data.C_STATUS === "SUCCESS") setOptions({ groups: (response.data.C_DATA.groups || []).map(group => ({ value: String(group.id), label: group.name })), users: (response.data.C_DATA.users || []).map(user => ({ value: user.username, label: `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username })) }); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
    return <PropertyEditorModal propModal={{ type: "userTasks", subType: "assignee", title: task.name || task.taskDefinitionKey }} propForm={form} propLoading={loading || busy} refDataLoaded={!loading} groups={options.groups} users={options.users} formList={[]} aiAgents={[]} aiAgentTasks={[]} aiTasksLoading={false} onClose={onClose} onFormChange={setForm} onSave={() => { if (form.assignee) onAssign(form.assigneeType, form.assignee); }} onAgentChange={() => { }} zIndex={1090} />;
}
