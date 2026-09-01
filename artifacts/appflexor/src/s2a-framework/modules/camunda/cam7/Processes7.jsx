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
    /* Keeps the last fetched all-tasks count so the "All Tasks" stat card
       stays accurate even when the user switches to myTask mode (which
       re-fetches only the user's tasks, making taskList.length wrong). */
    const [allTasksCount, setAllTasksCount] = useState(0);

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
    const [showComments, setShowComments] = useState(() => {
        try {
            const savedState = localStorage.getItem(
                "camunda7.inbox.showComments",
            );
            return savedState === null ? true : savedState === "true";
        } catch {
            return true;
        }
    });
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        try {
            localStorage.setItem(
                "camunda7.inbox.showComments",
                String(showComments),
            );
        } catch {
            // Keep the in-memory preference when storage is unavailable.
        }
    }, [showComments]);

    // Side Effects
    useEffect(() => {
        enableTooltip();
        getTenantData();
        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        getTaskList();
    }, [taskFilterType, data?.process_scope, data?.process_keys]);

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
        } else if (actionType === actions.draft) {
            setCurrentProcessState({
                initial: true,
                start: false,
                step: false,
            });
            setSelectedProcessId("");
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
        debugger;
        let serviceParams = "";
        let filterCondition = "";
        let serviceKeyOrder = "cam.list.my.tasks";
        if (data?.process_scope === "SELECTED") {
            filterCondition = " and process.proc_def_key_ in ('" + (Array.isArray(data?.process_keys) ? data.process_keys.join("','") : "") + "')";
        }
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
            filterCondition = filterCondition + " and task.Assignee_ in (" + _params + ")";
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

                        const processScope = data?.process_scope || "ALL";
                        const configuredProcessKeys = Array.isArray(data?.process_keys)
                            ? data.process_keys
                            : tryParseJSONObject(data?.process_keys || "[]");
                        if (processScope === "SELECTED") {
                            const selectedKeys = new Set((Array.isArray(configuredProcessKeys) ? configuredProcessKeys : []).map(String));
                            list = list.filter(item => selectedKeys.has(String(item.proc_def_key || item.process_def_key || "")));
                        }

                        /* Persist the all-tasks count separately so it
                           remains correct when switching to myTask mode. */
                        if (taskFilterType === "allTask") {
                            setAllTasksCount(list.length);
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
                showComments={showComments}
                setShowComments={setShowComments}
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
        } catch (e) { }
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
                    allTasksCount={allTasksCount}
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
        process_scope: "ALL",
        process_keys: [],
        inbox_fields: initialInboxOptions,
    };
    const [config, setConfig] = useState(initialConfig);
    const [options, setOptions] = useState(initialInboxOptions);
    const [configProcessList, setConfigProcessList] = useState([]);
    const [processListLoading, setProcessListLoading] = useState(false);
    const [showProcessSelector, setShowProcessSelector] = useState(false);
    const [processSearch, setProcessSearch] = useState("");

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
        // { name: "Table View", code: "TABLE-VIEW", selected: false },
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
            const savedProcessKeys = Array.isArray(data.process_keys)
                ? data.process_keys
                : tryParseJSONObject(data.process_keys || "[]");
            setOptions(data?.inbox_fields || initialInboxOptions);
            setConfig({ ...initialConfig, ...data, process_keys: Array.isArray(savedProcessKeys) ? savedProcessKeys : [] });
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

    useEffect(() => {
        if (!show) return;
        setProcessListLoading(true);
        axios.post(API_URL + "?service.key=masterKey.tenantData", {
            dataKeys: [{ serviceParams: "", dataKey: "processMap", serviceKey: "process.map", mode: "formData" }],
        }).then(response => {
            const rows = response.data?.C_STATUS === "SUCCESS" ? response.data.C_DATA?.processMap || [] : [];
            const uniqueRows = [...new Map(rows.filter(item => item.process_key).map(item => [String(item.process_key), item])).values()];
            setConfigProcessList(uniqueRows.sort((left, right) => String(left.title || left.process_key).localeCompare(String(right.title || right.process_key))));
        }).catch(error => {
            console.error("Unable to load process map:", error);
            setConfigProcessList([]);
        }).finally(() => setProcessListLoading(false));
    }, [show]);

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

    function handleProcessSelection(processKey, checked) {
        setConfig(previous => {
            const selected = new Set(Array.isArray(previous.process_keys) ? previous.process_keys : []);
            if (checked) selected.add(processKey);
            else selected.delete(processKey);
            return { ...previous, process_keys: [...selected] };
        });
    }

    const selectedProcessKeys = Array.isArray(config.process_keys) ? config.process_keys : [];
    const selectedConfigProcesses = selectedProcessKeys.map(processKey =>
        configProcessList.find(process => String(process.process_key) === String(processKey)) || { process_key: processKey, title: processKey },
    );
    const processSearchTerm = processSearch.toLowerCase().trim();
    const filteredConfigProcesses = configProcessList.filter(process =>
        !processSearchTerm || String(process.title || "").toLowerCase().includes(processSearchTerm) || String(process.process_key || "").toLowerCase().includes(processSearchTerm),
    );

    return (
        <>
            <Modal
                className="s2a-modal"
                dialogClassName="inbox-process-config-dialog"
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
                                className={`${toggleModalWindow === "maximize"
                                    ? "visually-hidden"
                                    : ""
                                    } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${toggleModalWindow === "restore"
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
                        <section className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3" aria-labelledby="inbox-process-scope-title">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div><h3 id="inbox-process-scope-title" className="mb-0 text-sm font-bold text-slate-900">Processes to display</h3><p className="mb-0 text-xs text-slate-500">Choose which process tasks are retrieved for this Inbox.</p></div>
                                {config?.process_scope === "SELECTED" && <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">{(config.process_keys || []).length} selected</span>}
                            </div>
                            <div className="mb-2 flex flex-wrap gap-4 text-sm">
                                <label className="inline-flex cursor-pointer items-center gap-2"><input type="radio" className="form-check-input m-0" name="process_scope" value="ALL" checked={(config?.process_scope || "ALL") === "ALL"} onChange={event => setConfig(previous => ({ ...previous, process_scope: event.target.value }))} /><span> All processes</span></label>
                                <label className="inline-flex cursor-pointer items-center gap-2"><input type="radio" className="form-check-input m-0" name="process_scope" value="SELECTED" checked={config?.process_scope === "SELECTED"} onChange={event => { setConfig(previous => ({ ...previous, process_scope: event.target.value })); setShowProcessSelector(true); }} /><span> Selected processes</span></label>
                            </div>
                            {config?.process_scope === "SELECTED" && <div className="rounded-lg border border-slate-200 bg-white p-2"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-600">Selected processes</span><button type="button" onClick={() => { setProcessSearch(""); setShowProcessSelector(true); }} className="!rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"><i className="fa-solid fa-list-check mr-1.5" />Manage</button></div>{selectedConfigProcesses.length ? <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{selectedConfigProcesses.map(process => <span key={process.process_key} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200"><span className="truncate">{process.title || process.process_key}</span><button type="button" onClick={() => handleProcessSelection(String(process.process_key), false)} className="shrink-0 text-indigo-400 hover:text-red-600" aria-label={`Remove ${process.title || process.process_key}`}><i className="fa-solid fa-xmark" /></button></span>)}</div> : <button type="button" onClick={() => setShowProcessSelector(true)} className="w-full rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600">No processes selected. Choose processes.</button>}</div>}
                        </section>
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
            <Modal
                show={showProcessSelector}
                onHide={() => setShowProcessSelector(false)}
                backdrop="static"
                centered
                size="lg"
                className="inbox-process-selector-modal"
                backdropClassName="inbox-process-selector-backdrop"
                style={{ zIndex: 2000 }}>
                <Modal.Header closeButton>
                    <Modal.Title className="modal-title"><span><i className="fa-solid fa-diagram-project me-2 text-primary" />Select processes</span></Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-3">
                        <label className="relative block w-50">
                            <span className="sr-only">Search processes</span>
                            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400 pl-2 pb-2">
                                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                            </span>
                            <input type="search" autoFocus value={processSearch} onChange={event => setProcessSearch(event.target.value)} placeholder="Search process name or key…" className="form-control !rounded-xl py-3.5 !pl-10 pr-3" /></label>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>{filteredConfigProcesses.length} available · {selectedProcessKeys.length} selected</span>{selectedProcessKeys.length > 0 && <button type="button" onClick={() => setConfig(previous => ({ ...previous, process_keys: [] }))} className="font-semibold text-red-600 hover:underline">Clear selection</button>}</div>
                    </div>
                    <div className="max-h-[55vh] overflow-y-auto p-3">
                        {processListLoading ? <p className="mb-0 p-8 text-center text-sm text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2" />Loading processes…</p> : filteredConfigProcesses.length ? <div className="grid gap-2 sm:grid-cols-2">{filteredConfigProcesses.map((process, index) => { const processKey = String(process.process_key || ""); const checked = selectedProcessKeys.includes(processKey); return <label key={process.id || processKey || index} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${checked ? "border-indigo-300 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"}`}><input type="checkbox" className="form-check-input mt-0.5 shrink-0" checked={checked} onChange={event => handleProcessSelection(processKey, event.target.checked)} /><span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{process.title || processKey}</strong><small className="mt-0.5 block truncate text-xs text-slate-500">{processKey}</small></span></label>; })}</div> : <div className="p-10 text-center text-sm text-slate-500"><i className="fa-solid fa-magnifying-glass mb-2 block text-xl text-slate-300" />No processes match your search.</div>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" onClick={() => setShowProcessSelector(false)} className="btn button-theme btn-sm rounded-pill px-4"><i className="fa-solid fa-check me-2" />Done</button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
