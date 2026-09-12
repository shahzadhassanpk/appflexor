export const DEFAULT_CONFIG = {
    title: "Process Dashboard",
    process_scope: "ALL",
    process_keys: [],
    refresh_interval_seconds: 60,
    show_header: true,
    show_activity_status: true,
    show_error_tracking: true,
    show_sla_breaches: true,
    max_activity_rows: 6,
    max_incident_rows: 6,
    max_sla_rows: 6,
};

export const DASHBOARD_TABS = {
    LIVE: "LIVE",
    HISTORY: "HISTORY",
};

export const INITIAL_DASHBOARD_STATE = {
    loading: false,
    error: "",
    summary: null,
    activityRows: [],
    incidentRows: [],
    slaRows: [],
    selectedProcessNames: [],
    lastUpdated: "",
};

export const INITIAL_HISTORY_STATE = {
    loading: false,
    error: "",
    cycleRows: [],
    throughputRows: [],
    complianceRows: [],
    activityPerformanceRows: [],
    failureRows: [],
    summary: {
        avgCycleSeconds: 0,
        completedTotal: 0,
        completedDailyAverage: 0,
        completedWeeklyAverage: 0,
        completedMonthlyAverage: 0,
        compliancePercent: 0,
        slowestActivitySeconds: 0,
        historicFailures: 0,
        historicIncidents: 0,
        historicEscalations: 0,
    },
    lastUpdated: "",
};
