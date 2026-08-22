import axios from "axios";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../AppContext";
import { API_URL } from "../../../Config";
import { formatDateTimeForUserView } from "../../../utils/utils";
import StartStepProcessor from "./StartStepProcessor7";
import StepProcessor from "./StepProcessor7";
import { CommentBox } from "../CommentBox/CommentBox";
import { actions } from "../constants";
import { filterArrayByTerms, tryParseJSONObject } from "../../../utils/utils";
import { eventBus } from "../../../eventBus";
import "../inbox-style.css";
import { Interweave } from "interweave";
import { BPM_API_URL } from "../CamundaConfig";

function RenderListView({
    processList,
    data,
    syncTaskList,
    taskFilterType,
    setTaskFilterType,
    notification,
    taskList,
    allTasksCount,
    currentProcessState,
    setCurrentProcessState,
    userDetails,
    setSelectedProcessId,
    setRenderProcessModal,
    filteredTaskList,
    setFilteredTaskList,
    selectedTask,
    setSelectedTask,
    getProfileImage,
    getDisplayName,
    showComments,
    setShowComments,
    userList,
    taskInitState,
    selectedProcessId,
    getTimeAgo,
    dynamicFields,
}) {
    const appContext = useContext(AppContext);
    const safeCurrentProcessState = currentProcessState || {
        initial: true,
        start: false,
        step: false,
        loading: false,
    };
    const safeSelectedTask = selectedTask || taskInitState || {};
    const selectedTaskId = safeSelectedTask?.id || "";
    const safeTaskList = Array.isArray(taskList) ? taskList : [];
    const safeProcessList = Array.isArray(processList) ? processList : [];
    const [expandedProcessDescriptionId, setExpandedProcessDescriptionId] = useState("");
    const [processCatalogSearch, setProcessCatalogSearch] = useState("");
    const [processCatalogPage, setProcessCatalogPage] = useState(1);
    const PROCESS_CATALOG_PAGE_SIZE = 5;
    const keysToSearch = [
        "variables",
        "task_def_key",
        "json_data",
        "name",
        "assignee",
        "proc_def_key",
        "created",
        "process_name",
        "task_name",
        "process_version",
        "datecreated",
    ];

    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const parsedOptions =
        dynamicFields?.length > 0
            ? tryParseJSONObject(dynamicFields[0].options, [])
            : [];

    // ── Inbox UI state ────────────────────────────────
    const [filters, setFilters] = useState({ priority: "all", dueDate: "all" });
    const [activeFilterDropdown, setActiveFilterDropdown] = useState(null); // "priority" | "dueDate" | null
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 15;
    const filterRef = useRef(null);
    const [pendingDrafts, setPendingDrafts] = useState([]);
    const [pendingDraftsLoading, setPendingDraftsLoading] = useState(false);
    const [pendingDraftsError, setPendingDraftsError] = useState("");
    const [pendingDraftsView, setPendingDraftsView] = useState(false);
    const [selectedPendingDraft, setSelectedPendingDraft] = useState(null);
    const [draftSearch, setDraftSearch] = useState("");
    const [draftActions, setDraftActions] = useState({});
    const draftRetryLocks = useRef(new Set());
    const pendingDraftsInitializedRef = useRef(false);

    const getDraftVariables = useCallback(draft => {
        const value = draft?.process_variables;
        if (!value) return {};
        if (typeof value === "object") return value;
        const parsed = tryParseJSONObject(value, {});
        return parsed && typeof parsed === "object" ? parsed : {};
    }, []);

    const normalizeDraft = useCallback(draft => ({
        ...draft,
        process_variables:
            typeof draft?.process_variables === "string"
                ? draft.process_variables
                : JSON.stringify(draft?.process_variables || {}),
        retry_count: Number(draft?.retry_count || 0),
    }), []);

    const loadPendingDrafts = useCallback(async () => {
        setPendingDraftsLoading(true);
        setPendingDraftsError("");
        try {
            const response = await axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                {
                    dataKeys: [
                        {
                            serviceParams: "",
                            dataKey: "pendingDrafts",
                            serviceKey: "bpm.list.pending.draft",
                            mode: "formData",
                        },
                    ],
                },
            );
            const status = response?.data?.C_STATUS || response?.data?.status;
            if (status !== "SUCCESS") {
                throw new Error(
                    response?.data?.C_MESSAGE ||
                    response?.data?.message ||
                    "Unable to load pending drafts.",
                );
            }

            const responseData = response?.data?.C_DATA || response?.data?.data || {};
            const drafts =
                responseData.pendingDrafts ||
                responseData.drafts ||
                responseData.pending_drafts ||
                [];
            const normalizedDrafts = Array.isArray(drafts)
                ? drafts.map(normalizeDraft)
                : [];
            setPendingDrafts(normalizedDrafts);
            if (!pendingDraftsInitializedRef.current) {
                setPendingDraftsView(normalizedDrafts.length > 0);
                pendingDraftsInitializedRef.current = true;
            }
        } catch (error) {
            console.error(error);
            setPendingDraftsError(
                error?.response?.data?.C_MESSAGE ||
                error?.response?.data?.message ||
                error?.message ||
                "Unable to load pending drafts.",
            );
        } finally {
            setPendingDraftsLoading(false);
        }
    }, [normalizeDraft]);

    const draftFormData = useCallback((draft, changes = {}) => {
        const nextDraft = { ...draft, ...changes };
        const fields = {
            id: nextDraft.id,
            process_definition_id: nextDraft.process_definition_id,
            process_key: nextDraft.process_key,
            form_key: nextDraft.form_key,
            form_table: nextDraft.form_table,
            form_record_id: nextDraft.form_record_id,
            business_key: nextDraft.business_key,
            process_variables:
                typeof nextDraft.process_variables === "string"
                    ? nextDraft.process_variables
                    : JSON.stringify(nextDraft.process_variables || {}),
            status: nextDraft.status,
            last_error: nextDraft.last_error || "",
            retry_count: Number(nextDraft.retry_count || 0),
            requester: nextDraft.requester || appContext?.profile?.username || "",
        };
        return Object.fromEntries(
            Object.entries(fields).filter(([, value]) => value !== undefined),
        );
    }, [appContext?.profile?.username]);

    const updateDraft = useCallback(async (draft, changes = {}) => {
        if (!draft?.id) {
            throw new Error("Pending draft is missing its id.");
        }

        const request = {
            data: [
                {
                    formId: "process_start_draft",
                    entity: "process_start_draft",
                    action: "update",
                    fileData: [],
                    id: draft.id,
                    formData: draftFormData(draft, changes),
                },
            ],
        };
        const response = await axios.post(
            API_URL + "?service.key=update.formData",
            request,
        );
        const status = response?.data?.C_STATUS || response?.data?.status;
        if (status !== "SUCCESS") {
            throw new Error(
                response?.data?.C_MESSAGE ||
                response?.data?.message ||
                "Unable to update pending draft.",
            );
        }
        return response;
    }, [draftFormData]);

    const processInstanceExists = useCallback(async draft => {
        if (!draft?.business_key || !draft?.process_key) {
            throw new Error(
                "Pending draft is missing the business key or process key needed to retry safely.",
            );
        }

        const query = new URLSearchParams({
            businessKey: draft.business_key,
            processDefinitionKey: draft.process_key,
            active: "true",
        });
        const tenantId = appContext?.tenantSubscription?.tenant_id;
        if (tenantId) {
            query.set("tenantIdIn", tenantId);
        } else {
            query.set("withoutTenantId", "true");
        }

        async function findInstances(path) {
            const response = await axios.post(
                BPM_API_URL + "?service.key=bpm.data",
                {
                    path,
                    method: "GET",
                },
            );
            const status = response?.data?.C_STATUS || response?.data?.status;
            if (status && status !== "SUCCESS") {
                throw new Error(
                    response?.data?.C_MESSAGE ||
                    response?.data?.message ||
                    "Unable to confirm whether this process was already started.",
                );
            }
            const payload = response?.data || {};
            const instances = [
                payload?.C_DATA?.processInstances,
                payload?.C_DATA,
                payload?.data?.processInstances,
                payload?.data,
                payload,
            ].find(Array.isArray);
            return Array.isArray(instances) ? instances : [];
        }

        const activeInstances = await findInstances(
            `/process-instance?${query.toString()}`,
        );
        if (activeInstances.length > 0) return true;

        const historicQuery = new URLSearchParams({
            processDefinitionKey: draft.process_key,
            processInstanceBusinessKey: draft.business_key,
        });
        if (tenantId) {
            historicQuery.set("tenantIdIn", tenantId);
        } else {
            historicQuery.set("processDefinitionWithoutTenantId", "true");
        }
        const historicInstances = await findInstances(
            `/history/process-instance?${historicQuery.toString()}`,
        );
        return historicInstances.length > 0;
    }, [appContext?.tenantSubscription?.tenant_id]);

    const setDraftActionState = useCallback((draftId, state) => {
        setDraftActions(previous => ({
            ...previous,
            [draftId]: { ...(previous[draftId] || {}), ...state },
        }));
    }, []);

    const reconcileStartedDraft = useCallback(async draft => {
        const draftId = draft?.id;
        if (!draftId || draftActions[draftId]?.loading) return;

        setDraftActionState(draftId, { loading: true, error: "" });
        try {
            await updateDraft(draft, {
                status: "STARTED",
                last_error: "",
            });
            setPendingDrafts(previous =>
                previous.filter(item => item.id !== draftId),
            );
            if (selectedPendingDraft?.id === draftId) {
                setSelectedPendingDraft(null);
                setSelectedProcessId("");
                setCurrentProcessState({
                    initial: true,
                    start: false,
                    step: false,
                    loading: false,
                });
            }
            setDraftActionState(draftId, {
                loading: false,
                error: "",
                reconcileStarted: false,
            });
            syncTaskList();
            loadPendingDrafts();
        } catch (error) {
            setDraftActionState(draftId, {
                loading: false,
                reconcileStarted: true,
                error: "The process already started. Save its completion status before leaving the Inbox.",
            });
        }
    }, [
        draftActions,
        loadPendingDrafts,
        selectedPendingDraft?.id,
        setCurrentProcessState,
        setDraftActionState,
        setSelectedProcessId,
        syncTaskList,
        updateDraft,
    ]);

    const retryPendingDraft = useCallback(async draft => {
        const draftId = draft?.id;
        if (
            !draftId ||
            draftActions[draftId]?.loading ||
            draftRetryLocks.current.has(draftId)
        ) {
            return;
        }

        draftRetryLocks.current.add(draftId);
        setDraftActionState(draftId, { loading: true, error: "" });
        const retryCount = Number(draft.retry_count || 0);
        const variables = { ...getDraftVariables(draft) };
        const username = appContext?.profile?.username;
        if (!variables.requestor && username) {
            variables.requestor = { value: username, type: "string" };
        }
        let engineStarted = false;

        const finishSuccessfulStart = async () => {
            await updateDraft(draft, {
                status: "STARTED",
                last_error: "",
                process_variables: JSON.stringify(variables),
            });
            setPendingDrafts(previous =>
                previous.filter(item => item.id !== draftId),
            );
            if (selectedPendingDraft?.id === draftId) {
                setSelectedPendingDraft(null);
                setSelectedProcessId("");
                setCurrentProcessState({
                    initial: true,
                    start: false,
                    step: false,
                    loading: false,
                });
            }
            setDraftActionState(draftId, { loading: false, error: "" });
            syncTaskList();
            loadPendingDrafts();
        };

        try {
            await updateDraft(draft, {
                status: "STARTING",
                last_error: "",
                process_variables: JSON.stringify(variables),
            });

            const tenantId = appContext?.tenantSubscription?.tenant_id;
            const processKey = draft.process_key;
            if (!processKey) {
                throw new Error("Pending draft is missing its process key.");
            }
            if (await processInstanceExists(draft)) {
                engineStarted = true;
                await finishSuccessfulStart();
                return;
            }
            const path = tenantId
                ? `/process-definition/key/${processKey}/tenant-id/${tenantId}/start`
                : `/process-definition/key/${processKey}/start`;
            const response = await axios.post(
                BPM_API_URL + "?service.key=bpm.data",
                {
                    path,
                    method: "POST",
                    data: {
                        businessKey: draft.business_key,
                        variables,
                    },
                },
            );
            const status = response?.data?.C_STATUS || response?.data?.status;
            const message =
                response?.data?.C_MESSAGE ||
                response?.data?.message ||
                "Failed to start the process.";

            if (status === "SUCCESS") {
                engineStarted = true;
                await finishSuccessfulStart();
                return;
            }

            throw new Error(message);
        } catch (error) {
            const message =
                error?.response?.data?.C_MESSAGE ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to start the process.";
            if (engineStarted) {
                console.error(error);
                setDraftActionState(draftId, {
                    loading: false,
                    reconcileStarted: true,
                    error: "The process started, but its completion status still needs to be saved.",
                });
                return;
            }
            try {
                await updateDraft(draft, {
                    status: "PENDING_ENGINE",
                    last_error: message,
                    retry_count: retryCount + 1,
                    process_variables: JSON.stringify(variables),
                });
                setPendingDrafts(previous =>
                    previous.map(item =>
                        item.id === draftId
                            ? normalizeDraft({
                                ...item,
                                status: "PENDING_ENGINE",
                                last_error: message,
                                retry_count: retryCount + 1,
                                process_variables: JSON.stringify(variables),
                            })
                            : item,
                    ),
                );
            } catch (persistError) {
                console.error(persistError);
            }
            setDraftActionState(draftId, { loading: false, error: message });
        } finally {
            draftRetryLocks.current.delete(draftId);
        }
    }, [
        appContext?.profile?.username,
        appContext?.tenantSubscription?.tenant_id,
        draftActions,
        getDraftVariables,
        loadPendingDrafts,
        normalizeDraft,
        processInstanceExists,
        selectedPendingDraft?.id,
        setDraftActionState,
        setCurrentProcessState,
        setSelectedProcessId,
        syncTaskList,
        updateDraft,
    ]);

    const cancelPendingDraft = useCallback(async draft => {
        const draftId = draft?.id;
        if (!draftId || draftActions[draftId]?.loading) return;
        setDraftActionState(draftId, { loading: true, error: "" });
        try {
            await updateDraft(draft, {
                status: "CANCELLED",
                last_error: "",
            });
            setPendingDrafts(previous =>
                previous.filter(item => item.id !== draftId),
            );
            if (selectedPendingDraft?.id === draftId) {
                setSelectedPendingDraft(null);
                setSelectedProcessId("");
                setCurrentProcessState({
                    initial: true,
                    start: false,
                    step: false,
                    loading: false,
                });
            }
        } catch (error) {
            setDraftActionState(draftId, {
                loading: false,
                error:
                    error?.message || "Unable to cancel pending draft.",
            });
        }
    }, [
        draftActions,
        selectedPendingDraft?.id,
        setDraftActionState,
        setCurrentProcessState,
        setSelectedProcessId,
        updateDraft,
    ]);

    useEffect(() => {
        loadPendingDrafts();
    }, [loadPendingDrafts]);

    // Close filter dropdown when clicking outside
    useEffect(() => {
        function handleClick(e) {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setActiveFilterDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ── Helpers ──────────────────────────────────────
    function getPriorityLevel(task) {
        const p = (
            task.variables?.priority ||
            task.priority ||
            ""
        ).toString().toLowerCase();
        if (p === "high" || p === "1") return "high";
        if (p === "low" || p === "3") return "low";
        if (p === "medium" || p === "2" || p === "") return "medium";
        return "medium";
    }

    function groupTasksByDue(tasks) {
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(23, 59, 59, 999);

        const groups = { "Overdue": [], "Due Today": [], "Due This Week": [], "Due Later": [] };
        tasks.forEach(task => {
            const due = task.due_date ? new Date(task.due_date) : null;
            if (!due || due > weekEnd) {
                groups["Due Later"].push(task);
            } else if (due < todayStart) {
                groups["Overdue"].push(task);
            } else if (due <= todayEnd) {
                groups["Due Today"].push(task);
            } else {
                groups["Due This Week"].push(task);
            }
        });
        return groups;
    }

    function applyLocalFilters(allTasks) {
        const _myUsername = (userDetails?.username || "")
            .toString()
            .toLowerCase();
        const tasks = (allTasks || []).filter(task => {
            if (taskFilterType === "myTask") {
                const assignee = (task?.assignee || task?.variables?.["assignee"]);
                return assignee && assignee.toString().toLowerCase() === _myUsername;
            }
            return true; // keep all tasks if not "myTask"
        });
        return (tasks || []).filter(task => {
            if (filters.priority !== "all") {
                if (getPriorityLevel(task) !== filters.priority) return false;
            }
            if (filters.dueDate !== "all") {
                const due = task.due_date ? new Date(task.due_date) : null;
                const now = new Date();
                const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
                const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7); weekEnd.setHours(23, 59, 59, 999);
                const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
                /* "Due Today" filter includes overdue — show anything due on or before today. */
                if (filters.dueDate === "today" && (!due || due > todayEnd)) return false;
                if (filters.dueDate === "overdue" && (!due || due >= todayStart)) return false;
                if (filters.dueDate === "thisWeek" && (!due || due > weekEnd)) return false;
            }
            return true;
        });
    }

    function toggleGroup(key) {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function hasActiveFilters() {
        return filters.priority !== "all" || filters.dueDate !== "all";
    }

    function clearFilters() {
        setFilters({ priority: "all", dueDate: "all" });
        setActiveFilterDropdown(null);
        setCurrentPage(1);
    }

    const localFiltered = applyLocalFilters(filteredTaskList);
    const totalFiltered = localFiltered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedTasks = localFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const grouped = groupTasksByDue(pagedTasks);
    const safeTaskListLength = safeTaskList.length;
    const safeProcessListLength = safeProcessList.length;
    const normalizedDraftSearch = draftSearch.trim().toLowerCase();
    const filteredPendingDrafts = pendingDrafts.filter(draft => {
        if (!normalizedDraftSearch) return true;
        return [
            draft.process_title,
            draft.process_key,
            draft.form_title,
            draft.form_key,
            draft.status,
            draft.last_error,
        ]
            .filter(Boolean)
            .some(value => value.toString().toLowerCase().includes(normalizedDraftSearch));
    });
    const hasInboxItems = safeTaskListLength > 0 || pendingDrafts.length > 0;
    const normalizedProcessCatalogSearch = processCatalogSearch.trim().toLowerCase();
    const filteredProcessList = safeProcessList.filter(process => {
        if (!normalizedProcessCatalogSearch) return true;

        return [
            process.process_title,
            process.title,
            process.subtitle,
            process.sub_title,
            process.discription,
            process.description,
            process.process_key,
            process.key,
            process.id,
        ]
            .filter(Boolean)
            .some(value => value.toString().toLowerCase().includes(normalizedProcessCatalogSearch));
    });
    const processCatalogTotalPages = Math.max(
        1,
        Math.ceil(filteredProcessList.length / PROCESS_CATALOG_PAGE_SIZE),
    );
    const safeProcessCatalogPage = Math.min(processCatalogPage, processCatalogTotalPages);
    const pagedProcessList = filteredProcessList.slice(
        (safeProcessCatalogPage - 1) * PROCESS_CATALOG_PAGE_SIZE,
        safeProcessCatalogPage * PROCESS_CATALOG_PAGE_SIZE,
    );

    const priorityOptions = [
        { value: "all", label: "All Priorities" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
    ];
    const dueDateOptions = [
        { value: "all", label: "Any Date" },
        { value: "overdue", label: "Overdue" },
        { value: "today", label: "Due Today" },
        { value: "thisWeek", label: "Due This Week" },
    ];
    useEffect(() => {
        const handleInboxUpdate = data => {
            if (data === "task_list") {
                syncTaskList();
                loadPendingDrafts();
            } else if (data === "pending_drafts") {
                loadPendingDrafts();
            }
        };
        eventBus.on("update", handleInboxUpdate);
        return () => eventBus.off("update", handleInboxUpdate);
    }, [loadPendingDrafts, syncTaskList]);

    useEffect(() => {
        setCurrentProcessState({
            initial: true,
            start: false,
            step: false,
            loading: false,
        });
    }, []);

    /* ── Header stat counts ──────────────────────────────────────────────
     * taskList is pre-filtered by the API based on taskFilterType:
     *   "allTask"  → API returns ALL tasks      (cam.list.task.all)
     *   "myTask"   → API returns only the user's tasks (cam.list.my.tasks)
     *
     * allCount:  use the dedicated allTasksCount prop which Processes7 keeps
     *   updated only on allTask fetches, so it stays correct even after the
     *   user switches to myTask mode.
     *
     * assignedToMeCount:
     *   - myTask mode:  safeTaskList.length (API already filtered by assignee;
     *     re-filtering by username would incorrectly exclude delegate tasks)
     *   - allTask mode: filter safeTaskList by assignee === username
     *
     * dueTodayCount / overdueCount: scoped to the current mode's list —
     *   intentional, shows the numbers relevant to what's displayed.
     * ─────────────────────────────────────────────────────────────────── */
    const allCount = allTasksCount ?? safeTaskList.length;

    const _myUsername = (userDetails?.username || "").toString().toLowerCase();
    const assignedToMeCount = safeTaskList.filter(t => {
        const assignee =
            (t?.assignee || t?.variables?.["assignee"])?.toString().toLowerCase();

        // Only count tasks explicitly assigned to me
        return assignee === _myUsername;
    }).length;

    const _now = new Date();
    /* Use calendar-day boundaries so a task due at 9 AM (past the current
       time but still today) counts as "Due Today", not "Overdue". */
    const _todayStart = new Date(_now); _todayStart.setHours(0, 0, 0, 0);
    const _todayEnd = new Date(_now); _todayEnd.setHours(23, 59, 59, 999);
    /* "Due Today" includes overdue tasks — anything that needs attention
       on or before end of today (due <= todayEnd). */
    const dueTodayCount = safeTaskList.filter(t => {
        const due = t.due_date ? new Date(t.due_date) : null;
        return due && due <= _todayEnd;
    }).length;
    const overdueCount = safeTaskList.filter(t => {
        const due = t.due_date ? new Date(t.due_date) : null;
        return due && due < _todayStart;
    }).length;

    function handleStartProcessActions(
        actionType,
        state = {},
        formDetails = {},
        componentsData = {},
        reqPayload = {},
    ) {
        if (actionType === actions.complete) {
            setCurrentProcessState({
                initial: true,
                start: false,
                step: false,
                loading: false,
            });

            setSelectedProcessId("");
            syncTaskList();
            loadPendingDrafts();
        } else if (actionType === actions.draft) {
            setCurrentProcessState({
                initial: true,
                start: false,
                step: false,
                loading: false,
            });
            setSelectedProcessId("");
            setSelectedPendingDraft(null);
            loadPendingDrafts();
        }
    }

    function handlePendingDraftChange(draft) {
        if (!draft?.id) return;

        const normalizedDraft = normalizeDraft(draft);
        if (normalizedDraft.status === "PENDING_ENGINE") {
            setPendingDraftsView(true);
        }
        setPendingDrafts(previous => {
            if (normalizedDraft.status === "STARTED") {
                return previous.filter(item => item.id !== normalizedDraft.id);
            }
            const found = previous.some(
                item => item.id === normalizedDraft.id,
            );
            return found
                ? previous.map(item =>
                    item.id === normalizedDraft.id
                        ? normalizedDraft
                        : item,
                )
                : [normalizedDraft, ...previous];
        });
        if (selectedPendingDraft?.id === normalizedDraft.id) {
            setSelectedPendingDraft(normalizedDraft);
        }
    }

    function handleStepProcessActions(actionType) {
        if (actionType === actions.complete) {
            setCurrentProcessState({
                initial: true,
                start: false,
                step: false,
                loading: true,
            });
            setSelectedTask(taskInitState);
            syncTaskList();
        } else if (actionType === actions.update) {
            syncTaskList();
        } else if (actionType === actions.draft) {
            syncTaskList();
        }
    }

    function handleProcessModal() {
        setRenderProcessModal(true);
        setExpandedProcessDescriptionId("");
        setSelectedProcessId("");
        setSelectedTask(taskInitState);
        setCurrentProcessState({
            initial: true,
            start: false,
            step: false,
            loading: false,
        });
    }

    function handleProcessSelection(process) {
        setSelectedPendingDraft(null);
        setPendingDraftsView(false);
        setSelectedProcessId(process.id);
        setCurrentProcessState({
            initial: false,
            start: true,
            step: false,
            loading: false,
        });

        // Dismiss modal only on process selection, not on info toggle clicks.
        const modalElement = document.getElementById("startProcessModal");
        if (modalElement && window?.bootstrap?.Modal) {
            const instance = window.bootstrap.Modal.getOrCreateInstance(modalElement);
            instance.hide();
        }
    }

    function handleTaskSearch(event) {
        let textToSearch = event.target.value.toLowerCase();

        let result = filterArrayByTerms(safeTaskList, textToSearch, keysToSearch);
        setFilteredTaskList(result);
    }

    function handleTaskSelection(task) {
        setSelectedPendingDraft(null);
        setSelectedTask(task);
        setCurrentProcessState({
            initial: false,
            start: false,
            step: true,
            loading: false,
        });
    }

    // Event handlers
    function handleTypeChange(event) {
        let value = event.target.value;

        if (event.target.checked) {
            setTaskFilterType(value);
        }

        setSelectedTask(taskInitState);

        setCurrentProcessState({
            initial: true,
            start: false,
            step: false,
            loading: false,
        });
    }

    // ── Render helpers ───────────────────────────────

    function formatDueLabel(dueDateStr) {
        if (!dueDateStr) return "";
        const due = new Date(dueDateStr);
        const now = new Date();

        // Time portion: "06:00 PM"
        const timeStr = due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Day label
        const dueDay = new Date(due); dueDay.setHours(0, 0, 0, 0);
        const today = new Date(now); today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dueDay - today) / 86400000);

        if (diffDays === 0) return `Today, ${timeStr}`;
        if (diffDays === 1) return `Tomorrow, ${timeStr}`;
        if (diffDays === -1) return `Yesterday, ${timeStr}`;
        if (diffDays > 1 && diffDays < 7) {
            const dayName = due.toLocaleDateString([], { weekday: "short" });
            return `${dayName}, ${timeStr}`;
        }
        // Further out: "Mon 27 Jul, HH:MM"
        const dateLabel = due.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
        return `${dateLabel}, ${timeStr}`;
    }

    function renderDueBadge(task) {
        if (!task.due_date) return null;
        const due = new Date(task.due_date);
        const isOverdue = due < new Date();
        return (
            <span className={`inbox-due-badge ${isOverdue ? "overdue" : ""}`}>
                <i className="fa-regular fa-calendar" style={{ fontSize: 10 }}></i>
                {formatDueLabel(task.due_date)}
            </span>
        );
    }

    function renderPriorityBadge(task) {
        const level = getPriorityLevel(task);
        const labels = { high: "High", medium: "Medium", low: "Low" };
        const flagColor = { high: "#e05252", medium: "#d4820a", low: "#38a169" }[level];
        return (
            <span className={`${level}`} style={{ color: flagColor }}>
                <i className="fa-solid fa-flag" style={{ fontSize: 11 }}></i> {labels[level]}
            </span>
        );
    }

    function renderTaskGroup(groupLabel, tasks) {
        if (tasks.length === 0) return null;
        const isCollapsed = collapsedGroups.has(groupLabel);
        return (
            <div key={groupLabel}>
                <div
                    className="inbox-group-header"
                    onClick={() => toggleGroup(groupLabel)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === "Enter") toggleGroup(groupLabel); }}>
                    <span className="inbox-group-label">
                        {groupLabel}
                        <span className="inbox-group-count">{tasks.length}</span>
                    </span>
                    <i className={`fa-solid fa-chevron-down inbox-group-chevron ${isCollapsed ? "collapsed" : ""}`}></i>
                </div>
                {!isCollapsed && tasks.map(currentTask => {
                    const assigneeKey = currentTask.assignee || currentTask.variables?.["assignee"] || "";
                    const metaText = [
                        getDisplayName(assigneeKey),
                        currentTask?.variables?.subject || currentTask.process_name,
                    ].filter(Boolean).join(" · ");

                    return (
                        <div
                            className={`inbox-task-card ${currentTask.id === selectedTaskId ? "selected" : ""}`}
                            key={currentTask.id}
                            role="button"
                            tabIndex={0}
                            aria-current={currentTask.id === selectedTaskId ? "true" : undefined}
                            onClick={() => handleTaskSelection(currentTask)}
                            onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleTaskSelection(currentTask);
                                }
                            }}>
                            <img
                                className="inbox-task-avatar"
                                src={getProfileImage(assigneeKey)}
                                alt={getDisplayName(assigneeKey)}
                                onError={e => { e.target.src = "/theme/images/default-user-profile-img.png"; e.target.onerror = null; }}
                            />
                            <div className="inbox-task-body">
                                <div className="inbox-task-name">{currentTask.task_name}</div>
                                <div className="inbox-task-process">{currentTask.process_name}</div>
                                {metaText && <div className="inbox-task-meta-row">{metaText}</div>}
                                {data?.use_dynamic === true && parsedOptions.length > 0 &&
                                    parsedOptions.map(option => (
                                        <div key={option.id} className="inbox-task-meta-row">
                                            {option.label}: {currentTask?.variables?.[option.value] || ""}
                                        </div>
                                    ))
                                }
                                <div className="inbox-task-footer">
                                    {renderDueBadge(currentTask)}
                                    {renderPriorityBadge(currentTask)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    function getDraftProcess(draft) {
        return safeProcessList.find(process =>
            process.id === draft?.process_definition_id ||
            process.process_key === draft?.process_key ||
            process.key === draft?.process_key,
        );
    }

    function getDraftProcessTitle(draft) {
        const process = getDraftProcess(draft);
        return (
            draft?.process_title ||
            process?.process_title ||
            process?.title ||
            draft?.process_key ||
            "Process start"
        );
    }

    function getDraftFormTitle(draft) {
        return (
            draft?.form_title ||
            draft?.draft_title ||
            draft?.title ||
            draft?.form_key ||
            "Saved form"
        );
    }

    function formatDraftDate(draft) {
        const timestamp = draft?.updated_at || draft?.created_at;
        if (!timestamp) return "Saved recently";
        try {
            return formatDateTimeForUserView(new Date(timestamp));
        } catch {
            return timestamp;
        }
    }

    function handlePendingDraftResume(draft) {
        const process = getDraftProcess(draft);
        const processId = process?.id || draft?.process_definition_id;
        if (!processId || !draft?.form_record_id) {
            setDraftActionState(draft?.id, {
                error: "This draft is missing the process or saved form reference needed to resume it.",
            });
            return;
        }

        setSelectedPendingDraft(draft);
        setSelectedTask(taskInitState);
        setSelectedProcessId(processId);
        setCurrentProcessState({
            initial: false,
            start: true,
            step: false,
            loading: false,
        });
    }

    function handleBackToPendingDrafts() {
        setSelectedPendingDraft(null);
        setSelectedProcessId("");
        setCurrentProcessState({
            initial: true,
            start: false,
            step: false,
            loading: false,
        });
    }

    function renderPendingDraftCard(draft) {
        const actionState = draftActions[draft.id] || {};
        const isPending = draft.status === "PENDING_ENGINE";
        const isStartedAwaitingSave = actionState.reconcileStarted;
        const statusLabel = isStartedAwaitingSave
            ? "Started"
            : isPending
                ? "Pending start"
                : "Draft";
        const statusClass = isStartedAwaitingSave
            ? "text-success"
            : isPending
                ? "text-warning"
                : "text-secondary";

        return (
            <div
                key={draft.id}
                className="inbox-task-card pending-draft-card"
                aria-label={`${getDraftProcessTitle(draft)} pending draft`}>
                <div className="inbox-task-body">
                    <div className="d-flex justify-content-between gap-2">
                        <div className="inbox-task-name">{getDraftProcessTitle(draft)}</div>
                        <span className={`small fw-semibold text-nowrap ${statusClass}`}>
                            <i className="fa-regular fa-clock me-1"></i>
                            {statusLabel}
                        </span>
                    </div>
                    <div className="inbox-task-process">{getDraftFormTitle(draft)}</div>
                    <div className="inbox-task-meta-row">
                        <i className="fa-regular fa-floppy-disk me-1"></i>
                        {formatDraftDate(draft)}
                        {draft.retry_count > 0 && (
                            <span className="ms-2">Retry {draft.retry_count}</span>
                        )}
                    </div>
                    {draft.last_error && (
                        <div className="small text-danger mt-2" role="alert">
                            <i className="fa-solid fa-triangle-exclamation me-1"></i>
                            {draft.last_error}
                        </div>
                    )}
                    {actionState.error && (
                        <div className="small text-danger mt-2" role="alert">
                            {actionState.error}
                        </div>
                    )}
                    <div className="inbox-task-footer mt-2 d-flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-sm button-theme"
                            disabled={actionState.loading || isStartedAwaitingSave}
                            onClick={() => handlePendingDraftResume(draft)}>
                            <i className="fa-regular fa-pen-to-square me-1"></i>
                            Continue editing
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            disabled={actionState.loading}
                            onClick={() =>
                                isStartedAwaitingSave
                                    ? reconcileStartedDraft(draft)
                                    : retryPendingDraft(draft)
                            }>
                            {actionState.loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                    Saving…
                                </>
                            ) : isStartedAwaitingSave ? (
                                <>
                                    <i className="fa-solid fa-check me-1"></i>
                                    Save completion
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-rotate-right me-1"></i>
                                    Retry now
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-muted"
                            disabled={actionState.loading || isStartedAwaitingSave}
                            onClick={() => cancelPendingDraft(draft)}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Stat click handlers ──────────────────────────────────────────── */
    const resetTaskView = () => {
        setSelectedTask(taskInitState);
        setSelectedPendingDraft(null);
        setCurrentProcessState({ initial: true, start: false, step: false, loading: false });
        setCurrentPage(1);
    };

    const handleAllTasksClick = () => {
        setPendingDraftsView(false);
        setTaskFilterType("allTask");
        setFilters(f => ({ ...f, dueDate: "all" }));
        resetTaskView();
    };

    const handleAssignedClick = () => {
        setPendingDraftsView(false);
        setTaskFilterType("myTask");
        setFilters(f => ({ ...f, dueDate: "all" })); /* clear dueDate filter */
        resetTaskView();
    };

    const handleDueTodayClick = () => {
        setPendingDraftsView(false);
        setFilters(f => ({ ...f, dueDate: f.dueDate === "today" ? "all" : "today" }));
        setCurrentPage(1);
        setCollapsedGroups(new Set());
    };

    const handleOverdueClick = () => {
        setPendingDraftsView(false);
        setFilters(f => ({ ...f, dueDate: f.dueDate === "overdue" ? "all" : "overdue" }));
        setCurrentPage(1);
        setCollapsedGroups(new Set());
    };

    const handlePendingDraftsClick = () => {
        setPendingDraftsView(previous => !previous);
        resetTaskView();
        setFilters({ priority: "all", dueDate: "all" });
        setDraftSearch("");
        loadPendingDrafts();
    };

    return (
        <div id="processes" className="processes container-fluid">
            <div className="row">
                {/* ── Header ───────────────────────────────────────── */}
                <div className="inbox-panel-header">

                    {/* Identity: icon + label */}
                    <div className="inbox-panel-title">
                        <i className="fa-solid fa-inbox"></i>
                        <span>Tasks</span>
                    </div>

                    {/* Stat filter cards */}
                    <div className="inbox-stat-group">
                        {((data?.show_task === "ALL-TASK") || data?.show_task === "BOTH") && appContext.userGroups?.groupid && (
                            <button
                                type="button"
                                className={`inbox-stat-item inbox-stat-item--all${taskFilterType === "allTask" && filters.dueDate === "all" ? " active" : ""}`}
                                title="View all tasks"
                                onClick={handleAllTasksClick}>
                                <span className="inbox-stat-value">{allCount}</span>
                                <span className="inbox-stat-label">
                                    <i className="fa-solid fa-layer-group"></i>
                                    All Tasks
                                </span>
                            </button>
                        )}
                        {((data?.show_task === "MY-TASK") || data?.show_task === "BOTH") && (
                            <button
                                type="button"
                                className={`inbox-stat-item inbox-stat-item--assigned${taskFilterType === "myTask" && filters.dueDate === "all" ? " active" : ""}`}
                                title="Filter: tasks assigned to you"
                                onClick={handleAssignedClick}>
                                <span className="inbox-stat-value">{assignedToMeCount}</span>
                                <span className="inbox-stat-label">
                                    <i className="fa-solid fa-user"></i>
                                    Assigned to me
                                </span>
                            </button>
                        )}
                        <button
                            type="button"
                            className={`inbox-stat-item inbox-stat-item--due${filters.dueDate === "today" ? " active" : ""}`}
                            title="Filter: tasks due today"
                            onClick={handleDueTodayClick}>
                            <span className="inbox-stat-value">{dueTodayCount}</span>
                            <span className="inbox-stat-label">
                                <i className="fa-regular fa-calendar-check"></i>
                                Due Today
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`inbox-stat-item inbox-stat-item--assigned${pendingDraftsView ? " active" : ""}`}
                            title="View saved process starts waiting for the engine"
                            onClick={handlePendingDraftsClick}>
                            <span className="inbox-stat-value">
                                {pendingDraftsLoading ? "…" : pendingDrafts.length}
                            </span>
                            <span className="inbox-stat-label">
                                <i className="fa-regular fa-floppy-disk"></i>
                                Pending Drafts
                            </span>
                        </button>
                        {((data?.show_task === "ALL-TASK") || data?.show_task === "BOTH") && appContext.userGroups?.groupid && (
                            <button
                                type="button"
                                className={`inbox-stat-item inbox-stat-item--overdue${filters.dueDate === "overdue" ? " active" : ""}`}
                                title="Filter: overdue tasks"
                                onClick={handleOverdueClick}>
                                <span className="inbox-stat-value">{overdueCount}</span>
                                <span className="inbox-stat-label">
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    Overdue
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Actions: start process */}
                    {data?.allow_start_task && (
                        <div className="inbox-header-actions">
                            <button
                                type="button"
                                className="inbox-icon-btn"
                                data-bs-toggle="modal"
                                data-bs-target="#startProcessModal"
                                title="Start new process"
                                aria-label="Start new process"
                                onClick={() => handleProcessModal()}>
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="row" style={{ height: "100%" }}>
                {/* ── LEFT PANEL ─────────────────────────────── */}
                <div className="col-sm-3 task-panel p-0">
                    <div className="inbox-panel">

                        {/* Search */}
                        <div className="inbox-search-row">
                            <div className="inbox-search-wrap">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <input
                                    key={pendingDraftsView ? "draft-search" : "task-search"}
                                    id="task-search-input"
                                    type="text"
                                    className="inbox-search-input"
                                    onChange={e => {
                                        if (pendingDraftsView) {
                                            setDraftSearch(e.target.value);
                                        } else {
                                            handleTaskSearch(e);
                                            setCurrentPage(1);
                                        }
                                    }}
                                    placeholder={pendingDraftsView ? "Search pending drafts…" : "Search tasks…"}
                                    aria-label={pendingDraftsView ? "Search pending drafts" : "Search tasks"}
                                />
                            </div>
                            <div className="inbox-header-actions">
                                <button
                                    type="button"
                                    className="inbox-icon-btn"
                                    title="Refresh Inbox"
                                    aria-label="Refresh Inbox"
                                    onClick={() => {
                                        syncTaskList();
                                        loadPendingDrafts();
                                    }}>
                                    <i className={`fa-solid fa-arrows-rotate ${notification?.count > 0 ? "active" : ""}`}
                                        title={notification.message}></i>
                                </button>
                            </div>
                        </div>

                        {/* Filter chips */}  {/* Priority filter */} {/* Due Date filter */}
                        {/* <div className="inbox-filter-row" ref={filterRef}>

                            <div className="inbox-filter-chip-wrap">
                                <button
                                    className={`inbox-filter-chip ${filters.priority !== "all" ? "active" : ""}`}
                                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === "priority" ? null : "priority")}>
                                    Priority
                                    {filters.priority !== "all" && `: ${priorityOptions.find(o => o.value === filters.priority)?.label}`}
                                    <i className={`fa-solid fa-chevron-${activeFilterDropdown === "priority" ? "up" : "down"}`} style={{ fontSize: 9 }}></i>
                                </button>
                                {activeFilterDropdown === "priority" && (
                                    <div className="inbox-filter-dropdown">
                                        {priorityOptions.map(opt => (
                                            <div
                                                key={opt.value}
                                                className={`inbox-filter-option ${filters.priority === opt.value ? "selected" : ""}`}
                                                onClick={() => { setFilters(f => ({ ...f, priority: opt.value })); setActiveFilterDropdown(null); setCurrentPage(1); }}>
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>


                            <div className="inbox-filter-chip-wrap">
                                <button
                                    className={`inbox-filter-chip ${filters.dueDate !== "all" ? "active" : ""}`}
                                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === "dueDate" ? null : "dueDate")}>
                                    Due Date
                                    {filters.dueDate !== "all" && `: ${dueDateOptions.find(o => o.value === filters.dueDate)?.label}`}
                                    <i className={`fa-solid fa-chevron-${activeFilterDropdown === "dueDate" ? "up" : "down"}`} style={{ fontSize: 9 }}></i>
                                </button>
                                {activeFilterDropdown === "dueDate" && (
                                    <div className="inbox-filter-dropdown">
                                        {dueDateOptions.map(opt => (
                                            <div
                                                key={opt.value}
                                                className={`inbox-filter-option ${filters.dueDate === opt.value ? "selected" : ""}`}
                                                onClick={() => { setFilters(f => ({ ...f, dueDate: opt.value })); setActiveFilterDropdown(null); setCurrentPage(1); }}>
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {hasActiveFilters() && (
                                <button className="inbox-filter-clear" onClick={clearFilters}>
                                    Clear All
                                </button>
                            )}

                        </div> */}

                        {/* Task groups */}
                        <div className="inbox-task-groups-scroll">
                            {pendingDraftsView ? (
                                pendingDraftsLoading ? (
                                    <div className="task-list-empty" style={{ padding: "30px 14px", textAlign: "center", color: "var(--text-muted)" }}>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Loading pending drafts…
                                    </div>
                                ) : pendingDraftsError ? (
                                    <div className="task-list-empty" style={{ padding: "30px 14px", textAlign: "center", color: "var(--text-muted)" }}>
                                        <i className="fa-solid fa-triangle-exclamation text-warning" style={{ fontSize: 22, display: "block", marginBottom: 8 }}></i>
                                        <div>{pendingDraftsError}</div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary mt-2"
                                            onClick={loadPendingDrafts}>
                                            Try again
                                        </button>
                                    </div>
                                ) : filteredPendingDrafts.length === 0 ? (
                                    <div className="task-list-empty" style={{ padding: "30px 14px", textAlign: "center", color: "var(--text-muted)" }}>
                                        <i className="fa-regular fa-folder-open" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.5 }}></i>
                                        {normalizedDraftSearch ? "No pending drafts match your search." : "No pending drafts found."}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="inbox-group-header">
                                            <span className="inbox-group-label">
                                                Pending Drafts
                                                <span className="inbox-group-count">{filteredPendingDrafts.length}</span>
                                            </span>
                                        </div>
                                        {filteredPendingDrafts.map(renderPendingDraftCard)}
                                    </div>
                                )
                            ) : pagedTasks.length === 0 ? (
                                <div className="task-list-empty" style={{ padding: "30px 14px", textAlign: "center", color: "var(--text-muted)" }}>
                                    <i className="fa-regular fa-folder-open" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.5 }}></i>
                                    {hasActiveFilters() ? "No tasks match the current filters." : "No tasks found."}
                                </div>
                            ) : (
                                <>
                                    {renderTaskGroup("Overdue", grouped["Overdue"])}
                                    {renderTaskGroup("Due Today", grouped["Due Today"])}
                                    {renderTaskGroup("Due This Week", grouped["Due This Week"])}
                                    {renderTaskGroup("Due Later", grouped["Due Later"])}
                                </>
                            )}
                        </div>

                        {/* Pagination */}
                        {!pendingDraftsView && totalFiltered > 0 && (
                            <div className="inbox-pagination">
                                <span>
                                    Showing {Math.min((safePage - 1) * PAGE_SIZE + 1, totalFiltered)}–{Math.min(safePage * PAGE_SIZE, totalFiltered)} of {totalFiltered} task{totalFiltered !== 1 ? "s" : ""}
                                </span>
                                <div className="inbox-page-btns">
                                    <button
                                        className="inbox-page-btn"
                                        disabled={safePage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        aria-label="Previous page">
                                        <i className="fa-solid fa-chevron-left" style={{ fontSize: 10 }}></i>
                                    </button>
                                    <button className="inbox-page-btn current" aria-current="page">{safePage}</button>
                                    <button
                                        className="inbox-page-btn"
                                        disabled={safePage >= totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        aria-label="Next page">
                                        <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }}></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* {JSON.stringify(currentProcessState)} {taskList?.length } */}
                {/* {currentProcessState?.loading && taskList?.length > 0 && (
                    <div className="col-sm-9 task-view-panel">
                        <div className="no-task-border">
                            <div className="no-task-wrap">
                                <span
                                    className="spinner-border spinner-border-sm label me-2"
                                    role="status"></span>{" "}
                                Updating task...
                            </div>
                        </div>
                    </div>
                )} */}

                {!safeCurrentProcessState.loading && !safeCurrentProcessState?.start && !hasInboxItems && (
                    <div className="col-sm-9 task-view-panel">
                        <div className="no-task-border">
                            <div className="no-task-wrap">
                                <i className="fa-solid fa-info no-task-info-icon me-2"></i>
                                <span className="no-task-text">
                                    Task list is empty.
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {!safeCurrentProcessState.loading &&
                    safeCurrentProcessState.initial &&
                    hasInboxItems && (
                        <div className="col-sm-9 task-view-panel">
                            <div className="no-task-border">
                                <div className="no-task-wrap">
                                    <i className="fa-solid fa-info no-task-info-icon me-2"></i>
                                    <span className="no-task-text">
                                        {pendingDraftsView
                                            ? "Select a pending draft to continue editing or retry it."
                                            : "Select a task in the list."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                {!safeCurrentProcessState.loading && safeCurrentProcessState.start && selectedProcessId !== "" && (
                    <>
                        <div className="col-sm-6 form-panel">
                            {selectedPendingDraft && (
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="small text-muted">
                                        Continuing saved draft: {getDraftFormTitle(selectedPendingDraft)}
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={handleBackToPendingDrafts}>
                                        <i className="fa-solid fa-arrow-left me-1"></i>
                                        Back to inbox
                                    </button>
                                </div>
                            )}
                            {renderStartStepProcessor()}
                        </div>
                        <div className="col-sm-3 comment-panel p-3">
                            <Interweave content={safeProcessList.find(p => p.id === selectedProcessId)?.description || "No description available for this service."} />
                        </div>
                    </>
                )}
                {!safeCurrentProcessState.loading &&
                    userDetails &&
                    safeCurrentProcessState.step &&
                    safeTaskListLength > 0 && (
                        <>
                            <div
                                className={
                                    showComments
                                        ? "form-panel col-sm-6"
                                        : "form-panel col-sm-9"
                                }>
                                {renderStepProcessor()}
                            </div>
                            {showComments && (
                                <div
                                    id="task-comment-panel"
                                    className="col-sm-3 comment-panel">
                                    <CommentBox
                                        task={selectedTask}
                                        getProfileImage={getProfileImage}
                                        getDisplayName={getDisplayName}
                                    />
                                </div>
                            )}
                        </>
                    )}
            </div>
            <div
                id="startProcessModal"
                className="modal fade "
                data-bs-backdrop="static"
                data-bs-keyboard="false">
                <div
                    className={`modal-dialog ${toggleModalWindow === "maximize"
                        ? "modal-fullscreen"
                        : ""
                        } `}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Process Catalog</h5>
                            <div className="d-flex">
                                <div
                                    className={`m-2 pointer ${toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                        } `}
                                    onClick={() =>
                                        setToggleModalWindow("maximize")
                                    }
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Maximize window">
                                    <i className="fa-regular fa-window-maximize fs-5"></i>
                                </div>

                                <div
                                    className={`m-2 pointer ${toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                        } `}
                                    onClick={() =>
                                        setToggleModalWindow("restore")
                                    }
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Restore Window">
                                    <i className="fa-regular fa-window-restore fs-5"></i>
                                </div>
                                <div
                                    className=""
                                    data-bs-dismiss="modal"
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Close"
                                    onClick={() =>
                                        setRenderProcessModal(false)
                                    }>
                                    <i className="fa-solid fa-x modal-close"></i>
                                </div>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div
                                id="select-process"
                                className="select-process">
                                <div className="row">
                                    <div className="col">
                                        <p>Select from available services and submit request.</p>
                                    </div>
                                </div>

                                <div className="input-group mb-3">
                                    <span className="input-group-text" aria-hidden="true">
                                        <i className="fa-solid fa-magnifying-glass"></i>
                                    </span>
                                    <input
                                        type="search"
                                        className="form-control"
                                        value={processCatalogSearch}
                                        placeholder="Search services"
                                        aria-label="Search process catalog"
                                        onChange={event => {
                                            setProcessCatalogSearch(event.target.value);
                                            setProcessCatalogPage(1);
                                            setExpandedProcessDescriptionId("");
                                        }}
                                    />
                                    {processCatalogSearch && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            aria-label="Clear process search"
                                            onClick={() => {
                                                setProcessCatalogSearch("");
                                                setProcessCatalogPage(1);
                                            }}>
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    )}
                                </div>

                                {safeProcessListLength === 0 && (
                                    <div className="text-muted">No process available to start.</div>
                                )}

                                {safeProcessListLength > 0 && filteredProcessList.length === 0 && (
                                    <div className="text-muted text-center py-4">
                                        No services match &ldquo;{processCatalogSearch.trim()}&rdquo;.
                                    </div>
                                )}

                                {pagedProcessList.map((process, index) => {
                                    const processId = process.id || process.process_key || `${index}`;
                                    const isDescriptionExpanded = expandedProcessDescriptionId === processId;
                                    return (
                                        <div key={processId} className="mb-2">
                                            <div
                                                className="process-item pointer d-flex"
                                                title="Start Process"
                                                onClick={() =>
                                                    handleProcessSelection(
                                                        process,
                                                    )
                                                }>
                                                <i className="fa-solid fa-diagram-project me-2"></i>
                                                <div className="d-flex justify-content-between align-items-start w-100">
                                                    <div>
                                                        <div>{process.process_title || process.title}</div>
                                                        {(process.subtitle || process.sub_title) && (
                                                            <div className="small text-muted">{process.subtitle || process.sub_title}</div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-link p-0 ms-2"
                                                        title={isDescriptionExpanded ? "Hide service details" : "View service details"}
                                                        aria-expanded={isDescriptionExpanded}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setExpandedProcessDescriptionId(prev =>
                                                                prev === processId ? "" : processId,
                                                            );
                                                        }}>
                                                        <i className="fa-solid fa-circle-info"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {isDescriptionExpanded && (
                                                <div className="process-description mt-1 ms-4 small text-muted">
                                                    <Interweave content={process.discription || process.description || "No description available for this service."} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {filteredProcessList.length > 0 && (
                                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-3 pt-2 border-top">
                                        <small className="text-muted">
                                            Showing {((safeProcessCatalogPage - 1) * PROCESS_CATALOG_PAGE_SIZE) + 1}
                                            &ndash;{Math.min(safeProcessCatalogPage * PROCESS_CATALOG_PAGE_SIZE, filteredProcessList.length)} of {filteredProcessList.length}
                                        </small>
                                        <div className="btn-group btn-group-sm" role="group" aria-label="Process catalog pagination">
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                disabled={safeProcessCatalogPage === 1}
                                                onClick={() => {
                                                    setProcessCatalogPage(page => Math.max(1, page - 1));
                                                    setExpandedProcessDescriptionId("");
                                                }}>
                                                <i className="fa-solid fa-chevron-left me-1"></i>
                                                Previous
                                            </button>
                                            <span className="btn btn-outline-secondary disabled" aria-current="page">
                                                {safeProcessCatalogPage} / {processCatalogTotalPages}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                disabled={safeProcessCatalogPage === processCatalogTotalPages}
                                                onClick={() => {
                                                    setProcessCatalogPage(page => Math.min(processCatalogTotalPages, page + 1));
                                                    setExpandedProcessDescriptionId("");
                                                }}>
                                                Next
                                                <i className="fa-solid fa-chevron-right ms-1"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer d-flex justify-content-between">
                            <button
                                type="button"
                                className="btn btn-sm button-theme"
                                data-bs-dismiss="modal"
                                onClick={() => setRenderProcessModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    function renderStepProcessor() {
        if (selectedTaskId === "") {
            return <span>Loading...</span>;
        }

        return (
            <StepProcessor
                task={safeSelectedTask}
                userList={userList}
                userDetails={userDetails}
                handleProcessActions={handleStepProcessActions}
                showComments={showComments}
                setShowComments={setShowComments}
                getProfileImage={getProfileImage}
                getDisplayName={getDisplayName}
                taskFilterType={taskFilterType}
            />
        );
    }

    function renderStartStepProcessor() {
        if (selectedProcessId === "") {
            return <span>Loading...</span>;
        }

        return (
            <StartStepProcessor
                id={selectedProcessId}
                handleProcessActions={handleStartProcessActions}
                processStartDraft={selectedPendingDraft}
                onDraftChange={handlePendingDraftChange}
                formVars={
                    selectedPendingDraft
                        ? { business_key: selectedPendingDraft.form_record_id }
                        : {}
                }
            />
        );
    }
}

export default RenderListView;
