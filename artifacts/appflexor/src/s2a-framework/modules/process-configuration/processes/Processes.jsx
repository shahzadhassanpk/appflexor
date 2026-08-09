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
import "./processes.css";

/* ── constants ─────────────────────────────────────────────────────────── */
const DB_TABLE     = "process";
const STATUS       = { none: "NONE", create: "CREATE", update: "UPDATE" };
const INITIAL_ITEM = { id: "", title: "", process_def_key: "", process_file: "", file_url: "" };

/* ═══════════════════════════════════════════════════════════════════════════
   Processes — list + orchestrator
═══════════════════════════════════════════════════════════════════════════ */
function Processes({ activeTab }) {
    const appContext = useContext(AppContext);

    /* ── List state ──────────────────────────────────────────────────── */
    const [items,        setItems]        = useState([]);
    const [size,         setSize]         = useState(5);
    const [current,      setCurrent]      = useState(1);
    const [searchTerm,   setSearchTerm]   = useState("");
    const [deleteConfig, setDeleteConfig] = useState({ show: false, item: {} });

    /* ── Dialog state ────────────────────────────────────────────────── */
    const [formShow,          setFormShow]          = useState(false);
    const [initialFormStatus, setInitialFormStatus] = useState(STATUS.create);
    const [initialItem,       setInitialItem]       = useState(INITIAL_ITEM);
    const [selectedItemId,    setSelectedItemId]    = useState(""); // for list row highlight

    /* ═══════════════════════════════════════════════════════════════════
       Data
    ═══════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        if (activeTab === "PROCESSES") getData();
    }, [activeTab]);

    function getData() {
        const tenantId = appContext?.tenantSubscription?.tenant_id;
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", {
                tenant_id: tenantId,
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey:       "engine",
                        serviceKey:    "bpm.list.process",
                        mode:          "formData",
                    },
                ],
            })
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setItems(response.data.C_DATA?.engine || []);
                }
            })
            .catch(console.error);
    }

    /* ═══════════════════════════════════════════════════════════════════
       List helpers
    ═══════════════════════════════════════════════════════════════════ */
    function getFilteredItems() {
        if (!searchTerm || !searchTerm.trim()) return items;
        const q = searchTerm.trim().toLowerCase();
        return items.filter(it =>
            (it.title          || "").toLowerCase().includes(q) ||
            (it.process_def_key || "").toLowerCase().includes(q) ||
            (it.process_file    || "").toLowerCase().includes(q),
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
    function deleteData(item, isDelete) {
        if (isDelete === true) {
            axios
                .post(API_URL + "?service.key=update.formData", {
                    data: [{ formId: DB_TABLE, entity: DB_TABLE, action: "delete", id: item.id }],
                })
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        getData();
                        updateDeleteConfig(false, {}, setDeleteConfig);
                    }
                })
                .catch(console.error);
        } else {
            updateDeleteConfig(true, item, setDeleteConfig);
        }
    }

    /* ═══════════════════════════════════════════════════════════════════
       Quick redeploy from list row (no dialog)
    ═══════════════════════════════════════════════════════════════════ */
    async function quickDeploy(item) {
        const process_engine = appContext?.tenantSubscription?.process_engine;
        try {
            const res = await axios.post(`${BPM_API_URL}?service.key=deploy.process`, {
                id:                item.id,
                entity:            DB_TABLE,
                fileName:          item.process_file,
                mainProcessDefKey: item.process_def_key,
                process_engine,
            });
            if (res.data.C_STATUS === "SUCCESS") {
                const data = res.data.C_DATA;
                await axios.post(API_URL + "?service.key=update.formData", {
                    data: [{
                        formId:   DB_TABLE,
                        entity:   DB_TABLE,
                        action:   "update",
                        id:       item.id,
                        formData: {
                            ...item,
                            version:    data.version,
                            process_id: data.process_id,
                            deployment: data.deployment,
                        },
                    }],
                });
                getData();
            }
        } catch (err) {
            console.error("Quick deploy error:", err);
        }
    }

    /* ═══════════════════════════════════════════════════════════════════
       Render
    ═══════════════════════════════════════════════════════════════════ */
    return (
        <div className="process-configuration-map">
            <div className="proc-list-wrap">
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
                                            <button className="proc-list-action-btn warning" title="Redeploy" onClick={() => quickDeploy(item)}>
                                                <i className="fa fa-retweet" />
                                            </button>
                                            <button className="proc-list-action-btn" title="Edit" onClick={() => editItem(item)}>
                                                <i className="fa-regular fa-edit" />
                                            </button>
                                            <button className="proc-list-action-btn danger" title="Delete" onClick={() => deleteData(item)}>
                                                <i className="fa-regular fa-trash-can" />
                                            </button>
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
            <ModalBox
                state={deleteConfig}
                message="Are you sure you want to delete this process?"
                operation={deleteData}
                header="Delete Process Deployment"
                setState={setDeleteConfig}
                modalType="deleteModal"
            />
        </div>
    );
}

export default Processes;
