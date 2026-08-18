import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../AppContext";
import { formatDateTimeForUserView } from "../../../utils/utils";
import StartStepProcessor from "./StartStepProcessor7";
import StepProcessor from "./StepProcessor7";
import { CommentBox } from "../CommentBox/CommentBox";
import { actions } from "../constants";
import { filterArrayByTerms, tryParseJSONObject } from "../../../utils/utils";
import { eventBus } from "../../../eventBus";
import "../inbox-style.css";
import { Interweave } from "interweave";

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
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(23, 59, 59, 999);

        const groups = { "Due Today": [], "Due This Week": [], "Due Later": [] };
        tasks.forEach(task => {
            const due = task.due_date ? new Date(task.due_date) : null;
            if (!due || due > weekEnd) {
                groups["Due Later"].push(task);
            } else if (due <= todayEnd) {
                groups["Due Today"].push(task);
            } else {
                groups["Due This Week"].push(task);
            }
        });
        return groups;
    }

    function applyLocalFilters(tasks) {
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
                if (filters.dueDate === "today" && (!due || due > todayEnd || due < todayStart)) return false;
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
        eventBus.on("update", data => {
            if (data === "task_list") {
                syncTaskList();
            }
        });
        return () => eventBus.off("update");
    }, []);

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
    const assignedToMeCount = taskFilterType === "myTask"
        ? safeTaskList.length
        : safeTaskList.filter(
            t => (t.assignee || "").toString().toLowerCase() === _myUsername
          ).length;

    const _now = new Date();
    /* Use calendar-day boundaries so a task due at 9 AM (past the current
       time but still today) counts as "Due Today", not "Overdue". */
    const _todayStart = new Date(_now); _todayStart.setHours(0, 0, 0, 0);
    const _todayEnd   = new Date(_now); _todayEnd.setHours(23, 59, 59, 999);
    const dueTodayCount = safeTaskList.filter(t => {
        const due = t.due_date ? new Date(t.due_date) : null;
        return due && due >= _todayStart && due <= _todayEnd;
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

    /* ── Stat click handlers ──────────────────────────────────────────── */
    const resetTaskView = () => {
        setSelectedTask(taskInitState);
        setCurrentProcessState({ initial: true, start: false, step: false, loading: false });
        setCurrentPage(1);
    };

    const handleAllTasksClick = () => {
        setTaskFilterType("allTask");
        setFilters(f => ({ ...f, dueDate: "all" }));
        resetTaskView();
    };

    const handleAssignedClick = () => {
        setTaskFilterType("myTask");
        setFilters(f => ({ ...f, dueDate: "all" })); /* clear dueDate filter */
        resetTaskView();
    };

    const handleDueTodayClick = () => {
        setFilters(f => ({ ...f, dueDate: f.dueDate === "today" ? "all" : "today" }));
        setCurrentPage(1);
    };

    const handleOverdueClick = () => {
        setFilters(f => ({ ...f, dueDate: f.dueDate === "overdue" ? "all" : "overdue" }));
        setCurrentPage(1);
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
                                <i className="fa fa-bolt"></i>
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
                                    id="task-search-input"
                                    type="text"
                                    className="inbox-search-input"
                                    onChange={e => { handleTaskSearch(e); setCurrentPage(1); }}
                                    placeholder="Search tasks…"
                                    aria-label="Search tasks"
                                />
                            </div>
                            <div className="inbox-header-actions">
                                <button
                                    type="button"
                                    className="inbox-icon-btn"
                                    title="Refresh task list"
                                    aria-label="Refresh task list"
                                    onClick={() => syncTaskList()}>
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
                            {pagedTasks.length === 0 ? (
                                <div className="task-list-empty" style={{ padding: "30px 14px", textAlign: "center", color: "var(--text-muted)" }}>
                                    <i className="fa-regular fa-folder-open" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.5 }}></i>
                                    {hasActiveFilters() ? "No tasks match the current filters." : "No tasks found."}
                                </div>
                            ) : (
                                <>
                                    {renderTaskGroup("Due Today", grouped["Due Today"])}
                                    {renderTaskGroup("Due This Week", grouped["Due This Week"])}
                                    {renderTaskGroup("Due Later", grouped["Due Later"])}
                                </>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalFiltered > 0 && (
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

                {!safeCurrentProcessState.loading && !safeCurrentProcessState?.start && safeTaskListLength === 0 && (
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
                    safeTaskListLength > 0 && (
                        <div className="col-sm-9 task-view-panel">
                            <div className="no-task-border">
                                <div className="no-task-wrap">
                                    <i className="fa-solid fa-info no-task-info-icon me-2"></i>
                                    <span className="no-task-text">
                                        Select a task in the list.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                {!safeCurrentProcessState.loading && safeCurrentProcessState.start && selectedProcessId !== "" && (
                    <>
                        <div className="col-sm-6 form-panel">
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
                            <h5 className="modal-title">Request Service</h5>
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

                                {safeProcessListLength === 0 && (
                                    <div className="text-muted">No process available to start.</div>
                                )}

                                {safeProcessList.map((process, index) => {
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
            />
        );
    }
}

export default RenderListView;
