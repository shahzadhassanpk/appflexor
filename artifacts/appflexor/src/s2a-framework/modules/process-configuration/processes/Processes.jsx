import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { AppContext } from "../../../../AppContext";
import { API_URL, BPM_API_URL, FILE_URL } from "../../../Config";
import ModalBox from "../../../components/Modal/Modal";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import {
    formatDateTimeForUserView,
    updateDeleteConfig,
} from "../../../utils/utils";
import { ProcessDeployDialog } from "./ProcessDeployDialog";
import ProcessWorkspaceList from "../components/ProcessWorkspaceList";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import "./processes.css";

/* ── constants ─────────────────────────────────────────────────────────── */
const DB_TABLE = "process";
const STATUS = { none: "NONE", create: "CREATE", update: "UPDATE" };
const INITIAL_ITEM = { id: "", title: "", process_def_key: "", process_file: "", file_url: "", status: "DRAFT" };

function getDeploymentStatus(item) {
    const status = String(item?.status || "").toUpperCase();
    if (status === "ARCHIVED") return "ARCHIVED";
    if (status === "UNDEPLOYED") return "UNDEPLOYED";
    if (status === "DEPLOYED" || item?.deployment || item?.version || item?.process_id) return "DEPLOYED";
    return "DRAFT";
}

function isMissingDeployment(errorOrResponse) {
    const response = errorOrResponse?.response || errorOrResponse;
    const data = response?.data || response;
    const payload = data?.C_DATA || data?.data || data?.content || data;
    const status = payload?.statusCode || payload?.httpStatus || response?.status;
    const message = [data?.C_MESSAGE, data?.message, payload?.message, payload?.error, errorOrResponse?.message]
        .filter(Boolean)
        .join(" ");
    return Number(status) === 404 || /(no deployment|deployment.*(?:not found|does not exist|do not exist|unknown))/i.test(message);
}

function isMissingProcessDefinition(errorOrResponse) {
    const response = errorOrResponse?.response || errorOrResponse;
    const data = response?.data || response;
    const payload = data?.C_DATA || data?.data || data?.content || data;
    const status = payload?.statusCode || payload?.httpStatus || response?.status;
    const message = [data?.C_MESSAGE, data?.message, payload?.message, payload?.error, errorOrResponse?.message]
        .filter(Boolean)
        .join(" ");
    return Number(status) === 404 || /(?:process definition|definition).*(?:not found|does not exist|do not exist|unknown|no matching)/i.test(message) || /no matching.*(?:process definition|definition)/i.test(message);
}

function isProcessEngineError(response) {
    const data = response?.data || response;
    const payload = data?.C_DATA || data?.data || data?.content || data;
    return [data?.C_STATUS, data?.status, payload?.status]
        .some(status => ["ERROR", "FAILED", "FAILURE"].includes(String(status).toUpperCase()));
}

function parseEngineMetadata(value) {
    if (!value || typeof value === "object") return value;
    const text = String(value).trim();
    if (!text.startsWith("[") && !text.startsWith("{")) return text;
    try { return JSON.parse(text); } catch { return text; }
}

function firstMetadataRecord(value) {
    const parsed = parseEngineMetadata(value);
    return Array.isArray(parsed) ? parsed[0] : parsed;
}

function getStoredDeploymentId(item) {
    const metadata = firstMetadataRecord(item?.deployment);
    if (metadata && typeof metadata === "object") {
        return metadata.deploymentId || metadata.deployment_id || "";
    }
    return typeof metadata === "string" && !metadata.includes(":") ? metadata : "";
}

function getStoredProcessDefinitionId(item) {
    const processId = firstMetadataRecord(item?.process_id);
    if (typeof processId === "string" && processId) return processId;
    if (processId && typeof processId === "object") {
        return processId.process_id || processId.processDefinitionId || "";
    }
    const deploymentMetadata = firstMetadataRecord(item?.deployment);
    return deploymentMetadata && typeof deploymentMetadata === "object"
        ? deploymentMetadata.process_id || deploymentMetadata.processDefinitionId || ""
        : "";
}

function getProcessEnginePayload(response) {
    return response?.data?.data || response?.data?.C_DATA || response?.data?.content || response?.data || response;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Processes — list + orchestrator
═══════════════════════════════════════════════════════════════════════════ */
function Processes({ activeTab }) {
    const appContext = useContext(AppContext);

    /* ── List state ──────────────────────────────────────────────────── */
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [archiveConfig, setArchiveConfig] = useState({ show: false, item: {} });
    const [draftDeleteConfig, setDraftDeleteConfig] = useState({ show: false, item: {} });
    const [undeployConfig, setUndeployConfig] = useState({ show: false, item: {} });
    const [actionItemId, setActionItemId] = useState("");

    /* ── Dialog state ────────────────────────────────────────────────── */
    const [formShow, setFormShow] = useState(false);
    const [initialFormStatus, setInitialFormStatus] = useState(STATUS.create);
    const [initialItem, setInitialItem] = useState(INITIAL_ITEM);
    const [selectedItemId, setSelectedItemId] = useState(""); // for list row highlight

    /* ═══════════════════════════════════════════════════════════════════
       Data
    ═══════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        if (activeTab === "PROCESSES") getData();
    }, [activeTab]);

    function getData() {
        const tenantId = appContext?.tenantSubscription?.tenant_id;
        setLoading(true);
        return axios
            .post(API_URL + "?service.key=masterKey.tenantData", {
                tenant_id: tenantId,
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "engine",
                        serviceKey: "bpm.list.process",
                        mode: "formData",
                    },
                ],
            })
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setItems(response.data.C_DATA?.engine || []);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }

    /* ═══════════════════════════════════════════════════════════════════
       List helpers
    ═══════════════════════════════════════════════════════════════════ */
    function getFilteredItems() {
        const statusFilteredItems = items.filter(item => showArchived
            ? getDeploymentStatus(item) === "ARCHIVED"
            : getDeploymentStatus(item) !== "ARCHIVED");
        if (!searchTerm || !searchTerm.trim()) return statusFilteredItems;
        const q = searchTerm.trim().toLowerCase();
        return statusFilteredItems.filter(it =>
            (it.title || "").toLowerCase().includes(q) ||
            (it.process_def_key || "").toLowerCase().includes(q) ||
            (it.process_file || "").toLowerCase().includes(q),
        );
    }

    function getPaginateData(page, pageSize) {
        const data = getFilteredItems();
        return data ? data.slice((page - 1) * pageSize, page * pageSize) : [];
    }

    /* ═══════════════════════════════════════════════════════════════════
       Dialog open / close
    ═══════════════════════════════════════════════════════════════════ */
    function addNewItem() {
        setInitialFormStatus(STATUS.create);
        setInitialItem(INITIAL_ITEM);
        setSelectedItemId("");
        setFormShow(true);
    }

    function editItem(item) {
        setInitialFormStatus(STATUS.update);
        setInitialItem(item);
        setSelectedItemId(item.id);
        setFormShow(true);
    }

    function handleDialogClose() {
        setFormShow(false);
        setSelectedItemId("");
    }

    /* ═══════════════════════════════════════════════════════════════════
       Delete
    ═══════════════════════════════════════════════════════════════════ */
    function archiveData(item, isDelete) {
        if (isDelete === true) {
            if (getDeploymentStatus(item) !== "UNDEPLOYED") return;
            setActionItemId(item.id);
            axios
                .post(API_URL + "?service.key=update.formData", {
                    data: [{ formId: DB_TABLE, entity: DB_TABLE, action: "update", id: item.id, formData: { ...item, status: "ARCHIVED" } }],
                })
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        getData();
                        updateDeleteConfig(false, {}, setArchiveConfig);
                        toastEmitter("Process archived", true);
                    }
                })
                .catch(error => {
                    console.error(error);
                    toastEmitter("Unable to archive process", true, "error");
                })
                .finally(() => setActionItemId(""));
        } else {
            updateDeleteConfig(true, item, setArchiveConfig);
        }
    }

    function deleteDraft(item, isDelete) {
        if (isDelete !== true) {
            updateDeleteConfig(true, item, setDraftDeleteConfig);
            return;
        }
        if (getDeploymentStatus(item) !== "DRAFT") return;

        setActionItemId(item.id);
        axios.post(API_URL + "?service.key=update.formData", {
            data: [{ formId: DB_TABLE, entity: DB_TABLE, action: "delete", id: item.id }],
        }).then(response => {
            if (response.data?.C_STATUS !== "SUCCESS") {
                throw new Error(response.data?.C_MESSAGE || "Unable to delete draft process");
            }
            updateDeleteConfig(false, {}, setDraftDeleteConfig);
            toastEmitter("Draft process deleted", true);
            return getData();
        }).catch(error => {
            console.error(error);
            toastEmitter(error.message || "Unable to delete draft process", true, "error");
        }).finally(() => setActionItemId(""));
    }

    async function undeployData(item, isDelete) {
        if (isDelete !== true) {
            updateDeleteConfig(true, item, setUndeployConfig);
            return;
        }
        if (getDeploymentStatus(item) !== "DEPLOYED" || !item.deployment) return;

        setActionItemId(item.id);
        try {
            let deploymentWasMissing = false;
            let deploymentId = getStoredDeploymentId(item);

            if (!deploymentId) {
                const processDefinitionId = getStoredProcessDefinitionId(item);
                if (!processDefinitionId) throw new Error("Unable to determine the process definition ID for this deployment");
                try {
                    const definitionResponse = await axios.post(`${BPM_API_URL}?service.key=bpm.data`, {
                        path: `/process-definition/${encodeURIComponent(processDefinitionId)}`,
                        method: "GET",
                        data: {},
                    });
                    if (isMissingProcessDefinition(definitionResponse)) deploymentWasMissing = true;
                    else if (isProcessEngineError(definitionResponse)) throw new Error(getProcessEnginePayload(definitionResponse)?.message || "Unable to find the process deployment");
                    else deploymentId = getProcessEnginePayload(definitionResponse)?.deploymentId || "";
                } catch (definitionError) {
                    if (isMissingProcessDefinition(definitionError)) deploymentWasMissing = true;
                    else throw definitionError;
                }
            }

            if (!deploymentWasMissing) {
                if (!deploymentId) throw new Error("The process engine did not return a deployment ID");
                try {
                    const processEngineResponse = await axios.post(`${BPM_API_URL}?service.key=bpm.data`, {
                        path: `/deployment/${encodeURIComponent(deploymentId)}?cascade=true&skipCustomListeners=true&skipIoMappings=true`,
                        method: "DELETE",
                        data: {},
                    });
                    if (isMissingDeployment(processEngineResponse)) deploymentWasMissing = true;
                    else if (isProcessEngineError(processEngineResponse)) throw new Error(getProcessEnginePayload(processEngineResponse)?.message || "Process engine undeploy failed");
                } catch (processEngineError) {
                    if (isMissingDeployment(processEngineError)) deploymentWasMissing = true;
                    else throw processEngineError;
                }
            }

            const updateResponse = await axios.post(API_URL + "?service.key=update.formData", {
                data: [{
                    formId: DB_TABLE,
                    entity: DB_TABLE,
                    action: "update",
                    id: item.id,
                    formData: {
                        ...item,
                        status: "UNDEPLOYED",
                        version: "",
                        process_id: "",
                        deployment: "",
                    },
                }],
            });
            if (updateResponse.data?.C_STATUS !== "SUCCESS") {
                throw new Error(updateResponse.data?.C_MESSAGE || "Unable to update deployment status");
            }
            updateDeleteConfig(false, {}, setUndeployConfig);
            await getData();
            toastEmitter(deploymentWasMissing ? "Deployment was already absent; process marked as undeployed" : "Process undeployed successfully", true);
        } catch (error) {
            console.error("Undeploy error:", error);
            toastEmitter(error.message || "Unable to undeploy process", true, "error");
        } finally {
            setActionItemId("");
        }
    }

    /* ═══════════════════════════════════════════════════════════════════
       Quick redeploy from list row (no dialog)
    ═══════════════════════════════════════════════════════════════════ */
    async function quickDeploy(item) {
        const process_engine = appContext?.tenantSubscription?.process_engine;
        try {
            const res = await axios.post(`${BPM_API_URL}?service.key=deploy.process`, {
                id: item.id,
                entity: DB_TABLE,
                fileName: item.process_file,
                mainProcessDefKey: item.process_def_key,
                process_engine,
            });
            if (res.data.C_STATUS === "SUCCESS") {
                const data = res.data.C_DATA;
                await axios.post(API_URL + "?service.key=update.formData", {
                    data: [{
                        formId: DB_TABLE,
                        entity: DB_TABLE,
                        action: "update",
                        id: item.id,
                        formData: {
                            ...item,
                            version: data.version,
                            process_id: data.process_id,
                            deployment: data.deployment,
                            status: "DEPLOYED",
                        },
                    }],
                });
                getData();
            }
        } catch (err) {
            console.error("Quick deploy error:", err);
        }
    }

    function renderProcessActions(item) {
        const status = getDeploymentStatus(item);
        const busy = actionItemId === item.id;
        return <>
            <button type="button" disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 disabled:opacity-50" title="Edit process" onClick={() => editItem(item)}><i className="fa-regular fa-edit" /></button>
            {status === "DEPLOYED" && item.deployment && <button type="button" disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-700 disabled:opacity-50" title="Undeploy from process engine" aria-label={`Undeploy ${item.title || item.process_def_key}`} onClick={() => undeployData(item)}><i className={`fa-solid ${busy ? "fa-spinner fa-spin" : "fa-cloud-arrow-down"}`} /></button>}
            {status === "UNDEPLOYED" && <button type="button" disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-700 disabled:opacity-50" title="Archive process" aria-label={`Archive ${item.title || item.process_def_key}`} onClick={() => archiveData(item)}><i className={`fa-solid ${busy ? "fa-spinner fa-spin" : "fa-box-archive"}`} /></button>}
            {status === "DRAFT" && <button type="button" disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 disabled:opacity-50" title="Delete draft" aria-label={`Delete draft ${item.title || item.process_def_key}`} onClick={() => deleteDraft(item)}><i className={`fa-solid ${busy ? "fa-spinner fa-spin" : "fa-trash-can"}`} /></button>}
        </>;
    }

    /* ═══════════════════════════════════════════════════════════════════
       Render
    ═══════════════════════════════════════════════════════════════════ */
    return (
        <div className="process-configuration-map">
            <ModalBox state={undeployConfig} message="Undeploy this process from the process engine? Running and historical process data associated with this deployment may be removed." operation={undeployData} header="Undeploy Process" setState={setUndeployConfig} modalType="deleteModal" />
            <ModalBox state={archiveConfig} message="Archive this undeployed process? It will be hidden from the active process list." operation={archiveData} header="Archive Process" setState={setArchiveConfig} modalType="deleteModal" />
            <ModalBox state={draftDeleteConfig} message="Permanently delete this draft process from AppFlexor?" operation={deleteDraft} header="Delete Draft Process" setState={setDraftDeleteConfig} modalType="deleteModal" />
            <ProcessWorkspaceList title="Deploy Processes" description="Manage BPMN files, deployed versions, and process definitions." items={getFilteredItems()} loading={loading} onRefresh={getData} showArchived={showArchived} setShowArchived={setShowArchived} searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchPlaceholder="Search title, definition key, or file" page={current} setPage={setCurrent} pageSize={size} setPageSize={setSize} onAdd={addNewItem} addLabel="Add process" stats={[
                { label: "Process files", value: items.length, icon: "fa-solid fa-file-code", tone: "bg-indigo-50 text-indigo-600" },
                { label: "Deployed", value: items.filter(item => getDeploymentStatus(item) === "DEPLOYED").length, icon: "fa-solid fa-rocket", tone: "bg-emerald-50 text-emerald-600" },
                { label: "Drafts", value: items.filter(item => getDeploymentStatus(item) === "DRAFT").length, icon: "fa-solid fa-pen-ruler", tone: "bg-amber-50 text-amber-600" },
                { label: "Latest version", value: Math.max(0, ...items.map(item => Number(item.version) || 0)), icon: "fa-solid fa-code-branch", tone: "bg-sky-50 text-sky-600" },
            ]} columns={[
                { key: "title", label: "Process Title" },
                { key: "process_def_key", label: "Definition Key", render: item => <span className="font-medium text-indigo-600">{item.process_def_key || "—"}</span> },
                { key: "process_file", label: "BPMN File" },
                { key: "version", label: "Deployment", sortValue: item => Number(item.version) || 0, render: item => item.version ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">v{item.version}</span> : <span className="text-slate-400">—</span> },
                { key: "status", label: "Status", sortValue: getDeploymentStatus, render: item => { const status = getDeploymentStatus(item); const tone = status === "DEPLOYED" ? "bg-emerald-50 text-emerald-700" : status === "UNDEPLOYED" ? "bg-amber-50 text-amber-700" : status === "ARCHIVED" ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-600"; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status === "UNDEPLOYED" ? "Undeployed" : status === "DEPLOYED" ? "Deployed" : status === "ARCHIVED" ? "Archived" : "Draft"}</span>; } },
                { key: "datemodified", label: "Last Updated", render: item => formatDateTimeForUserView(item.datemodified) },
            ]} renderActions={renderProcessActions} />
            <div className="proc-list-wrap" style={{ display: "none" }}>
                {/* ── Search bar ── */}
                <div className="proc-list-search">
                    <span className="proc-list-search-icon"><i className="fa fa-search" /></span>
                    <input
                        type="text"
                        placeholder="Search by title, def key or file…"
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrent(1); }}
                    />
                    {searchTerm && (
                        <button className="proc-list-search-clear" onClick={() => setSearchTerm("")} title="Clear">
                            <i className="fa fa-times" />
                        </button>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="proc-list-table-wrap">
                    <Table className="proc-list-table">
                        <Thead>
                            <Tr>
                                <Th><TableSorting state={items} setState={setItems} fieldName="title" headerTitle="Process Title" /></Th>
                                <Th><TableSorting state={items} setState={setItems} fieldName="process_def_key" headerTitle="Def Key" /></Th>
                                <Th><TableSorting state={items} setState={setItems} fieldName="process_file" headerTitle="File" /></Th>
                                <Th><TableSorting state={items} setState={setItems} fieldName="version" headerTitle="Deployment" /></Th>
                                <Th><TableSorting state={items} setState={setItems} fieldName="datemodified" headerTitle="Last Updated" /></Th>
                                <Th style={{ width: "7rem" }} />
                            </Tr>
                        </Thead>
                        <Tbody>
                            {getPaginateData(current, size).map(item => (
                                <Tr
                                    key={item.id}
                                    className={item.id === selectedItemId ? "proc-row-selected" : ""}>
                                    <Td>{item.title}</Td>
                                    <Td><span className="proc-list-file">{item.process_def_key}</span></Td>
                                    <Td><span className="proc-list-file">{item.process_file}</span></Td>
                                    <Td>
                                        {item?.version
                                            ? <span className="proc-list-badge proc-list-badge-version">v{item.version}</span>
                                            : <span style={{ color: "color-mix(in srgb, var(--font-color,#374151) 35%, transparent)", fontSize: "0.75rem" }}>—</span>
                                        }
                                    </Td>
                                    <Td>{formatDateTimeForUserView(item?.datemodified)}</Td>
                                    <Td>
                                        <div className="proc-list-actions">
                                            {/* <button className="proc-list-action-btn warning" title="Redeploy" onClick={() => quickDeploy(item)}>
                                                <i className="fa fa-retweet" />
                                            </button> */}
                                            <button className="proc-list-action-btn" title="Edit" onClick={() => editItem(item)}>
                                                <i className="fa-regular fa-edit" />
                                            </button>
                                            {!item?.version &&
                                                <button className="proc-list-action-btn danger" title="Archive" onClick={() => archiveData(item)}>
                                                    <i className="fa-solid fa-box-archive" />
                                                </button>
                                            }
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </div>

                {/* ── Footer: add + pagination ── */}
                <div className="proc-list-footer">
                    <button className="button-theme btn btn-sm" onClick={addNewItem}>
                        <i className="fa-solid fa-plus pe-1" />Add New
                    </button>
                    <TablePagination
                        size={size}
                        setSize={setSize}
                        current={current}
                        setCurrent={setCurrent}
                        tableData={getFilteredItems()}
                    />
                </div>
            </div>

            {/* ── Deploy dialog (self-contained) ── */}
            <ProcessDeployDialog
                show={formShow}
                initialItem={initialItem}
                initialFormStatus={initialFormStatus}
                onClose={handleDialogClose}
                onGetData={getData}
                appContext={appContext}
            />

            {/* ── Delete confirm ── */}
        </div>
    );
}

export default Processes;
