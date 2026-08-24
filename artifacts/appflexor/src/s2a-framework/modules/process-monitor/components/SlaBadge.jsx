/* eslint-disable react/prop-types */
import { formatRemaining, urgencyClasses, variableValue } from "../utils/sla";

function formatDate(value) {
    if (!value) return "Not available";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const day = date.toLocaleDateString(undefined, { day: "2-digit" });
    const month = date.toLocaleDateString(undefined, { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase();
    return `${weekday} ${day}, ${month} ${year} ${time}`;
}

function priorityFrom(instance) {
    const raw = variableValue(instance?.variables, ["priority", "urgency", "slaPriority"]);
    const value = String(raw ?? "medium").toLowerCase();
    if (value === "1" || value === "high") return "high";
    if (value === "3" || value === "low") return "low";
    return "medium";
}

function elapsedFrom(startTime) {
    const timestamp = startTime ? new Date(startTime).getTime() : Number.NaN;
    if (Number.isNaN(timestamp)) return "Not available";
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    const days = Math.floor(elapsedMinutes / 1440);
    const hours = Math.floor((elapsedMinutes % 1440) / 60);
    const minutes = elapsedMinutes % 60;
    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function compactRemaining(minutes) {
    if (minutes === null || minutes === undefined) return "Not set";
    const absoluteMinutes = Math.abs(minutes);
    const days = Math.floor(absoluteMinutes / 1440);
    const hours = Math.floor((absoluteMinutes % 1440) / 60);
    const value = days ? `${days}d ${hours}h` : hours ? `${hours}h ${absoluteMinutes % 60}m` : `${absoluteMinutes}m`;
    return minutes < 0 ? `${value} overdue` : value;
}

export default function SlaBadge({ instance, compact = false }) {
    const sla = instance?.sla || {};
    const urgency = sla.urgency || "low";
    const priority = priorityFrom(instance);
    const startTime = instance?.startTime || instance?.startDate || instance?.history?.startTime;

    if (compact) {
        return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${urgencyClasses[urgency] || urgencyClasses.low}`}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{urgency.toUpperCase()} · {formatRemaining(sla.remainingMinutes ?? null)}</span>;
    }

    return (
        <section className="bg-slate-50" aria-labelledby={`process-sla-${instance?.id || "instance"}`}>
            <span id={`process-sla-${instance?.id || "instance"}`} className="mb-3 d-flex items-center text-sm font-bold text-slate-900">
                <i className="fa-regular fa-clock mr-1.5 text-slate-900" aria-hidden="true" />Process SLA &amp; Timing
                <span className={`ml-1.5 inline-flex items-center text-xs font-semibold capitalize ${priority === "high" ? "text-red-600" : priority === "low" ? "text-emerald-600" : "text-amber-600"}`}><i className="fa-solid fa-flag mr-1 text-[10px] mt-2" aria-hidden="true" />{priority}</span>
            </span>
            <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-2.5 text-xs">
                <dt className="font-medium text-slate-500">Start Date</dt><dd className="text-slate-900">{formatDate(startTime)}</dd>
                <dt className="font-medium text-slate-500">SLA Due</dt><dd className="text-slate-900">{formatDate(sla.deadline)}</dd>
                <dt className="font-medium text-slate-500">Time Left</dt><dd className={`font-bold ${urgency === "high" ? "text-red-600" : urgency === "medium" ? "text-amber-600" : "text-emerald-600"}`}>{compactRemaining(sla.remainingMinutes)}</dd>
                <dt className="font-medium text-slate-500">Elapsed Time</dt><dd className="text-slate-900">{elapsedFrom(startTime)}</dd>
            </dl>
        </section>
    );
}
