import { tryParseJSONObject } from "../../../../utils/utils";
import { calculateSla, variableValue } from "../../../process-monitor/utils/sla";
import { DEFAULT_CONFIG } from "./constants";

export function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function defaultHistoryFilters() {
    const today = new Date();
    const prior = new Date(today);
    prior.setDate(today.getDate() - 29);
    return {
        from: toDateInputValue(prior),
        to: toDateInputValue(today),
    };
}

export function formatServiceDate(dateValue, endOfDay = false) {
    return `${dateValue} ${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export function normalizeBoolean(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.toLowerCase();
        if (["true", "yes", "1"].includes(normalized)) return true;
        if (["false", "no", "0"].includes(normalized)) return false;
    }
    return fallback;
}

export function normalizeNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeProcessKeys(value) {
    if (Array.isArray(value)) return value.map(String);
    const parsed = tryParseJSONObject(value || "[]", []);
    return Array.isArray(parsed) ? parsed.map(String) : [];
}

export function normalizeConfig(data = {}) {
    return {
        ...DEFAULT_CONFIG,
        ...data,
        process_scope: data?.process_scope === "SELECTED" ? "SELECTED" : "ALL",
        process_keys: normalizeProcessKeys(data?.process_keys),
        refresh_interval_seconds: normalizeNumber(
            data?.refresh_interval_seconds,
            DEFAULT_CONFIG.refresh_interval_seconds,
        ),
        show_header: normalizeBoolean(
            data?.show_header,
            DEFAULT_CONFIG.show_header,
        ),
        show_activity_status: normalizeBoolean(
            data?.show_activity_status,
            DEFAULT_CONFIG.show_activity_status,
        ),
        show_error_tracking: normalizeBoolean(
            data?.show_error_tracking,
            DEFAULT_CONFIG.show_error_tracking,
        ),
        show_sla_breaches: normalizeBoolean(
            data?.show_sla_breaches,
            DEFAULT_CONFIG.show_sla_breaches,
        ),
        max_activity_rows: normalizeNumber(
            data?.max_activity_rows,
            DEFAULT_CONFIG.max_activity_rows,
        ),
        max_incident_rows: normalizeNumber(
            data?.max_incident_rows,
            DEFAULT_CONFIG.max_incident_rows,
        ),
        max_sla_rows: normalizeNumber(
            data?.max_sla_rows,
            DEFAULT_CONFIG.max_sla_rows,
        ),
    };
}

export function isEmptyObject(value) {
    if (!value || typeof value !== "object") return true;
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) return false;
    }
    return true;
}

export function formatDateTime(value) {
    if (!value) return "Not available";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleString();
}

export function formatRelativeMinutes(minutes) {
    if (minutes === null || minutes === undefined) return "No SLA due date";
    const absoluteMinutes = Math.abs(minutes);
    const days = Math.floor(absoluteMinutes / 1440);
    const hours = Math.floor((absoluteMinutes % 1440) / 60);
    const remainingMinutes = absoluteMinutes % 60;
    const segments = [];
    if (days) segments.push(`${days}d`);
    if (hours) segments.push(`${hours}h`);
    if (!days && !hours) segments.push(`${remainingMinutes}m`);
    if (days && remainingMinutes && segments.length < 2) {
        segments.push(`${remainingMinutes}m`);
    }
    const text = segments.join(" ");
    return minutes < 0 ? `${text} overdue` : `${text} left`;
}

export function formatSeconds(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value <= 0) return "0m";
    const rounded = Math.round(value);
    const days = Math.floor(rounded / 86400);
    const hours = Math.floor((rounded % 86400) / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}m`;
    if (minutes) return `${minutes}m`;
    return `${rounded}s`;
}

export function normalizeRows(rows) {
    return Array.isArray(rows) ? rows : [];
}

export function parseNumeric(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPercent(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "0%";
    return `${Math.round(parsed * 10) / 10}%`;
}

export function startOfIsoWeek(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Unknown week";
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    return toDateInputValue(date);
}

export function monthKey(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Unknown month";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function quoteProcessKey(processKey) {
    return `'${String(processKey).replace(/'/g, "''")}'`;
}

function wrapServiceParam(value) {
    return `"${String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')}"`;
}

export function buildHistoryServiceParams(filters, processKeys) {
    const scopedKeys = Array.isArray(processKeys) ? processKeys.filter(Boolean) : [];
    const processKeyList = scopedKeys.map(quoteProcessKey).join(",");
    const encodedProcessKeyList = encodeURIComponent(processKeyList);
    return [
        formatServiceDate(filters.from, false),
        formatServiceDate(filters.to, true),
        wrapServiceParam(encodedProcessKeyList),
    ].join(",");
}

export function flattenLeafActivities(node, rows = []) {
    if (!node) return rows;
    const children = Array.isArray(node.childActivityInstances)
        ? node.childActivityInstances
        : [];
    if (!children.length && (node.activityId || node.activityName)) {
        rows.push({
            id: node.activityId || "",
            name: node.activityName || node.activityId || "Unknown activity",
            type: node.activityType || "",
        });
        return rows;
    }
    children.forEach(child => flattenLeafActivities(child, rows));
    return rows;
}

export function formatEscalationPath(rawValue) {
    if (!rawValue) return "Not configured";
    if (Array.isArray(rawValue)) {
        const values = rawValue
            .map(item => formatEscalationPath(item))
            .filter(Boolean)
            .filter(item => item !== "Not configured");
        return values.length ? values.join(" -> ") : "Not configured";
    }
    if (typeof rawValue === "string") {
        const trimmed = rawValue.trim();
        if (!trimmed) return "Not configured";
        if (
            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
            return formatEscalationPath(tryParseJSONObject(trimmed, trimmed));
        }
        return trimmed;
    }
    if (typeof rawValue === "object") {
        if (Array.isArray(rawValue.path)) return formatEscalationPath(rawValue.path);
        if (Array.isArray(rawValue.levels)) {
            return formatEscalationPath(
                rawValue.levels.map(level => level?.name || level?.group || level),
            );
        }
        const keys = ["owner", "group", "team", "email", "name", "value"];
        const values = keys
            .map(key => rawValue?.[key])
            .filter(Boolean)
            .map(String);
        if (values.length) return values.join(" -> ");
        try {
            return JSON.stringify(rawValue);
        } catch {
            return "Not configured";
        }
    }
    return String(rawValue);
}

export function resolveEscalationPath(variables = {}) {
    return formatEscalationPath(
        variableValue(variables, [
            "escalationPath",
            "escalation_path",
            "escalationMatrix",
            "escalation_matrix",
            "escalationTo",
            "escalation_to",
            "escalationOwner",
            "escalation_owner",
        ]),
    );
}

export async function mapWithConcurrency(items, concurrency, mapper) {
    const rows = [];
    for (let index = 0; index < items.length; index += concurrency) {
        const batch = items.slice(index, index + concurrency);
        rows.push(...(await Promise.all(batch.map(mapper))));
    }
    return rows;
}

export function buildInstanceSla(variables, startTime) {
    return calculateSla(variables, new Date(), startTime);
}
