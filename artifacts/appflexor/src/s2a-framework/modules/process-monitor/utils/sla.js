const CONFIG_KEYS = ["slaConfig", "sla_config", "SLA_CONFIG"];
const DEADLINE_KEYS = ["slaDeadline", "sla_deadline", "deadline", "dueDate"];

export function variableValue(variables, keys) {
    const key = keys.find(candidate => variables?.[candidate] !== undefined);
    return key ? variables[key]?.value ?? variables[key] : undefined;
}

export function parseSlaConfig(variables = {}) {
    const raw = variableValue(variables, CONFIG_KEYS);
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function numberFrom(config, keys, fallback) {
    const key = keys.find(candidate => config?.[candidate] !== undefined);
    const value = Number(key ? config[key] : fallback);
    return Number.isFinite(value) ? value : fallback;
}

export function calculateSla(variables = {}, now = new Date()) {
    const config = parseSlaConfig(variables);
    const deadlineRaw = variableValue(variables, DEADLINE_KEYS) || config.deadline;
    const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
    const remainingMinutes = deadline && !Number.isNaN(deadline.getTime())
        ? Math.round((deadline.getTime() - now.getTime()) / 60000)
        : null;
    const highThreshold = numberFrom(config, ["highMinutes", "high_threshold_minutes", "high"], 60);
    const mediumThreshold = numberFrom(config, ["mediumMinutes", "medium_threshold_minutes", "medium"], 240);

    let urgency = "low";
    if (remainingMinutes !== null && remainingMinutes <= highThreshold) urgency = "high";
    else if (remainingMinutes !== null && remainingMinutes <= mediumThreshold) urgency = "medium";

    return {
        urgency,
        deadline,
        remainingMinutes,
        thresholds: { highMinutes: highThreshold, mediumMinutes: mediumThreshold },
        config,
    };
}

export const urgencyClasses = {
    high: "bg-red-100 text-red-700 ring-red-200",
    medium: "bg-amber-100 text-amber-800 ring-amber-200",
    low: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

export function formatRemaining(minutes) {
    if (minutes === null) return "No deadline";
    if (minutes < 0) return `${Math.abs(minutes)}m overdue`;
    if (minutes < 60) return `${minutes}m left`;
    return `${Math.round(minutes / 60)}h left`;
}

