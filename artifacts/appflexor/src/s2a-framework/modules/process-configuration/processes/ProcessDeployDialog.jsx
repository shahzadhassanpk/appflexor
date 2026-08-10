import axios from "axios";
import BpmnNavigatedViewer from "bpmn-js/lib/NavigatedViewer";
import camundaModdle from "camunda-bpmn-moddle/resources/camunda.json";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { API_URL, BPM_API_URL, FILE_URL } from "../../../Config";
import { tryParseJSONObject } from "../../../utils/utils";
import { PropertyEditorModal } from "./PropertyEditorModal";

const DB_TABLE = "process";
const STATUS   = { none: "NONE", create: "CREATE", update: "UPDATE" };
const INITIAL_ITEM = { id: "", title: "", process_def_key: "", process_file: "", file_url: "" };
const ELEM_TABS = [
    { key: "userTasks",    label: "User Tasks",     icon: "fa-user-check" },
    { key: "serviceTasks", label: "Service Tasks",  icon: "fa-gear" },
    { key: "variables",    label: "Variables",      icon: "fa-database" },
];

/**
 * Self-contained Process Deployment dialog.
 *
 * Props:
 *   show              boolean — controls visibility
 *   initialItem       object  — record to edit; INITIAL_ITEM for new
 *   initialFormStatus string  — STATUS.create | STATUS.update
 *   onClose           ()=>void — called when dialog should close (parent sets show=false)
 *   onGetData         ()=>void — called after save / delete to refresh the list
 *   appContext         object  — app context (tenant subscription etc.)
 */
export function ProcessDeployDialog({
    show,
    initialItem,
    initialFormStatus,
    onClose,
    onGetData,
    appContext,
}) {
    /* ── Record + form state ──────────────────────────────────────────── */
    const [selectedItem,      setSelectedItem]      = useState(INITIAL_ITEM);
    const [formStatus,        setFormStatus]        = useState(STATUS.create);
    const [saveIsDisabled,    setSaveIsDisabled]    = useState(true);
    const [processes,         setProcesses]         = useState([]); // [{id,name}] from BPMN
    const [fileStatus,        setFileStatus]        = useState("");
    const [showDiscardModal,  setShowDiscardModal]  = useState(false);

    /* ── Window / viewer layout ──────────────────────────────────────── */
    const [toggleModalWindow, setToggleModalWindow] = useState("maximize");
    const [toggleBpmnViewer,  setToggleBpmnViewer]  = useState("restore");

    /* ── Deploy ──────────────────────────────────────────────────────── */
    const [deployPending, setDeployPending] = useState(false);
    const [deploying,     setDeploying]     = useState(false);

    /* ── Inline status pill ──────────────────────────────────────────── */
    const [statusMsg,      setStatusMsg]      = useState(null);
    const statusTimeoutRef                    = useRef(null);
    function setStatus(text, type = "success") {
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        setStatusMsg({ text, type });
        statusTimeoutRef.current = setTimeout(() => setStatusMsg(null), 4000);
    }

    /* ── Viewer state ────────────────────────────────────────────────── */
    const [xmlLoading,      setXmlLoading]      = useState(false);
    const [bpmnProcesses,   setBpmnProcesses]   = useState([]);
    const [activeProcessId, setActiveProcessId] = useState("");
    const [elementsMap,     setElementsMap]     = useState(
        { userTasks: [], serviceTasks: [], variables: [], startEvents: [] },
    );
    const [activeElemTab, setActiveElemTab] = useState("userTasks");
    const [xmlDirty,      setXmlDirty]      = useState(false);

    /* ── Property editor state ───────────────────────────────────────── */
    const [propModal,     setPropModal]     = useState(null);
    const [propForm,      setPropForm]      = useState({});
    const [propLoading,   setPropLoading]   = useState(false);
    const [groups,        setGroups]        = useState([]);
    const [users,         setUsers]         = useState([]);
    const [formList,      setFormList]      = useState([]);
    const [refDataLoaded, setRefDataLoaded] = useState(false);
    const [aiAgents,      setAiAgents]      = useState([]);
    const [aiAgentTasks,  setAiAgentTasks]  = useState([]);
    const [aiTasksLoading,setAiTasksLoading]= useState(false);

    /* ── Refs ────────────────────────────────────────────────────────── */
    const restoreViewerRef  = useRef(null);
    const maxViewerRef      = useRef(null);
    const viewerInstanceRef = useRef(null);
    const currentXmlRef     = useRef(null);
    const allElementsRef    = useRef([]);
    const pendingFileRef    = useRef(null);

    /* ── Computed ────────────────────────────────────────────────────── */
    const fileUrl =
        FILE_URL + "/" + DB_TABLE + "/" + selectedItem.id + "/" + selectedItem.process_file;

    /* ═══════════════════════════════════════════════════════════════════
       Initialise when the dialog opens
    ═══════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        if (!show) return;
        const item = initialItem || INITIAL_ITEM;
        setSelectedItem(item);
        setFormStatus(initialFormStatus || STATUS.create);
        setSaveIsDisabled(true);
        setXmlDirty(false);
        currentXmlRef.current  = null;
        allElementsRef.current = [];
        pendingFileRef.current = null;
        setBpmnProcesses([]);
        setActiveProcessId("");
        setElementsMap({ userTasks: [], serviceTasks: [], variables: [], startEvents: [] });
        setActiveElemTab("userTasks");
        setDeployPending(!!item.process_file);
        setToggleBpmnViewer("restore");
        setFileStatus("");
        setStatusMsg(null);
        setProcesses(
            tryParseJSONObject(
                item.processes,
                item.title ? [{ name: item.title, id: item.process_def_key }] : [],
            ),
        );
        // Load reference data (groups, users, forms) eagerly so the user-task
        // table can resolve assignee/group names without waiting for the
        // property editor modal to be opened first.
        loadRefData();
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── saveIsDisabled computed from selectedItem ─────────────────── */
    useEffect(() => {
        setSaveIsDisabled(
            !(selectedItem.title && selectedItem.process_def_key && selectedItem.process_file),
        );
    }, [selectedItem]);

    /* ── Fetch BPMN when dialog opens or fileUrl changes ───────────── */
    useEffect(() => {
        if (show && selectedItem.process_file && selectedItem.id) {
            fetchAndLoadBpmn(fileUrl);
        }
    }, [show, fileUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Auto-load AI tasks when agents are populated ───────────────── */
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

    /* ═══════════════════════════════════════════════════════════════════
       Viewer lifecycle — recreate when dialog shows / viewer mode toggles
    ═══════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        if (!show) {
            if (viewerInstanceRef.current) {
                viewerInstanceRef.current.destroy();
                viewerInstanceRef.current = null;
            }
            return;
        }
        const container =
            toggleBpmnViewer === "maximize" ? maxViewerRef.current : restoreViewerRef.current;
        if (!container) return;

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
    }, [show, toggleBpmnViewer]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ═══════════════════════════════════════════════════════════════════
       BPMN helpers
    ═══════════════════════════════════════════════════════════════════ */
    function getProcessId(bo) {
        let cur = bo;
        while (cur) {
            if (cur.$type === "bpmn:Process") return cur.id;
            cur = cur.$parent;
        }
        return null;
    }

    function parseProcessesFromXml(xml) {
        const parser = new DOMParser();
        const doc    = parser.parseFromString(xml, "application/xml");
        let elems    = Array.from(
            doc.getElementsByTagNameNS("http://www.omg.org/spec/BPMN/20100524/MODEL", "process"),
        );
        if (elems.length === 0) elems = Array.from(doc.getElementsByTagName("bpmn:process"));
        if (elems.length === 0) elems = Array.from(doc.getElementsByTagName("process"));
        return elems
            .map(p => ({
                id:   p.getAttribute("id") || "",
                name: p.getAttribute("name") || p.getAttribute("id") || "",
            }))
            .filter(p => p.id);
    }

    function extractElements(viewer, initialProcessId) {
        try {
            const registry = viewer.get("elementRegistry");
            const all      = registry.getAll().filter(e => e.type !== "label");
            allElementsRef.current = all;

            const pid      = initialProcessId || getProcessId(all[0]?.businessObject) || "";
            const filtered = pid ? all.filter(e => getProcessId(e.businessObject) === pid) : all;
            setElementsMap({
                userTasks:    filtered.filter(e => e.type === "bpmn:UserTask"),
                serviceTasks: filtered.filter(e => e.type === "bpmn:ServiceTask"),
                variables:    filtered.filter(e => e.type === "bpmn:DataObjectReference"),
                startEvents:  filtered.filter(e => e.type === "bpmn:StartEvent"),
            });
        } catch (err) {
            console.error("Element extraction error:", err);
        }
    }

    function switchToProcess(processId) {
        setActiveProcessId(processId);
        const filtered = processId
            ? allElementsRef.current.filter(e => getProcessId(e.businessObject) === processId)
            : allElementsRef.current;
        setElementsMap({
            userTasks:    filtered.filter(e => e.type === "bpmn:UserTask"),
            serviceTasks: filtered.filter(e => e.type === "bpmn:ServiceTask"),
            variables:    filtered.filter(e => e.type === "bpmn:DataObjectReference"),
            startEvents:  filtered.filter(e => e.type === "bpmn:StartEvent"),
        });
    }

    async function fetchAndLoadBpmn(url) {
        if (!url || !selectedItem.process_file) return;
        setXmlLoading(true);
        try {
            const res = await fetch(url + "?a=" + Date.now());
            if (!res.ok) throw new Error("HTTP " + res.status);
            const xml = await res.text();
            currentXmlRef.current = xml;
            setXmlDirty(false);

            const procs   = parseProcessesFromXml(xml);
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

    /* ═══════════════════════════════════════════════════════════════════
       Reference data (groups / users / forms / AI agents)
    ═══════════════════════════════════════════════════════════════════ */
    async function loadRefData() {
        if (refDataLoaded) return;
        setPropLoading(true);
        try {
            const res = await axios.post(API_URL + "?service.key=masterKey.tenantData", {
                dataKeys: [
                    { serviceParams: "", dataKey: "groups",   serviceKey: "sys.console.dir.group", mode: "formData" },
                    { serviceParams: "", dataKey: "users",    serviceKey: "sys.user.list",          mode: "formData" },
                    { serviceParams: "", dataKey: "formList", serviceKey: "sys.list.forms",         mode: "formData" },
                    { serviceParams: "", dataKey: "agents",   serviceKey: "ai.agent.list",          mode: "formData" },
                ],
            });
            if (res.data.C_STATUS === "SUCCESS") {
                const d = res.data.C_DATA;
                // Ensure group IDs are stored as strings so SearchableSelect
                // value comparison works correctly (select value is always string).
                setGroups(
                    (d.groups || []).map(g => ({ value: String(g.id), label: g.name })),
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
                        value: a.agent_key,
                        label: a.agent_name,
                        id:    a.id,
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

    async function loadAiTasksForAgent(agentKey) {
        if (!agentKey) { setAiAgentTasks([]); return; }
        const agentRec = aiAgents.find(a => a.value === agentKey);
        const agentId  = agentRec?.id;
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

    /* ═══════════════════════════════════════════════════════════════════
       Record form handlers
    ═══════════════════════════════════════════════════════════════════ */
    function handleChange(event) {
        const { name, type, value, checked } = event.target;
        setSelectedItem(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (checked ? "YES" : "NO") : value,
        }));
        setDeployPending(true);
    }

    const handleProcessSelected = proc => {
        setSelectedItem(prev => ({
            ...prev,
            title:          proc.name,
            process_def_key: proc.id,
        }));
        setDeployPending(true);
    };

    function handleDeleteFileClick(event) {
        const fileName = selectedItem.process_file;
        if (window.confirm(`You cannot undo deleting "${fileName}". Are you sure?`)) {
            setFileStatus("deleted");
            setProcesses([]);
            currentXmlRef.current  = null;
            allElementsRef.current = [];
            setBpmnProcesses([]);
            setActiveProcessId("");
            setElementsMap({ userTasks: [], serviceTasks: [], variables: [], startEvents: [] });
            setSelectedItem(prev => ({ ...prev, process_def_key: "", process_file: "" }));
            event.target.value = "";
            deleteFromServer(fileName, "");
            setDeployPending(true);
        }
    }

    const handleFileUpload = event => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;
        const fileName   = selectedFile.name;
        const fileReader = new FileReader();

        fileReader.onload = fileLoadedEvent => {
            const content     = fileLoadedEvent.target.result;
            const encodedData = content.split("base64,")[1] || "";

            const xmlText = atob(encodedData);
            const parsed  = parseProcessesFromXml(xmlText);
            setProcesses(parsed);
            setBpmnProcesses(parsed);
            const firstId = parsed[0]?.id || "";
            setActiveProcessId(firstId);
            if (parsed.length > 0) handleProcessSelected(parsed[0]);

            // Load into already-mounted viewer immediately
            currentXmlRef.current = xmlText;
            const viewer = viewerInstanceRef.current;
            if (viewer) {
                viewer
                    .importXML(xmlText)
                    .then(() => {
                        viewer.get("canvas").zoom("fit-viewport");
                        extractElements(viewer, firstId);
                    })
                    .catch(err => console.error("BPMN local import error:", err));
            }

            setDeployPending(true);

            // Always stage the file locally; saveData flushes it when Save Draft
            // is clicked.  Uploading immediately for existing records would
            // change file_url, re-trigger fetchAndLoadBpmn, and overwrite
            // currentXmlRef with the server copy — wiping any pending property
            // changes the user applied before clicking Save Draft.
            pendingFileRef.current = { fileName, encodedData };
        };

        fileReader.readAsDataURL(selectedFile);
        setSelectedItem(prev => ({ ...prev, process_file: fileName }));
    };

    /* ═══════════════════════════════════════════════════════════════════
       Server calls
    ═══════════════════════════════════════════════════════════════════ */
    async function uploadFilesToServer(fileName, encodedData, savedRecord = null) {
        const base = savedRecord || selectedItem;
        const rid  = base.id || "new";
        const request = {
            data: [{
                formId:   DB_TABLE,
                entity:   DB_TABLE,
                action:   "update",
                id:       rid,
                formData: { ...base, id: rid, process_file: fileName },
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
                    id:           recordId,
                    process_file: pf,
                    file_url:     `${FILE_URL}/${DB_TABLE}/${recordId}/${pf}`,
                }));
                setFileStatus("");
            }
        }
    }

    async function deleteFromServer(fileName, encodedData) {
        const rid = selectedItem.id || "new";
        const request = {
            data: [{
                formId:   DB_TABLE,
                entity:   DB_TABLE,
                action:   "update",
                id:       rid,
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
                    id:           recordId,
                    process_file: pf,
                    file_url:     `${FILE_URL}/${DB_TABLE}/${recordId}/${pf}`,
                }));
            }
        }
    }

    async function saveData(item) {
        const fieldsData = { ...item, processes };
        const pending    = pendingFileRef.current;

        const entry = {
            formId:   DB_TABLE,
            entity:   DB_TABLE,
            action:   "update",
            id:       fieldsData.id || "new",
            formData: {
                ...fieldsData,
                id: fieldsData.id || "new",
                ...(pending ? { process_file: pending.fileName } : {}),
            },
        };
        if (pending) {
            entry.fileData = [{ fileName: pending.fileName, content: pending.encodedData }];
        }

        try {
            const response = await axios.post(
                API_URL + "?service.key=update.formData",
                { data: [entry] },
            );
            if (response.status === 200) {
                const saved = response.data?.C_DATA?.[0]?.formData || fieldsData;
                if (pending) {
                    pendingFileRef.current = null;
                    saved.file_url = `${FILE_URL}/${DB_TABLE}/${saved.id}/${saved.process_file}`;
                }
                setSelectedItem(prev => ({ ...prev, ...saved }));
                setFormStatus(STATUS.update);
                setDeployPending(true);
                setXmlDirty(false);
                onGetData();
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

    const deployProcess = async proc => {
        const process_engine = appContext?.tenantSubscription?.process_engine;
        const request = {
            id:                proc.id,
            entity:            DB_TABLE,
            fileName:          proc.process_file,
            mainProcessDefKey: proc.process_def_key,
            process_engine,
        };
        setDeploying(true);
        try {
            const res = await axios.post(`${BPM_API_URL}?service.key=deploy.process`, request);
            if (res.data.C_STATUS === "SUCCESS") {
                const data = res.data.C_DATA;
                await saveData({
                    ...proc,
                    version:    data.version,
                    process_id: data.process_id,
                    deployment: data.deployment,
                });
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

    /* ═══════════════════════════════════════════════════════════════════
       Property editor — inputParameter helpers
    ═══════════════════════════════════════════════════════════════════ */

    /** Read all camunda:inputParameter elements as a plain {name→value} map. */
    function getInputParamMap(bo) {
        const ext = bo?.extensionElements;
        if (!ext) return {};
        const io = (ext.values || []).find(v => v.$type === "camunda:InputOutput");
        if (!io) return {};
        return Object.fromEntries((io.inputParameters || []).map(p => [p.name, p.value ?? ""]));
    }

    /**
     * Replace the camunda:InputOutput block on bo with new inputParameters
     * built from paramsObj {name: value}.  Entries with undefined/null value
     * are skipped so callers can use spread to omit optional keys cleanly.
     */
    function setInputParams(bo, paramsObj) {
        const moddle = viewerInstanceRef.current?.get("moddle");
        if (!moddle) return;

        const inputParameters = Object.entries(paramsObj)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([name, value]) =>
                moddle.create("camunda:InputParameter", { name, value: String(value) }),
            );

        const io = moddle.create("camunda:InputOutput", { inputParameters });

        if (!bo.extensionElements) {
            bo.extensionElements = moddle.create("bpmn:ExtensionElements", { values: [io] });
        } else {
            bo.extensionElements.values = [
                ...(bo.extensionElements.values || []).filter(v => v.$type !== "camunda:InputOutput"),
                io,
            ];
        }

        // Clean up legacy $attrs written by the old approach
        const legacyKeys = ["s2aAgentKey","s2aTaskKey","s2aPayload","s2aParams",
                            "s2aAppServiceKey","s2aAppServiceConfig"];
        if (bo.$attrs) legacyKeys.forEach(k => delete bo.$attrs[k]);
    }

    /* ═══════════════════════════════════════════════════════════════════
       Property editor
    ═══════════════════════════════════════════════════════════════════ */
    function openPropModal(type, element, subType) {
        const bo    = element.businessObject;
        const attrs = bo.$attrs || {};
        let init    = {};

        if (type === "userTasks" && subType === "assignee") {
            // After camunda-bpmn-moddle re-import, values land on bo directly
            const grp = String(bo.candidateGroups || attrs["camunda:candidateGroups"] || attrs["activiti:candidateGroups"] || "");
            const usr = String(bo.assignee        || attrs["camunda:assignee"]        || attrs["activiti:assignee"]        || "");
            const val = grp !== "" ? grp : usr;
            const isExpr = /^\$\{|^#\{/.test(val);
            init = { assigneeType: isExpr ? "expression" : (grp !== "" ? "group" : "user"), assignee: val };

        } else if ((type === "userTasks" || type === "startEvent") && subType === "form") {
            const fk = bo.formKey || attrs["camunda:formKey"] || attrs["activiti:formKey"] || "";
            init = { formKey: fk, formType: /^\$\{|^#\{/.test(fk) ? "expression" : "key" };

        } else if (type === "serviceTasks") {
            // Read from camunda:inputParameter elements.
            // New format: all config stored in "appflexor.worker.meta" JSON param.
            // Legacy formats: s2aAgentKey / s2aAppServiceKey / kafka.topic kept for backward compat.
            const ip    = getInputParamMap(bo);
            const topic = bo.topic || attrs["camunda:topic"] || "";

            // Parse appflexor.worker.meta (new format)
            let meta = {};
            try { if (ip["appflexor.worker.meta"]) meta = JSON.parse(ip["appflexor.worker.meta"]); }
            catch (_) { /* keep empty */ }

            const workerTitle       = meta.title       || "";
            const workerDescription = meta.description || "";

            if (topic === "appflexor.ai.agent") {
                // New AI Agent format
                const agentKey = meta.agentKey || "";
                const taskKey  = meta.taskKey  || "";
                const reserved = new Set(["appflexor.worker.meta"]);
                const params = Object.entries(ip)
                    .filter(([k]) => !reserved.has(k))
                    .map(([key, value]) => ({ key, value }));
                init = { serviceType: "ai", workerTitle, workerDescription, agentKey, taskKey, params };

            } else if (topic === "appflexor.app.service") {
                // New App Service format
                const appServiceKey = meta.service || "get.formData";
                const appConfig     = meta.serviceConfig || {};
                const reserved = new Set(["appflexor.worker.meta"]);
                const params = Object.entries(ip)
                    .filter(([k]) => !reserved.has(k))
                    .map(([key, value]) => ({ key, value }));
                init = { serviceType: "app", workerTitle, workerDescription, appServiceKey, appConfig, params };

            } else if (topic === "appflexor.connector" && ip["appflexor.worker.meta"]) {
                // New Connector format (meta present)
                const workerTopic = meta["connector.topic"] || "";
                const reserved = new Set(["appflexor.worker.meta"]);
                const params = Object.entries(ip)
                    .filter(([k]) => !reserved.has(k))
                    .map(([key, value]) => ({ key, value }));
                init = { serviceType: "external", workerTitle, workerDescription, workerTopic, params };

            } else if (ip["s2aAgentKey"] || attrs["s2aAgentKey"]) {
                // Legacy AI Agent (topic: ai.agent.task)
                const agentKey = ip["s2aAgentKey"] || attrs["s2aAgentKey"] || "";
                const taskKey  = ip["s2aTaskKey"]  || attrs["s2aTaskKey"]  || "";
                const metaKeys = new Set(["s2aAgentKey", "s2aTaskKey"]);
                let params = Object.entries(ip)
                    .filter(([k]) => !metaKeys.has(k))
                    .map(([key, value]) => ({ key, value }));
                if (params.length === 0 && attrs["s2aPayload"]) {
                    try {
                        params = Object.entries(JSON.parse(attrs["s2aPayload"]))
                            .map(([k, v]) => ({ key: k, value: v }));
                    } catch (_) { /* keep empty */ }
                }
                init = { serviceType: "ai", workerTitle: "", workerDescription: "", agentKey, taskKey, params };

            } else if (ip["s2aAppServiceKey"] || attrs["s2aAppServiceKey"]) {
                // Legacy App Service (topic: app.service.api)
                const appServiceKey = ip["s2aAppServiceKey"] || attrs["s2aAppServiceKey"] || "get.formData";
                let appConfig = {};
                const rawCfg = ip["s2aAppServiceConfig"] || attrs["s2aAppServiceConfig"] || "";
                try { if (rawCfg) appConfig = JSON.parse(rawCfg); } catch (_) { /* keep empty */ }
                init = { serviceType: "app", workerTitle: "", workerDescription: "", appServiceKey, appConfig, params: [] };

            } else {
                // AppFlexor Connector — legacy: kafka.topic param
                const workerTopic = ip["kafka.topic"] ||
                    (topic === "appflexor.connector" || topic === "kafka.connector" ? "" : topic);
                const reserved = new Set(["kafka.topic"]);
                let params = Object.entries(ip)
                    .filter(([k]) => !reserved.has(k))
                    .map(([key, value]) => ({ key, value }));
                if (params.length === 0 && attrs["s2aParams"]) {
                    try {
                        params = Object.entries(JSON.parse(attrs["s2aParams"]))
                            .filter(([k]) => k !== "kafka.topic" && k !== "worker.topic")
                            .map(([key, value]) => ({ key, value }));
                    } catch (_) { /* keep empty */ }
                }
                init = { serviceType: "external", workerTitle: "", workerDescription: "", workerTopic, params };
            }

        } else if (type === "variables") {
            init = { name: bo.name || "" };
        }

        setPropForm(init);
        setPropModal({ type, subType, element, title: bo.name || element.id });
        loadRefData();
    }

    async function savePropChanges() {
        const { type, subType, element } = propModal;
        const bo = element.businessObject;
        if (!bo.$attrs) bo.$attrs = {};

        if (type === "userTasks" && subType === "assignee") {
            if (propForm.assigneeType === "group") {
                bo.candidateGroups = propForm.assignee;
                bo.assignee = undefined;
            } else {
                bo.assignee = propForm.assignee;
                bo.candidateGroups = undefined;
            }
            // Clean up any legacy $attrs duplicates
            delete bo.$attrs["camunda:candidateGroups"];
            delete bo.$attrs["activiti:candidateGroups"];
            delete bo.$attrs["camunda:assignee"];
            delete bo.$attrs["activiti:assignee"];

        } else if ((type === "userTasks" || type === "startEvent") && subType === "form") {
            bo.formKey = propForm.formKey;
            // Clean up any legacy $attrs duplicates
            delete bo.$attrs["camunda:formKey"];
            delete bo.$attrs["activiti:formKey"];

        } else if (type === "serviceTasks") {
            bo.type = "external";

            // Auto-generate title from current form state (mirrors computeAutoTitle in PropertyEditorModal)
            function computeAutoTitle() {
                const svcKey = propForm.appServiceKey || "get.formData";
                const cfg    = propForm.appConfig    || {};
                if (propForm.serviceType === "ai") {
                    const agentLabel = aiAgents.find(a => a.value === propForm.agentKey)?.label || propForm.agentKey || "";
                    const taskLabel  = aiAgentTasks.find(t => t.value === propForm.taskKey)?.label || propForm.taskKey || "";
                    if (agentLabel && taskLabel) return `AI Agent (${agentLabel}: ${taskLabel})`;
                    if (agentLabel)              return `AI Agent (${agentLabel})`;
                    return "AI Agent";
                }
                if (propForm.serviceType === "app") {
                    const svcName = svcKey === "get.formData"    ? "Fetch/Read"
                                  : svcKey === "update.formData" ? "Create/Update/Delete"
                                  : "Send Email";
                    const detail  = svcKey === "get.formData"    ? (cfg.serviceKey || "")
                                  : svcKey === "update.formData" ? (cfg.formId     || "")
                                  : (cfg.emailKey || "");
                    return detail ? `App Service (${svcName}: ${detail})` : `App Service (${svcName})`;
                }
                // AppFlexor Connector
                const topic = propForm.workerTopic || "";
                return topic ? `AppFlexor Connector (${topic})` : "AppFlexor Connector";
            }

            // Build appflexor.worker.meta with auto-title + description + type-specific config
            const meta = {};
            const autoTitle = computeAutoTitle();
            if (autoTitle)                  meta.title       = autoTitle;
            if (propForm.workerDescription) meta.description = propForm.workerDescription;

            // User-defined input parameters (Add Parameter rows)
            const extraParams = Object.fromEntries(
                (propForm.params || [])
                    .filter(p => p.key.trim())
                    .map(p => [p.key.trim(), p.value]),
            );

            if (propForm.serviceType === "ai") {
                bo.topic = "appflexor.ai.agent";
                if (propForm.agentKey) meta.agentKey = propForm.agentKey;
                if (propForm.taskKey)  meta.taskKey  = propForm.taskKey;
                setInputParams(bo, {
                    "appflexor.worker.meta": JSON.stringify(meta),
                    ...extraParams,
                });

            } else if (propForm.serviceType === "app") {
                bo.topic = "appflexor.app.service";
                meta.service       = propForm.appServiceKey || "get.formData";
                meta.serviceConfig = propForm.appConfig || {};
                setInputParams(bo, {
                    "appflexor.worker.meta": JSON.stringify(meta),
                    ...extraParams,
                });

            } else {
                bo.topic = "appflexor.connector";
                if (propForm.workerTopic) meta["connector.topic"] = propForm.workerTopic;
                setInputParams(bo, {
                    "appflexor.worker.meta": JSON.stringify(meta),
                    ...extraParams,
                });
            }

        } else if (type === "variables") {
            bo.name = propForm.name;
        }

        // Serialize XML and stage for deferred upload — flushed when Save Draft is clicked
        try {
            const { xml } = await viewerInstanceRef.current.saveXML({ format: true });
            currentXmlRef.current = xml;
            setXmlDirty(true);
            setDeployPending(true);

            const xmlBytes = new TextEncoder().encode(xml);
            let binary = "";
            xmlBytes.forEach(b => { binary += String.fromCharCode(b); });
            const encodedXml = btoa(binary);

            // Merge into pendingFileRef so saveData always has one place to look
            if (pendingFileRef.current) {
                // New record: update the encoded content but keep the fileName
                pendingFileRef.current = { ...pendingFileRef.current, encodedData: encodedXml };
            } else {
                // Existing record: stage the updated XML for upload on next save
                pendingFileRef.current = { fileName: selectedItem.process_file, encodedData: encodedXml };
            }

            setStatus("Properties updated — click Save Draft to persist", "info");
            setPropModal(null);
        } catch (err) {
            console.error("saveXML error:", err);
            setStatus("Failed to apply properties", "error");
        }
    }

    /* ═══════════════════════════════════════════════════════════════════
       Close / discard
    ═══════════════════════════════════════════════════════════════════ */
    function handleCloseClick() {
        if (formStatus === STATUS.create && selectedItem.id !== "") {
            setShowDiscardModal(true);
        } else {
            onClose();
        }
    }

    async function handleDiscardConfirm() {
        try {
            const response = await axios.post(API_URL + "?service.key=update.formData", {
                data: [{ id: selectedItem.id, formId: DB_TABLE, entity: DB_TABLE, action: "delete" }],
            });
            if (response.data.C_STATUS === "SUCCESS") {
                onGetData();
                setShowDiscardModal(false);
                onClose();
            }
        } catch (err) {
            console.error("Discard error:", err);
        }
    }

    /* ═══════════════════════════════════════════════════════════════════
       Element-tab chip helpers
    ═══════════════════════════════════════════════════════════════════ */
    function resolveAssigneeLabel(elem) {
        const bo    = elem.businessObject || {};
        const attrs = bo.$attrs || {};
        // Convert to string to handle numeric IDs returned by the API
        const grp = String(bo.candidateGroups || attrs["camunda:candidateGroups"] || attrs["activiti:candidateGroups"] || "");
        const usr = String(bo.assignee        || attrs["camunda:assignee"]        || attrs["activiti:assignee"]        || "");
        if (grp) {
            const found = groups.find(g => String(g.value) === grp);
            return { label: found ? found.label : grp, type: "group" };
        }
        if (usr) {
            const found = users.find(u => u.value === usr);
            return { label: found ? found.label : usr, type: "user" };
        }
        return null;
    }

    function resolveFormLabel(elem) {
        const bo    = elem.businessObject || {};
        const attrs = bo.$attrs || {};
        const key   = bo.formKey || attrs["camunda:formKey"] || attrs["activiti:formKey"];
        if (!key) return null;
        const found = formList.find(f => f.value === key);
        return found ? found.label : key;
    }

    function elemDisplayName(elem) {
        const name = elem.businessObject?.name;
        return name && name.trim() ? name : elem.id;
    }

    function elemBadge(elem) {
        if (elem.type === "bpmn:Lane") return <span className="proc-type-badge badge-lane">Lane</span>;
        return null;
    }

    /* ═══════════════════════════════════════════════════════════════════
       Render helpers
    ═══════════════════════════════════════════════════════════════════ */
    function renderViewerPanel(mode) {
        const isMax        = mode === "maximize";
        const containerRef = isMax ? maxViewerRef : restoreViewerRef;

        return (
            <div className={`proc-viewer-wrap${isMax ? " proc-viewer-wrap--max" : ""}`}>
                <div className="proc-viewer-toolbar">
                    <div className="proc-viewer-toolbar-left">
                        <span className="proc-viewer-filename">
                            <i className="fa-solid fa-file-code me-1" />
                            {selectedItem.process_file || "No file loaded"}
                        </span>
                        {bpmnProcesses.length === 1 && (
                            <span className="proc-viewer-procname">
                                <i className="fa-solid fa-sitemap me-1" />
                                {bpmnProcesses[0].name || bpmnProcesses[0].id}
                            </span>
                        )}
                    </div>
                    <div className="d-flex gap-1 align-items-center flex-shrink-0">
                        {xmlLoading && (
                            <span className="proc-viewer-loading">
                                <i className="fa-solid fa-spinner fa-spin me-1" />Loading…
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
                <div
                    className={`proc-viewer-canvas${isMax ? " proc-viewer-canvas--max" : ""}`}
                    ref={containerRef}
                />
            </div>
        );
    }

    function renderElemTabs() {
        const currentElems = elementsMap[activeElemTab] || [];
        const isUserTasks  = activeElemTab === "userTasks";

        return (
            <div className="proc-elem-panel">
                <div className="proc-elem-nav d-flex">
                    {ELEM_TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`proc-elem-tab${activeElemTab === tab.key ? " active" : ""}`}
                            onClick={() => setActiveElemTab(tab.key)}>
                            <i className={`fa-solid ${tab.icon} me-1`} />
                            {tab.label}
                            <span className="proc-elem-count ms-1">
                                {(elementsMap[tab.key] || []).length}
                            </span>
                        </button>
                    ))}
                    {bpmnProcesses.length > 1 && (
                        <select
                            className="proc-process-select ms-auto"
                            value={activeProcessId}
                            onChange={e => switchToProcess(e.target.value)}
                            title="Switch process">
                            {bpmnProcesses.map(p => (
                                <option key={p.id} value={p.id}>{p.name || p.id}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="proc-elem-body">
                    {currentElems.length === 0 ? (
                        <div className="proc-elem-empty">
                            {xmlLoading
                                ? <><i className="fa-solid fa-spinner fa-spin me-1" /> Loading diagram…</>
                                : isUserTasks
                                    ? <>No user tasks found in this diagram.</>
                                    : <>No {ELEM_TABS.find(t => t.key === activeElemTab)?.label.toLowerCase()} found.</>}
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
                                    const assignee  = isUserTasks ? resolveAssigneeLabel(elem) : null;
                                    const formLabel = isUserTasks ? resolveFormLabel(elem)     : null;
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
                                                    {(() => {
                                                        const bo2   = elem.businessObject;
                                                        const topic = bo2?.topic || bo2?.$attrs?.["camunda:topic"] || "";
                                                        const ip    = getInputParamMap(bo2);

                                                        // Parse appflexor.worker.meta (new format)
                                                        let meta = {};
                                                        try { if (ip["appflexor.worker.meta"]) meta = JSON.parse(ip["appflexor.worker.meta"]); }
                                                        catch (_) { /* keep empty */ }
                                                        const metaTitle = meta.title || "";

                                                        // AI Agent — new & legacy topics
                                                        if (topic === "appflexor.ai.agent" || topic === "ai.agent.task") {
                                                            const agentKey = meta.agentKey || ip["s2aAgentKey"] || bo2?.$attrs?.["s2aAgentKey"] || "";
                                                            const taskKey  = meta.taskKey  || ip["s2aTaskKey"]  || bo2?.$attrs?.["s2aTaskKey"]  || "";
                                                            return agentKey ? (
                                                                <span className="proc-ai-chip">
                                                                    <i className="fa-solid fa-robot me-1" />
                                                                    {metaTitle || agentKey}
                                                                    {taskKey && <span className="proc-ai-chip-task">/{taskKey}</span>}
                                                                </span>
                                                            ) : <span className="proc-elem-type">AI Agent</span>;
                                                        }
                                                        // App Service — new & legacy topics
                                                        if (topic === "appflexor.app.service" || topic === "app.service.api") {
                                                            const svcKey = meta.service || ip["s2aAppServiceKey"] || bo2?.$attrs?.["s2aAppServiceKey"] || "";
                                                            return (
                                                                <span className="proc-app-svc-chip">
                                                                    <i className="fa-solid fa-server me-1" />
                                                                    {metaTitle || svcKey || topic}
                                                                </span>
                                                            );
                                                        }
                                                        // AppFlexor Connector — new & legacy
                                                        if (topic === "appflexor.connector" || topic === "kafka.connector") {
                                                            const connTopic = meta["connector.topic"] || ip["kafka.topic"] || "";
                                                            return (
                                                                <span className="proc-kafka-chip">
                                                                    <i className="fa-solid fa-plug me-1" />
                                                                    {metaTitle || connTopic || "appflexor.connector"}
                                                                </span>
                                                            );
                                                        }
                                                        return <span className="proc-elem-type">{elem.type.replace("bpmn:", "")}</span>;
                                                    })()}
                                                </td>
                                            )}
                                            <td>
                                                {isUserTasks ? (
                                                    <div className="d-flex gap-1 min-w-50">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm proc-elem-edit-btn no-wrap"
                                                            title="Assign User/Group"
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
                                                            title="Configure"
                                                            onClick={() => openPropModal(activeElemTab, elem)}>
                                                            <i className="fa-solid fa-file-lines me-1" />Configure
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

    /* ═══════════════════════════════════════════════════════════════════
       Render
    ═══════════════════════════════════════════════════════════════════ */
    return (
        <>
            {/* ── Main deploy modal ── */}
            <Modal
                show={show}
                onHide={() => {}}
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
                            <div className="pointer" title="Maximize window"
                                onClick={() => setToggleModalWindow("maximize")}>
                                <i className="fa-regular fa-window-maximize fs-5" />
                            </div>
                        )}
                        {toggleModalWindow !== "restore" && (
                            <div className="pointer" title="Restore window"
                                onClick={() => setToggleModalWindow("restore")}>
                                <i className="fa-regular fa-window-restore fs-5" />
                            </div>
                        )}
                        <div className="pointer" onClick={handleCloseClick}>
                            <i className="fa-solid fa-xmark fs-5" />
                        </div>
                    </div>
                </Modal.Header>

                <Modal.Body className="p-0">
                    {toggleBpmnViewer === "restore" ? (
                        /* Restore layout */
                        <div className="proc-modal-restore-layout">
                            {/* Left — metadata form */}
                            <div className="proc-form-col">
                                <div className="proc-form-inner">
                                    {/* Primary process selector */}
                                    <div className="mb-3">
                                        <label className="fw-bold form-label">
                                            Primary Process <span className="text-danger">*</span>
                                            <span className="ai-tooltip ms-1" title="Select which process starts when this workflow is triggered.">
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
                                            <span className="ai-tooltip ms-1" title="Used to start this process via API.">
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
                                            <span className="ai-tooltip ms-1" title="Upload a new file to replace the existing one.">
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
                        /* Maximize layout — diagram only */
                        <div className="proc-modal-max-layout">
                            {renderViewerPanel("maximize")}
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* ── Property editor modal ── */}
            <PropertyEditorModal
                propModal={propModal}
                propForm={propForm}
                propLoading={propLoading}
                refDataLoaded={refDataLoaded}
                groups={groups}
                users={users}
                formList={formList}
                aiAgents={aiAgents}
                aiAgentTasks={aiAgentTasks}
                aiTasksLoading={aiTasksLoading}
                onClose={() => setPropModal(null)}
                onFormChange={setPropForm}
                onSave={savePropChanges}
                onAgentChange={loadAiTasksForAgent}
            />

            {/* ── Discard confirm ── */}
            <Modal
                show={showDiscardModal}
                onHide={() => setShowDiscardModal(false)}
                backdrop="static"
                className="s2a-modal"
                size="md"
                style={{ zIndex: 1070 }}>
                <Modal.Header>
                    <Modal.Title className="modal-title">Confirm Discard</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    There are unsaved changes. Are you sure you want to discard them?
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn button-theme btn-sm m-0 me-2"
                        onClick={() => setShowDiscardModal(false)}>
                        <i className="fa-solid fa-xmark pe-1" />No
                    </button>
                    <button className="btn button-theme btn-sm me-2 m-0"
                        onClick={handleDiscardConfirm}>
                        <i className="fa-solid fa-floppy-disk pe-1" />Yes
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
