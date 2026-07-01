import axios from "axios";
import moment from "moment";
import React, { useContext, useEffect, useState, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import { AppContext } from "../../../../AppContext";
import { API_URL, BPM_API_URL } from "../../../Config";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import {
    disposeTooltip,
    enableTooltip,
    filterArrayByTerms,
    formatDateForUserViewLocale,
    formatDateTimeForUserView,
} from "../../../utils/utils";
import DesignerContext from "../../content-management/page-builder/Context/DesignerContext";
import { isEmpty } from "../../data-management/form-builder/Forms/FormViewer/utils";

import "../styles.css";

import { StompSessionProvider, useSubscription } from "react-stomp-hooks";
import { DndCard } from "../../../components/drag-and-drop-listing/Card";
import DndWrapper from "../../../components/drag-and-drop-listing";
import { makeid, tryParseJSONObject } from "../../../utils/utils";
import { moveChecker } from "../../data-management/form-builder/Designer/props-editors/utils";
import { count } from "d3";
import RenderListView from "./InboxListView";
import RenderTableView from "./InboxTableView";

const USER_ROLES = {
    user: "ROLE_USER",
    admin: "ROLE_ADMIN",
};

const taskInitState = {
    id: "new",
    createdby: "",
    modifiedby: "",
    datecreated: "",
    datemodified: "",
    task_name: "",
    variables: "",
    form_key: "",
    process_def_key: "",
    process_version: "",
    process_name: "",
    task_id: "",
    business_key: "",
    process_instance_id: "",
    deadline: "",
    candidate_user: "",
    candidate_group: "",
    assignee: "",
};

function Inbox(props) {
    const {
        mode,
        modeType,
        component: { data },
    } = props;
    const appContext = useContext(AppContext);
    const context = useContext(DesignerContext);
    const [filteredTaskList, setFilteredTaskList] = useState([]);
    const [taskList, setTaskList] = useState([]);
    const [taskLoaded, setTaskLoaded] = useState(false);

    const [selectedTask, setSelectedTask] = useState(taskInitState);

    const [processList, setProcessList] = useState([]);
    const [selectedProcessId, setSelectedProcessId] = useState("");
    const [renderProcessModal, setRenderProcessModal] = useState(false);

    const [taskFilterType, setTaskFilterType] = useState("");
    const [taskFilterTypeCurrent, setTaskFilterTypeCurrent] = useState("");

    const [currentProcessState, setCurrentProcessState] = useState({
        initial: true,
        start: false,
        step: false,
        loading: false,
    });

    const [userList, setUserList] = useState([]);
    const [notification, setNotification] = useState({
        message: "Last updated on " + formatDateTimeForUserView(new Date()),
        count: 5,
    });
    const [userDetails, setUserDetails] = useState({
        firstname: "",
        lastname: "",
        username: "",
    });
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [showComments, setShowComments] = useState(true);
    const [taskView, setTaskView] = useState("");
    const [
        subscribedProcessDefinitionKeys,
        setSubscribedProcessDefinitionKeys,
    ] = useState([]);
    const [subscribedProcessInstanceKeys, setSubscribedProcessInstanceKeys] =
        useState([]);

    // Side Effects

    useEffect(() => {
        enableTooltip();
        getTenantData();

        return () => disposeTooltip();
    }, []);

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
        // console.log("*********** calling taskList effect");
        let _list = [];
        taskList.map(task => {
            _list.push(parseInt(task.process_instance_id));
        });
        setSubscribedProcessInstanceKeys(_list);

        // setNotification(prev => ({
        //     ...prev,
        //     count: 0,
        // }));
    }, [taskList]);

    useEffect(() => {
        // console.log("*********** calling processList effect");
        let _list = [];
        processList.map(process => {
            _list.push(parseInt(process.process_id));
        });
        setSubscribedProcessDefinitionKeys(_list);
    }, [processList]);

    useEffect(() => {
        // console.log("*********** calling notification effect");
        if (notification.count > 0) {
            setTimeout(() => {
                getTaskList();
                setNotification(prev => ({
                    ...prev,
                    count: 0,
                }));
            }, 3000);
        }
    }, [notification.count]);

    useEffect(() => {
        // console.log("*********** calling taskFilterType effect");
        if (taskFilterType !== "" && taskFilterType !== taskFilterTypeCurrent) {
            getTaskList();
            setTaskFilterTypeCurrent(taskFilterType);
        }
    }, [taskFilterType]);

    useEffect(() => {
        getProcessList();
    }, []);

    useEffect(() => {
        // console.log("*********** calling taskLoaded effect");
        if (!taskLoaded) {
            getTaskList();
        }
    }, [taskLoaded]);

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

    useEffect(() => {
        console.log("data?.show_task ********* " + data?.show_task);
        if (data && data?.show_task === taskFilterType) {
            return;
        }
        if (data && data?.show_task === "MY-TASK") {
            _handleTypeChange("myTask");
        } else if (
            data &&
            (data?.show_task === "ALL-TASK" || data?.show_task === "BOTH")
        ) {
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

    function syncTaskList() {
        // currentProcessState.loading = true;
        setCurrentProcessState(prev => ({ ...prev, loading: true }));
        setTimeout(() => {
            getTaskList();
        }, 1000);
    }

    // API calls
    function getTaskList() {
        if (mode !== modeType.render || taskFilterType == "") {
            return;
        }

        let serviceParams = "";
        let serviceKeyOrder = "bpm.list.my.task1";
        if (taskFilterType == "allTask") {
            serviceKeyOrder = "bpm.list.all.task1";
        }
        // console.log("************ serviceKeyOrder > "+serviceKeyOrder);
        // console.log("************ serviceKeyOrder > "+serviceKeyOrder);
        let processDataSource =
            appContext.tenantSubscription?.process_datasource;
        if (
            !processDataSource ||
            processDataSource == undefined ||
            processDataSource === ""
        ) {
            processDataSource = tenantId;
        }

        let dataRequest = {
            datasource: processDataSource,
            dataKeys: [
                {
                    serviceParams: serviceParams,
                    dataKey: "list",
                    serviceKey: serviceKeyOrder,
                    mode: "formData",
                },
            ],
        };

        axios
            .post(BPM_API_URL + "?service.key=process.taskList", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let list = response.data.C_DATA.list;

                    if (list && typeof list === "object") {
                        if (list.length == 0) {
                            currentProcessState.initial = true;
                        }
                        list.map(item => {
                            if (item.created) {
                                item.created = `Created ${getTimeAgo(
                                    item.created,
                                )}`;
                            }
                            try {
                                item.variables = JSON.parse(item.variables);
                            } catch (e) {}
                        });

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
                    setTaskLoaded(true);
                    setCurrentProcessState(prev => ({
                        ...prev,
                        loading: false,
                    }));
                }
                setCurrentProcessState(prev => ({
                    ...prev,
                    loading: false,
                }));
            })
            .catch(error => {
                console.error(error);
                setCurrentProcessState(prev => ({
                    ...prev,
                    loading: false,
                }));
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

    // function convertDBDateToFromNow(dateInString) {
    //     // Takes date in UTC and convert accordingto timezone and returns time fromNow
    //     let date = new Date(dateInString);
    //     let dateWithTimeZone = new Date(
    //         date.getTime() + date.getTimezoneOffset() * 60 * 1000,
    //     );
    //     let offset = date.getTimezoneOffset() / 60;
    //     let hours = date.getHours();
    //     dateWithTimeZone.setHours(hours - offset);
    //     return moment(dateWithTimeZone).fromNow();
    // }

    function convertDBDateToFromNow(dateInString) {
        // Create a Date object from the input date string
        let date = new Date(dateInString);

        // Calculate the time from now using moment.js
        return moment(date).fromNow();
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

    return (
        <ErrorBoundary>
            <StompSessionProvider
                url={"/monitor/notifications"}
                //All options supported by @stomp/stompjs can be used here
            >
                <SubscribingComponent
                    callback={syncTaskList}
                    notification={notification}
                    setNotification={setNotification}
                    subscribedProcessDefinitionKeys={
                        subscribedProcessDefinitionKeys
                    }
                    subscribedProcessInstanceKeys={
                        subscribedProcessInstanceKeys
                    }
                />
            </StompSessionProvider>
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
                                &nbsp;Camunda8 Task List {data?.task_view}&nbsp;
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

function SubscribingComponent({
    callback,
    subscribedProcessDefinitionKeys,
    subscribedProcessInstanceKeys,
    notification,
    setNotification,
}) {
    const [lastMessage, setLastMessage] = useState(
        "Last updated " + formatDateTimeForUserView(new Date()),
    );

    // useEffect(() => {
    //     if (callback) {
    //         console.log("***************** updating task list");
    //         callback();
    //     }
    // }, [lastMessage]);

    useSubscription("/monitor/notifications/process-instance", message => {
        // setLastMessage(message.body),
        let _msg = JSON.parse(message.body);
        let _def = subscribedProcessDefinitionKeys?.includes(
            _msg.processDefinitionKey,
        );
        let _ins = subscribedProcessInstanceKeys?.includes(
            _msg.processInstanceKey,
        );
        if ((_def || _ins) && _msg.type !== "UPDATED") {
            let _new = {
                // message:
                //     "Last updated on " + formatDateTimeForUserView(new Date()),
                count: ++notification.count,
            };
            console.log("*************** message:" + JSON.stringify(_msg));
            console.log("*************** Notification count:" + _new.count);
            setNotification(prev => ({
                ...prev,
                // message: _new.message,
                count: _new.count,
            }));
        }

        // setLastMessage(
        //     "Last updated on " + formatDateTimeForUserView(new Date()),
        // );
        // if (
        //     subscribedProcessDefinitionKeys?.includes(
        //         lastMessage.processDefinitionKey,
        //     ) ||
        //     subscribedProcessInstanceKeys?.includes(
        //         lastMessage.processInstanceKey,
        //     )
        // ) {
        //     setLastMessage(
        //         "Your inbox was last updated on " +
        //             formatDateTimeForUserView(new Date()),
        //     );
        // }
    });

    // return <div className="inbox-notification">{lastMessage}</div>;
    return "";
}

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
    const [currentComponent, setCurrentComponent] = useState({});
    const [options, setOptions] = useState(initialInboxOptions);
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
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    useEffect(() => {
        
        if(data){
            console.log("data inbox_fields:" + JSON.stringify(data?.inbox_fields));
            setOptions(data?.inbox_fields);
            setConfig(data ? data : initialConfig);
            selectTaskRadio(data?.show_task);
            selectTaskViewRadio(data?.task_view);           
        }
        
    }, [data]);

    useEffect(() => {
        console.log("config inbox_fields:" + JSON.stringify(options));
        setConfig(prev => ({
            ...prev,
            inbox_fields: options,
        }));
    }, [options]);

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            setCurrentComponent(context.selectedComponent);
        } else {
            setCurrentComponent({});
        }
    }, [context]);

    // useEffect(() => {
    //     if (show) {
    //         let _components = { ...context.selectedComponent };
    //         let componentProps = _components?.props[0];
    //         if (componentProps) {
    //             componentProps.options = JSON.stringify(
    //                 options.map(option => {
    //                     return {
    //                         id: option.id,
    //                         label: option.label,
    //                         value: option.value,
    //                         type: option.type,
    //                     };
    //                 }),
    //             );
    //         }
    //     }
    // }, [context]);

    // useEffect(() => {
    //     if (
    //         context &&
    //         context.selectedComponent &&
    //         !isEmpty(context.selectedComponent) &&
    //         context.selectedComponent.props
    //     ) {
    //         let props = context.selectedComponent.props;
    //         parseOptionsFromProps(props);
    //     }
    // }, [context]);

    function parseOptionsFromProps(array) {
        if (!array || array.length == 0) {
            setOptions(initialInboxOptions);
            return;
        }
        let options = [];
        array &&
            array.map(item => {
                if (item.type === "array") {
                    try {
                        options = tryParseJSONObject(item.options, []);
                    } catch (error) {
                        console.log();
                    }
                }
            });
        setOptions(options);
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

    const clone = x => JSON.parse(JSON.stringify(x));

    function handleOptionsChange(e, fieldId) {
        // ;
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

    function handleRadioOptDelete(option, fieldId) {
        // Filter out the option to be deleted
        const _updatedArr = options.filter(opt => opt.id !== option.id);

        // Update the options state
        setOptions(_updatedArr);

        // Stringify and handle radio options if necessary
        const str = JSON.stringify(_updatedArr);
        handleRadioOptions(str, fieldId);
    }

    function handleShowTask(e, code) {
        const { name } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: code,
        }));
        selectTaskRadio(code);
    }

    function handleTaskView(e, code) {
        const { name } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: code,
        }));
        selectTaskViewRadio(code);
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
export default Inbox;
