import React, { useContext, useState, useRef, useEffect } from "react";
import { AppContext } from "../../../../AppContext";
import StartStepProcessor from "./StartStepProcessor7";
import StepProcessor from "./StepProcessor7";
import { CommentBox } from "../CommentBox/CommentBox";
import { actions } from "../constants";
import Pagination from "../../content-management/page-builder/datalist-viewer/viewer/components/Pagination";
import { TablePagination } from "../../../components/TablePagination/TablePagination";

import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import {
    filterArrayByTerms,
    formatDateTimeForUserView,
    formatDateForUserViewLocale,
    formatDateForUserView,
    formatTimeForUserView,
    formatTimeForUserViewLocale,
    parseDBDateTime,
} from "../../../utils/utils";
import Modal from "react-bootstrap/Modal";
import { tryParseJSONObject } from "../../../utils/utils";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";

import { DateRangePicker } from "react-dates";
import moment from "moment";
import { DATE_FORMAT_FOR_DATE_PICKER_VIEW } from "../../../Config";
import TableSorting from "../../../components/TableSorting/TableSorting";

function RenderTableView({
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
    selectedProcessId,
    setSelectedProcessId,
    setRenderProcessModal,
    filteredTaskList,
    setFilteredTaskList,
    // selectedTask,
    // setSelectedTask,
    getProfileImage,
    getDisplayName,
    showComments,
    setShowComments,
    userList,
    taskInitState,
}) {
    const appContext = useContext(AppContext);
    const [selectedTask, setSelectedTask] = useState(taskInitState);
    const count = useRef(0);
    const keysToSearch = ["variables", "task_name", "assignee"];

    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const [processModalMode, setProcessModalMode] = useState("start");
    const [showModal, setShowModal] = useState(false);

    const [startDate, setStartDate] = useState();
    const [searchText, setSearchText] = useState();
    const [sortColumn, setSortColumn] = useState("date_created");
    const [sortOrder, setSortOrder] = useState("asc");
    const [endDate, setEndDate] = useState();
    const [focusedInput, setFocusedInput] = useState(null);

    const taskModal = useRef(null);
    const parsedOptions = data?.inbox_fields;
    useEffect(() => {
        if (!selectedProcessId || selectedProcessId == "") {
            setShowModal(false);
        }
    }, [selectedProcessId]);

    useEffect(() => {
        // if (!searchText || searchText == "") {
        //     setFilteredTaskList(taskList);
        // }else{
        //     let result = filterArrayByTerms(taskList, searchText.toLowerCase(), keysToSearch);
        //     setFilteredTaskList(result);
        // }
        let result = taskList;
        if (searchText && searchText !== "") {
            result = filterArrayByTerms(
                result,
                searchText.toLowerCase(),
                keysToSearch,
            );
        }
        if (startDate !== "" && endDate !== "") {
            result = filterTaskListByDate(result, startDate, endDate);
        }

        setFilteredTaskList(result);
    }, [searchText, startDate, endDate]);

    function closeModal() {
        setShowModal(false);
    }
    const prepareTaskList = (tasks, options) => {
        let taskList = [];
        tasks.forEach(task => {
            let _task = {};
            options.forEach(option => {
                if (task[option.value]) {
                    _task[option.value] = task.variables[option.value];
                } else {
                    _task[option.value] = "";
                }
            });
            taskList.push(_task);
        });
        // Join matched values with a separator, if needed
        return taskList;
    };
    function handleStartProcessActions(
        actionType,
        state = {},
        formDetails = {},
        componentsData = {},
        reqPayload = {},
    ) {
        if (actionType === actions.complete) {
            closeModal();
            setCurrentProcessState({
                initial: true,
                start: false,
                step: false,
            });
            // setProcessModalMode("start");
            setRenderProcessModal(false);
            setSelectedProcessId("");
            syncTaskList();
            clearFilters();
        }
    }

    function handleStepProcessActions(actionType) {
        setProcessModalMode("step");
        if (actionType === actions.complete) {
            setCurrentProcessState({
                initial: true,
                start: false,
                step: false,
                loading: true,
            });
            setSelectedTask(taskInitState);
            syncTaskList();
            clearFilters();
        } else if (actionType === actions.update) {
            syncTaskList();
        } else if (actionType === actions.draft) {
            syncTaskList();
        }
        closeModal();
    }

    function clearFilters() {
        setStartDate("");
        setEndDate("");
        setSearchText("");
    }

    function handleStartProcessModal() {
        setProcessModalMode("start");
        setSelectedProcessId("");
        setSelectedTask(taskInitState);
        setCurrentProcessState({
            initial: true,
            start: false,
            step: false,
        });

        setRenderProcessModal(true);
        setTimeout(() => {
            setShowModal(true);
        }, 100);
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
        let textToSearch = event.target.value;
        setSearchText(textToSearch);
    }

    function handleTaskSelection(task) {
        setProcessModalMode("task");
        setSelectedProcessId(task.id);
        setSelectedTask(task);
        setShowModal(true);
        setCurrentProcessState({
            initial: false,
            start: false,
            step: true,
        });
    }

    // Event handlers
    function handleTypeChange(event) {
        let value = event.target.value;
        clearFilters();
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

    const handleDatesChange = ({ startDate = "", endDate = "" }) => {
        if (startDate) {
            setStartDate(moment(startDate));
        }
        if (endDate) {
            setEndDate(moment(endDate));
        }

        // setFilteredTaskList(result);
    };

    const clearDates = () => {
        setStartDate("");
        setEndDate("");
        setFilteredTaskList(taskList);
    };

    const filterTaskListByDate = (taskList, startDate, endDate) => {
        return taskList.filter(task => {
            const taskDate = new Date(task.date_created);
            const taskDateOnly = new Date(
                taskDate.getFullYear(),
                taskDate.getMonth(),
                taskDate.getDate(),
            );

            const start = new Date(startDate);
            const startOnly = new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate(),
            );

            const end = new Date(endDate);
            const endOnly = new Date(
                end.getFullYear(),
                end.getMonth(),
                end.getDate(),
            );

            return (
                (!startDate || taskDateOnly >= startOnly) &&
                (!endDate || taskDateOnly <= endOnly)
            );
        });
    };

    function disableDay(day) {
        let bool;
        if (props.disableDaysFrom) {
            bool = moment(day).isBefore(moment(props.disableDaysFrom));
        } else {
            bool = false;
        }
        return bool;
    }

    return (
        <div
            id="processes"
            className="processes container-fluid">
            <div className="row task-panel-filters process-task-title chart-title">
                <div className="col-sm-5 pt-3 d-inline-flex">
                    <div className="col-sm-6 tasks-select">
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
                                            taskFilterType === "allTask" ||
                                            (data &&
                                                data?.show_task === "ALL-TASK")
                                        }
                                        onChange={event => {
                                            handleTypeChange(event);
                                        }}
                                    />
                                    <span className="ms-2">All Tasks</span>
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
                                        (data && data?.show_task === "MY-TASK")
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
                        className={`float-right col-sm-2 inbox-notification ${
                            data && data?.allow_start_task
                                ? "ps-2 tasks-refresh"
                                : "ps-2 tasks-refresh"
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
                                } ${notification?.count > 0 ? "active" : ""}`}
                                // className=""
                                onClick={() => {
                                    syncTaskList();
                                    clearFilters();
                                }}></i>
                        </span>
                    </div>
                    {data && data?.allow_start_task && (
                        <div className="px-2 col-sm-2 start-process">
                            <span
                                data-bs-toggle="tooltip"
                                data-bs-title="Start process instance">
                                <i
                                    className="fa fa-bolt pointer"
                                    data-bs-toggle="modal"
                                    data-bs-target="#processModal"
                                    onClick={() =>
                                        handleStartProcessModal()
                                    }></i>
                            </span>
                        </div>
                    )}
                    <div className="col-sm-2">
                        <span className="rounded-0">
                            {filteredTaskList && filteredTaskList.length}/
                            {taskList && taskList.length}
                        </span>
                    </div>
                </div>
                <div className="col-sm-3 p-2">
                    <div className="col-sm-12">
                        <input
                            id="task-search-input"
                            type="text"
                            value={searchText}
                            className="form-control rounded-0"
                            onChange={event => handleTaskSearch(event)}
                            placeholder="Search Task ID, Task Name, Assignee"
                        />
                    </div>
                </div>
                <div className="col-sm-4 p-2 d-flex">
                    <div className="inbox-date-range">
                        <DateRangePicker
                            startDate={startDate}
                            startDateId="startDateId"
                            endDate={endDate}
                            endDateId="endDateId"
                            startDatePlaceholderText="Date From"
                            endDatePlaceholderText="Date To"
                            isOutsideRange={() => false}
                            onDatesChange={handleDatesChange}
                            focusedInput={focusedInput}
                            onFocusChange={focusedInput =>
                                setFocusedInput(focusedInput)
                            }
                            numberOfMonths={2}
                            daySize={30}
                            displayFormat={DATE_FORMAT_FOR_DATE_PICKER_VIEW}
                            block
                            showDefaultInputIcon
                            enableOutsideDays
                        />
                        <i
                            className="fa fa-close"
                            onClick={clearDates}></i>
                    </div>
                </div>
                {/* <div className="col-sm-12 task-panel-filters process-task-title chart-title">

                </div> */}
            </div>
            <div className="row">
                <TaskTable
                    taskList={filteredTaskList}
                    currentTask={selectedTask}
                    data={data}
                    parsedOptions={parsedOptions}
                />
            </div>
            <div className="row">
                <ModalBox />
            </div>
        </div>
    );

    function renderModalBox() {
        return <ModalBox />;
    }

    function renderProcessList() {
        return (
            <div
                id="select-process"
                className="select-process">
                {/* <div className="row">
                    <div className="col">
                        <p>
                            Click any of the available types to create task.
                        </p>
                    </div>
                </div> */}
                {processList.length == 0 && <span>No Process Available</span>}

                {processList &&
                    processList.map((process, index) => {
                        return (
                            <>
                                {process?.hide_inbox_start !== "YES" && (
                                    <div
                                        className="process-item table-edit-font pointer"
                                        title="Start Process"
                                        // data-bs-dismiss="modal"
                                        onClick={() =>
                                            handleProcessSelection(process)
                                        }>
                                        <i className="fa-solid fa-diagram-project me-2"></i>
                                        <a href="#">{process.process_title}</a>
                                    </div>
                                )}
                            </>
                        );
                    })}
            </div>
        );
    }

    function renderStepProcessor() {
        if (!selectedTask || selectedTask.id === "") {
            return <span>Loading...</span>;
        }
        return (
            <div className="row">
                <div className="col-sm-7">
                    <StepProcessor
                        task={selectedTask}
                        userList={userList}
                        userDetails={userDetails}
                        handleProcessActions={handleStepProcessActions}
                        showComments={showComments}
                        setShowComments={setShowComments}
                        getProfileImage={getProfileImage}
                        getDisplayName={getDisplayName}
                    />
                </div>
                <div className="col-sm-5 comment-panel">
                    <CommentBox
                        task={selectedTask}
                        getProfileImage={getProfileImage}
                        getDisplayName={getDisplayName}
                    />
                </div>
            </div>
        );
    }

    function TaskTable({ taskList, currentTask, data, parsedOptions }) {
        const [pageSize, setPageSize] = useState(5);
        const [current, setCurrent] = useState(1);
        const getPaginateData = (current, pageSize) => {
            return filteredTaskList.slice(
                (current - 1) * pageSize,
                current * pageSize,
            );
        };

        const getDynamicValue = (task, option) => {
            let value = "";
            if (option.value === "date_created") {
                value = formatDateTimeForUserView(task.date_created);
            } else if (option.value === "due_date") {
                value = formatDateTimeForUserView(task.due_date);
            } else if (option.value === "subject") {
                value = task.variables[option.value];
                if (!value || value) {
                    value = task.process_name;
                }
            } else if (task.variables[option.value]) {
                value = task.variables[option.value];
            } else if (option.value === "start_time") {
                value = formatDateTimeForUserView(task.start_time);
            } else if (task.variables[option.value]) {
                value = task.variables[option.value];
            }
            return value;
        };

        const getDynamicValueOld = (task, options) => {
            let matchedValues = [];

            options.forEach(option => {
                if (option.type === "dynamic") {
                    // For dynamic options, check in task.variables
                    if (task.variables[option.value]) {
                        matchedValues.push(task.variables[option.value]);
                    }
                } else if (option.type === "default") {
                    // For default options, check in task
                    if (task[option.value]) {
                        matchedValues.push(task[option.value]);
                    }
                }
            });

            // Join matched values with a separator, if needed
            return matchedValues;
        };

        function extractDate(dateStr) {
            const datePart = dateStr.split(" ")[0];
            const date = new Date(datePart);
            if (isNaN(date.getTime())) {
                console.error("Invalid date string:", dateStr);
                return 0;
            }
            return date.getTime();
        }

        function extractTime(dateStr) {
            const timePart = dateStr.split(" ")[1];
            const time = new Date(`1970-01-01T${timePart}Z`); // Using a fixed date to parse time
            if (isNaN(time.getTime())) {
                console.error("Invalid time string:", dateStr);
                return 0;
            }
            return time.getTime();
        }

        function sortData(option) {
            let sortedArray = [];
            let newSortOrder = sortOrder == "asc" ? "dsc" : "asc";
            setSortColumn(option.value);
            setSortOrder(newSortOrder);
            if (option.value == "date_created") {
                sortedArray = filteredTaskList.sort((a, b) => {
                    let key1 = Date.parse(a.date_created);
                    let key2 = Date.parse(b.date_created);
                    if (isNaN(key1) || isNaN(key2)) {
                        console.error("Invalid date values", key1, key2);
                        return 0;
                    }
                    return newSortOrder == "dsc" ? key2 - key1 : key1 - key2;
                });
            } else if (option.value == "due_date") {
                sortedArray = filteredTaskList.sort((a, b) => {
                    let key1 = Date.parse(a.due_date);
                    let key2 = Date.parse(b.due_date);
                    if (isNaN(key1) || isNaN(key2)) {
                        console.error("Invalid time values", key1, key2);
                        return 0;
                    }
                    return newSortOrder == "dsc" ? key2 - key1 : key1 - key2;
                });
            } else if (
                option.value == "task_name" ||
                option.value == "subject"
            ) {
                sortedArray = filteredTaskList.sort((a, b) => {
                    let key1 = a.process_name || "";
                    let key2 = b.process_name || "";
                    return newSortOrder === "dsc"
                        ? key1.localeCompare(key2)
                        : key2.localeCompare(key1);
                });
            } else if (option.value == "assignee") {
                sortedArray = filteredTaskList.sort((a, b) => {
                    let key1 = a.assignee || "";
                    let key2 = b.assignee || "";

                    if (!key1 && key2) return 1;
                    if (key1 && !key2) return -1;

                    return newSortOrder === "dsc"
                        ? key2.localeCompare(key1)
                        : key1.localeCompare(key2);
                });
            } else {
                sortedArray = filteredTaskList.sort((a, b) => {
                    let key1 = a.variables[option.value] || "";
                    let key2 = b.variables[option.value] || "";
                    return newSortOrder === "dsc"
                        ? key1.localeCompare(key2)
                        : key2.localeCompare(key1);
                });
            }

            setFilteredTaskList([...sortedArray]);
        }

        return (
            <>
                <div className="row">
                    <Table
                        key="task-table"
                        className="s2a-table table-bordered mb-0 s2a-user-table">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                {/* <Th className="col-sm-1 text-left">Date</Th>
                                <Th className="col-sm-1 text-left">Time</Th>
                                <Th className="col-sm-1 text-left">User</Th>
                                <Th className="col-sm-1 text-left">
                                    Task ID
                                </Th>
                                <Th className="col-sm-2 text-left">Subject</Th>
                                <Th className="col-sm-1 text-left">Priority</Th>
                                <Th className="col-sm-1 text-left">
                                    Department
                                </Th>
                                <Th className="col-sm-1 text-left">Action</Th>
                                <Th className="col-sm-3 text-left">Notes</Th> */}
                                {data?.use_dynamic === true &&
                                    parsedOptions.length > 0 &&
                                    parsedOptions.map(option => (
                                        <Th
                                            key={option.id}
                                            onClick={() => sortData(option)}
                                            className={`col-sm-1 text-left ${option.value}`}>
                                            {option.label}
                                            <span
                                                className="ms-2 mt-2"
                                                title={sortOrder}>
                                                {sortColumn == option.value ? (
                                                    sortOrder == "asc" ? (
                                                        <i className="fa-solid fa-sort-down"></i>
                                                    ) : (
                                                        <i className="fa-solid fa-sort-up"></i>
                                                    )
                                                ) : (
                                                    ""
                                                )}
                                            </span>
                                        </Th>
                                    ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {getPaginateData(current, pageSize).map(
                                (task, i) => {
                                    return (
                                        <Tr>
                                            {/* <code>{JSON.stringify(parsedOptions)}</code> */}
                                            {parsedOptions.length > 0 &&
                                                parsedOptions.map(option => (
                                                    <Td
                                                        key={option.id}
                                                        className="col-sm-1 task-cell text-left">
                                                        <div
                                                            className={`task-cell ${option.value}`}
                                                            title={
                                                                task.variables[
                                                                    option.value
                                                                ] || ""
                                                            }>
                                                            {option.value ==
                                                            "task_name" ? (
                                                                <a
                                                                    href="#"
                                                                    onClick={() => {
                                                                        handleTaskSelection(
                                                                            task,
                                                                        );
                                                                    }}>
                                                                    {
                                                                        task.task_name
                                                                    }
                                                                </a>
                                                            ) : option.value ==
                                                              "assignee" ? (
                                                                <div className="task-comment-stamp">
                                                                    <img
                                                                        src={getProfileImage(
                                                                            task.assignee
                                                                                ? task.assignee
                                                                                : task.assignee,
                                                                        )}
                                                                        alt="image"
                                                                        // onError="this.src='/app/theme/images/default-user-profile-img.png';this.onerror='';"
                                                                        title={getDisplayName(
                                                                            task.assignee
                                                                                ? task.assignee
                                                                                : task.assignee,
                                                                        )}></img>
                                                                </div>
                                                            ) : (
                                                                <span>
                                                                    {getDynamicValue(
                                                                        task,
                                                                        option,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Td>
                                                ))}
                                        </Tr>
                                    );
                                },
                            )}
                        </Tbody>
                    </Table>
                </div>
                <div className="row">
                    <div className="col-sm-7"></div>

                    <div className="col-sm-5 p-0">
                        <TablePagination
                            size={pageSize}
                            setSize={setPageSize}
                            current={current}
                            setCurrent={setCurrent}
                            tableData={taskList}
                        />
                    </div>
                </div>
            </>
        );
    }

    function ModalBox() {
        function handleClose() {
            setShowModal(false);
            setSelectedProcessId("");
        }

        return (
            <>
                <Modal
                    className="s2a-modal"
                    show={showModal}
                    onHide={() => handleClose()}
                    size={processModalMode == "task" ? "xl" : "lg"}
                    fullscreen={"lg"}
                    backdrop="static">
                    <Modal.Header>
                        <Modal.Title className="modal-title">
                            <span>
                                {processModalMode == "start"
                                    ? "Start Process"
                                    : "Complete Task"}
                            </span>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={handleClose}></i>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* <code>{JSON.stringify(processModalMode)}</code> */}
                        {selectedProcessId === ""
                            ? renderProcessList()
                            : processModalMode == "start"
                            ? renderStartStepProcessor()
                            : renderStepProcessor()}
                    </Modal.Body>
                    {/* <Modal.Footer></Modal.Footer> */}
                </Modal>
            </>
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

export default RenderTableView;
