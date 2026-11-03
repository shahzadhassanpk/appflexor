import axios from "axios";
import { BPM_API_URL } from "../../camunda/CamundaConfig";

const proxyUrl = `${BPM_API_URL}?service.key=bpm.data`;
const batchProxyUrl = `${BPM_API_URL}?service.key=bpm.multiKey.data`;

function unwrap(response) {
    if (response.data?.C_STATUS === "UNAUTHORIZED") {
        throw new Error("Your AppFlexor session has expired. Please sign in again.");
    }
    if (["FAILED", "FAILURE", "ERROR"].includes(response.data?.C_STATUS) || response.data?.status === "ERROR") {
        throw new Error(response.data?.C_MESSAGE || response.data?.message || "Process engine request failed.");
    }
    return response.data?.data ?? response.data;
}

export async function camundaRequest(path, options = {}) {
    const method = options.method || "GET";
    const maxAttempts = method === "GET" ? 3 : 1;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const response = await axios.post(proxyUrl, { path, method, data: options.data || {} });
            return unwrap(response);
        } catch (error) {
            lastError = error;
            if (attempt < maxAttempts && !String(error.message || "").includes("session has expired")) {
                await new Promise(resolve => setTimeout(resolve, attempt * 250));
            }
        }
    }
    throw lastError;
}

export async function camundaBatchRequest(dataKeys = []) {
    const response = await axios.post(batchProxyUrl, { dataKeys });
    if (response.data?.C_STATUS === "UNAUTHORIZED") {
        throw new Error("Your AppFlexor session has expired. Please sign in again.");
    }
    if (["FAILED", "FAILURE", "ERROR"].includes(response.data?.C_STATUS) || response.data?.status === "ERROR") {
        throw new Error(response.data?.C_MESSAGE || response.data?.message || "Process engine request failed.");
    }
    return response.data?.data ?? response.data;
}

function query(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            search.set(key, String(value));
        }
    });
    const value = search.toString();
    return value ? `?${value}` : "";
}

async function getAllPages(path, params = {}, pageSize = 100) {
    const rows = [];
    const seenIds = new Set();
    let firstResult = 0;
    let hasMore = true;
    while (hasMore) {
        const page = await camundaRequest(`${path}${query({ ...params, firstResult })}`);
        const items = Array.isArray(page) ? page : [];
        const newItems = items.filter(item => !seenIds.has(item.id));
        newItems.forEach(item => seenIds.add(item.id));
        rows.push(...newItems);
        hasMore = items.length === pageSize && newItems.length > 0;
        if (hasMore) firstResult += pageSize;
    }
    return rows;
}

export const camundaApi = {
    getProcessDefinitions: () => camundaRequest(`/process-definition${query({
        latestVersion: true,
    })}`),
    getAllProcessDefinitions: () => getAllPages("/process-definition"),

    getProcessInstances: () => getAllPages("/process-instance", { active: true }),
    getSuspendedProcessInstances: () => getAllPages("/process-instance", { suspended: true }),
    getProcessInstance: instanceId => camundaRequest(`/process-instance/${instanceId}`),
    getWorkspaceMonitorStats: () => camundaBatchRequest([
        { key: "definitions", request: { path: `/process-definition${query({ latestVersion: true })}`, method: "GET", data: {} } },
        { key: "instances", request: { path: `/process-instance${query({ active: true, firstResult: 0 })}`, method: "GET", data: {} } },
        { key: "suspendedInstances", request: { path: `/process-instance${query({ suspended: true, firstResult: 0 })}`, method: "GET", data: {} } },
        { key: "tasks", request: { path: `/task${query({ active: true, firstResult: 0 })}`, method: "GET", data: {} } },
        { key: "failedJobs", request: { path: `/job${query({ withException: true, firstResult: 0 })}`, method: "GET", data: {} } },
    ]),
    getInstanceDetails: instanceId => camundaBatchRequest([
        { key: "instance", request: { path: `/process-instance/${instanceId}`, method: "GET", data: {} } },
        { key: "activity", request: { path: `/process-instance/${instanceId}/activity-instances`, method: "GET", data: {} } },
        { key: "tasks", request: { path: `/task${query({ processInstanceId: instanceId, active: true, firstResult: 0 })}`, method: "GET", data: {} } },
        { key: "jobs", request: { path: `/job${query({ processInstanceId: instanceId, firstResult: 0 })}`, method: "GET", data: {} } },
    ]),
    deleteProcessInstance: instanceId => camundaRequest(`/process-instance/${instanceId}${query({ skipCustomListeners: true, skipIoMappings: true })}`, { method: "DELETE" }),
    deleteProcessInstances: instanceIds => camundaRequest("/process-instance/delete", {
        method: "POST",
        data: {
            processInstanceIds: instanceIds,
            deleteReason: "Deleted from process monitor",
            skipCustomListeners: true,
            skipIoMappings: true,
            skipSubprocesses: false,
            failIfNotExists: true,
        },
    }),
    getProcessInstancesByDefinition: (definitionId, params = { active: true }) => getAllPages("/process-instance", {
        processDefinitionId: definitionId,
        ...params,
    }),
    getDefinitionRuntime: definitionKey => camundaBatchRequest([
        { key: "activeInstances", request: { path: `/process-instance${query({ processDefinitionKey: definitionKey, active: true, firstResult: 0 })}`, method: "GET", data: {} } },
        { key: "suspendedInstances", request: { path: `/process-instance${query({ processDefinitionKey: definitionKey, suspended: true, firstResult: 0 })}`, method: "GET", data: {} } },
        { key: "tasks", request: { path: `/task${query({ processDefinitionKey: definitionKey, active: true, firstResult: 0 })}`, method: "GET", data: {} } },
        { key: "jobs", request: { path: `/job${query({ processDefinitionKey: definitionKey, firstResult: 0 })}`, method: "GET", data: {} } },
        { key: "history", request: { path: `/history/process-instance${query({ processDefinitionKey: definitionKey, unfinished: true, sortBy: "startTime", sortOrder: "desc", firstResult: 0 })}`, method: "GET", data: {} } },
    ]),
    getProcessInstancesByDefinitionKey: (definitionKey, tenantId, params = {}) => getAllPages("/process-instance", {
        processDefinitionKey: definitionKey,
        tenantIdIn: tenantId || undefined,
        withoutTenantId: tenantId ? undefined : true,
        ...params,
    }),
    setProcessInstanceSuspended: (instanceId, suspended) => camundaRequest(
        `/process-instance/${instanceId}/suspended`,
        {
            method: "PUT",
            data: { suspended },
        },
    ),
    setProcessInstancesSuspendedByDefinitionKey: (definitionKey, tenantId, suspended) => camundaRequest(
        "/process-instance/suspended",
        {
            method: "PUT",
            data: {
                suspended,
                processDefinitionKey: definitionKey,
                ...(tenantId
                    ? { processDefinitionTenantId: tenantId }
                    : { processDefinitionWithoutTenantId: true }),
            },
        },
    ),
    setProcessInstancesSuspendedByDefinition: (definitionId, suspended) => camundaRequest(
        "/process-instance/suspended",
        {
            method: "PUT",
            data: {
                suspended,
                processDefinitionId: definitionId,
            },
        },
    ),

    getTasks: () => camundaRequest(`/task${query({
        active: true,
        sortBy: "created",
        sortOrder: "desc",
        firstResult: 0,
    })}`),
    getTasksByDefinition: definitionId => camundaRequest(`/task${query({ processDefinitionId: definitionId, active: true, firstResult: 0 })}`),
    getTasksByInstance: instanceId => camundaRequest(`/task${query({ processInstanceId: instanceId, active: true, firstResult: 0 })}`),

    getHistoricInstances: () => camundaRequest(`/history/process-instance${query({
        sortBy: "startTime",
        sortOrder: "desc",
        firstResult: 0,
    })}`),
    getRunningHistoricInstances: () => getAllPages(
        "/history/process-instance",
        {
            unfinished: true,
            sortBy: "startTime",
            sortOrder: "desc",
        },
    ),
    getHistoricInstancesByDefinition: definitionId => getAllPages(
        "/history/process-instance",
        {
            processDefinitionId: definitionId,
            unfinished: true,
            sortBy: "startTime",
            sortOrder: "desc",
        },
    ),

    getJobs: () => camundaRequest(`/job${query({
        withException: false,
        firstResult: 0,
    })}`),
    getFailedJobs: () => getAllPages("/job", {
        withException: true,
    }),
    getJobsByDefinition: definitionId => camundaRequest(`/job${query({ processDefinitionId: definitionId, firstResult: 0 })}`),
    getJobsByInstance: instanceId => camundaRequest(`/job${query({ processInstanceId: instanceId, firstResult: 0 })}`),
    getIncidents: () => getAllPages("/incident", {}),
    setJobRetries: (jobId, retries) => camundaRequest(`/job/${jobId}/retries`, { method: "PUT", data: { retries } }),
    getExternalTasksByInstance: instanceId => camundaRequest(`/external-task${query({ processInstanceId: instanceId, firstResult: 0 })}`),
    unlockExternalTask: taskId => camundaRequest(`/external-task/${taskId}/unlock`, { method: "POST" }),
    setExternalTaskRetries: (taskId, retries) => camundaRequest(`/external-task/${taskId}/retries`, { method: "PUT", data: { retries } }),

    getInstanceVariables: instanceId => camundaRequest(`/process-instance/${instanceId}/variables?deserializeValue=true`),
    getInstanceVariable: (instanceId, name) => camundaRequest(`/process-instance/${instanceId}/variables/${encodeURIComponent(name)}?deserializeValue=true`),
    getSerializedInstanceVariable: (instanceId, name) => camundaRequest(`/process-instance/${instanceId}/variables/${encodeURIComponent(name)}?deserializeValue=false`),
    getActivityInstances: instanceId => camundaRequest(`/process-instance/${instanceId}/activity-instances`),
    getProcessDefinitionXml: definitionId => camundaRequest(`/process-definition/${definitionId}/xml`),
    setInstanceVariable: (instanceId, name, variable) => camundaRequest(`/process-instance/${instanceId}/variables/${encodeURIComponent(name)}`, { method: "PUT", data: variable }),
    deleteInstanceVariable: (instanceId, name) => camundaRequest(`/process-instance/${instanceId}/variables/${encodeURIComponent(name)}`, { method: "DELETE" }),
    assignTaskUser: (taskId, userId) => camundaRequest(`/task/${taskId}/assignee`, { method: "POST", data: { userId } }),
    updateTask: (taskId, task) => camundaRequest(`/task/${taskId}`, { method: "PUT", data: task }),
    addTaskCandidateGroup: (taskId, groupId) => camundaRequest(`/task/${taskId}/identity-links`, { method: "POST", data: { groupId, type: "candidate" } }),
    getTask: taskId => camundaRequest(`/task/${taskId}`),
    getTaskForm: taskId => camundaRequest(`/task/${taskId}/form`),
    getTaskIdentityLinks: taskId => camundaRequest(`/task/${taskId}/identity-links`),
    getInstanceTaskDetails: (instanceId, tasks = []) => camundaBatchRequest([
        ...tasks.map((task, index) => ({
            key: `identityLinks_${index}`,
            request: { path: `/task/${task.id}/identity-links`, method: "GET", data: {} },
        })),
        { key: "externalTasks", request: { path: `/external-task${query({ processInstanceId: instanceId, firstResult: 0 })}`, method: "GET", data: {} } },
    ]),
    getProcessDefinitionVersions: (key, tenantId) => camundaRequest(`/process-definition${query({ key, tenantIdIn: tenantId || undefined, withoutTenantId: tenantId ? undefined : true, sortBy: "version", sortOrder: "desc" })}`),
};
