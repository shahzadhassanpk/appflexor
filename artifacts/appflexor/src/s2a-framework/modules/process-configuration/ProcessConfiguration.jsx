import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import ReactBpmn from "react-bpmn";
import { AppContext } from "../../../AppContext";
import { API_URL, FILE_URL } from "../../Config";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import ModalBox from "../../components/Modal/Modal";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";
import { toastEmitter } from "../../components/Toastify/Toastify";
import { updateDeleteConfig } from "../../utils/utils";
import Loading from "../../components/Loading/loading";
import ProcessMap from "./process-map/ProcessMap";
import ProcessMonitor from "./process-monitor/ProcessMonitor";
import Processes from "./processes/Processes";
import "./process-config.css";

/* ── colour palette (deterministic by index) ────────────────────────────── */
const PALETTE = [
    "#4f46e5", "#16a34a", "#9333ea", "#ea580c",
    "#0891b2", "#d97706", "#dc2626", "#7c3aed",
    "#0f766e", "#be185d",
];
const getColor = i => PALETTE[i % PALETTE.length];

/* ── match helpers ──────────────────────────────────────────────────────── */
function matchArea(proc, ba) {
    const v = (proc.business_area || "").toLowerCase().trim();
    return v && (
        v === (ba.key || "").toLowerCase().trim() ||
        v === (ba.id || "").toLowerCase().trim() ||
        v === (ba.title || "").toLowerCase().trim()
    );
}
function matchGB(proc, gb) {
    const v = (proc.process_gov || "").toLowerCase().trim();
    return v && (
        v === (gb.key || "").toLowerCase().trim() ||
        v === (gb.id || "").toLowerCase().trim() ||
        v === (gb.title || "").toLowerCase().trim()
    );
}

function matchTP(proc, tp) {
    const v = (proc.process_key || "").toLowerCase().trim();
    return v && (
        v === (tp.process_def_key || "").toLowerCase().trim()
    );
}

function matchPC(proc, pc) {
    const v = (proc.category || "").toLowerCase().trim();
    return v && (
        v === (pc.key || "").toLowerCase().trim() ||
        v === (pc.id || "").toLowerCase().trim() ||
        v === (pc.title || "").toLowerCase().trim()
    );
}

function getGBForProcess(proc, governingBodies) {
    return governingBodies.find(gb => matchGB(proc, gb));
}
function getPCForProcess(proc, processCategories) {
    return processCategories.find(pc => matchPC(proc, pc));
}

function getTPForProcess(proc, tenantProcs) {
    return tenantProcs.find(tp => matchTP(proc, tp));
}
/* ── initial form states ────────────────────────────────────────────────── */
const BA_INIT = { id: "", title: "", key: "" };
const GB_INIT = { id: "", title: "", key: "" };
const PC_INIT = { id: "", title: "", key: "" };
const PROC_INIT = {
    id: "", title: "", process_key: "",
    category: "", business_area: "",
    process_gov: "",
    is_active: "YES", allow_draft: "YES",
};

/* ── full-screen overlay for ProcessMap / Monitor / Deploy ──────────────── */
function FullScreenDialog({ title, icon, onClose, children }) {
    return (
        <div className="orch-fullscreen-overlay">
            <div className="orch-fullscreen-bar">
                <div className="d-flex align-items-center gap-2">
                    <i className={`fa-solid ${icon}`} aria-hidden="true" />
                    <span className="orch-fullscreen-title">{title}</span>
                </div>
                <button
                    type="button"
                    className="orch-fullscreen-close"
                    onClick={onClose}
                    aria-label="Close">
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                    Close
                </button>
            </div>
            <div className="orch-fullscreen-body">
                {children}
            </div>
        </div>
    );
}

function MediumDialog({ title, icon, onClose, children }) {
    return (
        <div className="orch-dialog-overlay">
            <div className="orch-dialog-box">
                <div className="orch-dialog-header d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        <i className={`fa-solid ${icon}`} aria-hidden="true" />
                        <span className="orch-dialog-title">{title}</span>
                    </div>
                    <button
                        type="button"
                        className="orch-dialog-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                </div>
                <div className="orch-dialog-body">
                    {children}
                </div>
            </div>
        </div>
    );
}


/* ════════════════════════════════════════════════════════════════════════ */
function ProcessConfiguration() {
    const appContext = useContext(AppContext);

    /* ── data ───────────────────────────────────────────────────────────── */
    const [businessAreas, setBusinessAreas] = useState([]);
    const [governingBodies, setGoverningBodies] = useState([]);
    const [processCategories, setProcessCategories] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    /* ── left-panel UI ──────────────────────────────────────────────────── */
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedAreas, setExpandedAreas] = useState(new Set());

    /* ── full-screen dialog visibility ─────────────────────────────────── */
    const [showProcessMap, setShowProcessMap] = useState(false);
    const [showMonitor, setShowMonitor] = useState(false);
    const [showDeploy, setShowDeploy] = useState(false);
    const [showBPMN, setShowBPMN] = useState(false);
    const [urlBPMN, setUrlBPMN] = useState("");

    /* ── Business Area modal ────────────────────────────────────────────── */
    const [baModal, setBAModal] = useState(false);
    const [selectedBA, setSelectedBA] = useState(BA_INIT);
    const [baDeleteCfg, setBADeleteCfg] = useState({ show: false, item: {} });

    /* ── Governing Body modal ───────────────────────────────────────────── */
    const [gbModal, setGBModal] = useState(false);
    const [selectedGB, setSelectedGB] = useState(GB_INIT);
    const [gbDeleteCfg, setGBDeleteCfg] = useState({ show: false, item: {} });

    /* ── Process Category modal ───────────────────────────────────────────── */
    const [pcModal, setPCModal] = useState(false);
    const [selectedPC, setSelectedPC] = useState(PC_INIT);
    const [pcDeleteCfg, setPCDeleteCfg] = useState({ show: false, item: {} });

    /* ── Process (quick-edit) modal ─────────────────────────────────────── */
    const [procModal, setProcModal] = useState(false);
    const [selectedProc, setSelectedProc] = useState(PROC_INIT);
    const [procDeleteCfg, setProcDeleteCfg] = useState({ show: false, item: {} });
    const [tenantProcs, setTenantProcs] = useState([]);
    const [bpmnTitle, setBpmnTitle] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
        getData();
    }, []);

    /* ── fetch everything in one batch ──────────────────────────────────── */
    function getData() {
        setIsLoading(true);
        axios
            .post(`${API_URL}?service.key=masterKey.tenantData`, {
                dataKeys: [
                    { serviceParams: "", dataKey: "processMap", serviceKey: "process.map", mode: "formData" },
                    { serviceParams: "", dataKey: "processBusinessArea", serviceKey: "process.business.area", mode: "formData" },
                    { serviceParams: "", dataKey: "processCategory", serviceKey: "process.category", mode: "formData" },
                    { serviceParams: "", dataKey: "processGov", serviceKey: "process.gov", mode: "formData" },
                    { serviceParams: "", dataKey: "tenantProcess", serviceKey: "sys.tenant.process", mode: "formData" },
                ],
            })
            .then(res => {
                if (res.data.C_STATUS === "SUCCESS") {
                    const d = res.data.C_DATA;
                    const areas = d.processBusinessArea || [];
                    setBusinessAreas(areas);
                    setGoverningBodies(d.processGov || []);
                    setProcesses(d.processMap || []);
                    setProcessCategories(d.processCategory || []);
                    setTenantProcs(d.tenantProcess || []);
                    setExpandedAreas(new Set(areas.map(ba => ba.id)));
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }

    /* ── collapse / expand ──────────────────────────────────────────────── */
    function toggleArea(baId) {
        setExpandedAreas(prev => {
            const n = new Set(prev);
            n.has(baId) ? n.delete(baId) : n.add(baId);
            return n;
        });
    }

    /* ── derived data ───────────────────────────────────────────────────── */
    const q = searchTerm.toLowerCase().trim();
    const visibleProcs = q
        ? processes.filter(p => p.title?.toLowerCase().includes(q))
        : processes;

    const processGroups = businessAreas.map((ba, idx) => ({
        ba, color: getColor(idx), idx,
        procs: visibleProcs.filter(p => matchArea(p, ba)),
    }));

    const baCount = ba => processes.filter(p => matchArea(p, ba)).length;
    const gbCount = gb => processes.filter(p => matchGB(p, gb)).length;
    const pcCount = pc => processes.filter(p => matchPC(p, pc)).length;

    /* ── Business Area CRUD ─────────────────────────────────────────────── */
    function openAddBA() { setSelectedBA(BA_INIT); setBAModal(true); }
    function openEditBA(ba) { setSelectedBA(ba); setBAModal(true); }

    function deleteBA(item, isDelete) {
        if (isDelete) {
            axios.post(`${API_URL}?service.key=update.formData`, {
                data: [{ formId: "business_area", entity: "business_area", action: "delete", id: item.id }],
            }).then(res => {
                if (res.data.C_STATUS === "SUCCESS") {
                    setBusinessAreas(prev => prev.filter(a => a.id !== res.data.C_DATA[0].id));
                    updateDeleteConfig(false, {}, setBADeleteCfg);
                    toastEmitter("Business Area deleted", true);
                }
            }).catch(console.error);
        } else {
            updateDeleteConfig(true, item, setBADeleteCfg);
        }
    }

    function saveBA() {
        const isNew = !selectedBA.id || selectedBA.id === "new";
        axios.post(`${API_URL}?service.key=update.formData`, {
            data: [{
                formId: "business_area", entity: "business_area", action: "update",
                id: isNew ? "new" : selectedBA.id, formData: selectedBA
            }],
        }).then(res => {
            if (res.data.C_STATUS === "SUCCESS") {
                const saved = res.data.C_DATA[0].formData;
                if (isNew) {
                    setBusinessAreas(prev => [...prev, { ...selectedBA, id: saved.id }]);
                    toastEmitter("Business Area added", true);
                } else {
                    setBusinessAreas(prev => prev.map(a => a.id === selectedBA.id ? { ...selectedBA } : a));
                    toastEmitter("Business Area updated", true);
                }
                setBAModal(false);
            }
        }).catch(console.error);
    }

    /* ── Governing Body CRUD ────────────────────────────────────────────── */
    function openAddGB() { setSelectedGB(GB_INIT); setGBModal(true); }
    function openEditGB(gb) { setSelectedGB(gb); setGBModal(true); }

    function deleteGB(item, isDelete) {
        if (isDelete) {
            axios.post(`${API_URL}?service.key=update.formData`, {
                data: [{ formId: "process_gov", entity: "process_gov", action: "delete", id: item.id }],
            }).then(res => {
                if (res.data.C_STATUS === "SUCCESS") {
                    setGoverningBodies(prev => prev.filter(g => g.id !== res.data.C_DATA[0].id));
                    updateDeleteConfig(false, {}, setGBDeleteCfg);
                    toastEmitter("Governing Body deleted", true);
                }
            }).catch(console.error);
        } else {
            updateDeleteConfig(true, item, setGBDeleteCfg);
        }
    }

    function saveGB() {
        const isNew = !selectedGB.id || selectedGB.id === "new";
        axios.post(`${API_URL}?service.key=update.formData`, {
            data: [{
                formId: "process_gov", entity: "process_gov", action: "update",
                id: isNew ? "new" : selectedGB.id, formData: selectedGB
            }],
        }).then(res => {
            if (res.data.C_STATUS === "SUCCESS") {
                const saved = res.data.C_DATA[0].formData;
                if (isNew) {
                    setGoverningBodies(prev => [...prev, { ...selectedGB, id: saved.id }]);
                    toastEmitter("Governing Body added", true);
                } else {
                    setGoverningBodies(prev => prev.map(g => g.id === selectedGB.id ? { ...selectedGB } : g));
                    toastEmitter("Governing Body updated", true);
                }
                setGBModal(false);
            }
        }).catch(console.error);
    }
    /* ── Category CRUD ────────────────────────────────────────────── */
    function openAddPC() { setSelectedPC(PC_INIT); setPCModal(true); }
    function openEditPC(category) { setSelectedPC(category); setPCModal(true); }

    function deletePC(item, isDelete) {
        if (isDelete) {
            axios.post(`${API_URL}?service.key=update.formData`, {
                data: [{ formId: "process_category", entity: "process_category", action: "delete", id: item.id }],
            }).then(res => {
                if (res.data.C_STATUS === "SUCCESS") {
                    setProcessCategories(prev => prev.filter(c => c.id !== res.data.C_DATA[0].id));
                    updateDeleteConfig(false, {}, setPCDeleteCfg);
                    toastEmitter("Category deleted", true);
                }
            }).catch(console.error);
        } else {
            updateDeleteConfig(true, item, setPCDeleteCfg);
        }
    }

    function savePC() {
        const isNew = !selectedPC.id || selectedPC.id === "new";
        axios.post(`${API_URL}?service.key=update.formData`, {
            data: [{
                formId: "process_category", entity: "process_category", action: "update",
                id: isNew ? "new" : selectedPC.id, formData: selectedPC
            }],
        }).then(res => {
            if (res.data.C_STATUS === "SUCCESS") {
                const saved = res.data.C_DATA[0].formData;
                if (isNew) {
                    setProcessCategories(prev => [...prev, { ...selectedPC, id: saved.id }]);
                    toastEmitter("Category added", true);
                } else {
                    setProcessCategories(prev => prev.map(c => c.id === selectedPC.id ? { ...selectedPC } : c));
                    toastEmitter("Category updated", true);
                }
                setPCModal(false);
            }
        }).catch(console.error);
    }
    /* ── Process quick-edit CRUD ────────────────────────────────────────── */
    function openEditProc(proc) {
        setSelectedProc({ ...proc });
        setProcModal(true);
    }

    function deleteProc(item, isDelete) {
        if (isDelete) {
            axios.post(`${API_URL}?service.key=update.formData`, {
                data: [{ formId: "process_map", entity: "process_map", action: "delete", id: item.id }],
            }).then(res => {
                if (res.data.C_STATUS === "SUCCESS") {
                    setProcesses(prev => prev.filter(p => p.id !== res.data.C_DATA[0].id));
                    updateDeleteConfig(false, {}, setProcDeleteCfg);
                    toastEmitter("Process removed", true);
                }
            }).catch(console.error);
        } else {
            updateDeleteConfig(true, item, setProcDeleteCfg);
        }
    }

    function saveProc() {
        const isNew = !selectedProc.id || selectedProc.id === "new";
        axios.post(`${API_URL}?service.key=update.formData`, {
            data: [{
                formId: "process_map", entity: "process_map", action: "update",
                id: isNew ? "new" : selectedProc.id, formData: selectedProc
            }],
        }).then(res => {
            if (res.data.C_STATUS === "SUCCESS") {
                const saved = res.data.C_DATA[0].formData;
                if (isNew) {
                    setProcesses(prev => [...prev, { ...selectedProc, id: saved.id }]);
                    toastEmitter("Process added", true);
                } else {
                    setProcesses(prev => prev.map(p => p.id === selectedProc.id ? { ...selectedProc } : p));
                    toastEmitter("Process updated", true);
                }
                setProcModal(false);
            }
        }).catch(console.error);
    }

    if (isLoading) return (
        <div id="ProcessConfig" className="process-config container-fluid static-module-bg">
            <Loading />
        </div>
    );

    return (
        <ErrorBoundary>
            {/* ── delete confirmations ─────────────────────────────────── */}
            <ModalBox state={baDeleteCfg} message="Delete this Business Area?" operation={deleteBA} header="Delete Business Area" setState={setBADeleteCfg} modalType="deleteModal" />
            <ModalBox state={gbDeleteCfg} message="Delete this Governing Body?" operation={deleteGB} header="Delete Governing Body" setState={setGBDeleteCfg} modalType="deleteModal" />
            <ModalBox state={pcDeleteCfg} message="Delete this Process Category?" operation={deletePC} header="Delete Process Category" setState={setPCDeleteCfg} modalType="deleteModal" />
            <ModalBox state={procDeleteCfg} message="Remove this process?" operation={deleteProc} header="Remove Process" setState={setProcDeleteCfg} modalType="deleteModal" />

            {/* ══════════ FULL-SCREEN DIALOGS (conditionally mounted) ════ */}

            {showProcessMap && (
                <FullScreenDialog
                    title="Configure Processes"
                    icon="fa-diagram-project"
                    onClose={() => { setShowProcessMap(false); getData(); }}>
                    <ProcessMap activeTab="PROCESS_MAP" />
                </FullScreenDialog>
            )}

            {showMonitor && (
                <FullScreenDialog
                    title="Process Monitor"
                    icon="fa-chart-line"
                    onClose={() => setShowMonitor(false)}>
                    <ProcessMonitor activeTab="PROCESS_MONITOR" />
                </FullScreenDialog>
            )}

            {showBPMN && (
                <FullScreenDialog
                    title={`BPMN Diagram: ${bpmnTitle}`}
                    icon="fa-diagram-project"
                    onClose={() => { setShowBPMN(false); setUrlBPMN(""); }}
                >
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <ReactBpmn
                            url={urlBPMN + "?a=" + new Date().getMilliseconds()}
                        // style={{ flex: 1, width: "100%" }}
                        />
                    </div>
                </FullScreenDialog>
            )}


            {showDeploy && (
                <FullScreenDialog
                    title="Deploy Processes"
                    icon="fa-rocket"
                    onClose={() => setShowDeploy(false)}>
                    <Processes activeTab="PROCESSES" />
                </FullScreenDialog>
            )}

            {/* ══════════ MAIN PAGE ═══════════════════════════════════════ */}
            <div id="ProcessConfig" className="process-config container-fluid static-module-bg">

                {/* ── page header ──────────────────────────────────────── */}
                <div className="row mb-3">
                    <div className="col-12 datalist-viewer">
                        <div className="s2a-datalist-header">
                            <div className="s2a-dl-title-wrapper">
                                <div className="s2a-dl-title"><span>Orchestrate — Execute Enterprise Architecture</span></div>
                                <span>Deploy and manage processes that coordinate work and deliver business outcomes.</span>
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    className="btn button-theme btn-sm d-inline-flex align-items-center gap-2"
                                    onClick={() => setShowDeploy(true)}>
                                    <i className="fa-solid fa-rocket" aria-hidden="true" />
                                    Deploy
                                </button>
                                <button
                                    type="button"
                                    className="btn button-theme btn-sm d-inline-flex align-items-center gap-2"
                                    onClick={() => setShowProcessMap(true)}>
                                    <i className="fa-solid fa-gears" aria-hidden="true" />
                                    Configure
                                </button>
                                <button
                                    type="button"
                                    className="btn button-theme btn-sm d-inline-flex align-items-center gap-2"
                                    onClick={() => setShowMonitor(true)}>
                                    <i className="fa-solid fa-chart-line" aria-hidden="true" />
                                    Monitor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── split layout ─────────────────────────────────────── */}
                <div className="orch-layout">

                    {/* ════════════ LEFT: process tree ════════════════════ */}
                    <div className="orch-left">
                        <div className="orch-panel">

                            {/* panel header */}
                            <div className="orch-panel-header">
                                <div className="d-flex align-items-start gap-2 flex-1 min-w-0">
                                    <span className="orch-panel-icon">
                                        <i className="fa-solid fa-sitemap" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="orch-panel-title">Business Processes</div>
                                        <div className="orch-panel-desc">Business processes that deliver outcomes to stakeholders.</div>
                                    </div>
                                </div>
                            </div>

                            {/* tree body */}
                            <div className="orch-tree">
                                <div className="orch-search p-2">
                                    <i className="fa-solid ms-2 fa-magnifying-glass orch-search-icon" aria-hidden="true" />
                                    <input
                                        type="text"
                                        className="orch-search-input"
                                        placeholder="Search processes…"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        aria-label="Search processes"
                                    />
                                    {searchTerm && (
                                        <button type="button" className="orch-search-clear" onClick={() => setSearchTerm("")} aria-label="Clear search">
                                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                                {processGroups.length === 0 && (
                                    <div className="orch-empty-state">
                                        <i className="fa-solid fa-layer-group" />
                                        <p>No process areas defined yet</p>
                                        <button type="button" className="orch-add-btn" onClick={openAddBA}>
                                            <i className="fa-solid fa-plus" /> Add Business Area
                                        </button>
                                    </div>
                                )}

                                {processGroups.map(({ ba, color, procs }) => (
                                    <div key={ba.id} className="orch-tree-group">
                                        {/* group header */}
                                        <div className="orch-tree-group-header">
                                            <button
                                                type="button"
                                                className="orch-tree-chevron"
                                                onClick={() => toggleArea(ba.id)}
                                                aria-label={expandedAreas.has(ba.id) ? "Collapse" : "Expand"}>
                                                <i className={`fa-solid ${expandedAreas.has(ba.id) ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true" />
                                            </button>
                                            <span className="orch-area-icon" style={{ background: `${color}22`, color }}>
                                                <i className="fa-solid fa-layer-group" aria-hidden="true" />
                                            </span>
                                            <span className="orch-tree-area-name">{ba.title}</span>
                                            <span className="orch-count-badge" style={{ background: `${color}18`, color }}>{procs.length}</span>
                                            <button
                                                type="button"
                                                className="orch-icon-btn ms-1"
                                                title="Configure processes in this area"
                                                onClick={() => setShowProcessMap(true)}>
                                                <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
                                            </button>
                                        </div>

                                        {/* process rows */}
                                        {expandedAreas.has(ba.id) && (
                                            <div className="orch-tree-children">
                                                {procs.length === 0 && (
                                                    <div className="orch-tree-empty">No processes in this area</div>
                                                )}
                                                {procs.map(proc => {
                                                    const gb = getGBForProcess(proc, governingBodies);
                                                    const pc = getPCForProcess(proc, processCategories);
                                                    const tp = getTPForProcess(proc, tenantProcs);
                                                    const url = "/file/service/process/"
                                                        + encodeURIComponent(tp?.id)
                                                        + "/"
                                                        + encodeURIComponent(tp?.process_file);
                                                    const gbIdx = gb ? governingBodies.indexOf(gb) : -1;
                                                    const gbColor = gbIdx >= 0 ? getColor(gbIdx + 2) : "#6b7280";
                                                    const pcColor = pc ? getColor(processCategories.indexOf(pc) + 2) : "#6b7280";
                                                    return (
                                                        <div key={proc.id} className="orch-tree-proc-row">
                                                            <span className="orch-proc-indent" aria-hidden="true" />
                                                            <i className="fa-solid fa-diagram-project orch-proc-icon" aria-hidden="true" />
                                                            <a href="#" className="orch-proc-title" title={proc.title} onClick={() => { setUrlBPMN(url); setShowBPMN(true); setBpmnTitle(proc.title) }}>{proc.title} {proc.def_key}</a>
                                                            

                                                            {gb && (
                                                                <span
                                                                    className="orch-gb-badge"
                                                                    style={{ background: `${gbColor}18`, color: gbColor, border: `1px solid ${gbColor}35` }}>
                                                                    {gb.title}
                                                                </span>
                                                            )}
                                                            {pc && (
                                                                <span
                                                                    className="orch-gb-badge"
                                                                    style={{ background: `${pcColor}18`, color: pcColor, border: `1px solid ${pcColor}35` }}>
                                                                    {pc.title}
                                                                </span>
                                                            )}
                                                            {/* <div className="orch-proc-actions">
                                                                <button type="button" className="orch-icon-btn" title="Edit" onClick={() => openEditProc(proc)}>
                                                                    <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                                                </button>
                                                                <button type="button" className="orch-icon-btn danger" title="Remove" onClick={() => deleteProc(proc)}>
                                                                    <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                                                </button>
                                                            </div> */}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ════════════ RIGHT: side panels ════════════════════ */}
                    <div className="orch-right">

                        {/* ── Business Areas ─────────────────────────── */}
                        <div className="orch-panel mb-3">
                            <div className="orch-panel-header">
                                <div className="d-flex align-items-start gap-2 flex-1">
                                    <span className="orch-panel-icon">
                                        <i className="fa-solid fa-building" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <div className="orch-panel-title">Business Areas</div>
                                        <div className="orch-panel-desc">Business areas group related business services.</div>
                                    </div>
                                </div>
                                <button type="button" className="orch-add-btn" onClick={openAddBA}>
                                    <i className="fa-solid fa-plus" aria-hidden="true" />
                                    Add New
                                </button>
                            </div>
                            <div className="orch-list">
                                {businessAreas.length === 0 && (
                                    <div className="orch-list-empty">No business areas yet</div>
                                )}
                                {businessAreas.map((ba, idx) => (
                                    <div key={ba.id} className="orch-list-item">
                                        <span className="orch-area-icon sm" style={{ background: `${getColor(idx)}22`, color: getColor(idx) }}>
                                            <i className="fa-solid fa-layer-group" aria-hidden="true" />
                                        </span>
                                        <span className="orch-list-name">{ba.title}</span>
                                        <span className="orch-count-badge" style={{ background: `${getColor(idx)}18`, color: getColor(idx) }}>{baCount(ba)}</span>
                                        <div className="orch-list-actions">
                                            <button type="button" className="orch-icon-btn" title="Edit" onClick={() => openEditBA(ba)}>
                                                <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                            </button>
                                            <button type="button" className="orch-icon-btn danger" title="Delete" onClick={() => deleteBA(ba)}>
                                                <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Governing Bodies ───────────────────────── */}
                        <div className="orch-panel mb-3">
                            <div className="orch-panel-header">
                                <div className="d-flex align-items-start gap-2 flex-1">
                                    <span className="orch-panel-icon">
                                        <i className="fa-solid fa-tag" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <div className="orch-panel-title">Governing Bodies</div>
                                        <div className="orch-panel-desc">Bodies accountable for business process performance.</div>
                                    </div>
                                </div>
                                <button type="button" className="orch-add-btn" onClick={openAddGB}>
                                    <i className="fa-solid fa-plus" aria-hidden="true" />
                                    Add New
                                </button>
                            </div>
                            <div className="orch-list">
                                {governingBodies.length === 0 && (
                                    <div className="orch-list-empty">No governing bodies yet</div>
                                )}
                                {governingBodies.map((gb, idx) => (
                                    <div key={gb.id} className="orch-list-item">
                                        <span className="orch-gb-icon" style={{ color: getColor(idx + 2) }}>
                                            <i className="fa-solid fa-tag" aria-hidden="true" />
                                        </span>
                                        <span className="orch-list-name">{gb.title}</span>
                                        <span className="orch-count-badge">{gbCount(gb)}</span>
                                        <div className="orch-list-actions">
                                            <button type="button" className="orch-icon-btn" title="Edit" onClick={() => openEditGB(gb)}>
                                                <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                            </button>
                                            <button type="button" className="orch-icon-btn danger" title="Delete" onClick={() => deleteGB(gb)}>
                                                <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* ── Process Categories ───────────────────────── */}
                        <div className="orch-panel mb-3">
                            <div className="orch-panel-header">
                                <div className="d-flex align-items-start gap-2 flex-1">
                                    <span className="orch-panel-icon">
                                        <i className="fa-solid fa-tag" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <div className="orch-panel-title">Process Categories</div>
                                        <div className="orch-panel-desc">Categories for classifying business processes</div>
                                    </div>
                                </div>
                                <button type="button" className="orch-add-btn" onClick={openAddPC}>
                                    <i className="fa-solid fa-plus" aria-hidden="true" />
                                    Add New
                                </button>
                            </div>
                            <div className="orch-list">
                                {processCategories.length === 0 && (
                                    <div className="orch-list-empty">No categories yet</div>
                                )}
                                {processCategories.map((gb, idx) => (
                                    <div key={gb.id} className="orch-list-item">
                                        <span className="orch-gb-icon" style={{ color: getColor(idx + 2) }}>
                                            <i className="fa-solid fa-tag" aria-hidden="true" />
                                        </span>
                                        <span className="orch-list-name">{gb.title}</span>
                                        <span className="orch-count-badge">{pcCount(gb)}</span>
                                        <div className="orch-list-actions">
                                            <button type="button" className="orch-icon-btn" title="Edit" onClick={() => openEditPC(gb)}>
                                                <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                                            </button>
                                            <button type="button" className="orch-icon-btn danger" title="Delete" onClick={() => deletePC(gb)}>
                                                <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>{/* end orch-right */}
                </div>{/* end orch-layout */}

                {/* ════════════ CRUD MODALS ═════════════════════════════════ */}

                {/* Business Area */}
                <ModuleFormViewer
                    handleClose={() => setBAModal(false)}
                    showModal={baModal}
                    modalTitle={selectedBA.id ? "Edit Business Area" : "Add Business Area"}
                    size="lg">
                    <div className="col-12 form-background pt-2 pb-3 px-3">
                        <div className="mb-3">
                            <label className="fw-semibold mt-1">Title <span className="text-danger">*</span></label>
                            <input type="text" className="form-control mt-1" value={selectedBA.title}
                                onChange={e => setSelectedBA(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="mb-1">
                            <label className="fw-semibold mt-1">Key <span className="text-danger">*</span></label>
                            <input type="text" className="form-control mt-1" value={selectedBA.key}
                                onChange={e => setSelectedBA(p => ({ ...p, key: e.target.value }))} />
                        </div>
                    </div>
                    <div className="modal-footer pe-0">
                        <button className="btn button-theme btn-sm me-2" onClick={saveBA}
                            disabled={!selectedBA.title || !selectedBA.key}>
                            <i className="fa-solid fa-floppy-disk pe-1" />
                            {selectedBA.id ? "Update" : "Save"}
                        </button>
                        <button className="btn button-theme btn-sm" onClick={() => setBAModal(false)}>
                            <i className="fa-solid fa-xmark pe-1" />Close
                        </button>
                    </div>
                </ModuleFormViewer>

                {/* Governing Body */}
                <ModuleFormViewer
                    handleClose={() => setGBModal(false)}
                    showModal={gbModal}
                    modalTitle={selectedGB.id ? "Edit Governing Body" : "Add Governing Body"}
                    size="lg">
                    <div className="col-12 form-background pt-2 pb-3 px-3">
                        <div className="mb-3">
                            <label className="fw-semibold mt-1">Title <span className="text-danger">*</span></label>
                            <input type="text" className="form-control mt-1" value={selectedGB.title}
                                onChange={e => setSelectedGB(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="mb-1">
                            <label className="fw-semibold mt-1">Key <span className="text-danger">*</span></label>
                            <input type="text" className="form-control mt-1" value={selectedGB.key}
                                onChange={e => setSelectedGB(p => ({ ...p, key: e.target.value }))} />
                        </div>
                    </div>
                    <div className="modal-footer pe-0">
                        <button className="btn button-theme btn-sm me-2" onClick={saveGB}
                            disabled={!selectedGB.title || !selectedGB.key}>
                            <i className="fa-solid fa-floppy-disk pe-1" />
                            {selectedGB.id ? "Update" : "Save"}
                        </button>
                        <button className="btn button-theme btn-sm" onClick={() => setGBModal(false)}>
                            <i className="fa-solid fa-xmark pe-1" />Close
                        </button>
                    </div>
                </ModuleFormViewer>

                {/* Process Category */}
                <ModuleFormViewer
                    handleClose={() => setPCModal(false)}
                    showModal={pcModal}
                    modalTitle={selectedPC.id ? "Edit Process Category" : "Add Process Category"}
                    size="lg">
                    <div className="col-12 form-background pt-2 pb-3 px-3">
                        <div className="mb-3">
                            <label className="fw-semibold mt-1">Title <span className="text-danger">*</span></label>
                            <input type="text" className="form-control mt-1" value={selectedPC.title}
                                onChange={e => setSelectedPC(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="mb-1">
                            <label className="fw-semibold mt-1">Key <span className="text-danger">*</span></label>
                            <input type="text" className="form-control mt-1" value={selectedPC.key}
                                onChange={e => setSelectedPC(p => ({ ...p, key: e.target.value }))} />
                        </div>
                    </div>
                    <div className="modal-footer pe-0">
                        <button className="btn button-theme btn-sm me-2" onClick={savePC}
                            disabled={!selectedPC.title || !selectedPC.key}>
                            <i className="fa-solid fa-floppy-disk pe-1" />
                            {selectedPC.id ? "Update" : "Save"}
                        </button>
                        <button className="btn button-theme btn-sm" onClick={() => setPCModal(false)}>
                            <i className="fa-solid fa-xmark pe-1" />Close
                        </button>
                    </div>
                </ModuleFormViewer>
                {/* Process quick-edit */}
                <ModuleFormViewer
                    handleClose={() => setProcModal(false)}
                    showModal={procModal}
                    modalTitle="Edit Process"
                    size="lg">
                    <div className="col-12 form-background pt-2 pb-3 px-3">
                        <div className="row">
                            <div className="col-sm-12 mb-3">
                                <label className="fw-semibold mt-1">Title <span className="text-danger">*</span></label>
                                <input type="text" className="form-control mt-1" value={selectedProc.title}
                                    onChange={e => setSelectedProc(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="col-sm-6 mb-3">
                                <label className="fw-semibold mt-1">Business Area <span className="text-danger">*</span></label>
                                <select className="form-select mt-1" value={selectedProc.business_area}
                                    onChange={e => setSelectedProc(p => ({ ...p, business_area: e.target.value }))}>
                                    <option value="">Select business area…</option>
                                    {businessAreas.map(ba => (
                                        <option key={ba.id} value={ba.key || ba.id}>{ba.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-sm-6 mb-3">
                                <label className="fw-semibold mt-1">Governing Body <span className="text-danger">*</span></label>
                                <select className="form-select mt-1" value={selectedProc.process_gov}
                                    onChange={e => setSelectedProc(p => ({ ...p, process_gov: e.target.value }))}>
                                    <option value="">Select governing body…</option>
                                    {governingBodies.map(gb => (
                                        <option key={gb.id} value={gb.key || gb.id}>{gb.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-sm-12 d-flex gap-4">
                                <div className="form-check form-switch">
                                    <input type="checkbox" className="form-check-input" role="switch"
                                        id="procIsActive"
                                        checked={selectedProc.is_active === "YES"}
                                        onChange={e => setSelectedProc(p => ({ ...p, is_active: e.target.checked ? "YES" : "NO" }))} />
                                    <label className="form-check-label" htmlFor="procIsActive">Active</label>
                                </div>
                                <div className="form-check form-switch">
                                    <input type="checkbox" className="form-check-input" role="switch"
                                        id="procAllowDraft"
                                        checked={selectedProc.allow_draft === "YES"}
                                        onChange={e => setSelectedProc(p => ({ ...p, allow_draft: e.target.checked ? "YES" : "NO" }))} />
                                    <label className="form-check-label" htmlFor="procAllowDraft">Allow Draft</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer pe-0">
                        <button className="btn button-theme btn-sm me-2" onClick={saveProc}
                            disabled={!selectedProc.title || !selectedProc.business_area || !selectedProc.category}>
                            <i className="fa-solid fa-floppy-disk pe-1" />
                            Update
                        </button>
                        <button className="btn button-theme btn-sm" onClick={() => setProcModal(false)}>
                            <i className="fa-solid fa-xmark pe-1" />Close
                        </button>
                    </div>
                </ModuleFormViewer>

            </div>
        </ErrorBoundary>
    );
}

export default ProcessConfiguration;
