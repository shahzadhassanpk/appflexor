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

function RenderListView({
    processList,
    data,
    syncTaskList,
    taskFilterType,
    setTaskFilterType,
    notification,
    taskList,
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
                if (filters.dueDate === "today" && (!due || due > todayEnd)) return false;
                if (filters.dueDate === "overdue" && (!due || due >= now)) return false;
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

    const allCount = taskList ? taskList.length : 0;
    const myCount = taskList
        ? taskList.filter(
            t =>
                (t.assignee || "").toString().toLowerCase() ===
                (userDetails?.username || "").toString().toLowerCase(),
        ).length
        : 0;
    // keep single total counts (as before)

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
    }

    function handleTaskSearch(event) {
        let textToSearch = event.target.value.toLowerCase();

        let result = filterArrayByTerms(taskList, textToSearch, keysToSearch);
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

    function renderDueBadge(task) {
        if (!task.due_date) return null;
        const due = new Date(task.due_date);
        const now = new Date();
        const isOverdue = due < now;
        const formatted = formatDateTimeForUserView(task.due_date);
        return (
            <span className={`inbox-due-badge ${isOverdue ? "overdue" : ""}`}>
                <i className="fa-regular fa-calendar" style={{ fontSize: 10 }}></i>
                {isOverdue ? "Overdue · " : ""}{formatted}
            </span>
        );
    }

    function renderPriorityBadge(task) {
        const level = getPriorityLevel(task);
        const labels = { high: "High", medium: "Medium", low: "Low" };
        return (
            <span className={`inbox-priority-badge ${level}`}>
                {labels[level]}
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
                            className={`inbox-task-card ${currentTask.id === selectedTask.id ? "selected" : ""}`}
                            key={currentTask.id}
                            role="button"
                            tabIndex={0}
                            aria-current={currentTask.id === selectedTask.id ? "true" : undefined}
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
                                            {option.label}: {currentTask.variables[option.value] || ""}
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

    return (
        <div id="processes" className="processes container-fluid">
            <div className="row" style={{ height: "100%" }}>
                {/* ── LEFT PANEL ─────────────────────────────── */}
                <div className="col-sm-3 task-panel p-0">
                    <div className="inbox-panel">

                        {/* Header */}
                        <div className="inbox-panel-header">
                            <span className="inbox-panel-title">
                                <i className="fa-solid fa-inbox" style={{ fontSize: 14 }}></i>
                                Tasks
                                <span className="inbox-panel-title-count">{taskList?.length || 0}</span>
                            </span>
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
                                {data?.allow_start_task && (
                                    <button
                                        type="button"
                                        className="inbox-icon-btn"
                                        data-bs-toggle="modal"
                                        data-bs-target="#startProcessModal"
                                        title="Start process instance"
                                        aria-label="Start process instance"
                                        onClick={() => handleProcessModal()}>
                                        <i className="fa fa-bolt"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* My Tasks / All Tasks tabs */}
                        <div className="inbox-tab-row">
                            {((data?.show_task === "MY-TASK") || data?.show_task === "BOTH") && (
                                <button
                                    type="button"
                                    className={`inbox-tab-btn ${taskFilterType === "myTask" || data?.show_task === "MY-TASK" ? "active" : ""}`}
                                    onClick={() => { setTaskFilterType("myTask"); setSelectedTask(taskInitState); setCurrentProcessState({ initial: true, start: false, step: false, loading: false }); setCurrentPage(1); }}>
                                    My Tasks
                                    <span className="inbox-tab-badge">{myCount}</span>
                                </button>
                            )}
                            {((data?.show_task === "ALL-TASK") || data?.show_task === "BOTH") && appContext.userGroups?.groupid && (
                                <button
                                    type="button"
                                    className={`inbox-tab-btn ${taskFilterType === "allTask" || data?.show_task === "ALL-TASK" ? "active" : ""}`}
                                    onClick={() => { setTaskFilterType("allTask"); setSelectedTask(taskInitState); setCurrentProcessState({ initial: true, start: false, step: false, loading: false }); setCurrentPage(1); }}>
                                    All Tasks
                                    <span className="inbox-tab-badge">{allCount}</span>
                                </button>
                            )}
                        </div>

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
                            <button className="inbox-icon-btn" title="Filter" aria-label="Filter">
                                <i className="fa-solid fa-filter" style={{ fontSize: 12 }}></i>
                            </button>
                            <button className="inbox-icon-btn" title="Sort" aria-label="Sort">
                                <i className="fa-solid fa-arrow-up-wide-short" style={{ fontSize: 12 }}></i>
                            </button>
                        </div>

                        {/* Filter chips */}
                        <div className="inbox-filter-row" ref={filterRef}>
                            {/* Priority filter */}
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

                            {/* Due Date filter */}
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
                        </div>

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

                {!currentProcessState.start && taskList?.length == 0 && (
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

                {!currentProcessState.loading &&
                    currentProcessState.initial &&
                    taskList?.length > 0 && (
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
                {!currentProcessState.loading && currentProcessState.start && (
                    <>
                        <div className="col-sm-6 form-panel">
                            {renderStartStepProcessor()}
                        </div>
                        <div className="col-sm-3 comment-panel"></div>
                    </>
                )}
                {!currentProcessState.loading &&
                    userDetails &&
                    currentProcessState.step &&
                    taskList?.length > 0 && (
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
                            <h5 className="modal-title">Start Process</h5>
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
                                        <p> Click on the process to start.</p>
                                    </div>
                                </div>

                                {processList &&
                                    processList.map((process, index) => {
                                        return (
                                            <div
                                                className="process-item pointer"
                                                title="Start Process"
                                                data-bs-dismiss="modal"
                                                onClick={() =>
                                                    handleProcessSelection(
                                                        process,
                                                    )
                                                }>
                                                <i class="fa-solid fa-diagram-project me-2"></i>
                                                <span>
                                                    {process.process_title}
                                                </span>
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
        if (selectedTask.id === "") {
            return <span>Loading...</span>;
        }

        return (
            <StepProcessor
                task={selectedTask}
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
