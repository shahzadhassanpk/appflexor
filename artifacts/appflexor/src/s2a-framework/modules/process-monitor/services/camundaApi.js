import axios from "axios";
import { BPM_API_URL } from "../../camunda/CamundaConfig";

const proxyUrl = `${BPM_API_URL}?service.key=bpm.data`;

function unwrap(response) {
    if (response.data?.C_STATUS === "UNAUTHORIZED") {
        throw new Error("Your AppFlexor session has expired. Please sign in again.");
    }
    if (["FAILED", "FAILURE", "ERROR"].includes(response.data?.C_STATUS) || response.data?.status === "ERROR") {
        throw new Error(response.data?.C_MESSAGE || response.data?.message || "Camunda request failed.");
    }
    return response.data?.data ?? response.data;
}

export async function camundaRequest(path, options = {}) {
    const response = await axios.post(proxyUrl, {
        path,
        method: options.method || "GET",
        data: options.data || {},
    });
    return unwrap(response);
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

export const camundaApi = {
    getProcessDefinitions: tenantId => camundaRequest(`/process-definition${query({
        latestVersion: true,
    })}`),

    getProcessInstances: tenantId => camundaRequest(`/process-instance${query({
        active: true,
        firstResult: 0,
        maxResults: 100,
    })}`),

    getTasks: tenantId => camundaRequest(`/task${query({
        active: true,
        sortBy: "created",
        sortOrder: "desc",
        firstResult: 0,
        maxResults: 200,
    })}`),

    getHistoricInstances: tenantId => camundaRequest(`/history/process-instance${query({
        sortBy: "startTime",
        sortOrder: "desc",
        firstResult: 0,
        maxResults: 20,
    })}`),

    getJobs: tenantId => camundaRequest(`/job${query({
        withException: false,
        firstResult: 0,
        maxResults: 100,
    })}`),

    getInstanceVariables: instanceId => camundaRequest(`/process-instance/${instanceId}/variables?deserializeValue=true`),
    getInstanceVariable: (instanceId, name) => camundaRequest(`/process-instance/${instanceId}/variables/${encodeURIComponent(name)}?deserializeValue=true`),
    getSerializedInstanceVariable: (instanceId, name) => camundaRequest(`/process-instance/${instanceId}/variables/${encodeURIComponent(name)}?deserializeValue=false`),
    getActivityInstances: instanceId => camundaRequest(`/process-instance/${instanceId}/activity-instances`),
    getProcessDefinitionXml: definitionId => camundaRequest(`/process-definition/${definitionId}/xml`),
    setInstanceVariable: (instanceId, name, variable) => camundaRequest(`/process-instance/${instanceId}/variables/${encodeURIComponent(name)}`, { method: "PUT", data: variable }),
    deleteInstanceVariable: (instanceId, name) => camundaRequest(`/process-instance/${instanceId}/variables/${encodeURIComponent(name)}`, { method: "DELETE" }),
    assignTaskUser: (taskId, userId) => camundaRequest(`/task/${taskId}/assignee`, { method: "POST", data: { userId } }),
    addTaskCandidateGroup: (taskId, groupId) => camundaRequest(`/task/${taskId}/identity-links`, { method: "POST", data: { groupId, type: "candidate" } }),
    getTask: taskId => camundaRequest(`/task/${taskId}`),
    getTaskIdentityLinks: taskId => camundaRequest(`/task/${taskId}/identity-links`),
    getProcessDefinitionVersions: (key, tenantId) => camundaRequest(`/process-definition${query({ key, tenantIdIn: tenantId || undefined, withoutTenantId: tenantId ? undefined : true, sortBy: "version", sortOrder: "desc" })}`),
};
