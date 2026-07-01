import axios from "axios";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { AppContext } from "../../../../AppContext";
import { API_URL } from "../../../Config";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import {
    enableTooltip,
    disposeTooltip,
    filterArrayByTerms,
    formatDateTimeForUserView,
    makeid,
    tryParseJSONObject,
} from "../../../utils/utils";
import DesignerContext from "../../content-management/page-builder/Context/DesignerContext";
import { isEmpty } from "../../data-management/form-builder/Forms/FormViewer/utils";
import { CommentBox } from "../CommentBox/CommentBox";
import { actions } from "../constants";
import "../styles.css";
import StartStepProcessor from "./StartStepProcessor7";
import StepProcessor from "./StepProcessor7";
import { DndCard } from "../../../components/drag-and-drop-listing/Card";
import DndWrapper from "../../../components/drag-and-drop-listing";
import RenderListView from "../cam7/InboxListView";
import RenderTableView from "../cam7/InboxTableView";
import { moveChecker } from "../../data-management/form-builder/Designer/props-editors/utils";

const USER_ROLES = {
    user: "ROLE_USER",
    admin: "ROLE_ADMIN",
};

const taskInitState = {
    id: "",
    name: "",
    assignee: "",
    business_key: "",
    instance_id: "",
    process_name: "",
    proc_def_key: "",
};

function Processes(props) {
    const {
        mode,
        modeType,
        component: { data },
    } = props;
    const appContext = useContext(AppContext);
    const context = useContext(DesignerContext);

    const [taskList, setTaskList] = useState([]);
    const [filteredTaskList, setFilteredTaskList] = useState([]);
    const [selectedTask, setSelectedTask] = useState(taskInitState);

    const [processList, setProcessList] = useState([]);
    const [selectedProcessId, setSelectedProcessId] = useState("");
    const [renderProcessModal, setRenderProcessModal] = useState(false);
    const [taskView, setTaskView] = useState("");
    const [taskFilterType, setTaskFilterType] = useState("allTask");
    const [currentProcessState, setCurrentProcessState] = useState({
        initial: true,
        start: false,
        step: false,
    });

    const [userList, setUserList] = useState([]);
    const [userDetails, setUserDetails] = useState({
        id: "",
        username: "",
    });
    const tenantId = appContext.tenantSubscription.tenant_id;
    const useOrg = tryParseJSONObject(localStorage.getItem("userOrg"));
    const org_id = useOrg?.id;

    const [notification, setNotification] = useState({
        message: "Last updated on " + formatDateTimeForUserView(new Date()),
        count: 5,
    });

    const keysToSearch = [
        "task_def_key",
        "json_data",
        "name",
        "assignee",
        "proc_def_key",
        "created",
        "process_name",
    ];

    const [show, setShow] = useState(false);
    const [showComments, setShowComments] = useState(true);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // Side Effects
    useEffect(() => {
        enableTooltip();
        getTenantData();
        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        getTaskList();
    }, [taskFilterType]);

    useEffect(() => {
        if (renderProcessModal) {
            getProcessList();
        }
    }, [renderProcessModal]);

    useEffect(() => {
        if (data && data.auto_refresh) {
            const time = parseInt(data?.auto_refresh);
            let intervalID = setInterval(getTaskList(), time);
            return () => clearInterval(intervalID);
        }
    }, [data?.auto_refresh]);

    useEffect(() => {
        // console.log("*********** calling data effect");
        if (
            mode &&
            modeType &&
            (mode === modeType.render || mode === modeType.preview)
        ) {
            setTaskView(data?.task_view);
        }
    }, [data]);

    useEffect(() => {
        // console.log("*********** calling notification effect");
        if (notification.count > 0) {
            setTimeout(() => {
                getTaskList();
                setNotification(prev => ({
                    ...prev,
                    count: 0,
                }));
            }, 100);
        }
    }, [taskList, notification.count]);

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

    useEffect(() => {
        if (data && data?.show_task === "MY-TASK") {
            _handleTypeChange("myTask");
        } else if (data && data?.show_task === "ALL-TASK") {
            _handleTypeChange("allTask");
        }
    }, [data, data?.show_task]);

    function _handleTypeChange(value) {
        setTaskFilterType(value);

        setSelectedTask(taskInitState);

        setCurrentProcessState({
            initial: true,
            start: false,
            step: false,
        });
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
            });
            setSelectedTask(taskInitState);
            syncTaskList();
        } else if (actionType === actions.update) {
            syncTaskList();
        } else if (actionType === actions.draft) {
            syncTaskList();
        }
    }

    function syncTaskList() {
        getTaskList();
    }

    // API calls
    function getTaskList() {
        let serviceParams = "";
        let filterCondition = "";
        let serviceKeyOrder = "cam.list.my.tasks";
        if (taskFilterType == "allTask") {
            serviceKeyOrder = "cam.list.task.all";
            serviceParams = "";
        } else {
            let username = "'" + appContext.profile.username + "'";
            let delegates = appContext.profile?.delegates;
            let _params =
                !delegates || delegates == ""
                    ? username
                    : username + "," + delegates;
            filterCondition = _params;
        }

        let dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "taskListOrder",
                    serviceKey: serviceKeyOrder,
                    mode: "formData",
                    IN_FILTER: filterCondition,
                },
                // {
                //     serviceParams: "",
                //     dataKey: "user",
                //     serviceKey: "cam.current.user",
                //     mode: "formData",
                // },
            ],
        };

        axios
            .post(API_URL + "?service.key=bpm.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let list = response.data.C_DATA.taskListOrder;

                    if (list && typeof list === "object") {
                        list = list.map(item => {
                            // Parse task.variables using tryParseJSONObject
                            if (item.variables) {
                                item.variables = tryParseJSONObject(
                                    item.variables,
                                );
                            }

                            // Update the created field
                            if (item.created) {
                                item.created = `Created ${getTimeAgo(
                                    item.created,
                                )}`;
                            }

                            return item; // Ensure the modified item is returned
                        });

                        if (org_id) {
                            list = list.filter(
                                item =>
                                    item.variables &&
                                    item.variables?.org_id === org_id || !item.variables?.org_id,
                            );
                        }

                        setTaskList(list);
                        setFilteredTaskList(list);

                        let el = document.getElementById("task-search-input");
                        let textToSearch = el ? el.value : "";

                        if (textToSearch && textToSearch !== "") {
                            let result = filterArrayByTerms(
                                list,
                                textToSearch,
                                keysToSearch,
                            );
                            setFilteredTaskList(result);
                        } else {
                            setFilteredTaskList(list);
                        }

                        if (
                            selectedTask.id &&
                            selectedTask.id !== "" &&
                            selectedTask.id !== "new"
                        ) {
                            let updatedState = getUpdatedTask(
                                selectedTask,
                                list,
                                taskInitState,
                            );
                            setSelectedTask(updatedState);
                            // getAndSetSelectedTask(updatedState);
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getTenantData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "userList",
                    serviceKey: "bpm.list.all.users",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "user",
                    serviceKey: "sys.user.profile",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let userList = response.data.C_DATA.userList;
                    if (userList && typeof userList === "object") {
                        setUserList(userList);
                    }

                    let user = response.data.C_DATA.user;

                    if (user && typeof user === "object") {
                        if (user[0]) {
                            setUserDetails(user[0]);
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getProcessList() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "process",
                    serviceKey: "sys.process.all",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setProcessList(response.data.C_DATA.process);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    // Utils func

    function getTimeAgo(date) {
        return convertDBDateToFromNow(date);
    }

    function convertDBDateToFromNow(dateInString) {
        // Takes date in UTC and convert accordingto timezone and returns time fromNow
        let date = new Date(dateInString);
        let dateWithTimeZone = new Date(
            date.getTime() + date.getTimezoneOffset() * 60 * 1000,
        );
        let offset = date.getTimezoneOffset() / 60;
        let hours = date.getHours();
        dateWithTimeZone.setHours(hours - offset);
        return moment(dateWithTimeZone).fromNow();
    }

    function getUpdatedTask(task, taskArr = [], defaultValue) {
        let taskId = task.id;
        let obj = { ...defaultValue };

        if (!taskId || taskId === "") {
            return defaultValue;
        } else {
            taskArr.map(el => {
                if (el.id === taskId) obj = { ...obj, ...el };
            });
        }

        return obj;
    }

    function renderStepProcessor() {
        if (
            selectedTask.id === "" ||
            userList.length === 0 ||
            userDetails.user_id === ""
        ) {
            return <span>Loading...</span>;
        }

        return (
            <StepProcessor
                task={selectedTask}
                userList={userList}
                userDetails={userDetails}
                handleProcessActions={handleStepProcessActions}
            />
        );
    }

    function getObjectById(arr, idField, idValue) {
        let result;
        arr.forEach(obj => {
            if (obj[idField] === idValue) {
                result = obj;
            }
        });
        return result;
    }

    function getDisplayName(username) {
        let user = getObjectById(userList, "username", username);
        let displayname = username;
        if (user && user.fullname !== "") {
            displayname = user.fullname;
        }
        return displayname;
    }

    function getProfileImage(username) {
        let url = "/app/theme/images/default-user-profile-img.png";
        try {
            let user = getObjectById(userList, "username", username);
            if (user?.id && user?.profile_img !== "") {
                url =
                    "/file/service/dir_user/" +
                    user.id +
                    "/" +
                    user.profile_img;
            }
        } catch (e) {}
        return url;
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

    return (
        <ErrorBoundary>
            <ModalBox
                taskList={taskList}
                show={show}
                handleClose={handleClose}
                context={context}
                data={data}
            />
            {mode &&
                modeType &&
                (mode === modeType.readonly || mode === modeType.design) && (
                    <div
                        onClick={handleShow}
                        style={{ minHeight: "100px" }}
                        className="d-flex align-items-center justify-content-center">
                        <span className="text-muted cursor-pointer">
                            <span className="fa-solid fa-inbox icon-space"></span>
                            Module
                            <span className="text-danger">
                                &nbsp;Camunda7 Task List {data?.task_view}&nbsp;
                            </span>
                            added successfully
                        </span>
                    </div>
                )}
            {taskView == "LIST-VIEW" && (
                <RenderListView
                    processList={processList}
                    data={data}
                    syncTaskList={syncTaskList}
                    setTaskFilterType={setTaskFilterType}
                    taskFilterType={taskFilterType}
                    notification={notification}
                    taskList={taskList}
                    currentProcessState={currentProcessState}
                    setCurrentProcessState={setCurrentProcessState}
                    userDetails={userDetails}
                    setSelectedProcessId={setSelectedProcessId}
                    setRenderProcessModal={setRenderProcessModal}
                    filteredTaskList={filteredTaskList}
                    setFilteredTaskList={setFilteredTaskList}
                    selectedTask={selectedTask}
                    setSelectedTask={setSelectedTask}
                    getProfileImage={getProfileImage}
                    getDisplayName={getDisplayName}
                    showComments={showComments}
                    setShowComments={setShowComments}
                    userList={userList}
                    taskInitState={taskInitState}
                    selectedProcessId={selectedProcessId}
                    getTimeAgo={getTimeAgo}
                    dynamicFields={data?.inbox_fields}
                />
            )}
            {taskView == "TABLE-VIEW" && (
                <>
                    {/* props: {JSON.stringify(data?.inbox_fields)} */}
                    <RenderTableView
                        key="task-table-view"
                        processList={processList}
                        data={data}
                        syncTaskList={syncTaskList}
                        setTaskFilterType={setTaskFilterType}
                        taskFilterType={taskFilterType}
                        notification={notification}
                        setNotification={setNotification}
                        taskList={taskList}
                        currentProcessState={currentProcessState}
                        setCurrentProcessState={setCurrentProcessState}
                        userDetails={userDetails}
                        selectedProcessId={selectedProcessId}
                        setSelectedProcessId={setSelectedProcessId}
                        setRenderProcessModal={setRenderProcessModal}
                        filteredTaskList={filteredTaskList}
                        setFilteredTaskList={setFilteredTaskList}
                        // selectedTask={selectedTask}
                        // setSelectedTask={setSelectedTask}
                        getProfileImage={getProfileImage}
                        getDisplayName={getDisplayName}
                        showComments={showComments}
                        setShowComments={setShowComments}
                        userList={userList}
                        taskInitState={taskInitState}
                        getTimeAgo={getTimeAgo}
                        dynamicFields={props.component.props}
                    />
                </>
            )}
        </ErrorBoundary>
    );
}

export default Processes;
function ModalBox(props) {
    const { show, handleClose, context, data } = props;
    const initialInboxOptions = [
        {
            id: makeid(4),
            label: "Date Assigned",
            value: "date_created",
            type: "default",
        },
        // {
        //     id: makeid(4),
        //     label: "Time",
        //     value: "time_created",
        //     type: "dynamic",
        // },
        {
            id: makeid(4),
            label: "Due Date",
            value: "due_date",
            type: "default",
        },
        {
            id: makeid(4),
            label: "Assignee",
            value: "assignee",
            type: "default",
        },
        {
            id: makeid(4),
            label: "Task ID",
            value: "task_id",
            type: "dynamic",
        },
        {
            id: makeid(4),
            label: "Subject",
            value: "subject",
            type: "dynamic",
        },
        {
            id: makeid(4),
            label: "Task Name",
            value: "task_name",
            type: "default",
        },
        {
            id: makeid(4),
            label: "Department",
            value: "department",
            type: "dynamic",
        },
    ];
    const initialConfig = {
        show_task: "MY-TASK",
        task_view: "LIST-VIEW",
        auto_refresh: false,
        allow_start_task: true,
        use_dynamic: true,
        inbox_fields: initialInboxOptions,
    };
    const [config, setConfig] = useState(initialConfig);
    const [options, setOptions] = useState(initialInboxOptions);

    const [currentComponent, setCurrentComponent] = useState({});
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const [moveCard, setMoveCard] = useState(true);

    const [taskRadio, setTaskRadio] = useState([
        { name: "My task", code: "MY-TASK", selected: false },
        { name: "All task", code: "ALL-TASK", selected: true },
        { name: "Both", code: "BOTH", selected: false },
    ]);
    const [taskViewRadio, setTaskViewRadio] = useState([
        { name: "List View", code: "LIST-VIEW", selected: true },
        { name: "Table View", code: "TABLE-VIEW", selected: false },
    ]);

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            const data = context.selectedComponent.data;
            setCurrentComponent(context.selectedComponent);
        } else {
            // setConfig({});
            setCurrentComponent({});
        }
    }, [context]);

    useEffect(() => {
        if (data) {
            setOptions(data?.inbox_fields);
            setConfig(data ? data : initialConfig);
            selectTaskRadio(data?.show_task);
            selectTaskViewRadio(data?.task_view);
        }
    }, [data]);

    useEffect(() => {
        setConfig(prev => ({
            ...prev,
            inbox_fields: options,
        }));
    }, [options]);

    function handleShowTask(e, code) {
        const { name } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: code,
        }));
        selectRadio(code);
    }

    function selectTaskRadio(code) {
        let arr = [];
        taskRadio.forEach(item => {
            if (item.code === code) {
                item.selected = true;
                arr.push(item);
            } else {
                item.selected = false;
                arr.push(item);
            }
        });
        setTaskRadio(arr);
    }

    function selectTaskViewRadio(code) {
        let arr = [];
        taskViewRadio.forEach(item => {
            if (item.code === code) {
                item.selected = true;
                arr.push(item);
            } else {
                item.selected = false;
                arr.push(item);
            }
        });
        setTaskViewRadio(arr);
    }

    function selectRadio(code) {
        let arr = [];
        taskRadio.forEach(item => {
            if (item.code === code) {
                item.selected = true;
                arr.push(item);
            } else {
                item.selected = false;
                arr.push(item);
            }
        });
        setTaskRadio(arr);
    }

    function handleTaskView(e, code) {
        const { name } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: code,
        }));
        selectTaskViewRadio(code);
    }

    function addRadioOption() {
        let currentState = [...options];
        const count = currentState.filter(item => item.value !== "").length;

        let newOption = {
            id: makeid(4),
            label: `Field ${count + 1}`,
            value: `field${count + 1}`,
            type: "dynamic",
        };

        currentState.push(newOption);

        setOptions(currentState);
        let fieldId = "array";
        let str = JSON.stringify(currentState);
        handleRadioOptions(str, fieldId);
    }

    function handleRadioOptions(radioList) {
        // let _radioList = [];
        // let arr = [...radioList];

        // arr.map((opt) => {
        //     delete opt.id;
        //     _radioList.push(opt);
        // });
        let _components = { ...context.components };

        let componentProps = _components[currentComponent.id].props;
        let newProps = [];

        if (isEmpty(componentProps)) {
            let prop = {
                id: "options",
                label: "Dynamic Fields",
                type: "array",
                value: "",
                options: "",
                hidden: false,
            };
            let temp = prop;
            temp.options = radioList;
            newProps.push(temp);
        } else {
            componentProps &&
                componentProps.map(props => {
                    let temp = props;
                    temp.options = radioList;
                    newProps.push(temp);
                });
        }

        _components[currentComponent.id].props = newProps;
        context.setComponents(_components);
    }

    function handleRadioOptDelete(option, fieldId) {
        // Filter out the option to be deleted
        const _updatedArr = options.filter(opt => opt.id !== option.id);

        // Update the options state
        setOptions(_updatedArr);

        // Stringify and handle radio options if necessary
        const str = JSON.stringify(_updatedArr);
        handleRadioOptions(str, fieldId);
    }

    function handleSaveSetting() {
        if (!isEmpty(context)) {
            let _components = { ...context.components };

            let tempData = _components[currentComponent.id].data;
            tempData = { ...tempData, ...config };
            _components[currentComponent.id].data = tempData;
            context.setComponents(_components);
            handleClose();
        }
    }

    function handleOptionsChange(e, fieldId) {
        let id = e.target.getAttribute("data-id");
        let value = e.target.value;
        let name = e.target.name;

        let _updatedArr = [];

        options &&
            options.map(opt => {
                if (opt.id === id) {
                    let obj = opt;
                    obj[name] = value;

                    _updatedArr.push(obj);
                } else {
                    _updatedArr.push(opt);
                }
            });
        setOptions(_updatedArr);
    }

    return (
        <>
            <Modal
                className="s2a-modal"
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Processes Config</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={handleClose}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <>
                        <div className="d-flex">
                            <label>Show Task List :</label>
                            <div className="ms-2 d-flex">
                                {taskRadio.map((item, index) => (
                                    <div
                                        key={index}
                                        className="d-block me-2">
                                        <span className="align-middle me-2 mt-1">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="show_task"
                                                value={config?.show_task}
                                                id={item.name}
                                                checked={
                                                    item.code ===
                                                    config?.show_task
                                                }
                                                onChange={e =>
                                                    handleShowTask(e, item.code)
                                                }
                                            />
                                        </span>
                                        <label
                                            htmlFor={item.name}
                                            value={item.code}>
                                            {item.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="d-flex">
                            <label>Task View :</label>
                            <div className="ms-2 d-flex">
                                {taskViewRadio.map((item, index) => (
                                    <div
                                        key={index}
                                        className="d-block me-2">
                                        <span className="align-middle me-2 mt-1">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="task_view"
                                                value={config?.task_view}
                                                id={item.name}
                                                checked={
                                                    item.code ===
                                                    config?.task_view
                                                }
                                                onChange={e =>
                                                    handleTaskView(e, item.code)
                                                }
                                            />
                                        </span>
                                        <label
                                            htmlFor={item.name}
                                            value={item.code}>
                                            {item.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="me-2">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={config?.allow_start_task}
                                    onChange={e =>
                                        setConfig({
                                            ...config,
                                            allow_start_task: e.target.checked,
                                        })
                                    }
                                />
                            </span>
                            <label>Allow Start Task</label>
                        </div>
                        {/* <div className="mt-2">
                            <span className="me-2">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={config?.use_dynamic}
                                    onChange={e =>
                                        setConfig({
                                            ...config,
                                            use_dynamic: e.target.checked,
                                        })
                                    }
                                />
                            </span>
                            <label> Use Dynamic Field Mapping</label>
                        </div> */}

                        {config?.use_dynamic === true && (
                            <div className="mt-4">
                                <div className="col-sm-12">
                                    <div className="col-sm-8">
                                        <label className="form-label">
                                            Field Mapping
                                        </label>
                                        <span className="float-end">
                                            <span className="me-1 px-2 rounded-circle">
                                                {options.length}
                                            </span>
                                            <span
                                                className="float-end pointer"
                                                data-bs-toggle="tooltip"
                                                data-bs-title="Create new list item"
                                                onClick={addRadioOption}>
                                                <i className="fs-5 fa-solid fa-plus"></i>
                                            </span>
                                        </span>
                                    </div>
                                    <DndWrapper>
                                        <div
                                            id={`array-selection`}
                                            className="form-accordion accordion accordion-flush">
                                            {options &&
                                                options.map((option, index) => {
                                                    const accordionId =
                                                        "accord" + option?.id;
                                                    return (
                                                        <DndCard
                                                            id={option.id}
                                                            index={index}
                                                            setItems={
                                                                setOptions
                                                            }
                                                            move={moveCard}>
                                                            <div
                                                                key={option.id}
                                                                className="col-sm-12 d-flex">
                                                                <div className="accordion-item col-sm-8">
                                                                    <h2 className="accordion-header">
                                                                        <button
                                                                            id={
                                                                                accordionId
                                                                            }
                                                                            onClick={() =>
                                                                                moveChecker(
                                                                                    accordionId,
                                                                                    setMoveCard,
                                                                                )
                                                                            }
                                                                            className="accordion-button p-2 collapsed"
                                                                            type="button"
                                                                            data-bs-toggle="collapse"
                                                                            data-bs-target={`#a${index}`}>
                                                                            {option.label +
                                                                                " (" +
                                                                                option.value +
                                                                                ")"}
                                                                        </button>
                                                                    </h2>
                                                                    <div
                                                                        id={`a${index}`}
                                                                        className="accordion-collapse collapse"
                                                                        data-bs-parent={`#array-selection`}>
                                                                        <div className="accordion-body py-1 px-2 d-flex">
                                                                            <div className="me-1">
                                                                                <label className="mb-0 form-label">
                                                                                    Label
                                                                                </label>
                                                                                <input
                                                                                    className="form-control form-control-sm "
                                                                                    type="text"
                                                                                    data-id={
                                                                                        option.id
                                                                                    }
                                                                                    name="label"
                                                                                    value={
                                                                                        option.label
                                                                                    }
                                                                                    onChange={e =>
                                                                                        handleOptionsChange(
                                                                                            e,
                                                                                            "array",
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </div>
                                                                            <div className="">
                                                                                <label className="mb-0 form-label">
                                                                                    Value
                                                                                </label>
                                                                                <input
                                                                                    disabled={
                                                                                        option?.type ==
                                                                                        "default"
                                                                                    }
                                                                                    className="form-control form-control-sm"
                                                                                    type="text"
                                                                                    name="value"
                                                                                    data-id={
                                                                                        option.id
                                                                                    }
                                                                                    value={
                                                                                        option.value
                                                                                    }
                                                                                    onChange={e =>
                                                                                        handleOptionsChange(
                                                                                            e,
                                                                                            "array",
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {option?.type ==
                                                                    "dynamic" && (
                                                                    <div
                                                                        onClick={() =>
                                                                            handleRadioOptDelete(
                                                                                option,
                                                                                "array",
                                                                            )
                                                                        }
                                                                        className="col-sm-2 d-flex justify-content-center align-items-center pointer">
                                                                        <i className=" fa-solid fa-trash text-danger ps-2"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </DndCard>
                                                    );
                                                })}
                                        </div>
                                    </DndWrapper>
                                </div>
                            </div>
                        )}
                        {/* <div className="mt-2">
                            <label>Auto Refresh Interval (Seconds)</label>

                            <input
                                type="number"
                                className="form-control"
                                value={config?.auto_refresh}
                                onChange={e =>
                                    setConfig({
                                        ...config,
                                        auto_refresh: e.target.value,
                                    })
                                }
                            />
                        </div> */}
                        <div className="text-end">
                            <button
                                onClick={handleSaveSetting}
                                className="mt-2 btn button-theme">
                                Ok
                            </button>
                        </div>
                    </>
                </Modal.Body>
            </Modal>
        </>
    );
}
