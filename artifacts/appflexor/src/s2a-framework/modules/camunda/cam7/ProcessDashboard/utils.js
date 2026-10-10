import { tryParseJSONObject } from "../../../../utils/utils";
import { calculateSla, variableValue } from "../../../process-monitor/utils/sla";
import { DEFAULT_CONFIG, HISTORY_QUICK_FILTERS } from "./constants";

export function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function defaultHistoryFilters() {
    return createQuickHistoryFilter("LAST_7_DAYS");
}

export function createQuickHistoryFilter(filterKey) {
    const selectedFilter = HISTORY_QUICK_FILTERS.find(
        filter => filter.key === filterKey && Number.isFinite(filter.days),
    ) || HISTORY_QUICK_FILTERS[0];
    const today = new Date();
    const prior = new Date(today);
    prior.setDate(today.getDate() - (selectedFilter.days - 1));
    return {
        key: selectedFilter.key,
        label: selectedFilter.label,
        from: toDateInputValue(prior),
        to: toDateInputValue(today),
    };
}

export function createCustomHistoryFilter(from, to) {
    return {
        key: "CUSTOM",
        label: "Custom Dates",
        from,
        to,
    };
}

export function formatHistoryFilterSummary(filters) {
    if (!filters?.from || !filters?.to) return "Showing results";
    if (filters?.key === "CUSTOM") {
        return `Showing results: Custom Dates (${filters.from} to ${filters.to})`;
    }
    return `Showing results: ${filters.label}`;
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

export function clampNumber(value, minimum, maximum, fallback) {
    const parsed = normalizeNumber(value, fallback);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    if (Number.isFinite(minimum) && parsed < minimum) {
        return minimum;
    }
    if (Number.isFinite(maximum) && parsed > maximum) {
        return maximum;
    }
    return parsed;
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
        refresh_interval_seconds: clampNumber(
            data?.refresh_interval_seconds,
            60,
            Number.POSITIVE_INFINITY,
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
        max_activity_rows: clampNumber(
            data?.max_activity_rows,
            10,
            50,
            DEFAULT_CONFIG.max_activity_rows,
        ),
        max_incident_rows: clampNumber(
            data?.max_incident_rows,
            10,
            50,
            DEFAULT_CONFIG.max_incident_rows,
        ),
        max_sla_rows: clampNumber(
            data?.max_sla_rows,
            10,
            50,
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
    return `'${String(processKey.trim()).replace(/'/g, "''")}'`;
}

export function buildHistoryServiceParams(filters) {
    return [
        formatServiceDate(filters.from, false),
        formatServiceDate(filters.to, true),
    ].join(",");
}

export function buildHistoryInFilter(processKeys) {
    const scopedKeys = Array.isArray(processKeys) ? processKeys.filter(Boolean) : [];
    const processKeyList = scopedKeys.map(quoteProcessKey).join(",");
    const encodedProcessKeyList = processKeyList;
    return encodedProcessKeyList ? encodedProcessKeyList : "";
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

function normalizeVariableName(name = "") {
    return String(name).replaceAll("_", "").toLowerCase();
}

function unwrapVariable(variable) {
    return variable?.value !== undefined ? variable.value : variable;
}

function findProcessVariableValue(variables, names) {
    const normalizedNames = names.map(normalizeVariableName);
    const findVariable = (source, depth = 0) => {
        if (!source || typeof source !== "object" || depth > 6) return undefined;
        const matchingKey = Object.keys(source).find(key =>
            normalizedNames.includes(normalizeVariableName(key)),
        );
        if (matchingKey) return source[matchingKey];
        for (const value of Object.values(source)) {
            const found = findVariable(unwrapVariable(value), depth + 1);
            if (found !== undefined) return found;
        }
        return undefined;
    };
    return unwrapVariable(findVariable(variables));
}

function parseJsonValue(value) {
    let parsed = value;
    while (typeof parsed === "string") {
        const trimmed = parsed.trim();
        if (!trimmed) return null;
        if (
            !(
                (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                (trimmed.startsWith("[") && trimmed.endsWith("]"))
            )
        ) {
            return parsed;
        }
        try {
            parsed = JSON.parse(trimmed);
        } catch {
            return null;
        }
    }
    return parsed;
}

function getPriorityLevel(variables = {}) {
    const priorityVariable = findProcessVariableValue(variables, ["priority"]);
    const priority = String(priorityVariable ?? "").toLowerCase();
    if (priority === "high" || priority === "1") return "high";
    if (priority === "low" || priority === "3") return "low";
    if (priority === "medium" || priority === "2" || priority === "") {
        return "medium";
    }
    return "medium";
}

function getSlaLevels(variables = {}) {
    const levels = parseJsonValue(
        findProcessVariableValue(variables, ["slaLevels", "sla_levels"]),
    );
    return levels?.urgencyLevels || levels || null;
}

function getUtcTimestamp(value) {
    if (!value) return null;
    if (value instanceof Date) {
        const timestamp = value.getTime();
        return Number.isNaN(timestamp) ? null : timestamp;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    const text = String(value).trim();
    if (!text) return null;
    const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(text);
    const normalizedText = hasTimezone
        ? text
        : `${text.replace(" ", "T")}Z`;
    const timestamp = new Date(normalizedText).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

function getProcessStartTimestamp(variables = {}, startTime = null) {
    return getUtcTimestamp(
        findProcessVariableValue(variables, [
            "process_start_date",
            "process_start_time",
            "processStartDate",
            "processStartTime",
            "start_time",
        ]) || startTime,
    );
}

export function buildInstanceVariableSla(
    variables = {},
    now = Date.now(),
    startTime = null,
) {
    const nowTimestamp = getUtcTimestamp(now) ?? Date.now();
    const processStartTimestamp = getProcessStartTimestamp(variables, startTime);
    const priorityLevel = getPriorityLevel(variables);
    const slaLevels = getSlaLevels(variables);
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
    const deadline =
        processStartTimestamp !== null && slaMilliseconds !== null
            ? new Date(processStartTimestamp + slaMilliseconds)
            : null;
    const remainingMinutes =
        deadline && !Number.isNaN(deadline.getTime())
            ? Math.round((deadline.getTime() - nowTimestamp) / 60000)
            : null;
    const isOverdue = deadline !== null && deadline.getTime() < nowTimestamp;
    const overdueMilliseconds = isOverdue
        ? nowTimestamp - deadline.getTime()
        : 0;
    const hasInstanceVariableSla =
        processStartTimestamp !== null &&
        slaMilliseconds !== null &&
        selectedSla !== null;

    return {
        urgency: priorityLevel,
        deadline,
        remainingMinutes,
        isOverdue,
        overdueMilliseconds,
        source: hasInstanceVariableSla ? "instanceVariables" : "",
        thresholds: {
            highMinutes: slaMilliseconds ? Math.round(slaMilliseconds / 60000) : 60,
            mediumMinutes: slaMilliseconds ? Math.round(slaMilliseconds / 60000) : 240,
        },
        thresholdText:
            selectedSla && slaValue
                ? `${slaValue} ${slaUnit || "hours"}`
                : "",
        config: selectedSla || {},
    };
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
    const now = Date.now();
    const variableSla = buildInstanceVariableSla(variables, now, startTime);
    if (variableSla.remainingMinutes !== null) return variableSla;
    const fallbackSla = calculateSla(variables, new Date(now), startTime);
    const deadline = fallbackSla?.deadline;
    const deadlineTimestamp =
        deadline && !Number.isNaN(deadline.getTime()) ? deadline.getTime() : null;
    const isOverdue = deadlineTimestamp !== null && deadlineTimestamp < now;
    return {
        ...fallbackSla,
        isOverdue,
        overdueMilliseconds: isOverdue ? now - deadlineTimestamp : 0,
        source: "dashboardConfig",
    };
}
