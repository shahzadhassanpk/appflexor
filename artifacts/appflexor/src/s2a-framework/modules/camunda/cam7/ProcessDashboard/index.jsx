/* eslint-disable react/prop-types */
import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../../../../AppContext";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../utils/utils";
import DesignerContext from "../../../content-management/page-builder/Context/DesignerContext";
import { SOURCE } from "../../../process-configuration/ProcessEngine";
import "../../../process-configuration/process-theme.css";
import { camundaApi } from "../../../process-monitor/services/camundaApi";
import "./ProcessDashboard.css";
import {
    DASHBOARD_TABS,
    DEFAULT_CONFIG,
    INITIAL_DASHBOARD_STATE,
    INITIAL_HISTORY_STATE,
} from "./constants";
import { fetchProcessCatalog, fetchTenantData } from "./fetchers";
import DashboardHeader from "./components/DashboardHeader";
import DesignPlaceholder from "./components/DesignPlaceholder";
import HistoryDashboardTab from "./components/HistoryDashboardTab";
import LiveDashboardTab from "./components/LiveDashboardTab";
import ProcessDashboardConfigModal from "./components/ProcessDashboardConfigModal";
import ProcessSelectorModal from "./components/ProcessSelectorModal";
import {
    buildHistoryServiceParams,
    buildHistoryInFilter,
    buildInstanceSla,
    createCustomHistoryFilter,
    createQuickHistoryFilter,
    defaultHistoryFilters,
    flattenLeafActivities,
    formatHistoryFilterSummary,
    formatRelativeMinutes,
    isEmptyObject,
    mapWithConcurrency,
    monthKey,
    normalizeConfig,
    normalizeNumber,
    normalizeRows,
    parseNumeric,
    resolveEscalationPath,
    startOfIsoWeek,
    toDateInputValue,
} from "./utils";

function ErrorMessage() {
    return <div>Error occurred in Process Dashboard.</div>;
}

export default function ProcessDashboard(props) {
    const { component, mode, modeType } = props;

    const appContext = useContext(AppContext);
    const designerContext = useContext(DesignerContext);
    const [componentData, setComponentData] = useState(DEFAULT_CONFIG);
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [processListLoading, setProcessListLoading] = useState(false);
    const [processList, setProcessList] = useState([]);
    const [processSearch, setProcessSearch] = useState("");
    const [showProcessSelector, setShowProcessSelector] = useState(false);
    const [activeTab, setActiveTab] = useState(DASHBOARD_TABS.LIVE);
    const [historyDraft, setHistoryDraft] = useState(defaultHistoryFilters);
    const [historyFilters, setHistoryFilters] = useState(defaultHistoryFilters);
    const [historyProcessKeys, setHistoryProcessKeys] = useState([]);
    const [historyProcessSelectionTouched, setHistoryProcessSelectionTouched] = useState(false);
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);
    const [reloadTick, setReloadTick] = useState(0);
    const [historyReloadTick, setHistoryReloadTick] = useState(0);
    const [dashboardState, setDashboardState] = useState(INITIAL_DASHBOARD_STATE);
    const [historyState, setHistoryState] = useState(INITIAL_HISTORY_STATE);

    const processEngine = appContext?.tenantSubscription?.process_engine || "";
    const tenantId = appContext?.tenantSubscription?.tenant_id || "";
    const resolvedComponentConfig = normalizeConfig(componentData);
    const processScopeSignature = JSON.stringify(
        resolvedComponentConfig.process_keys || [],
    );
    const configuredProcessKeys = useMemo(
        () => tryParseJSONObject(processScopeSignature, []),
        [processScopeSignature],
    );
    const configTitle = resolvedComponentConfig.title || DEFAULT_CONFIG.title;
    const configScope = resolvedComponentConfig.process_scope;
    const refreshIntervalSeconds = normalizeNumber(
        resolvedComponentConfig.refresh_interval_seconds,
        DEFAULT_CONFIG.refresh_interval_seconds,
    );
    const maxActivityRows = normalizeNumber(
        resolvedComponentConfig.max_activity_rows,
        DEFAULT_CONFIG.max_activity_rows,
    );
    const maxIncidentRows = normalizeNumber(
        resolvedComponentConfig.max_incident_rows,
        DEFAULT_CONFIG.max_incident_rows,
    );
    const maxSlaRows = normalizeNumber(
        resolvedComponentConfig.max_sla_rows,
        DEFAULT_CONFIG.max_sla_rows,
    );
    const isDesignMode = mode && modeType && mode === modeType.design;
    const canRenderLiveData =
        mode &&
        modeType &&
        [modeType.preview, modeType.render, modeType.readonly].includes(mode);
    const selectedScopeLabel = configScope === "SELECTED"
        ? `${configuredProcessKeys.length} selected process${configuredProcessKeys.length === 1 ? "" : "es"}`
        : "All processes";
    const availableHistoryProcesses = useMemo(() => processList.filter(process => {
        const processKey = String(process?.process_key || "");
        return processKey && (
            configScope !== "SELECTED" ||
            configuredProcessKeys.includes(processKey)
        );
    }), [configScope, configuredProcessKeys, processList]);
    const availableHistoryProcessKeys = useMemo(() => availableHistoryProcesses.map(process =>
        String(process.process_key || ""),
    ), [availableHistoryProcesses]);
    const availableHistoryProcessKeysSignature = JSON.stringify(availableHistoryProcessKeys);
    const selectedHistoryProcessKeys = useMemo(() => historyProcessKeys.filter(processKey =>
        availableHistoryProcessKeys.includes(processKey),
    ), [availableHistoryProcessKeys, historyProcessKeys]);
    const hasAvailableHistoryProcesses = availableHistoryProcessKeys.length > 0;
    const isUsingDefaultHistorySelection = (
        !historyProcessSelectionTouched &&
        hasAvailableHistoryProcesses &&
        selectedHistoryProcessKeys.length === 0
    );
    const areAllHistoryProcessesSelected = (
        hasAvailableHistoryProcesses &&
        (
            selectedHistoryProcessKeys.length === availableHistoryProcessKeys.length ||
            isUsingDefaultHistorySelection
        )
    );
    const selectedHistoryProcessLabel = useMemo(() => (
        !hasAvailableHistoryProcesses
            ? "No available processes"
            : areAllHistoryProcessesSelected
                ? "All available processes"
                : selectedHistoryProcessKeys.length === 0
                    ? "No processes selected"
                    : selectedHistoryProcessKeys.length === 1
                        ? (
                            availableHistoryProcesses.find(process =>
                                String(process.process_key || "") === selectedHistoryProcessKeys[0],
                            )?.title || selectedHistoryProcessKeys[0]
                        )
                        : `${selectedHistoryProcessKeys.length} processes selected`
    ), [
        areAllHistoryProcessesSelected,
        availableHistoryProcesses,
        hasAvailableHistoryProcesses,
        selectedHistoryProcessKeys,
    ]);
    const historyProcessSignature = JSON.stringify(selectedHistoryProcessKeys);
    const activeHistoryFilterSummary = formatHistoryFilterSummary(historyFilters);
    const headerScopeLabel = activeTab === DASHBOARD_TABS.LIVE
        ? (configScope === "SELECTED"
            ? `${dashboardState.selectedProcessNames.length || configuredProcessKeys.length} selected process definitions`
            : "All running processes in scope")
        : `${selectedScopeLabel} - ${selectedHistoryProcessLabel} - ${historyFilters.from} to ${historyFilters.to}`;

    useEffect(() => {
        const nextData = normalizeConfig(component?.data || {});
        setComponentData(nextData);
    }, [component?.data]);

    useEffect(() => {
        setConfig(normalizeConfig(componentData));
    }, [componentData]);

    useEffect(() => {
        if (!showConfig) return;
        let cancelled = false;
        setProcessListLoading(true);
        fetchProcessCatalog()
            .then(rows => {
                if (!cancelled) {
                    setProcessList(rows);
                }
            })
            .catch(error => {
                console.error("Unable to load process map:", error);
                if (!cancelled) {
                    setProcessList([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setProcessListLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [showConfig]);

    useEffect(() => {
        if (isDesignMode || activeTab !== DASHBOARD_TABS.HISTORY || processList.length) {
            return;
        }
        let cancelled = false;
        setProcessListLoading(true);
        fetchProcessCatalog()
            .then(rows => {
                if (!cancelled) setProcessList(rows);
            })
            .catch(error => {
                console.error("Unable to load process map:", error);
                if (!cancelled) setProcessList([]);
            })
            .finally(() => {
                if (!cancelled) setProcessListLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [activeTab, isDesignMode, processList.length]);

    useEffect(() => {
        setHistoryProcessKeys(previous => {
            const next = previous.filter(processKey =>
                availableHistoryProcessKeys.includes(processKey),
            );
            if (!availableHistoryProcessKeys.length) {
                return next.length === previous.length ? previous : next;
            }
            if (!historyProcessSelectionTouched && !next.length) {
                return availableHistoryProcessKeys;
            }
            return next.length === previous.length ? previous : next;
        });
    }, [
        availableHistoryProcessKeys,
        availableHistoryProcessKeysSignature,
        configScope,
        historyProcessSelectionTouched,
        processList,
        processScopeSignature,
    ]);

    useEffect(() => {
        if (!canRenderLiveData || processEngine !== SOURCE.CAMUNDA_SEVEN) return;
        setReloadTick(previous => previous + 1);
    }, [
        canRenderLiveData,
        processEngine,
        configTitle,
        configScope,
        processScopeSignature,
        refreshIntervalSeconds,
        maxActivityRows,
        maxIncidentRows,
        maxSlaRows,
    ]);

    useEffect(() => {
        if (!canRenderLiveData || processEngine !== SOURCE.CAMUNDA_SEVEN) return;
        const refreshSeconds = Math.max(60, refreshIntervalSeconds);
        const intervalId = setInterval(() => {
            setReloadTick(previous => previous + 1);
        }, refreshSeconds * 1000);
        return () => clearInterval(intervalId);
    }, [
        canRenderLiveData,
        processEngine,
        configScope,
        processScopeSignature,
        refreshIntervalSeconds,
    ]);

    useEffect(() => {
        if (!canRenderLiveData || processEngine !== SOURCE.CAMUNDA_SEVEN) return;
        if (reloadTick === 0) return;

        let cancelled = false;

        async function runLiveDashboard() {
            const currentConfig = {
                ...DEFAULT_CONFIG,
                title: configTitle,
                process_scope: configScope,
                process_keys: tryParseJSONObject(processScopeSignature, []),
                refresh_interval_seconds: refreshIntervalSeconds,
                max_activity_rows: maxActivityRows,
                max_incident_rows: maxIncidentRows,
                max_sla_rows: maxSlaRows,
            };
            const silent = reloadTick > 1;
            if (!silent) {
                setDashboardState(previous => ({
                    ...previous,
                    loading: true,
                    error: "",
                }));
            } else {
                setDashboardState(previous => ({
                    ...previous,
                    error: "",
                }));
            }

            try {
                const selectedProcessKeys = currentConfig.process_scope === "SELECTED"
                    ? currentConfig.process_keys
                    : [];

                const [
                    latestDefinitions,
                    activeInstances,
                    suspendedInstances,
                    failedJobs,
                    incidents,
                    runningHistory,
                    selectedProcessCatalog,
                ] = await Promise.all([
                    camundaApi.getProcessDefinitions().catch(() => []),
                    camundaApi.getProcessInstances().catch(() => []),
                    camundaApi.getSuspendedProcessInstances().catch(() => []),
                    camundaApi.getFailedJobs().catch(() => []),
                    camundaApi.getIncidents().catch(() => []),
                    camundaApi.getRunningHistoricInstances().catch(() => []),
                    selectedProcessKeys.length
                        ? fetchProcessCatalog().catch(() => [])
                        : Promise.resolve([]),
                ]);

                let scopedDefinitions = Array.isArray(latestDefinitions)
                    ? latestDefinitions
                    : [];
                let allowedDefinitionIds = null;
                const titleByProcessKey = Object.fromEntries(
                    (Array.isArray(selectedProcessCatalog) ? selectedProcessCatalog : [])
                        .filter(item => item?.process_key)
                        .map(item => [String(item.process_key), item.title || item.process_key]),
                );

                if (selectedProcessKeys.length) {
                    const definitionVersions = await Promise.all(
                        selectedProcessKeys.map(processKey =>
                            camundaApi.getProcessDefinitionVersions(
                                processKey,
                                tenantId,
                            ).catch(() => []),
                        ),
                    );
                    const versionRows = definitionVersions.flat().filter(Boolean);
                    allowedDefinitionIds = new Set(versionRows.map(item => item.id));
                    const latestByKey = {};
                    versionRows.forEach(item => {
                        if (!latestByKey[item.key]) {
                            latestByKey[item.key] = item;
                        }
                    });
                    scopedDefinitions = selectedProcessKeys.map(processKey => (
                        latestByKey[processKey] || {
                            id: processKey,
                            key: processKey,
                            name: titleByProcessKey[processKey] || processKey,
                        }
                    ));
                }

                const definitionMap = {};
                (Array.isArray(latestDefinitions) ? latestDefinitions : []).forEach(item => {
                    definitionMap[item.id] = item;
                });
                if (allowedDefinitionIds) {
                    scopedDefinitions.forEach(item => {
                        if (item?.id) definitionMap[item.id] = item;
                    });
                }

                const historyMap = {};
                (Array.isArray(runningHistory) ? runningHistory : []).forEach(item => {
                    if (item?.id) historyMap[item.id] = item;
                });

                const filterByScope = row => {
                    if (!allowedDefinitionIds) return true;
                    return allowedDefinitionIds.has(
                        row?.definitionId || row?.processDefinitionId,
                    );
                };

                const filteredActiveInstances = (
                    Array.isArray(activeInstances) ? activeInstances : []
                ).filter(filterByScope);
                const filteredSuspendedInstances = (
                    Array.isArray(suspendedInstances) ? suspendedInstances : []
                ).filter(filterByScope);
                const filteredFailedJobs = (
                    Array.isArray(failedJobs) ? failedJobs : []
                ).filter(filterByScope);
                const filteredIncidents = (
                    Array.isArray(incidents) ? incidents : []
                ).filter(filterByScope);

                const detailedInstances = await mapWithConcurrency(
                    filteredActiveInstances,
                    8,
                    async instance => {
                        const [variables, activity] = await Promise.all([
                            camundaApi.getInstanceVariables(instance.id).catch(() => ({})),
                            camundaApi.getActivityInstances(instance.id).catch(() => null),
                        ]);
                        const definition = definitionMap[instance.definitionId] || {};
                        const startTime = historyMap[instance.id]?.startTime || null;
                        const activities = flattenLeafActivities(activity);
                        return {
                            ...instance,
                            definition,
                            definitionKey: definition?.key || instance?.definitionId || "",
                            definitionName:
                                definition?.name ||
                                titleByProcessKey[definition?.key] ||
                                definition?.key ||
                                instance?.definitionId ||
                                "Unknown process",
                            variables,
                            activities,
                            startTime,
                            sla: buildInstanceSla(variables, startTime),
                            escalationPath: resolveEscalationPath(variables),
                        };
                    },
                );

                const failedInstanceIds = new Set();
                filteredFailedJobs.forEach(job => {
                    if (job?.processInstanceId) failedInstanceIds.add(job.processInstanceId);
                });
                filteredIncidents.forEach(incident => {
                    if (incident?.processInstanceId) {
                        failedInstanceIds.add(incident.processInstanceId);
                    }
                });

                const activityRowsMap = {};
                detailedInstances.forEach(instance => {
                    const groupKey =
                        instance.definitionKey || instance.definitionId || instance.id;
                    if (!activityRowsMap[groupKey]) {
                        activityRowsMap[groupKey] = {
                            key: groupKey,
                            title: instance.definitionName,
                            processKey: instance.definitionKey,
                            activeInstances: 0,
                            activityCounts: {},
                        };
                    }
                    activityRowsMap[groupKey].activeInstances += 1;
                    if (!instance.activities.length) {
                        activityRowsMap[groupKey].activityCounts["No active step"] =
                            (activityRowsMap[groupKey].activityCounts["No active step"] || 0) + 1;
                    }
                    instance.activities.forEach(activityItem => {
                        const name =
                            activityItem.name || activityItem.id || "Unknown activity";
                        activityRowsMap[groupKey].activityCounts[name] =
                            (activityRowsMap[groupKey].activityCounts[name] || 0) + 1;
                    });
                });

                const activityRows = Object.values(activityRowsMap)
                    .map(item => ({
                        ...item,
                        activities: Object.entries(item.activityCounts)
                            .sort((left, right) => right[1] - left[1])
                            .map(([name, count]) => ({ name, count })),
                    }))
                    .sort((left, right) => right.activeInstances - left.activeInstances)
                    .slice(0, Math.max(1, currentConfig.max_activity_rows));

                const instanceDetailsMap = Object.fromEntries(
                    detailedInstances.map(instance => [instance.id, instance]),
                );
                const incidentRowsMap = {};

                const ensureIncidentRow = (definitionId, fallbackProcessKey = "") => {
                    const definition = definitionMap[definitionId] || {};
                    const groupKey =
                        definition?.key || fallbackProcessKey || definitionId || "unknown";
                    if (!incidentRowsMap[groupKey]) {
                        incidentRowsMap[groupKey] = {
                            key: groupKey,
                            title:
                                definition?.name ||
                                titleByProcessKey[definition?.key] ||
                                definition?.key ||
                                fallbackProcessKey ||
                                "Unknown process",
                            processKey: definition?.key || fallbackProcessKey || "",
                            failedJobs: 0,
                            incidents: 0,
                            totalRetries: 0,
                            paths: new Set(),
                            samples: [],
                        };
                    }
                    return incidentRowsMap[groupKey];
                };

                filteredFailedJobs.forEach(job => {
                    const row = ensureIncidentRow(job?.processDefinitionId);
                    row.failedJobs += 1;
                    row.totalRetries += Number(job?.retries || 0);
                    const details = instanceDetailsMap[job?.processInstanceId];
                    if (details?.escalationPath) row.paths.add(details.escalationPath);
                    if (row.samples.length < 3) {
                        row.samples.push({
                            type: "Job failure",
                            message: job?.exceptionMessage || "Exception not provided",
                            retries: Number(job?.retries || 0),
                        });
                    }
                });

                filteredIncidents.forEach(incident => {
                    const row = ensureIncidentRow(incident?.processDefinitionId);
                    row.incidents += 1;
                    const details = instanceDetailsMap[incident?.processInstanceId];
                    if (details?.escalationPath) row.paths.add(details.escalationPath);
                    if (row.samples.length < 3) {
                        row.samples.push({
                            type: incident?.incidentType || "Incident",
                            message:
                                incident?.incidentMessage ||
                                "Incident message unavailable",
                            retries: null,
                        });
                    }
                });

                const incidentRows = Object.values(incidentRowsMap)
                    .map(item => ({
                        ...item,
                        escalationPath:
                            [...item.paths].filter(Boolean)[0] || "Not configured",
                    }))
                    .sort((left, right) => {
                        const leftScore = left.incidents + left.failedJobs;
                        const rightScore = right.incidents + right.failedJobs;
                        return rightScore - leftScore;
                    })
                    .slice(0, Math.max(1, currentConfig.max_incident_rows));

                const breachedInstances = detailedInstances
                    .filter(instance => instance?.sla?.remainingMinutes !== null)
                    .filter(instance => instance.sla.remainingMinutes < 0)
                    .sort(
                        (left, right) =>
                            left.sla.remainingMinutes - right.sla.remainingMinutes,
                    );

                const slaRows = breachedInstances
                    .slice(0, Math.max(1, currentConfig.max_sla_rows))
                    .map(instance => ({
                        id: instance.id,
                        title: instance.definitionName,
                        processKey: instance.definitionKey,
                        businessKey: instance.businessKey || instance.id,
                        deadline: instance.sla.deadline,
                        overdueText: formatRelativeMinutes(
                            instance.sla.remainingMinutes,
                        ),
                        thresholdText: `${instance.sla.thresholds.highMinutes}m / ${instance.sla.thresholds.mediumMinutes}m`,
                        escalationPath: instance.escalationPath,
                    }));

                if (cancelled) return;
                setDashboardState({
                    loading: false,
                    error: "",
                    summary: {
                        activeCount: filteredActiveInstances.length,
                        suspendedCount: filteredSuspendedInstances.length,
                        failedCount: failedInstanceIds.size,
                        breachCount: breachedInstances.length,
                    },
                    activityRows,
                    incidentRows,
                    slaRows,
                    selectedProcessNames: scopedDefinitions.map(item => (
                        item?.name ||
                        titleByProcessKey[item?.key] ||
                        item?.key ||
                        item?.id
                    )),
                    lastUpdated: new Date().toLocaleString(),
                });
            } catch (error) {
                console.error(error);
                if (cancelled) return;
                setDashboardState(previous => ({
                    ...previous,
                    loading: false,
                    error:
                        error?.response?.data?.C_MESSAGE ||
                        error?.response?.data?.message ||
                        error?.message ||
                        "Unable to load the process dashboard.",
                }));
            }
        }

        runLiveDashboard();
        return () => {
            cancelled = true;
        };
    }, [
        canRenderLiveData,
        processEngine,
        reloadTick,
        tenantId,
        configTitle,
        configScope,
        processScopeSignature,
        refreshIntervalSeconds,
        maxActivityRows,
        maxIncidentRows,
        maxSlaRows,
    ]);

    useEffect(() => {
        if (
            !canRenderLiveData ||
            processEngine !== SOURCE.CAMUNDA_SEVEN ||
            activeTab !== DASHBOARD_TABS.HISTORY
        ) {
            return;
        }
        setHistoryReloadTick(previous => previous + 1);
    }, [
        activeTab,
        canRenderLiveData,
        processEngine,
        configScope,
        processScopeSignature,
        historyProcessSignature,
        historyFilters.from,
        historyFilters.to,
    ]);

    useEffect(() => {
        if (
            !canRenderLiveData ||
            processEngine !== SOURCE.CAMUNDA_SEVEN ||
            activeTab !== DASHBOARD_TABS.HISTORY ||
            historyReloadTick === 0
        ) {
            return;
        }

        let cancelled = false;

        async function runHistoryDashboard() {
            setHistoryState(previous => ({
                ...previous,
                loading: true,
                error: "",
            }));

            try {
                const catalog = processList.length ? processList : await fetchProcessCatalog();
                if (!cancelled && !processList.length) {
                    setProcessList(catalog);
                }
                const selectedKeys = tryParseJSONObject(processScopeSignature, []);
                const availableProcesses = configScope === "SELECTED"
                    ? catalog.filter(item => selectedKeys.includes(String(item.process_key || "")))
                    : catalog;
                const availableProcessKeys = availableProcesses
                    .map(item => String(item.process_key || ""))
                    .filter(Boolean);
                const scopedProcessKeys = areAllHistoryProcessesSelected
                    ? availableProcessKeys
                    : selectedHistoryProcessKeys.filter(processKey =>
                        availableProcessKeys.includes(processKey),
                    );

                if (!scopedProcessKeys.length) {
                    if (availableProcessKeys.length) {
                        setHistoryState({
                            ...INITIAL_HISTORY_STATE,
                            loading: false,
                            lastUpdated: new Date().toLocaleString(),
                        });
                        return;
                    }
                    throw new Error("No process definitions are available for the selected scope.");
                }
                let historyInFilters = buildHistoryInFilter(scopedProcessKeys);

                const serviceParams = buildHistoryServiceParams(
                    {
                        from: historyFilters.from,
                        to: historyFilters.to,
                    }
                );
                const titleByProcessKey = Object.fromEntries(
                    catalog
                        .filter(item => item?.process_key)
                        .map(item => [String(item.process_key), item.title || item.process_key]),
                );
                const data = await fetchTenantData([
                    {
                        serviceParams,
                        dataKey: "cycleTime",
                        serviceKey: "bpm.history.cycle.time",
                        mode: "formData",
                        IN_FILTER: historyInFilters,
                    },
                    {
                        serviceParams,
                        dataKey: "throughput",
                        serviceKey: "bpm.history.throughput",
                        mode: "formData",
                        IN_FILTER: historyInFilters,
                    },
                    {
                        serviceParams,
                        dataKey: "compliance",
                        serviceKey: "bpm.history.compliance.rate",
                        mode: "formData",
                        IN_FILTER: historyInFilters,
                    },
                    {
                        serviceParams,
                        dataKey: "failureTrend",
                        serviceKey: "bpm.history.failure.trend",
                        mode: "formData",
                        IN_FILTER: historyInFilters,
                    },
                ]);
                const cycleRows = normalizeRows(data?.cycleTime)
                    .map(row => ({
                        processKey: String(row?.process_definition_key || ""),
                        title:
                            titleByProcessKey[String(row?.process_definition_key || "")] ||
                            String(row?.process_definition_key || ""),
                        avgCycleSeconds: parseNumeric(row?.avg_cycle_seconds),
                    }))
                    .sort((left, right) => right.avgCycleSeconds - left.avgCycleSeconds);

                const throughputRows = normalizeRows(data?.throughput)
                    .map(row => ({
                        processKey: String(row?.process_definition_key || ""),
                        title:
                            titleByProcessKey[String(row?.process_definition_key || "")] ||
                            String(row?.process_definition_key || ""),
                        day: row?.day,
                        completedInstances: parseNumeric(row?.completed_instances),
                    }))
                    .sort((left, right) => new Date(left.day) - new Date(right.day));

                const complianceRows = normalizeRows(data?.compliance)
                    .map(row => ({
                        processKey: String(row?.process_definition_key || ""),
                        title:
                            titleByProcessKey[String(row?.process_definition_key || "")] ||
                            String(row?.process_definition_key || ""),
                        compliancePercent: parseNumeric(row?.sla_compliance_percent),
                    }))
                    .sort((left, right) => right.compliancePercent - left.compliancePercent);

                const activityPerformanceGroups = await mapWithConcurrency(
                    scopedProcessKeys,
                    4,
                    async processKey => {
                        const activityData = await fetchTenantData([
                            {
                                serviceParams,
                                dataKey: "activityPerformance",
                                serviceKey: "bpm.history.activity.performance",
                                mode: "formData",
                                IN_FILTER: buildHistoryInFilter([processKey]),
                            },
                        ]);

                        return normalizeRows(activityData?.activityPerformance).map(row => ({
                            processKey,
                            title: titleByProcessKey[processKey] || processKey,
                            taskName: row?.task_name || "Unknown activity",
                            avgActivitySeconds: parseNumeric(row?.avg_activity_seconds),
                        }));
                    },
                );

                const activityPerformanceRows = activityPerformanceGroups
                    .flat()
                    .sort((left, right) => right.avgActivitySeconds - left.avgActivitySeconds);

                const failureRows = normalizeRows(data?.failureTrend)
                    .map(row => ({
                        processKey: String(row?.process_definition_key || ""),
                        title:
                            titleByProcessKey[String(row?.process_definition_key || "")] ||
                            String(row?.process_definition_key || ""),
                        event: String(row?.c_event || "").toLowerCase(),
                        eventCount: parseNumeric(row?.event_count),
                        day: row?.day,
                    }))
                    .sort((left, right) => new Date(left.day) - new Date(right.day));

                const completedTotal = throughputRows.reduce(
                    (sum, row) => sum + row.completedInstances,
                    0,
                );
                const dailyGroups = {};
                const weeklyGroups = {};
                const monthlyGroups = {};
                throughputRows.forEach(row => {
                    const dayKey = row.day ? toDateInputValue(new Date(row.day)) : "Unknown";
                    const week = row.day ? startOfIsoWeek(row.day) : "Unknown";
                    const month = row.day ? monthKey(row.day) : "Unknown";
                    dailyGroups[dayKey] = (dailyGroups[dayKey] || 0) + row.completedInstances;
                    weeklyGroups[week] = (weeklyGroups[week] || 0) + row.completedInstances;
                    monthlyGroups[month] = (monthlyGroups[month] || 0) + row.completedInstances;
                });

                const historicFailures = failureRows
                    .filter(row => row.event === "error")
                    .reduce((sum, row) => sum + row.eventCount, 0);
                const historicIncidents = failureRows
                    .filter(row => row.event === "incident")
                    .reduce((sum, row) => sum + row.eventCount, 0);
                const historicEscalations = failureRows
                    .filter(row => row.event === "escalation")
                    .reduce((sum, row) => sum + row.eventCount, 0);

                if (cancelled) return;
                setHistoryState({
                    loading: false,
                    error: "",
                    cycleRows,
                    throughputRows,
                    complianceRows,
                    activityPerformanceRows,
                    failureRows,
                    summary: {
                        avgCycleSeconds: cycleRows.length
                            ? cycleRows.reduce((sum, row) => sum + row.avgCycleSeconds, 0) /
                              cycleRows.length
                            : 0,
                        completedTotal,
                        completedDailyAverage: Object.keys(dailyGroups).length
                            ? completedTotal / Object.keys(dailyGroups).length
                            : 0,
                        completedWeeklyAverage: Object.keys(weeklyGroups).length
                            ? completedTotal / Object.keys(weeklyGroups).length
                            : 0,
                        completedMonthlyAverage: Object.keys(monthlyGroups).length
                            ? completedTotal / Object.keys(monthlyGroups).length
                            : 0,
                        compliancePercent: complianceRows.length
                            ? complianceRows.reduce(
                                (sum, row) => sum + row.compliancePercent,
                                0,
                            ) / complianceRows.length
                            : 0,
                        slowestActivitySeconds: activityPerformanceRows[0]?.avgActivitySeconds || 0,
                        historicFailures,
                        historicIncidents,
                        historicEscalations,
                    },
                    lastUpdated: new Date().toLocaleString(),
                });
            } catch (error) {
                console.error(error);
                if (cancelled) return;
                setHistoryState(previous => ({
                    ...previous,
                    loading: false,
                    error:
                        error?.response?.data?.C_MESSAGE ||
                        error?.response?.data?.message ||
                        error?.message ||
                        "Unable to load process history KPIs.",
                }));
            }
        }

        runHistoryDashboard();
        return () => {
            cancelled = true;
        };
    }, [
        activeTab,
        areAllHistoryProcessesSelected,
        canRenderLiveData,
        processEngine,
        historyReloadTick,
        historyFilters.from,
        historyFilters.to,
        selectedHistoryProcessKeys,
        historyProcessSignature,
        configScope,
        processScopeSignature,
        processList,
    ]);

    function updateComponentConfig(nextConfig) {
        if (!designerContext?.components || isEmptyObject(component || {})) return;
        const currentComponent = designerContext.components[component.id];
        if (!currentComponent) return;
        const updatedComponents = { ...designerContext.components };
        updatedComponents[component.id] = {
            ...currentComponent,
            data: {
                ...currentComponent.data,
                ...nextConfig,
            },
        };
        designerContext.setComponents(updatedComponents);
        setComponentData(normalizeConfig(updatedComponents[component.id].data));
    }

    function handleSaveConfig() {
        updateComponentConfig({
            ...config,
            process_keys: Array.isArray(config.process_keys) ? config.process_keys : [],
        });
        setShowConfig(false);
    }

    function handleProcessToggle(processKey, checked) {
        setConfig(previous => {
            const selected = new Set(previous.process_keys || []);
            if (checked) selected.add(processKey);
            else selected.delete(processKey);
            return {
                ...previous,
                process_keys: [...selected],
            };
        });
    }

    function applyHistoryFilters() {
        if (!historyDraft.from || !historyDraft.to) return;
        if (new Date(historyDraft.from) > new Date(historyDraft.to)) {
            setHistoryState(previous => ({
                ...previous,
                error: "Date from must be earlier than or equal to date to.",
            }));
            return;
        }
        const customFilters = createCustomHistoryFilter(
            historyDraft.from,
            historyDraft.to,
        );
        setHistoryDraft(customFilters);
        setHistoryFilters(customFilters);
        setShowCustomDateModal(false);
    }

    function applyQuickHistoryFilter(filterKey) {
        const nextFilters = createQuickHistoryFilter(filterKey);
        setHistoryDraft(nextFilters);
        setHistoryFilters(nextFilters);
        setShowCustomDateModal(false);
    }

    function openCustomDateModal() {
        setHistoryDraft({
            from: historyFilters.from,
            to: historyFilters.to,
        });
        setShowCustomDateModal(true);
    }

    function closeCustomDateModal() {
        setHistoryDraft({
            from: historyFilters.from,
            to: historyFilters.to,
        });
        setShowCustomDateModal(false);
    }

    function openProcessSelector() {
        setProcessSearch("");
        setShowProcessSelector(true);
    }

    function handleHistoryProcessToggle(processKey, checked) {
        setHistoryProcessSelectionTouched(true);
        setHistoryProcessKeys(previous => {
            const selected = new Set(previous || []);
            if (checked) selected.add(processKey);
            else selected.delete(processKey);
            return [...selected];
        });
    }

    function handleHistoryProcessSelectAll() {
        setHistoryProcessSelectionTouched(true);
        setHistoryProcessKeys(availableHistoryProcessKeys);
    }

    function handleHistoryProcessClearAll() {
        setHistoryProcessSelectionTouched(true);
        setHistoryProcessKeys([]);
    }

    function refreshActiveTab() {
        if (activeTab === DASHBOARD_TABS.LIVE) {
            setReloadTick(previous => previous + 1);
            return;
        }
        setHistoryReloadTick(previous => previous + 1);
    }

    const selectedConfigProcesses = (config.process_keys || []).map(processKey => (
        processList.find(process => String(process.process_key) === String(processKey)) || {
            process_key: processKey,
            title: processKey,
        }
    ));

    return (
        <ErrorBoundary render={() => <ErrorMessage />}>
            <div className="process-theme-surface process-dashboard">
                {isDesignMode ? (
                    <>
                        <DesignPlaceholder
                            config={resolvedComponentConfig}
                            onConfigure={() => setShowConfig(true)}
                        />
                        {processEngine && processEngine !== SOURCE.CAMUNDA_SEVEN && (
                            <p className="mb-0 mt-2 text-xs text-slate-500">
                                This widget uses Camunda 7 APIs and will render live data only when the tenant engine is set to Camunda 7.
                            </p>
                        )}
                    </>
                ) : processEngine !== SOURCE.CAMUNDA_SEVEN ? (
                    <div className="process-dashboard__empty rounded-2xl border p-4 text-center text-sm">
                        <i className="fa-solid fa-circle-info me-2 text-indigo-600" />
                        Process Dashboard is available for Camunda 7 tenants.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <DashboardHeader
                            showHeader={config.show_header}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            title={configTitle}
                            scopeLabel={headerScopeLabel}
                            activeFilterSummary={activeHistoryFilterSummary}
                            lastUpdated={
                                activeTab === DASHBOARD_TABS.LIVE
                                    ? (dashboardState.lastUpdated || "just now")
                                    : (historyState.lastUpdated || "not loaded")
                            }
                            loading={
                                activeTab === DASHBOARD_TABS.LIVE
                                    ? dashboardState.loading
                                    : historyState.loading
                            }
                            onRefresh={refreshActiveTab}
                        />

                        {activeTab === DASHBOARD_TABS.LIVE ? (
                            <LiveDashboardTab
                                config={config}
                                dashboardState={dashboardState}
                            />
                        ) : (
                            <HistoryDashboardTab
                                historyDraft={historyDraft}
                                setHistoryDraft={setHistoryDraft}
                                activeFilterKey={historyFilters.key}
                                activeFilterLabel={historyFilters.label}
                                activeFilterSummary={activeHistoryFilterSummary}
                                showCustomDateModal={showCustomDateModal}
                                onQuickFilterSelect={applyQuickHistoryFilter}
                                onOpenCustomDates={openCustomDateModal}
                                onCloseCustomDates={closeCustomDateModal}
                                onApplyCustomDates={applyHistoryFilters}
                                availableProcesses={availableHistoryProcesses}
                                selectedProcessKeys={selectedHistoryProcessKeys}
                                selectedProcessLabel={selectedHistoryProcessLabel}
                                onToggleProcess={handleHistoryProcessToggle}
                                onSelectAllProcesses={handleHistoryProcessSelectAll}
                                onClearProcesses={handleHistoryProcessClearAll}
                                historyState={historyState}
                            />
                        )}
                    </div>
                )}
            </div>

            <ProcessDashboardConfigModal
                show={showConfig}
                onHide={() => setShowConfig(false)}
                config={config}
                setConfig={setConfig}
                selectedConfigProcesses={selectedConfigProcesses}
                onToggleProcess={handleProcessToggle}
                onOpenProcessSelector={openProcessSelector}
                onSave={handleSaveConfig}
            />

            <ProcessSelectorModal
                show={showProcessSelector}
                onHide={() => setShowProcessSelector(false)}
                processList={processList}
                loading={processListLoading}
                processSearch={processSearch}
                setProcessSearch={setProcessSearch}
                selectedProcessKeys={config.process_keys || []}
                onToggleProcess={handleProcessToggle}
                onClear={() =>
                    setConfig(previous => ({
                        ...previous,
                        process_keys: [],
                    }))
                }
            />
        </ErrorBoundary>
    );
}
