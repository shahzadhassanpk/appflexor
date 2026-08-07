import axios from "axios";
import BpmnNavigatedViewer from "bpmn-js/lib/NavigatedViewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { AppContext } from "../../../../AppContext";
import { API_URL, BPM_API_URL, FILE_URL } from "../../../Config";
import ModalBox from "../../../components/Modal/Modal";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import {
    formatDateTimeForUserView,
    tryParseJSONObject,
    updateDeleteConfig,
} from "../../../utils/utils";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import "./processes.css";

/* ── constants ─────────────────────────────────────────────────────────── */
const DB_TABLE = "process";
const STATUS = { none: "NONE", create: "CREATE", update: "UPDATE" };
const INITIAL_STATE = {
    id: "",
    title: "",
    process_def_key: "",
    process_file: "",
    file_url: "",
};
const ELEM_TABS = [
    { key: "participants", label: "Participants", icon: "fa-users" },
    { key: "userTasks",    label: "User Tasks",   icon: "fa-user-check" },
    { key: "serviceTasks", label: "Service Tasks", icon: "fa-gear" },
    { key: "variables",    label: "Variables",     icon: "fa-database" },
];

/* ── SearchableSelect ──────────────────────────────────────────────────── */
function SearchableSelect({ options = [], value, onChange, placeholder = "Search…" }) {
    const [filter, setFilter] = useState("");
    const filtered = options.filter(o =>
        (o.label || "").toLowerCase().includes(filter.toLowerCase()),
    );
    return (
        <div>
            <div className="input-group input-group-sm mb-1">
                <span className="input-group-text">
                    <i className="fa fa-search" />
                </span>
                <input
                    className="form-control"
                    placeholder={placeholder}
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
                {filter && (
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setFilter("")}>
                        <i className="fa fa-times" />
                    </button>
                )}
            </div>
            <select
                className="form-control proc-search-select"
                value={value}
                onChange={onChange}
                size={Math.min(Math.max(filtered.length, 1), 6)}>
                <option value="">— none —</option>
                {filtered.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

/* ── main component ────────────────────────────────────────────────────── */
function Processes({ activeTab }) {
    const appContext = useContext(AppContext);

    /* ── list state ── */
    const [items, setItems]               = useState([]);
    const [searchTerm, setSearchTerm]     = useState("");
    const [selectedItem, setSelectedItem] = useState(INITIAL_STATE);
    const [formStatus, setFormStatus]     = useState(STATUS.none);
    const [fileStatus, setFileStatus]     = useState("");
    const [processes, setProcesses]       = useState([]);
    const [size, setSize]                 = useState(5);
    const [current, setCurrent]           = useState(1);
    const [formShow, setFormShow]         = useState(false);
    const [showDiscardDataModal, setShowDiscardDataModal] = useState(false);
    const [toggleModalWindow, setToggleModalWindow]       = useState("maximize");
    const [toggleBpmnViewer, setToggleBpmnViewer]         = useState("restore");
    const [saveIsDisabled, setSaveIsDisabled]             = useState(true);
    const [deleteConfig, setDeleteConfig] = useState({ show: false, item: {} });

    /* ── viewer state ── */
    const [xmlLoading, setXmlLoading]   = useState(false);
    const [elementsMap, setElementsMap] = useState({
        participants: [], userTasks: [], serviceTasks: [], variables: [],
    });
    const [activeElemTab, setActiveElemTab] = useState("participants");

    /* ── property editor state ── */
    const [propModal, setPropModal]     = useState(null); // { type, element, title }
    const [propForm, setPropForm]       = useState({});
    const [propLoading, setPropLoading] = useState(false);
    const [groups, setGroups]           = useState([]);
    const [users, setUsers]             = useState([]);
    const [formList, setFormList]       = useState([]);
    const [refDataLoaded, setRefDataLoaded] = useState(false);

    /* ── viewer refs ── */
    const restoreViewerRef  = useRef(null); // DOM container — restore mode
    const maxViewerRef      = useRef(null); // DOM container — maximize mode
    const viewerInstanceRef = useRef(null); // NavigatedViewer instance
    const currentXmlRef     = useRef(null); // current BPMN XML string

    const { id, process_file } = selectedItem;
    const fileUrl = FILE_URL + "/" + DB_TABLE + "/" + id + "/" + process_file;

    /* ─────────────────────────────────────────────────────────────────────
       Viewer lifecycle
    ───────────────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!formShow) {
            // destroy viewer when modal closes
            if (viewerInstanceRef.current) {
                viewerInstanceRef.current.destroy();
                viewerInstanceRef.current = null;
            }
            return;
        }
        const container =
            toggleBpmnViewer === "maximize" ? maxViewerRef.current : restoreViewerRef.current;
        if (!container) return;

        // destroy previous instance before re-mounting
        if (viewerInstanceRef.current) {
            viewerInstanceRef.current.destroy();
            viewerInstanceRef.current = null;
        }

        const viewer = new BpmnNavigatedViewer({ container });
        viewerInstanceRef.current = viewer;

        if (currentXmlRef.current) {
            viewer
                .importXML(currentXmlRef.current)
                .then(() => {
                    viewer.get("canvas").zoom("fit-viewport");
                    extractElements(viewer);
                })
                .catch(err => console.error("BPMN re-import error:", err));
        }
    }, [formShow, toggleBpmnViewer]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ─────────────────────────────────────────────────────────────────────
       Fetch BPMN XML and load into viewer
    ───────────────────────────────────────────────────────────────────── */
    async function fetchAndLoadBpmn(url) {
        if (!url || !process_file) return;
        setXmlLoading(true);
        try {
            const res = await fetch(url + "?a=" + Date.now());
            if (!res.ok) throw new Error("HTTP " + res.status);
            const xml = await res.text();
            currentXmlRef.current = xml;

            const viewer = viewerInstanceRef.current;
            if (viewer) {
                await viewer.importXML(xml);
                viewer.get("canvas").zoom("fit-viewport");
                extractElements(viewer);
            }
        } catch (err) {
            console.error("BPMN fetch error:", err);
            toastEmitter("Failed to load BPMN diagram", true, "error");
        } finally {
            setXmlLoading(false);
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       Parse element registry into categorised lists
    ───────────────────────────────────────────────────────────────────── */
    function extractElements(viewer) {
        try {
            const registry = viewer.get("elementRegistry");
            const all = registry.getAll().filter(e => e.type !== "label");
            setElementsMap({
                participants: all.filter(
                    e => e.type === "bpmn:Participant" || e.type === "bpmn:Lane",
                ),
                userTasks: all.filter(e => e.type === "bpmn:UserTask"),
                serviceTasks: all.filter(e => e.type === "bpmn:ServiceTask"),
                variables: all.filter(e => e.type === "bpmn:DataObjectReference"),
            });
        } catch (err) {
            console.error("Element extraction error:", err);
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       Load reference data (groups / users / forms) for property editors
    ───────────────────────────────────────────────────────────────────── */
    async function loadRefData() {
        if (refDataLoaded) return;
        setPropLoading(true);
        try {
            const res = await axios.post(API_URL + "?service.key=masterKey.tenantData", {
                dataKeys: [
                    { serviceParams: "", dataKey: "groups",   serviceKey: "sys.console.dir.group", mode: "formData" },
                    { serviceParams: "", dataKey: "users",    serviceKey: "sys.user.list",          mode: "formData" },
                    { serviceParams: "", dataKey: "formList", serviceKey: "sys.list.forms",         mode: "formData" },
                ],
            });
            if (res.data.C_STATUS === "SUCCESS") {
                const d = res.data.C_DATA;
                setGroups(
                    (d.groups || []).map(g => ({ value: g.id, label: g.name })),
                );
                setUsers(
                    (d.users || []).map(u => ({
                        value: u.username,
                        label: `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.username,
                    })),
                );
                setFormList(
                    (d.formList || []).map(f => ({ value: f.form_key, label: f.name })),
                );
                setRefDataLoaded(true);
            }
        } catch (err) {
            console.error("Ref data load error:", err);
        } finally {
            setPropLoading(false);
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       Open property editor modal
    ───────────────────────────────────────────────────────────────────── */
    function openPropModal(type, element) {
        const bo = element.businessObject;
        const attrs = bo.$attrs || {};
        let init = {};

        if (type === "participants") {
            const grp = attrs["camunda:candidateGroups"] || attrs["activiti:candidateGroups"] || "";
            const usr = attrs["camunda:assignee"] || attrs["activiti:assignee"] || "";
            init = { assigneeType: grp ? "group" : "user", assignee: grp || usr };
        } else if (type === "userTasks") {
            init = {
                formKey: attrs["camunda:formKey"] || attrs["activiti:formKey"] || "",
            };
        } else if (type === "serviceTasks") {
            init = {
                type: "external",
                topic: attrs["camunda:topic"] || "",
            };
        } else if (type === "variables") {
            init = { name: bo.name || "" };
        }

        setPropForm(init);
        setPropModal({ type, element, title: bo.name || element.id });
        loadRefData();
    }

    /* ─────────────────────────────────────────────────────────────────────
       Save property changes → mutate businessObject → saveXML → upload
    ───────────────────────────────────────────────────────────────────── */
    async function savePropChanges() {
        const { type, element } = propModal;
        const bo = element.businessObject;
        if (!bo.$attrs) bo.$attrs = {};

        // Mutate businessObject attributes
        // NOTE: For full Camunda namespace support in new files, register
        //       camunda-bpmn-moddle as a moddleExtension on the viewer.
        if (type === "participants") {
            if (propForm.assigneeType === "user") {
                bo.$attrs["camunda:assignee"]        = propForm.assignee;
                delete bo.$attrs["camunda:candidateGroups"];
            } else {
                bo.$attrs["camunda:candidateGroups"] = propForm.assignee;
                delete bo.$attrs["camunda:assignee"];
            }
        } else if (type === "userTasks") {
            bo.$attrs["camunda:formKey"] = propForm.formKey;
        } else if (type === "serviceTasks") {
            bo.$attrs["camunda:type"]  = "external";
            bo.$attrs["camunda:topic"] = propForm.topic;
        } else if (type === "variables") {
            bo.name = propForm.name;
        }

        // Serialize and upload
        try {
            const { xml } = await viewerInstanceRef.current.saveXML({ format: true });
            currentXmlRef.current = xml;
            const b64 = btoa(unescape(encodeURIComponent(xml)));
            await saveXmlToServer(selectedItem.process_file, b64);
            toastEmitter("Properties saved", true);
            setPropModal(null);
        } catch (err) {
            console.error("saveXML error:", err);
            toastEmitter("Failed to persist BPMN changes", true, "error");
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       Save updated XML back to server (without changing record metadata)
    ───────────────────────────────────────────────────────────────────── */
    async function saveXmlToServer(fileName, encodedData) {
        const request = {
            data: [{
                formId: DB_TABLE,
                entity: DB_TABLE,
                action: "update",
                id: selectedItem.id,
                formData: { ...selectedItem },
                fileData: [{ fileName, content: encodedData }],
            }],
        };
        await axios.post(API_URL + "?service.key=update.formData", request);
    }

    /* ─────────────────────────────────────────────────────────────────────
       Existing list / CRUD logic (unchanged)
    ───────────────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (activeTab === "PROCESSES") getData();
    }, [activeTab]);

    useEffect(() => {
        if (
            selectedItem.title !== "" &&
            selectedItem.process_def_key !== "" &&
            selectedItem.process_file !== ""
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    // When file URL is ready and modal is visible, fetch the BPMN XML
    useEffect(() => {
        if (formShow && selectedItem.process_file && selectedItem.id) {
            fetchAndLoadBpmn(fileUrl);
        }
    }, [formShow, fileUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    function getPaginateData(page, pageSize) {
        const data = getFilteredItems();
        return data ? data.slice((page - 1) * pageSize, page * pageSize) : [];
    }

    function getFilteredItems() {
        if (!searchTerm || searchTerm.trim() === "") return items;
        const q = searchTerm.trim().toLowerCase();
        return items.filter(it => {
            const title = (it.title || "").toLowerCase();
            const key   = (it.process_def_key || "").toLowerCase();
            const file  = (it.process_file || "").toLowerCase();
            return title.includes(q) || key.includes(q) || file.includes(q);
        });
    }

    function editItem(item) {
        setFormStatus(STATUS.update);
        setToggleBpmnViewer("restore");
        currentXmlRef.current = null;
        setElementsMap({ participants: [], userTasks: [], serviceTasks: [], variables: [] });
        setSelectedItem(item);
        setProcesses(
            tryParseJSONObject(item.processes, [{ name: item.title, id: item.process_def_key }]),
        );
        setFormShow(true);
    }

    function addNewItem() {
        setFormStatus(STATUS.create);
        setSelectedItem(INITIAL_STATE);
        setSaveIsDisabled(true);
        setProcesses([]);
        currentXmlRef.current = null;
        setElementsMap({ participants: [], userTasks: [], serviceTasks: [], variables: [] });
        setToggleBpmnViewer("restore");
        setFormShow(true);
    }

    function clearFields() {
        setSelectedItem(INITIAL_STATE);
        setSaveIsDisabled(true);
    }

    const handleModalClose = status => {
        if (status === STATUS.create && selectedItem.id !== "") {
            setShowDiscardDataModal(true);
        } else if (status === STATUS.create && selectedItem.id === "") {
            clearFields();
            setFormShow(false);
        } else if (status === STATUS.update) {
            setFormShow(false);
        }
        setFileStatus("");
    };

    async function handleDiscardConfirm() {
        const request = {
            data: [{ id: selectedItem.id, formId: DB_TABLE, entity: DB_TABLE, action: "delete" }],
        };
        const response = await axios.post(API_URL + "?service.key=update.formData", request);
        if (response.data.C_STATUS === "SUCCESS") {
            clearFields();
            getData();
            setShowDiscardDataModal(false);
            setFormShow(false);
        }
    }

    function getData() {
        const tenantId = appContext?.tenantSubscription?.tenant_id;
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", {
                tenant_id: tenantId,
                dataKeys: [
                    { serviceParams: "", dataKey: "engine", serviceKey: "bpm.list.process", mode: "formData" },
                ],
            })
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    const data = response.data.C_DATA.engine;
                    setItems(data && data.length > 0 ? data : []);
                }
            })
            .catch(console.error);
    }

    function handleChange(event) {
        const { name, type, value, checked } = event.target;
        setSelectedItem(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (checked ? "YES" : "NO") : value,
        }));
    }

    function handleDeleteFileClick(event) {
        const fileName = selectedItem.process_file;
        if (confirm(`You cannot undo deleting "${fileName}". Are you sure?`)) {
            setFileStatus("deleted");
            setProcesses([]);
            currentXmlRef.current = null;
            setElementsMap({ participants: [], userTasks: [], serviceTasks: [], variables: [] });
            setSelectedItem(prev => ({ ...prev, process_def_key: "" }));
            selectedItem.process_file = "";
            event.target.value = "";
            deleteFromServer(fileName, "");
        }
    }

    const handleProcessSelected = proc => {
        setSelectedItem(prev => ({
            ...prev,
            title: proc.name,
            process_def_key: proc.id,
        }));
    };

    const handleFileUpload = event => {
        const selectedFile = event.target.files[0];
        const fileName = selectedFile.name;
        const fileReader = new FileReader();

        fileReader.onload = fileLoadedEvent => {
            const content = fileLoadedEvent.target.result;
            const newArr = content.split("base64,");
            const encodedData = newArr[1] || "";
            uploadFilesToServer(fileName, encodedData);

            // Parse process IDs from XML
            const xmlText = atob(encodedData);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            const processElements = xmlDoc.getElementsByTagName("bpmn:process");
            const parsed = Array.from(processElements).map(p => ({
                id: p.getAttribute("id"),
                name: p.getAttribute("name"),
            }));
            setProcesses(parsed);
            if (parsed.length > 0) handleProcessSelected(parsed[0]);

            // Store XML for viewer
            currentXmlRef.current = xmlText;
        };

        fileReader.readAsDataURL(selectedFile);
        setSelectedItem(prev => ({ ...prev, process_file: fileName }));
    };

    async function deleteFromServer(fileName, encodedData) {
        const rid = selectedItem.id || "new";
        const request = {
            data: [{
                formId: DB_TABLE, entity: DB_TABLE, action: "update", id: rid,
                formData: { ...selectedItem, id: rid, process_file: "" },
                fileData: [{ fileName, content: encodedData }],
            }],
        };
        const response = await axios.post(API_URL + "?service.key=update.formData", request);
        if (response.status === 200 && response.data.C_STATUS === "SUCCESS") {
            const res = response.data.C_DATA[0];
            if (res) {
                const { id: recordId, process_file: pf } = res.formData;
                setSelectedItem(prev => ({
                    ...prev,
                    id: recordId,
                    process_file: pf,
                    file_url: `${FILE_URL}/${DB_TABLE}/${recordId}/${pf}`,
                }));
            }
        }
    }

    async function uploadFilesToServer(fileName, encodedData) {
        const rid = selectedItem.id || "new";
        const request = {
            data: [{
                formId: DB_TABLE, entity: DB_TABLE, action: "update", id: rid,
                formData: { ...selectedItem, id: rid, process_file: fileName },
                fileData: [{ fileName, content: encodedData }],
            }],
        };
        const response = await axios.post(API_URL + "?service.key=update.formData", request);
        if (response.status === 200 && response.data.C_STATUS === "SUCCESS") {
            const res = response.data.C_DATA[0];
            if (res) {
                const { id: recordId, process_file: pf } = res.formData;
                setSelectedItem(prev => ({
                    ...prev,
                    id: recordId,
                    process_file: pf,
                    file_url: `${FILE_URL}/${DB_TABLE}/${recordId}/${pf}`,
                }));
                setFileStatus("");
            }
        }
    }

    function saveData(item) {
        const fieldsData = { ...item, processes };
        const request = {
            data: [{
                formId: DB_TABLE,
                entity: DB_TABLE,
                action: "update",
                id: fieldsData.id || "new",
                formData: { ...fieldsData, id: fieldsData.id || "new" },
            }],
        };
        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.status === 200) {
                    getData();
                    clearFields();
                    setFormShow(false);
                    toastEmitter("Record saved successfully", true);
                }
            })
            .catch(e => console.error("saveData error:", e));
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            const request = {
                data: [{
                    formId: DB_TABLE, entity: DB_TABLE, action: "delete", id: item.id,
                }],
            };
            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        getData();
                        updateDeleteConfig(false, {}, setDeleteConfig);
                    }
                })
                .catch(console.error);
        } else {
            updateDeleteConfig(true, item, setDeleteConfig);
        }
    }

    const deployProcess = proc => {
        const process_engine = appContext.tenantSubscription.process_engine;
        const request = {
            id: proc.id,
            entity: DB_TABLE,
            fileName: proc.process_file,
            mainProcessDefKey: proc.process_def_key,
            process_engine,
        };
        axios.post(`${BPM_API_URL}?service.key=deploy.process`, request).then(res => {
            if (res.data.C_STATUS === "SUCCESS") {
                const data = res.data.C_DATA;
                saveData({ ...proc, version: data.version, process_id: data.process_id, deployment: data.deployment });
                toastEmitter("Process Deployed Successfully", true);
            } else {
                toastEmitter("Process Deployment Failed", true, "error");
            }
        });
    };

    /* ─────────────────────────────────────────────────────────────────────
       Element-tab helpers
    ───────────────────────────────────────────────────────────────────── */
    function elemDisplayName(elem) {
        const name = elem.businessObject?.name;
        return name && name.trim() ? name : elem.id;
    }

    function elemBadge(elem) {
        if (elem.type === "bpmn:Lane") return <span className="proc-type-badge badge-lane">Lane</span>;
        return null;
    }

    /* ─────────────────────────────────────────────────────────────────────
       Property editor content (per type)
    ───────────────────────────────────────────────────────────────────── */
    function renderPropForm() {
        if (!propModal) return null;
        const { type } = propModal;

        if (propLoading && !refDataLoaded) {
            return (
                <div className="text-center py-3">
                    <i className="fa-solid fa-spinner fa-spin me-2" />
                    Loading reference data…
                </div>
            );
        }

        if (type === "participants") {
            return (
                <>
                    <div className="mb-3">
                        <label className="ai-label">Assign to</label>
                        <div className="d-flex gap-3">
                            {["user", "group"].map(t => (
                                <div key={t} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="assigneeType"
                                        id={`at-${t}`}
                                        value={t}
                                        checked={propForm.assigneeType === t}
                                        onChange={() => setPropForm(p => ({ ...p, assigneeType: t, assignee: "" }))}
                                    />
                                    <label className="form-check-label" htmlFor={`at-${t}`}>
                                        {t === "user" ? "User" : "Group"}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mb-1">
                        <label className="ai-label">
                            {propForm.assigneeType === "group" ? "Group" : "User"}
                        </label>
                        <SearchableSelect
                            options={propForm.assigneeType === "group" ? groups : users}
                            value={propForm.assignee}
                            onChange={e => setPropForm(p => ({ ...p, assignee: e.target.value }))}
                            placeholder={propForm.assigneeType === "group" ? "Search groups…" : "Search users…"}
                        />
                    </div>
                </>
            );
        }

        if (type === "userTasks") {
            return (
                <div className="mb-1">
                    <label className="ai-label">Form</label>
                    <SearchableSelect
                        options={formList}
                        value={propForm.formKey}
                        onChange={e => setPropForm(p => ({ ...p, formKey: e.target.value }))}
                        placeholder="Search forms…"
                    />
                </div>
            );
        }

        if (type === "serviceTasks") {
            return (
                <>
                    <div className="mb-3">
                        <label className="ai-label">Type</label>
                        <input className="form-control form-control-sm" value="external" readOnly />
                        <div className="form-text" style={{ fontSize: "0.72rem" }}>
                            External worker tasks are picked up by connected workflow engines.
                        </div>
                    </div>
                    <div className="mb-1">
                        <label className="ai-label">Topic</label>
                        <input
                            className="form-control form-control-sm"
                            placeholder="e.g. process-payment"
                            value={propForm.topic || ""}
                            onChange={e => setPropForm(p => ({ ...p, topic: e.target.value }))}
                        />
                    </div>
                </>
            );
        }

        if (type === "variables") {
            return (
                <div className="mb-1">
                    <label className="ai-label">Name</label>
                    <input
                        className="form-control form-control-sm"
                        value={propForm.name || ""}
                        onChange={e => setPropForm(p => ({ ...p, name: e.target.value }))}
                    />
                </div>
            );
        }

        return null;
    }

    /* ─────────────────────────────────────────────────────────────────────
       Element tabs panel (rendered inside the modal)
    ───────────────────────────────────────────────────────────────────── */
    function renderElemTabs() {
        const currentElems = elementsMap[activeElemTab] || [];
        return (
            <div className="proc-elem-panel">
                <ul className="nav nav-tabs proc-elem-nav">
                    {ELEM_TABS.map(t => {
                        const count = elementsMap[t.key]?.length || 0;
                        return (
                            <li key={t.key} className="nav-item">
                                <button
                                    className={`nav-link proc-elem-tab ${activeElemTab === t.key ? "active" : ""}`}
                                    onClick={() => setActiveElemTab(t.key)}>
                                    <i className={`fa-solid ${t.icon} me-1`} />
                                    {t.label}
                                    {count > 0 && (
                                        <span className="proc-elem-count ms-1">{count}</span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div className="proc-elem-body">
                    {currentElems.length === 0 ? (
                        <div className="proc-elem-empty">
                            {xmlLoading
                                ? <><i className="fa-solid fa-spinner fa-spin me-1" /> Loading diagram…</>
                                : <>No {ELEM_TABS.find(t => t.key === activeElemTab)?.label.toLowerCase()} found in this diagram.</>}
                        </div>
                    ) : (
                        <table className="proc-elem-table">
                            <thead>
                                <tr>
                                    <th>Name / ID</th>
                                    <th>Type</th>
                                    <th style={{ width: "5rem" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentElems.map(elem => (
                                    <tr key={elem.id}>
                                        <td>
                                            <span className="proc-elem-name">{elemDisplayName(elem)}</span>
                                            {elemBadge(elem)}
                                        </td>
                                        <td>
                                            <span className="proc-elem-type">
                                                {elem.type.replace("bpmn:", "")}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-outline-secondary btn-sm proc-elem-edit-btn"
                                                onClick={() => openPropModal(activeElemTab, elem)}>
                                                <i className="fa-regular fa-edit me-1" />
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }

    /* ─────────────────────────────────────────────────────────────────────
       BPMN viewer panel (top section inside modal)
    ───────────────────────────────────────────────────────────────────── */
    function renderViewerPanel(mode) {
        const isMax = mode === "maximize";
        const containerRef = isMax ? maxViewerRef : restoreViewerRef;

        return (
            <div className={`proc-viewer-wrap ${isMax ? "proc-viewer-wrap--max" : ""}`}>
                {/* Toolbar */}
                <div className="proc-viewer-toolbar">
                    <span className="proc-viewer-filename">
                        <i className="fa-solid fa-file-code me-1" />
                        {selectedItem.process_file || "No file loaded"}
                    </span>
                    <div className="d-flex gap-1 align-items-center">
                        {xmlLoading && (
                            <span className="proc-viewer-loading">
                                <i className="fa-solid fa-spinner fa-spin me-1" />
                                Loading…
                            </span>
                        )}
                        {selectedItem.process_file && !isMax && (
                            <button
                                className="btn btn-outline-secondary btn-sm proc-viewer-icon-btn"
                                title="Expand viewer"
                                onClick={() => setToggleBpmnViewer("maximize")}>
                                <i className="fa-solid fa-expand" />
                            </button>
                        )}
                        {selectedItem.process_file && isMax && (
                            <button
                                className="btn btn-outline-secondary btn-sm proc-viewer-icon-btn"
                                title="Collapse viewer"
                                onClick={() => setToggleBpmnViewer("restore")}>
                                <i className="fa-solid fa-compress" />
                            </button>
                        )}
                        {selectedItem.process_file && (
                            <a
                                className="btn btn-outline-secondary btn-sm proc-viewer-icon-btn"
                                title="Download BPMN"
                                href={fileUrl}
                                download>
                                <i className="fa-solid fa-download" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Canvas */}
                <div
                    className={`proc-viewer-canvas ${isMax ? "proc-viewer-canvas--max" : ""}`}
                    ref={containerRef}
                />
            </div>
        );
    }

    /* ─────────────────────────────────────────────────────────────────────
       Render
    ───────────────────────────────────────────────────────────────────── */
    return (
        <div className="process-configuration-map">
            {/* ── List table ── */}
            <div className="row p-2 m-0">
                <div className="col-sm-12 p-2">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="fa fa-search" />
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by title, def key or file"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="btn btn-light" onClick={() => setSearchTerm("")} title="Clear">
                                <i className="fa fa-times" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-2 table-row text-left">
                                    <TableSorting state={items} setState={setItems} fieldName="title" headerTitle="Select Main Process" />
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    <TableSorting state={items} setState={setItems} fieldName="process_def_key" headerTitle="Main Process Def Key" />
                                </Th>
                                <Th className="col-sm-2 table-row text-left">Process File</Th>
                                <Th className="col-sm-2 table-row text-left">Current Deployment</Th>
                                <Th className="col-sm-2 table-row text-left">Last Updated</Th>
                                <Th className="col-sm-2 table-row text-left" />
                            </Tr>
                        </Thead>
                        <Tbody>
                            {getPaginateData(current, size).map(item => (
                                <Tr
                                    key={item.id}
                                    className={item.id === selectedItem.id ? "selected-cell" : ""}>
                                    <Td className="col-sm-2 table-row text-left">{item.title}</Td>
                                    <Td className="col-sm-2 table-row text-left">{item.process_def_key}</Td>
                                    <Td className="col-sm-2 table-row text-left">{item.process_file}</Td>
                                    <Td className="col-sm-2 table-row text-left">{item?.version}</Td>
                                    <Td className="col-sm-2 table-row text-left">{formatDateTimeForUserView(item?.datemodified)}</Td>
                                    <Td className="col-sm-2 table-row text-left">
                                        <div className="data-cell d-flex">
                                            <span className="table-edit-font px-2" title="Deploy process" onClick={() => deployProcess(item)}>
                                                <i className="fa fa-retweet m-0" />
                                            </span>
                                            <span className="table-edit-font" title="Edit" onClick={() => editItem(item)}>
                                                <i className="fa-regular fa-edit" />
                                            </span>
                                            <span className="table-del-font" title="Delete" onClick={() => deleteData(item)}>
                                                <i className="fa-regular fa-trash-can" />
                                            </span>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </div>

                <div className="col-sm-8 p-0">
                    <span type="button" className="button-theme btn btn-sm pull-left my-2" onClick={addNewItem}>
                        <i className="fa-solid fa-plus pe-1" />
                        Add New
                    </span>
                </div>
                <div className="col-sm-4 p-0">
                    <TablePagination
                        size={size}
                        setSize={setSize}
                        current={current}
                        setCurrent={setCurrent}
                        tableData={getFilteredItems()}
                    />
                </div>
            </div>

            {/* ── Main modal ── */}
            <Modal
                show={formShow}
                onHide={() => {}}
                backdrop="static"
                keyboard={true}
                animation={true}
                size="lg"
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header className="d-flex align-items-center justify-content-between">
                    <Modal.Title>Process BPMN Model</Modal.Title>
                    <div className="d-flex gap-2">
                        {toggleModalWindow !== "maximize" && (
                            <div className="pointer" title="Maximize window" onClick={() => setToggleModalWindow("maximize")}>
                                <i className="fa-regular fa-window-maximize fs-5" />
                            </div>
                        )}
                        {toggleModalWindow !== "restore" && (
                            <div className="pointer" title="Restore window" onClick={() => setToggleModalWindow("restore")}>
                                <i className="fa-regular fa-window-restore fs-5" />
                            </div>
                        )}
                        <div className="pointer" onClick={() => handleModalClose(formStatus)}>
                            <i className="fa-solid fa-xmark fs-5" />
                        </div>
                    </div>
                </Modal.Header>

                <Modal.Body className="p-0">
                    {toggleBpmnViewer === "restore" ? (
                        /* ── Restore layout: form left | viewer+tabs right ── */
                        <div className="proc-modal-restore-layout">
                            {/* Left — metadata form */}
                            <div className="proc-form-col">
                                <div className="proc-form-inner">
                                    {/* Process select */}
                                    <div className="mb-3">
                                        <label className="fw-bold form-label">
                                            Select Main Process <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control"
                                            name="title"
                                            value={selectedItem.title}
                                            onChange={e =>
                                                handleProcessSelected(
                                                    processes.find(p => p.name === e.target.value),
                                                )
                                            }>
                                            {processes.map((p, i) => (
                                                <option key={i} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Def key */}
                                    <div className="mb-3">
                                        <label className="fw-bold form-label">
                                            Main Process Def Key <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="process_def_key"
                                            value={selectedItem.process_def_key}
                                            onChange={handleChange}
                                            readOnly
                                        />
                                    </div>

                                    {/* BPMN file */}
                                    <div className="mb-3">
                                        <label className="fw-bold form-label">
                                            BPMN File <span className="text-danger">*</span>
                                        </label>
                                        {(!selectedItem.process_file || fileStatus === "deleted") ? (
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept=".bpmn"
                                                onClick={e => { e.target.value = null; }}
                                                onChange={handleFileUpload}
                                            />
                                        ) : (
                                            <div className={`form-control d-flex align-items-center justify-content-between ${fileStatus === "deleted" ? "deleted-text" : ""}`}>
                                                <span>{selectedItem.process_file}</span>
                                                <i
                                                    className="text-danger fa-solid fa-trash pointer ms-2"
                                                    title="Delete file"
                                                    onClick={handleDeleteFileClick}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="proc-form-footer">
                                    <button
                                        className="btn button-theme btn-sm"
                                        onClick={() => handleModalClose(formStatus)}>
                                        <i className="fa-solid fa-xmark pe-1" />
                                        Close
                                    </button>
                                    <button
                                        className="btn button-theme btn-sm"
                                        onClick={() => saveData(selectedItem)}
                                        disabled={saveIsDisabled}>
                                        <i className="fa-solid fa-floppy-disk pe-1" />
                                        Save
                                    </button>
                                </div>
                            </div>

                            {/* Right — viewer + element tabs */}
                            <div className="proc-viewer-col">
                                {renderViewerPanel("restore")}
                                {renderElemTabs()}
                            </div>
                        </div>
                    ) : (
                        /* ── Maximize layout: full-width viewer + tabs ── */
                        <div className="proc-modal-max-layout">
                            {renderViewerPanel("maximize")}
                            {renderElemTabs()}
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* ── Property editor modal ── */}
            <Modal
                show={!!propModal}
                onHide={() => setPropModal(null)}
                backdrop="static"
                size="sm"
                style={{ zIndex: 1060 }}
                className="s2a-modal">
                <Modal.Header>
                    <Modal.Title className="modal-title" style={{ fontSize: "0.9rem" }}>
                        <i className="fa-solid fa-sliders me-2" />
                        {propModal?.title}
                    </Modal.Title>
                    <button className="btn-close" onClick={() => setPropModal(null)} />
                </Modal.Header>
                <Modal.Body>
                    {renderPropForm()}
                </Modal.Body>
                <Modal.Footer className="py-2">
                    <button className="btn button-theme btn-sm" onClick={() => setPropModal(null)}>
                        <i className="fa-solid fa-xmark pe-1" />Cancel
                    </button>
                    <button className="btn button-theme btn-sm" onClick={savePropChanges} disabled={propLoading}>
                        <i className="fa-solid fa-check pe-1" />Apply
                    </button>
                </Modal.Footer>
            </Modal>

            {/* ── Discard confirm modal ── */}
            <Modal
                show={showDiscardDataModal}
                onHide={() => setShowDiscardDataModal(false)}
                backdrop="static"
                className="s2a-modal"
                size="md">
                <Modal.Header>
                    <Modal.Title className="modal-title">Confirm Discard</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    There are unsaved changes. Are you sure you want to discard them?
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn button-theme btn-sm m-0 me-2" onClick={() => setShowDiscardDataModal(false)}>
                        <i className="fa-solid fa-xmark pe-1" />No
                    </button>
                    <button className="btn button-theme btn-sm me-2 m-0" onClick={handleDiscardConfirm}>
                        <i className="fa-solid fa-floppy-disk pe-1" />Yes
                    </button>
                </Modal.Footer>
            </Modal>

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
