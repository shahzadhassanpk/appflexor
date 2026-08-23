/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import SlaBadge from "./SlaBadge";

const FILTERS = ["Overdue", "Due Today", "Assigned to Me", "All Tasks"];
const sameDay = (a, b) => a?.toDateString() === b.toDateString();

export default function TaskList({ tasks, currentUser, instanceMap, onSelectInstance }) {
    const [filter, setFilter] = useState("All Tasks");
    const filtered = useMemo(() => {
        const now = new Date();
        return tasks.filter(task => {
            const due = task.due ? new Date(task.due) : null;
            if (filter === "Overdue") return due && due < now;
            if (filter === "Due Today") return due && sameDay(due, now);
            if (filter === "Assigned to Me") return currentUser && task.assignee === currentUser;
            return true;
        });
    }, [currentUser, filter, tasks]);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="task-list-title">
            <div className="border-b border-slate-100 p-4">
                <h2 id="task-list-title" className="mb-3 text-lg font-bold text-slate-900">Tasks</h2>
                <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Task filters">
                    {FILTERS.map(item => (
                        <button key={item} type="button" onClick={() => setFilter(item)}
                            className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition ${filter === item ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            {item}
                        </button>
                    ))}
                </div>
            </div>
            <div className="divide-y divide-slate-100">
                {filtered.map(task => {
                    const instance = instanceMap[task.processInstanceId];
                    return (
                        <button key={task.id} type="button" onClick={() => onSelectInstance(task.processInstanceId, task.id)}
                            className="block w-full p-4 text-left transition hover:bg-slate-50 focus:bg-slate-50">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="mb-1 truncate font-semibold text-slate-900">{task.name || task.taskDefinitionKey}</p>
                                    <p className="mb-0 text-sm text-slate-500">{task.assignee || "Unassigned"} · {task.due ? new Date(task.due).toLocaleString() : "No due date"}</p>
                                </div>
                                {instance?.sla && <SlaBadge sla={instance.sla} compact />}
                            </div>
                        </button>
                    );
                })}
                {!filtered.length && <div className="p-8 text-center text-sm text-slate-500">No tasks match this filter.</div>}
            </div>
        </section>
    );
}
