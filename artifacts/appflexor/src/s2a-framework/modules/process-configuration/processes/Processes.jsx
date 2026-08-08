import axios from "axios";
import BpmnNavigatedViewer from "bpmn-js/lib/NavigatedViewer";
import camundaModdle from "camunda-bpmn-moddle/resources/camunda.json";
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
    { key: "userTasks", label: "User Tasks", icon: "fa-user-check" },
    { key: "serviceTasks", label: "Service Tasks", icon: "fa-gear" },
    { key: "variables", label: "Variables", icon: "fa-database" },
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
                <option className="p-1" value="expression">— dynamic —</option>
                {filtered.map(o => (
                    <option className="p-1" key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

/* ── main component ────────────────────────────────────────────────────── */
function Processes({ activeTab }) {
    const appContext = useContext(AppContext);

    /* ── list state ── */
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(INITIAL_STATE);
    const [formStatus, setFormStatus] = useState(STATUS.none);
    const [fileStatus, setFileStatus] = useState("");
    const [processes, setProcesses] = useState([]);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const [showDiscardDataModal, setShowDiscardDataModal] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("maximize");
    const [toggleBpmnViewer, setToggleBpmnViewer] = useState("restore");
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [deleteConfig, setDeleteConfig] = useState({ show: false, item: {} });

    /* ── deployment state ── */
    const [deployPending, setDeployPending] = useState(false);
    const [deploying, setDeploying] = useState(false);

    /* ── inline status message (replaces toast) ── */
    const [statusMsg, setStatusMsg] = useState(null); // { text, type: "success"|"error"|"info" }
    const statusTimeoutRef = useRef(null);
    const setStatus = (text, type = "success") => {
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        setStatusMsg({ text, type });
        statusTimeoutRef.current = setTimeout(() => setStatusMsg(null), 4000);
    };

    /* ── viewer state ── */
    const [xmlLoading, setXmlLoading] = useState(false);
    const [bpmnProcesses, setBpmnProcesses] = useState([]); // [{id,name}] from XML
    const [activeProcessId, setActiveProcessId] = useState("");
    const [elementsMap, setElementsMap] = useState({
        userTasks: [], serviceTasks: [], variables: [], startEvents: [],
    });
    const [activeElemTab, setActiveElemTab] = useState("userTasks");
    const [xmlDirty, setXmlDirty] = useState(false);

    /* ── property editor state ── */
    const [propModal, setPropModal] = useState(null); // { type, subType, element, title }
    const [propForm, setPropForm] = useState({});
    const [propLoading, setPropLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [formList, setFormList] = useState([]);
    const [refDataLoaded, setRefDataLoaded] = useState(false);

    /* ── AI agent / task state (for service-task editor) ── */
    const [aiAgents, setAiAgents] = useState([]); // [{ value:id, label:name, key:agent_key }]
    const [aiAgentTasks, setAiAgentTasks] = useState([]); // [{ value:task_key, label:task_name }]
    const [aiTasksLoading, setAiTasksLoading] = useState(false);

    /* ── auto-load tasks when agents arrive with a modal already open ── */
    useEffect(() => {
        if (
            propModal?.type === "serviceTasks" &&
            propForm.serviceType === "ai" &&
            propForm.agentKey &&
            aiAgents.length > 0 &&
            aiAgentTasks.length === 0 &&
            !aiTasksLoading
        ) {
            loadAiTasksForAgent(propForm.agentKey);
        }
    }, [aiAgents]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── viewer refs ── */
    const restoreViewerRef = useRef(null); // DOM container — restore mode
    const maxViewerRef = useRef(null); // DOM container — maximize mode
    const viewerInstanceRef = useRef(null); // NavigatedViewer instance
    const currentXmlRef = useRef(null); // current BPMN XML string
    const allElementsRef = useRef([]);   // all registry elements (for process filtering)

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

        const viewer = new BpmnNavigatedViewer({
            container,
            moddleExtensions: { camunda: camundaModdle },
        });
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
            setXmlDirty(false);

            // Parse process list from XML
            const procs = parseProcessesFromXml(xml);
            setBpmnProcesses(procs);
            const firstId = procs[0]?.id || "";
            setActiveProcessId(firstId);

            const viewer = viewerInstanceRef.current;
            if (viewer) {
                await viewer.importXML(xml);
                viewer.get("canvas").zoom("fit-viewport");
                extractElements(viewer, firstId);
            }
        } catch (err) {
            console.error("BPMN fetch error:", err);
            setStatus("Failed to load BPMN diagram", "error");
        } finally {
            setXmlLoading(false);
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       Walk businessObject parent chain to find owning bpmn:Process id
    ───────────────────────────────────────────────────────────────────── */
    function getProcessId(bo) {
        let cur = bo;
        while (cur) {
            if (cur.$type === "bpmn:Process") return cur.id;
            cur = cur.$parent;
        }
        return null;
    }

    /* ─────────────────────────────────────────────────────────────────────
       Parse process list from raw BPMN XML string
    ───────────────────────────────────────────────────────────────────── */
    function parseProcessesFromXml(xml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        let elems = Array.from(
            doc.getElementsByTagNameNS("http://www.omg.org/spec/BPMN/20100524/MODEL", "process"),
        );
        if (elems.length === 0) elems = Array.from(doc.getElementsByTagName("bpmn:process"));
        if (elems.length === 0) elems = Array.from(doc.getElementsByTagName("process"));
        return elems
            .map(p => ({ id: p.getAttribute("id") || "", name: p.getAttribute("name") || p.getAttribute("id") || "" }))
            .filter(p => p.id);
    }

    /* ─────────────────────────────────────────────────────────────────────
       Switch active process: update elementsMap + zoom canvas to it
    ───────────────────────────────────────────────────────────────────── */
    function switchToProcess(processId) {
        setActiveProcessId(processId);

        // Filter stored elements by new process
        const filtered = processId
            ? allElementsRef.current.filter(e => getProcessId(e.businessObject) === processId)
            : allElementsRef.current;
        setElementsMap({
            userTasks: filtered.filter(e => e.type === "bpmn:UserTask"),
            serviceTasks: filtered.filter(e => e.type === "bpmn:ServiceTask"),
            variables: filtered.filter(e => e.type === "bpmn:DataObjectReference"),
            startEvents: filtered.filter(e => e.type === "bpmn:StartEvent"),
        });

        // Zoom canvas to the bounding box of this process's elements
        const viewer = viewerInstanceRef.current;
        if (!viewer || !processId) return;
        try {
            const canvas = viewer.get("canvas");
            const shapes = allElementsRef.current.filter(
                e => e.x !== undefined && getProcessId(e.businessObject) === processId,
            );
            if (shapes.length === 0) { canvas.zoom("fit-viewport"); return; }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            shapes.forEach(s => {
                minX = Math.min(minX, s.x);
                minY = Math.min(minY, s.y);
                maxX = Math.max(maxX, s.x + (s.width || 0));
                maxY = Math.max(maxY, s.y + (s.height || 0));
            });
            const pad = 50;
            canvas.viewbox({ x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 });
        } catch (err) {
            console.error("Zoom to process error:", err);
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       Parse element registry into categorised lists
    ───────────────────────────────────────────────────────────────────── */
    function extractElements(viewer, initialProcessId) {
        try {
            const registry = viewer.get("elementRegistry");
            const all = registry.getAll().filter(e => e.type !== "label");
            allElementsRef.current = all;

            const pid = initialProcessId || (all.length > 0 ? getProcessId(all[0]?.businessObject) : "") || "";
            const filtered = pid ? all.filter(e => getProcessId(e.businessObject) === pid) : all;
            setElementsMap({
                userTasks: filtered.filter(e => e.type === "bpmn:UserTask"),
                serviceTasks: filtered.filter(e => e.type === "bpmn:ServiceTask"),
                variables: filtered.filter(e => e.type === "bpmn:DataObjectReference"),
                startEvents: filtered.filter(e => e.type === "bpmn:StartEvent"),
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
                    { serviceParams: "", dataKey: "groups", serviceKey: "sys.console.dir.group", mode: "formData" },
                    { serviceParams: "", dataKey: "users", serviceKey: "sys.user.list", mode: "formData" },
                    { serviceParams: "", dataKey: "formList", serviceKey: "sys.list.forms", mode: "formData" },
                    { serviceParams: "", dataKey: "agents", serviceKey: "ai.agent.list", mode: "formData" },
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
                setAiAgents(
                    (d.agents || []).map(a => ({
                        value: a.agent_key, // use agent_key as select value for stable lookup
                        label: a.agent_name,
                        id: a.id,        // db id kept for task-loading API calls
                    })),
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
       Load tasks for a given agent id (called when agent changes)
    ───────────────────────────────────────────────────────────────────── */
    async function loadAiTasksForAgent(agentKey) {
        if (!agentKey) { setAiAgentTasks([]); return; }
        // Resolve db id from the key (aiAgents may or may not be populated yet)
        const agentRec = aiAgents.find(a => a.value === agentKey);
        const agentId = agentRec?.id;
        if (!agentId) { setAiAgentTasks([]); return; }
        setAiTasksLoading(true);
        try {
            const res = await axios.post(API_URL + "?service.key=masterKey.tenantData", {
                dataKeys: [
                    { serviceParams: agentId, dataKey: "tasks", serviceKey: "ai.task.by.agent", mode: "formData" },
                ],
            });
            if (res.data.C_STATUS === "SUCCESS") {
                setAiAgentTasks(
                    (res.data.C_DATA?.tasks || []).map(t => ({
                        value: t.task_key,
                        label: t.task_name,
                    })),
                );
            }
        } catch (err) {
            console.error("Load AI tasks error:", err);
        } finally {
            setAiTasksLoading(false);
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       Open property editor modal
       subType: "form" | "assignee" for userTasks; undefined for others
    ───────────────────────────────────────────────────────────────────── */
    function openPropModal(type, element, subType) {
        const bo = element.businessObject;
        const attrs = bo.$attrs || {};
        let init = {};

        if (type === "userTasks" && subType === "assignee") {
            // With camunda-bpmn-moddle registered, re-imported values land on bo directly
            const grp = bo.candidateGroups || attrs["camunda:candidateGroups"] || attrs["activiti:candidateGroups"] || "";
            const usr = bo.assignee        || attrs["camunda:assignee"]        || attrs["activiti:assignee"]        || "";
            const val = grp || usr;
            const isExpr = /^\$\{|^#\{/.test(val);
            init = { assigneeType: isExpr ? "expression" : (grp ? "group" : "user"), assignee: val };
        } else if ((type === "userTasks" || type === "startEvent") && subType === "form") {
            const fk = bo.formKey || attrs["camunda:formKey"] || attrs["activiti:formKey"] || "";
            init = { formKey: fk, formType: /^\$\{|^#\{/.test(fk) ? "expression" : "key" };
        } else if (type === "serviceTasks") {
            const storedAgentKey = attrs["s2aAgentKey"] || "";
            const storedTaskKey = attrs["s2aTaskKey"] || "";
            let payload = [
                { key: "business_key", value: "" },
                { key: "message", value: "" },
            ];
            try {
                const raw = attrs["s2aPayload"];
                if (raw) {
                    const parsed = JSON.parse(raw);
                    payload = Object.entries(parsed).map(([k, v]) => ({ key: k, value: v }));
                    // Ensure business_key + message always present
                    if (!payload.find(p => p.key === "business_key")) payload.unshift({ key: "business_key", value: "" });
                    if (!payload.find(p => p.key === "message")) payload.splice(1, 0, { key: "message", value: "" });
                }
            } catch (_) { /* keep defaults */ }

            // Parse external worker params
            let params = [];
            try {
                const raw = attrs["s2aParams"];
                if (raw) params = Object.entries(JSON.parse(raw)).map(([k, v]) => ({ key: k, value: v }));
            } catch (_) { /* keep empty */ }

            const topic = bo.topic || attrs["camunda:topic"] || "";
            if (storedAgentKey) {
                // Tasks are loaded later via useEffect once aiAgents is populated
                init = {
                    serviceType: "ai",
                    agentKey: storedAgentKey, // this IS the select value; no agentId needed
                    taskKey: storedTaskKey,
                    payload,
                    params,
                };
            } else {
                init = {
                    serviceType: "external",
                    topic,
                    agentKey: "", taskKey: "",
                    payload,
                    params,
                };
            }
        } else if (type === "variables") {
            init = { name: bo.name || "" };
        }

        setPropForm(init);
        setPropModal({ type, subType, element, title: bo.name || element.id });
        loadRefData();
    }

    /* ─────────────────────────────────────────────────────────────────────
       Save property changes → mutate businessObject → saveXML → upload
    ───────────────────────────────────────────────────────────────────── */
    async function savePropChanges() {
        const { type, subType, element } = propModal;
        const bo = element.businessObject;
        if (!bo.$attrs) bo.$attrs = {};

        // Mutate businessObject attributes
        // NOTE: For full Camunda namespace support in new files, register
        //       camunda-bpmn-moddle as a moddleExtension on the viewer.
        if (type === "userTasks" && subType === "assignee") {
            if (propForm.assigneeType === "group") {
                bo.candidateGroups = propForm.assignee;
                bo.$attrs["camunda:candidateGroups"] = propForm.assignee;
                delete bo.assignee;
                delete bo.$attrs["camunda:assignee"];
            } else {
                // user or expression — both write to camunda:assignee
                bo.assignee = propForm.assignee;
                bo.$attrs["camunda:assignee"] = propForm.assignee;
                delete bo.candidateGroups;
                delete bo.$attrs["camunda:candidateGroups"];
            }
        } else if ((type === "userTasks" || type === "startEvent") && subType === "form") {
            bo.formKey = propForm.formKey;
            bo.$attrs["camunda:formKey"] = propForm.formKey;
        } else if (type === "serviceTasks") {
            if (propForm.serviceType === "ai") {
                bo.type = "external";  bo.$attrs["camunda:type"]  = "external";
                bo.topic = "ai.agent.task"; bo.$attrs["camunda:topic"] = "ai.agent.task";
                bo.$attrs["s2aAgentKey"] = propForm.agentKey;
                bo.$attrs["s2aTaskKey"] = propForm.taskKey;
                const payloadObj = Object.fromEntries(
                    (propForm.payload || [])
                        .filter(p => p.key.trim())
                        .map(p => [p.key.trim(), p.value]),
                );
                bo.$attrs["s2aPayload"] = JSON.stringify(payloadObj);
            } else {
                bo.type = "external";  bo.$attrs["camunda:type"]  = "external";
                bo.topic = propForm.topic; bo.$attrs["camunda:topic"] = propForm.topic;
                const paramsObj = Object.fromEntries(
                    (propForm.params || [])
                        .filter(p => p.key.trim())
                        .map(p => [p.key.trim(), p.value]),
                );
                if (Object.keys(paramsObj).length > 0) {
                    bo.$attrs["s2aParams"] = JSON.stringify(paramsObj);
                } else {
                    delete bo.$attrs["s2aParams"];
                }
                delete bo.$attrs["s2aAgentKey"];
                delete bo.$attrs["s2aTaskKey"];
                delete bo.$attrs["s2aPayload"];
            }
        } else if (type === "variables") {
            bo.name = propForm.name;
        }

        // Serialize + upload to server immediately
        try {
            const { xml } = await viewerInstanceRef.current.saveXML({ format: true });
            currentXmlRef.current = xml;
            setXmlDirty(true);
            setDeployPending(true);
            // Encode XML as base64 (handles UTF-8 correctly)
            const xmlBytes = new TextEncoder().encode(xml);
            let binary = "";
            xmlBytes.forEach(b => { binary += String.fromCharCode(b); });
            await uploadFilesToServer(selectedItem.process_file, btoa(binary));
            setStatus("Properties saved");
            setPropModal(null);
        } catch (err) {
            console.error("saveXML/upload error:", err);
            setStatus("Failed to save properties", "error");
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       Save updated XML back to server (without changing record metadata)
    ───────────────────────────────────────────────────────────────────── */
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
            const key = (it.process_def_key || "").toLowerCase();
            const file = (it.process_file || "").toLowerCase();
            return title.includes(q) || key.includes(q) || file.includes(q);
        });
    }

    function editItem(item) {
        setFormStatus(STATUS.update);
        setToggleBpmnViewer("restore");
        setXmlDirty(false);
        currentXmlRef.current = null;
        allElementsRef.current = [];
        setBpmnProcesses([]);
        setActiveProcessId("");
        setElementsMap({ userTasks: [], serviceTasks: [], variables: [], startEvents: [] });
        setActiveElemTab("userTasks");
        setSelectedItem(item);
        setDeployPending(!!item.process_file);
        setProcesses(
            tryParseJSONObject(item.processes, [{ name: item.title, id: item.process_def_key }]),
        );
        setFormShow(true);
    }

    function addNewItem() {
        setFormStatus(STATUS.create);
        setSelectedItem(INITIAL_STATE);
        setXmlDirty(false);
        setSaveIsDisabled(true);
        setProcesses([]);
        currentXmlRef.current = null;
        allElementsRef.current = [];
        setBpmnProcesses([]);
        setActiveProcessId("");
        setElementsMap({ userTasks: [], serviceTasks: [], variables: [], startEvents: [] });
        setDeployPending(false);
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
        setDeployPending(true);
    }

    function handleDeleteFileClick(event) {
        const fileName = selectedItem.process_file;
        if (confirm(`You cannot undo deleting "${fileName}". Are you sure?`)) {
            setFileStatus("deleted");
            setProcesses([]);
            currentXmlRef.current = null;
            allElementsRef.current = [];
            setBpmnProcesses([]);
            setActiveProcessId("");
            setElementsMap({ userTasks: [], serviceTasks: [], variables: [], startEvents: [] });
            setSelectedItem(prev => ({ ...prev, process_def_key: "" }));
            selectedItem.process_file = "";
            event.target.value = "";
            deleteFromServer(fileName, "");
            setDeployPending(true);
        }
    }

    const handleProcessSelected = proc => {
        setSelectedItem(prev => ({
            ...prev,
            title: proc.name,
            process_def_key: proc.id,
        }));
        setDeployPending(true);
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
            const parsed = parseProcessesFromXml(xmlText);
            setProcesses(parsed);
            setBpmnProcesses(parsed);
            const firstId = parsed[0]?.id || "";
            setActiveProcessId(firstId);
            if (parsed.length > 0) handleProcessSelected(parsed[0]);

            // Store XML for viewer
            currentXmlRef.current = xmlText;
            setDeployPending(true);
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

    async function saveData(item) {
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
        try {
            const response = await axios.post(API_URL + "?service.key=update.formData", request);
            if (response.status === 200) {
                const saved = response.data?.C_DATA?.[0]?.formData || fieldsData;
                setSelectedItem(prev => ({ ...prev, ...saved }));
                setFormStatus(STATUS.update);
                setDeployPending(true);
                setXmlDirty(false);
                getData();
                setStatus("Record saved");
                return saved;
            }
        } catch (e) {
            console.error("saveData error:", e);
            setStatus("Failed to save record", "error");
            throw e;
        }
        return null;
    }

    const handleDeployClick = async () => {
        try {
            const saved = true; //await saveData(selectedItem);
            if (saved) await deployProcess(saved);
        } catch (_) { /* saveData already toasted */ }
    };

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

    const deployProcess = async proc => {
        const process_engine = appContext.tenantSubscription.process_engine;
        const request = {
            id: proc.id,
            entity: DB_TABLE,
            fileName: proc.process_file,
            mainProcessDefKey: proc.process_def_key,
            process_engine,
        };
        setDeploying(true);
        try {
            const res = await axios.post(`${BPM_API_URL}?service.key=deploy.process`, request);
            if (res.data.C_STATUS === "SUCCESS") {
                const data = res.data.C_DATA;
                await saveData({ ...proc, version: data.version, process_id: data.process_id, deployment: data.deployment });
                setDeployPending(false);
                setStatus("Process deployed successfully");
            } else {
                setStatus("Deployment failed", "error");
            }
        } catch (err) {
            console.error("Deploy error:", err);
            setStatus("Deployment failed", "error");
        } finally {
            setDeploying(false);
        }
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
        const { type, subType } = propModal;

        if (propLoading && !refDataLoaded) {
            return (
                <div className="text-center py-3">
                    <i className="fa-solid fa-spinner fa-spin me-2" />
                    Loading reference data…
                </div>
            );
        }

        if (type === "userTasks" && subType === "assignee") {
            const isExprMode = propForm.assigneeType === "expression";
            return (
                <>
                    <div className="mb-3">
                        <div className="d-flex gap-3 flex-wrap">
                            {[
                                { value: "user",       label: "Individual" },
                                { value: "group",      label: "Group" },
                                { value: "expression", label: "Expression" },
                            ].map(t => (
                                <div key={t.value} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="assigneeType"
                                        id={`at-${t.value}`}
                                        value={t.value}
                                        checked={propForm.assigneeType === t.value}
                                        onChange={() => setPropForm(p => ({ ...p, assigneeType: t.value, assignee: "" }))}
                                    />
                                    <label className="form-check-label" htmlFor={`at-${t.value}`}>
                                        {t.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mb-1">
                        {isExprMode ? (
                            <>
                                <label className="ai-label">Expression</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm font-monospace"
                                    value={propForm.assignee}
                                    onChange={e => setPropForm(p => ({ ...p, assignee: e.target.value }))}
                                    placeholder="${initiator} or #{someVariable}"
                                />
                            </>
                        ) : (
                            <>
                                <label className="ai-label">
                                    {propForm.assigneeType === "group" ? "Group" : "User"}
                                </label>
                                <SearchableSelect
                                    options={propForm.assigneeType === "group" ? groups : users}
                                    value={propForm.assignee}
                                    onChange={e => setPropForm(p => ({ ...p, assignee: e.target.value }))}
                                    placeholder={propForm.assigneeType === "group" ? "Search groups…" : "Search users…"}
                                />
                            </>
                        )}
                    </div>
                </>
            );
        }

        if ((type === "userTasks" || type === "startEvent") && subType === "form") {
            const isExprMode = propForm.formType === "expression";
            return (
                <>
                    <div className="mb-2">
                        <div className="d-flex gap-3">
                            {[{ value: "key", label: "Form Key" }, { value: "expression", label: "Expression" }].map(t => (
                                <div key={t.value} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="formType"
                                        id={`ft-${t.value}`}
                                        value={t.value}
                                        checked={propForm.formType === t.value}
                                        onChange={() => setPropForm(p => ({ ...p, formType: t.value, formKey: "" }))}
                                    />
                                    <label className="form-check-label" htmlFor={`ft-${t.value}`}>{t.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mb-1">
                        {isExprMode ? (
                            <input
                                type="text"
                                className="form-control form-control-sm font-monospace"
                                value={propForm.formKey}
                                onChange={e => setPropForm(p => ({ ...p, formKey: e.target.value }))}
                                placeholder="${someExpression}"
                            />
                        ) : (
                            <SearchableSelect
                                options={formList}
                                value={propForm.formKey}
                                onChange={e => setPropForm(p => ({ ...p, formKey: e.target.value }))}
                                placeholder="Search forms…"
                            />
                        )}
                    </div>
                </>
            );
        }

        if (type === "serviceTasks") {
            const isAi = propForm.serviceType === "ai";

            /* helper: update a payload row */
            const setPayloadRow = (idx, field, val) =>
                setPropForm(p => ({
                    ...p,
                    payload: p.payload.map((row, i) =>
                        i === idx ? { ...row, [field]: val } : row,
                    ),
                }));

            /* helper: when agent changes, load its tasks and reset taskKey */
            const handleAgentChange = agentKey => {
                setPropForm(p => ({ ...p, agentKey, taskKey: "" }));
                loadAiTasksForAgent(agentKey);
            };

            return (
                <>
                    {/* ── Service type toggle ─────────────────────────────── */}
                    <div className="mb-3">
                        <label className="ai-label">Service Type</label>
                        <div className="proc-svc-type-toggle">
                            <button
                                type="button"
                                className={`proc-svc-type-btn ${!isAi ? "active" : ""}`}
                                onClick={() => setPropForm(p => ({ ...p, serviceType: "external" }))}>
                                <i className="fa-solid fa-plug me-1" />
                                External Worker
                            </button>
                            <button
                                type="button"
                                className={`proc-svc-type-btn ${isAi ? "active" : ""}`}
                                onClick={() => setPropForm(p => ({ ...p, serviceType: "ai" }))}>
                                <i className="fa-solid fa-robot me-1" />
                                AI Agent Task
                            </button>
                        </div>
                    </div>

                    {/* ── External worker fields ──────────────────────────── */}
                    {!isAi && (
                        <>
                            <div className="mb-3">
                                <label className="ai-label">Topic</label>
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="e.g. process-payment"
                                    value={propForm.topic || ""}
                                    onChange={e => setPropForm(p => ({ ...p, topic: e.target.value }))}
                                />
                                <div className="form-text" style={{ fontSize: "0.72rem" }}>
                                    External worker tasks are picked up by connected workflow engines.
                                </div>
                            </div>

                            {/* ── Dynamic parameters ── */}
                            <div className="mb-1">
                                <label className="ai-label">
                                    Parameters
                                    <span className="proc-payload-hint ms-2">
                                        Values are Camunda expressions, e.g. <code>{"${execution.businessKey}"}</code>
                                    </span>
                                </label>
                                <table className="proc-payload-table">
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Value / Expression</th>
                                            <th style={{ width: "2rem" }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(propForm.params || []).length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="proc-payload-hint" style={{ padding: "0.5rem 0.4rem" }}>
                                                    No parameters yet — click Add Parameter below.
                                                </td>
                                            </tr>
                                        )}
                                        {(propForm.params || []).map((row, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        className="form-control form-control-sm proc-payload-key-input"
                                                        value={row.key}
                                                        placeholder="param name"
                                                        onChange={e =>
                                                            setPropForm(p => ({
                                                                ...p,
                                                                params: p.params.map((r, i) =>
                                                                    i === idx ? { ...r, key: e.target.value } : r,
                                                                ),
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        className="form-control form-control-sm proc-payload-val-input"
                                                        value={row.value}
                                                        placeholder="${...}"
                                                        onChange={e =>
                                                            setPropForm(p => ({
                                                                ...p,
                                                                params: p.params.map((r, i) =>
                                                                    i === idx ? { ...r, value: e.target.value } : r,
                                                                ),
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm proc-payload-del-btn"
                                                        title="Remove parameter"
                                                        onClick={() =>
                                                            setPropForm(p => ({
                                                                ...p,
                                                                params: p.params.filter((_, i) => i !== idx),
                                                            }))
                                                        }>
                                                        <i className="fa-solid fa-times" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm mt-2 proc-payload-add-btn"
                                    onClick={() =>
                                        setPropForm(p => ({
                                            ...p,
                                            params: [...(p.params || []), { key: "", value: "" }],
                                        }))
                                    }>
                                    <i className="fa-solid fa-plus me-1" />
                                    Add Parameter
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── AI Agent Task fields ────────────────────────────── */}
                    {isAi && (
                        <>
                            {/* Agent */}
                            <div className="mb-3">
                                <label className="ai-label">Agent</label>
                                {propLoading && !refDataLoaded ? (
                                    <div className="proc-payload-hint">
                                        <i className="fa-solid fa-spinner fa-spin me-1" /> Loading agents…
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        options={aiAgents}
                                        value={propForm.agentKey || ""}
                                        onChange={e => handleAgentChange(e.target.value)}
                                        placeholder="Search agents…"
                                    />
                                )}
                                {propForm.agentKey && (
                                    <div className="proc-payload-hint">
                                        key: <code>{propForm.agentKey}</code>
                                        {" — "}
                                        {aiAgents.find(a => a.value === propForm.agentKey)?.label || propForm.agentKey}
                                    </div>
                                )}
                            </div>

                            {/* Task */}
                            <div className="mb-3">
                                <label className="ai-label">Task</label>
                                {aiTasksLoading ? (
                                    <div className="proc-payload-hint">
                                        <i className="fa-solid fa-spinner fa-spin me-1" /> Loading tasks…
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        options={aiAgentTasks}
                                        value={propForm.taskKey || ""}
                                        onChange={e => setPropForm(p => ({ ...p, taskKey: e.target.value }))}
                                        placeholder={propForm.agentKey ? "Search tasks…" : "Select an agent first…"}
                                    />
                                )}
                            </div>

                            {/* Payload */}
                            <div className="mb-1">
                                <label className="ai-label">
                                    Payload
                                    <span className="proc-payload-hint ms-2">
                                        Values are Camunda expressions, e.g. <code>{"${execution.businessKey}"}</code>
                                    </span>
                                </label>
                                <table className="proc-payload-table">
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Value / Expression</th>
                                            <th style={{ width: "2rem" }} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(propForm.payload || []).map((row, idx) => {
                                            const isFixed = row.key === "business_key" || row.key === "message";
                                            return (
                                                <tr key={idx}>
                                                    <td>
                                                        {isFixed ? (
                                                            <span className="proc-payload-fixed-key">{row.key}</span>
                                                        ) : (
                                                            <input
                                                                className="form-control form-control-sm proc-payload-key-input"
                                                                value={row.key}
                                                                placeholder="param name"
                                                                onChange={e => setPayloadRow(idx, "key", e.target.value)}
                                                            />
                                                        )}
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="form-control form-control-sm proc-payload-val-input"
                                                            value={row.value}
                                                            placeholder="${...}"
                                                            onChange={e => setPayloadRow(idx, "value", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        {!isFixed && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm proc-payload-del-btn"
                                                                title="Remove parameter"
                                                                onClick={() =>
                                                                    setPropForm(p => ({
                                                                        ...p,
                                                                        payload: p.payload.filter((_, i) => i !== idx),
                                                                    }))
                                                                }>
                                                                <i className="fa-solid fa-times" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm mt-2 proc-payload-add-btn"
                                    onClick={() =>
                                        setPropForm(p => ({
                                            ...p,
                                            payload: [...p.payload, { key: "", value: "" }],
                                        }))
                                    }>
                                    <i className="fa-solid fa-plus me-1" />
                                    Add Parameter
                                </button>
                            </div>
                        </>
                    )}
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
       Resolve display labels for a user task's assignee / form
    ───────────────────────────────────────────────────────────────────── */
    function resolveAssigneeLabel(elem) {
        const attrs = elem.businessObject?.$attrs || {};
        const grp = attrs["camunda:candidateGroups"] || attrs["activiti:candidateGroups"];
        const usr = attrs["camunda:assignee"] || attrs["activiti:assignee"];
        if (grp) {
            const found = groups.find(g => g.value === grp);
            return { label: found ? found.label : grp, type: "group" };
        }
        if (usr) {
            const found = users.find(u => u.value === usr);
            return { label: found ? found.label : usr, type: "user" };
        }
        return null;
    }

    function resolveFormLabel(elem) {
        const attrs = elem.businessObject?.$attrs || {};
        const key = attrs["camunda:formKey"] || attrs["activiti:formKey"];
        if (!key) return null;
        const found = formList.find(f => f.value === key);
        return found ? found.label : key;
    }

    /* ─────────────────────────────────────────────────────────────────────
       Element tabs panel (rendered inside the modal)
    ───────────────────────────────────────────────────────────────────── */
    function renderElemTabs() {
        const currentElems = elementsMap[activeElemTab] || [];
        const isUserTasks = activeElemTab === "userTasks";

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
                    {/* {isUserTasks && (() => {
                        const startElem = elementsMap.startEvents?.[0] || null;
                        const startForm = startElem ? resolveFormLabel(startElem) : null;
                        return (
                            <div className="proc-start-event-row">
                                <div className="proc-start-event-info">
                                    <span className="proc-start-event-badge">
                                        <i className="fa-solid fa-circle-play me-1" />
                                        Start Process
                                    </span>
                                    {startElem && (
                                        startForm ? (
                                            <span className="proc-form-chip">
                                                <i className="fa-solid fa-file-lines me-1" />
                                                {startForm}
                                            </span>
                                        ) : (
                                            <span className="proc-elem-unset">No form linked</span>
                                        )
                                    )}
                                    {!startElem && (
                                        <span className="proc-elem-unset">No start event in diagram</span>
                                    )}
                                </div>
                                {startElem && (
                                    <button
                                        className="btn btn-outline-secondary btn-sm proc-elem-edit-btn"
                                        title="Edit start form"
                                        onClick={() => openPropModal("startEvent", startElem, "form")}>
                                        <i className="fa-solid fa-file-lines" />
                                    </button>
                                )}
                            </div>
                        );
                    })()} */}
                    {currentElems.length === 0 ? (
                        <div className="proc-elem-empty">
                            {xmlLoading
                                ? <><i className="fa-solid fa-spinner fa-spin me-1" /> Loading diagram…</>
                                : isUserTasks ? <>No user tasks found in this diagram.</> : <>No {ELEM_TABS.find(t => t.key === activeElemTab)?.label.toLowerCase()} found in this diagram.</>}
                        </div>
                    ) : (
                        <table className="proc-elem-table">
                            <thead>
                                <tr>
                                    <th>Name / ID</th>
                                    {isUserTasks && <th>Assigned User/Group</th>}
                                    {isUserTasks && <th>Associated Form</th>}
                                    {!isUserTasks && <th>Type</th>}
                                    <th style={{ width: isUserTasks ? "9rem" : "5rem" }} />
                                </tr>
                            </thead>
                            <tbody>
                                {currentElems.map(elem => {
                                    const assignee = isUserTasks ? resolveAssigneeLabel(elem) : null;
                                    const formLabel = isUserTasks ? resolveFormLabel(elem) : null;
                                    return (
                                        <tr key={elem.id}>
                                            <td>
                                                <span className="proc-elem-name">{elemDisplayName(elem)}</span>
                                                {elemBadge(elem)}
                                            </td>
                                            {isUserTasks && (
                                                <td>
                                                    {assignee ? (
                                                        <span className="proc-assignee-chip">
                                                            <i className={`fa-solid ${assignee.type === "group" ? "fa-users" : "fa-user"} me-1`} />
                                                            {assignee.label}
                                                        </span>
                                                    ) : (
                                                        <span className="proc-elem-unset">—</span>
                                                    )}
                                                </td>
                                            )}
                                            {isUserTasks && (
                                                <td>
                                                    {formLabel ? (
                                                        <span className="proc-form-chip">
                                                            <i className="fa-solid fa-file-lines me-1" />
                                                            {formLabel}
                                                        </span>
                                                    ) : (
                                                        <span className="proc-elem-unset">—</span>
                                                    )}
                                                </td>
                                            )}
                                            {!isUserTasks && (
                                                <td>
                                                    {elem.businessObject?.$attrs?.["s2aAgentKey"] ? (
                                                        <span className="proc-ai-chip">
                                                            <i className="fa-solid fa-robot me-1" />
                                                            {elem.businessObject.$attrs["s2aAgentKey"]}
                                                            {elem.businessObject.$attrs["s2aTaskKey"] && (
                                                                <span className="proc-ai-chip-task">
                                                                    /{elem.businessObject.$attrs["s2aTaskKey"]}
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="proc-elem-type">
                                                            {elem.type.replace("bpmn:", "")}
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            <td>

                                                {isUserTasks ? (
                                                    <div className="d-flex gap-1 min-w-50">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm proc-elem-edit-btn no-wrap"
                                                            title="Assign User/Group to perform this task"
                                                            onClick={() => openPropModal("userTasks", elem, "assignee")}>
                                                            <i className="fa-solid fa-user-pen" /> Assign
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm proc-elem-edit-btn no-wrap"
                                                            title="Configure Form"
                                                            onClick={() => openPropModal("userTasks", elem, "form")}>
                                                            <i className="fa-solid fa-file-lines" /> Configure
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex gap-1 min-w-30">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm proc-elem-edit-btn no-wrap"
                                                            title="Configure AI Agent or External Worker"
                                                            onClick={() => openPropModal(activeElemTab, elem)}>
                                                            <i className="fa-solid fa-file-lines me-1" />
                                                            Configure
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                    {/* File name + process switcher */}
                    <div className="proc-viewer-toolbar-left">
                        <span className="proc-viewer-filename">
                            <i className="fa-solid fa-file-code me-1" />
                            {selectedItem.process_file || "No file loaded"}
                        </span>
                        {bpmnProcesses.length > 1 && (
                            <select
                                className="form-select form-select-sm proc-process-select"
                                value={activeProcessId}
                                onChange={e => switchToProcess(e.target.value)}
                                title="Switch process">
                                {bpmnProcesses.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name || p.id}
                                    </option>
                                ))}
                            </select>
                        )}
                        {bpmnProcesses.length === 1 && (
                            <span className="proc-viewer-procname">
                                <i className="fa-solid fa-sitemap me-1" />
                                {bpmnProcesses[0].name || bpmnProcesses[0].id}
                            </span>
                        )}
                    </div>

                    {/* Right controls */}
                    <div className="d-flex gap-1 align-items-center flex-shrink-0">
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
                onHide={() => { }}
                backdrop="static"
                keyboard={true}
                animation={true}
                size="lg"
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header className="d-flex align-items-center justify-content-between">
                    <Modal.Title>Process Deployment</Modal.Title>
                    {statusMsg && (
                        <span className={`proc-status-msg proc-status-msg--${statusMsg.type}`}>
                            <i className={`fa-solid ${statusMsg.type === "error" ? "fa-circle-xmark" : "fa-circle-check"} me-1`} />
                            {statusMsg.text}
                        </span>
                    )}
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
                                            Primary Process <span className="text-danger">*</span>
                                            <span className="ai-tooltip ms-1" title="A BPMN file may contain multiple processes. Select which process should start when this workflow is triggered.">
                                                <i className="fa-solid fa-circle-info" />
                                            </span>
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
                                            Primary Process Def Key <span className="text-danger">*</span>
                                            <span className="ai-tooltip ms-1" title="Primary process definition key is used to start this process using API.">
                                                <i className="fa-solid fa-circle-info" />
                                            </span>
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
                                            Upload BPMN File <span className="text-danger">*</span>
                                            <span className="ai-tooltip ms-1" title="The source file containing one or more processes. Upload a new file to replace the existing one.">
                                                <i className="fa-solid fa-circle-info" />
                                            </span>
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

                                    {/* Deployment status card */}
                                    {formStatus === STATUS.update && (
                                        <div className="proc-deploy-card">
                                            <div className="proc-deploy-card-label">
                                                <i className={`fa-solid ${selectedItem.version ? "fa-circle-check proc-deploy-icon--ok" : "fa-circle-xmark proc-deploy-icon--none"} me-1`} />
                                                {selectedItem.version ? "Deployed" : "Not yet deployed"}
                                            </div>
                                            {selectedItem.version && (
                                                <div className="proc-deploy-card-meta">
                                                    <span className="proc-deploy-version">v{selectedItem.version}</span>
                                                    {selectedItem.process_id && (
                                                        <span className="proc-deploy-pid" title="Process definition ID">
                                                            {selectedItem.process_id}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Pending-deploy banner */}
                                {deployPending && formStatus === STATUS.update && (
                                    <div className="proc-deploy-pending-banner">
                                        <i className="fa-solid fa-triangle-exclamation me-2" />
                                        Changes saved — deploy to apply to the process engine
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="proc-form-footer">
                                    {/* <button
                                        className="btn button-theme btn-sm"
                                        onClick={() => handleModalClose(formStatus)}>
                                        <i className="fa-solid fa-xmark pe-1" />
                                        Close
                                    </button> */}
                                    <button
                                        className="btn button-theme btn-sm"
                                        onClick={() => saveData(selectedItem)}
                                        disabled={saveIsDisabled}>
                                        <i className="fa-solid fa-floppy-disk pe-1" />
                                        Save Draft
                                    </button>
                                    {formStatus === STATUS.update && (
                                        <button
                                            className={`btn button-theme btn-sm ${deployPending ? "proc-deploy-btn--pulse" : ""}`}
                                            onClick={() => deployProcess(selectedItem)}
                                            disabled={!deployPending || deploying}
                                            title="Deploy to process engine">
                                            {deploying
                                                ? <><i className="fa-solid fa-spinner fa-spin pe-1" />Deploying…</>
                                                : <><i className="fa-solid fa-rocket pe-1" />Deploy Process</>}
                                        </button>
                                    )}
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
                size="lg"
                style={{ zIndex: 1060 }}
                className="s2a-modal">
                <Modal.Header>
                    <Modal.Title className="h4" style={{ fontSize: "0.9rem" }}>
                        <i className="fa-solid fa-sliders me-2" />
                        Assign this {propModal?.title} task to a user or group.
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
