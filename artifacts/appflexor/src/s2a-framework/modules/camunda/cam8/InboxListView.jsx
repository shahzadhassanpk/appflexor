import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../AppContext";
import { formatDateTimeForUserView } from "../../../utils/utils";
import StartStepProcessor from "./StartStepProcessor8";
import StepProcessor from "./StepProcessor8";
import { CommentBox } from "../CommentBox/CommentBox";
import { actions } from "../constants";
import { tryParseJSONObject } from "../../../utils/utils";

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
        });
    }

    function handleProcessSelection(process) {
        setSelectedProcessId(process.id);
        setCurrentProcessState({
            initial: false,
            start: true,
            step: false,
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
        });
    }

    return (
        <div
            id="processes"
            className="processes container-fluid">
            <div className="row">
                <div className="col-sm-3 task-panel">
                    <div className="task-panel-filters process-task-title chart-title">
                        <div className="col-sm-12 d-inline-flex">
                            <div className="col-sm-8 tasks-select">
                                {((data && data?.show_task === "ALL-TASK") ||
                                    data?.show_task === "BOTH") &&
                                    appContext.userGroups &&
                                    appContext.userGroups.groupid && (
                                        <label className="px-1 form-check-label pointer">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                value="allTask"
                                                checked={
                                                    taskFilterType ===
                                                        "allTask" ||
                                                    (data &&
                                                        data?.show_task ===
                                                            "ALL-TASK")
                                                }
                                                onChange={event => {
                                                    handleTypeChange(event);
                                                }}
                                            />
                                            <span className="ms-2">
                                                All Tasks
                                            </span>
                                        </label>
                                    )}
                                {((data && data?.show_task === "MY-TASK") ||
                                    data?.show_task === "BOTH") && (
                                    <label className="px-1 form-check-label pointer">
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            value="myTask"
                                            checked={
                                                taskFilterType === "myTask" ||
                                                (data &&
                                                    data?.show_task ===
                                                        "MY-TASK")
                                            }
                                            onChange={event => {
                                                handleTypeChange(event);
                                            }}
                                        />
                                        <span className="ms-2">My Tasks</span>
                                    </label>
                                )}
                            </div>
                            <div
                                className={`float-right inbox-notification ${
                                    data && data?.allow_start_task
                                        ? "ps-2 col-sm-1 tasks-refresh"
                                        : "ps-2 col tasks-refresh"
                                }
                            `}>
                                <span
                                    className="me-2"
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Sync tasklist">
                                    <i
                                        title={
                                            // data?.auto_refresh
                                            //     ? `auto refresh in ${data?.auto_refresh} seconds`
                                            //     : ""
                                            notification.message
                                        }
                                        className={`fa-solid fa-arrows-rotate ${
                                            data?.auto_refresh &&
                                            data?.auto_refresh !== "0" &&
                                            data?.auto_refresh !== ""
                                                ? "refresh_interval"
                                                : ""
                                        } ${
                                            notification?.count > 0
                                                ? "active"
                                                : ""
                                        }`}
                                        // className=""
                                        onClick={() => syncTaskList()}></i>
                                </span>
                            </div>
                            {data && data?.allow_start_task && (
                                <div className="px-2 col-sm-1 start-process">
                                    <span
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Start process instance">
                                        <i
                                            className="fa fa-bolt pointer"
                                            data-bs-toggle="modal"
                                            data-bs-target="#startProcessModal"
                                            onClick={() =>
                                                handleProcessModal()
                                            }></i>
                                    </span>
                                </div>
                            )}
                            <div className="px-2 col-sm-2">
                                <span className="rounded-0">
                                    {filteredTaskList &&
                                        filteredTaskList.length}
                                    /{taskList && taskList.length}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mb-2 row">
                        <div className="input-group">
                            <input
                                id="task-search-input"
                                type="text"
                                className="form-control rounded-0"
                                onChange={handleTaskSearch}
                                placeholder="Search Task List"
                            />
                        </div>
                    </div>
                    <div className="row enable-vertical-scroll">
                        <ol className="task-list">
                            {filteredTaskList &&
                                filteredTaskList.map(currentTask => {
                                    return (
                                        <li
                                            className={`task-item ${
                                                currentTask.id ==
                                                selectedTask.id
                                                    ? "selected-task"
                                                    : "un-selected-task"
                                            } `}
                                            key={currentTask.id}
                                            onClick={() => {
                                                handleTaskSelection(
                                                    currentTask,
                                                );
                                            }}>
                                            <div
                                                className="col-sm-12 task-name"
                                                // title={
                                                //     currentTask.variables
                                                // }
                                            >
                                                <div className="process-task"></div>
                                                <div className="process-task">
                                                    <div className="case-ref">
                                                        <span>
                                                            Ref:{" "}
                                                            {
                                                                currentTask
                                                                    .variables[
                                                                    "case_ref"
                                                                ]
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="process-task-name">
                                                    <span>
                                                        {" "}
                                                        Subject:{" "}
                                                        {
                                                            currentTask
                                                                .variables[
                                                                "subject"
                                                            ]
                                                        }
                                                    </span>
                                                </div>
                                                <div className="process-task">
                                                    <span>
                                                        {" "}
                                                        Task:{" "}
                                                        {
                                                            currentTask
                                                                .variables[
                                                                "task_name"
                                                            ]
                                                        }
                                                    </span>
                                                </div>
                                                {data?.use_dynamic === true &&
                                                    parsedOptions.length > 0 &&
                                                    parsedOptions.map(
                                                        option => (
                                                            <div
                                                                key={option.id}
                                                                className="process-task">
                                                                <span>
                                                                    {
                                                                        option.label
                                                                    }
                                                                    :{" "}
                                                                    {currentTask
                                                                        .variables[
                                                                        option
                                                                            .value
                                                                    ] || ""}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}

                                                {currentTask.due && (
                                                    <div className="due-text">
                                                        <span className="">
                                                            Due&nbsp;
                                                            {getTimeAgo(
                                                                currentTask.due,
                                                            )}
                                                            &nbsp;
                                                        </span>
                                                        <span className="due-text-sm">
                                                            {formatDateTimeForUserView(
                                                                currentTask.due,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}

                                                {currentTask.datecreated && (
                                                    <div className="task-comment-stamp row">
                                                        <div className="col-sm-9">
                                                            <div className="col-sm-12">
                                                                <span
                                                                    title={formatDateTimeForUserView(
                                                                        currentTask?.follow_up,
                                                                    )}>
                                                                    Followup{" "}
                                                                    {currentTask?.follow_up !==
                                                                    ""
                                                                        ? getTimeAgo(
                                                                              formatDateTimeForUserView(
                                                                                  currentTask.follow_up,
                                                                              ),
                                                                          )
                                                                        : " "}{" "}
                                                                </span>
                                                                |{" "}
                                                                <span
                                                                    title={formatDateTimeForUserView(
                                                                        currentTask?.due_date,
                                                                    )}>
                                                                    {" "}
                                                                    Due{" "}
                                                                    {currentTask?.due_date !==
                                                                    ""
                                                                        ? getTimeAgo(
                                                                              formatDateTimeForUserView(
                                                                                  currentTask.due_date,
                                                                              ),
                                                                          )
                                                                        : " "}
                                                                </span>
                                                            </div>
                                                            <div className="col-sm-12">
                                                                Start Date:{" "}
                                                                {formatDateTimeForUserView(
                                                                    currentTask.datecreated,
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-3">
                                                            <img
                                                                src={getProfileImage(
                                                                    currentTask.assignee
                                                                        ? currentTask.assignee
                                                                        : currentTask
                                                                              .variables[
                                                                              "assignee"
                                                                          ],
                                                                )}
                                                                alt="image"
                                                                onError="this.src='/theme/images/default-user-profile-img.png';this.onerror='';"
                                                                title={getDisplayName(
                                                                    currentTask.assignee
                                                                        ? currentTask.assignee
                                                                        : currentTask
                                                                              .variables[
                                                                              "assignee"
                                                                          ],
                                                                )}></img>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                        </ol>
                    </div>
                </div>
                {/* {JSON.stringify(currentProcessState)} {taskList?.length } */}
                {currentProcessState.loading && (
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
                )}

                {!currentProcessState.loading &&
                    !currentProcessState.start &&
                    taskList?.length == 0 && (
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
                        <div className="col-sm-4">
                            {renderStartStepProcessor()}
                        </div>
                        <div className="col-sm-4 comment-panel"></div>
                    </>
                )}
                {!currentProcessState.loading &&
                    userDetails &&
                    currentProcessState.step &&
                    taskList?.length > 0 && (
                        <>
                            <div
                                className={
                                    showComments ? "col-sm-5" : "col-sm-9"
                                }>
                                {renderStepProcessor()}
                            </div>
                            {showComments && (
                                <div className="col-sm-4 comment-panel">
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
                    className={`modal-dialog ${
                        toggleModalWindow === "maximize"
                            ? "modal-fullscreen"
                            : ""
                    } `}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Start Process</h5>
                            <div className="d-flex">
                                <div
                                    className={`m-2 pointer ${
                                        toggleModalWindow === "maximize"
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
                                    className={`m-2 pointer ${
                                        toggleModalWindow === "restore"
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
                                                className="table-edit-font pointer"
                                                title="Start Process"
                                                data-bs-dismiss="modal"
                                                onClick={() =>
                                                    handleProcessSelection(
                                                        process,
                                                    )
                                                }>
                                                <span>
                                                    {process.process_title}
                                                </span>{" "}
                                                <i className="ps-2 fa-solid fa-play"></i>
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
