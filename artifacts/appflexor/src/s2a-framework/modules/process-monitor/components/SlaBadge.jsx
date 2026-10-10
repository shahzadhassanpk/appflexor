/* eslint-disable react/prop-types */
import { urgencyClasses } from "../utils/sla";

function formatDate(value) {
    if (!value) return "Not available";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const day = date.toLocaleDateString(undefined, { day: "2-digit" });
    const month = date.toLocaleDateString(undefined, { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString(
        undefined,
        { hour: "numeric", minute: "2-digit" },
    ).toLowerCase();
    return `${weekday} ${day}, ${month} ${year} ${time}`;
}

function getUtcTimestamp(value) {
    if (!value) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const text = String(value).trim();
    if (!text) return null;
    const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(text);
    const normalizedText = hasTimezone
        ? text
        : `${text.replace(" ", "T")}Z`;
    const timestamp = new Date(normalizedText).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

function formatSlaDuration(milliseconds) {
    const totalMinutes = Math.max(
        0,
        Math.floor(Math.abs(milliseconds) / 60000),
    );
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function getProcessVariableValue(variables, name) {
    const normalizedName = name.replaceAll("_", "").toLowerCase();
    const findVariable = (source, depth = 0) => {
        if (!source || typeof source !== "object" || depth > 6) return undefined;
        const matchingKey = Object.keys(source).find(
            key => key.replaceAll("_", "").toLowerCase() === normalizedName,
        );
        if (matchingKey) return source[matchingKey];
        for (const value of Object.values(source)) {
            const found = findVariable(value, depth + 1);
            if (found !== undefined) return found;
        }
        return undefined;
    };
    const unwrap = variable =>
        variable?.value !== undefined ? variable.value : variable;
    return unwrap(findVariable(variables));
}

function getSlaLevels(variables) {
    let levels =
        getProcessVariableValue(variables, "slaLevels") ||
        getProcessVariableValue(variables, "sla_levels");
    while (typeof levels === "string") {
        try {
            levels = JSON.parse(levels);
        } catch {
            return null;
        }
    }
    return levels?.urgencyLevels || levels || null;
}

function priorityFrom(instance) {
    const priorityVariable = getProcessVariableValue(
        instance?.variables,
        "priority",
    );
    const value = String(
        priorityVariable ?? instance?.priority ?? "",
    ).toLowerCase();
    if (value === "high" || value === "1") return "high";
    if (value === "low" || value === "3") return "low";
    if (value === "medium" || value === "2" || value === "") return "medium";
    return "medium";
}

function calculateCommentBoxSla(instance) {
    const startTime =
        instance?.process_start_date ||
        instance?.process_start_time ||
        instance?.processStartDate ||
        instance?.processStartTime ||
        instance?.start_time ||
        instance?.startTime ||
        instance?.startDate ||
        instance?.history?.startTime;
    const processStartTimestamp = getUtcTimestamp(startTime);
    const priorityLevel = priorityFrom(instance);
    const slaLevels = getSlaLevels(instance?.variables);
    const selectedSlaKey = Object.keys(slaLevels || {}).find(
        key => key.toLowerCase() === priorityLevel,
    );
    const selectedSla = selectedSlaKey ? slaLevels[selectedSlaKey] : null;
    const slaValue = Number.parseInt(
        selectedSla?.slaValue ?? selectedSla?.sla_value,
        10,
    );
    const slaUnit = String(
        selectedSla?.slaUnit ?? selectedSla?.sla_unit ?? "",
    ).toLowerCase();
    const slaMilliseconds =
        Number.isInteger(slaValue) &&
        slaValue > 0 &&
        ["hour", "hours", "day", "days"].includes(slaUnit)
            ? slaValue * (slaUnit.startsWith("day") ? 86400000 : 3600000)
            : null;
    const slaDueTimestamp =
        processStartTimestamp !== null && slaMilliseconds !== null
            ? processStartTimestamp + slaMilliseconds
            : null;
    const slaNow = Date.now();
    const isSlaOverdue = slaDueTimestamp !== null && slaDueTimestamp < slaNow;

    return {
        priorityLevel,
        startDate: processStartTimestamp === null
            ? null
            : new Date(processStartTimestamp),
        deadline: slaDueTimestamp === null ? null : new Date(slaDueTimestamp),
        isSlaOverdue,
        timeLeft:
            slaDueTimestamp === null
                ? "Not set"
                : isSlaOverdue
                  ? `Overdue by ${formatSlaDuration(slaNow - slaDueTimestamp)}`
                  : formatSlaDuration(slaDueTimestamp - slaNow),
        elapsedTime:
            processStartTimestamp === null
                ? "Not available"
                : formatSlaDuration(slaNow - processStartTimestamp),
    };
}

export default function SlaBadge({ instance, compact = false }) {
    const sla = calculateCommentBoxSla(instance);
    const priority = sla.priorityLevel;
    const urgency = sla.isSlaOverdue ? "high" : priority;

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${urgencyClasses[urgency] || urgencyClasses.low}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {priority.toUpperCase()} - {sla.timeLeft}
            </span>
        );
    }

    return (
        <section className="bg-slate-50" aria-labelledby={`process-sla-${instance?.id || "instance"}`}>
            <span id={`process-sla-${instance?.id || "instance"}`} className="mb-3 d-flex items-center text-sm font-bold text-slate-900">
                <i className="fa-regular fa-clock mr-1.5 text-slate-900" aria-hidden="true" />Process SLA &amp; Timing
                <span className={`ml-1.5 inline-flex items-center text-xs font-semibold capitalize ${priority === "high" ? "text-red-600" : priority === "low" ? "text-emerald-600" : "text-amber-600"}`}><i className="fa-solid fa-flag mr-1 text-[10px] mt-2" aria-hidden="true" />{priority}</span>
            </span>
            <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-2.5 text-xs">
                <dt className="font-medium text-slate-500">Start Date</dt><dd className="text-slate-900">{formatDate(sla.startDate)}</dd>
                <dt className="font-medium text-slate-500">SLA Due</dt><dd className="text-slate-900">{formatDate(sla.deadline)}</dd>
                <dt className="font-medium text-slate-500">Time Left</dt><dd className={`font-bold ${urgency === "high" ? "text-red-600" : urgency === "medium" ? "text-amber-600" : "text-emerald-600"}`}>{sla.timeLeft}</dd>
                <dt className="font-medium text-slate-500">Elapsed Time</dt><dd className="text-slate-900">{sla.elapsedTime}</dd>
            </dl>
        </section>
    );
}
