import axios from "axios";
import moment from "moment";
import React, { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../../../../AppContext";
import {
    API_URL,
    DATE_TIME_FORMAT_FOR_USER_VIEW,
    BPM_API_URL,
} from "../../../Config";
import { DateTimeHTML } from "../../../components/DatePicker/DatePicker";
import ReactSelect from "../../../components/ReactSelect/ReactSelect";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import {
    disposeTooltip,
    enableTooltip,
    filterArrayByTerms,
    formatDateTimeForDataBase,
    formatDateTimeForUserView,
    localToUTCDateTime,
    parseDBDateTime,
    formatDateTimeToISO,
    formatTimeForDataBase,
    tryParseJSONObject,
} from "../../../utils/utils";
import FormViewer, {
    modeType,
} from "../../data-management/form-builder/Forms/FormViewer/FormViewer";
import ProcessFormViewer from "../../data-management/form-builder/Forms/FormViewer/ProcessFormViewer";
import VariableForm from "../../data-management/form-builder/Forms/VariableForm";
// import { BPM_API_URL } from "../CamundaConfig";
// import { typeMappings } from "./StartStepProcessor";
import { actions } from "../constants";
import { getProcessVariablesFromData8 } from "../helperFunctions";
import Modal from "react-bootstrap/Modal";

function StepProcessor({
    task,
    handleProcessActions,
    userList = [],
    userDetails = {
        firstname: "",
        lastname: "",
        username: "",
    },
    hideHeader = false,
    showComments,
    setShowComments,
    getProfileImage,
    getDisplayName,
    taskFilterType,
}) {
    const processInitialState = {
        task_name: "",
        form_key: "",
    };

    const [processTask, setProcessTask] = useState(processInitialState);
    const [assignee, setAssignee] = useState({
        userId: "",
    });
    const [processInsVars, setProcessInsVars] = useState({});
    const appContext = useContext(AppContext);
    const [recordId, setRecordId] = useState("");
    const [modalTitle, setModalTitle] = useState("");

    const [taskFollowUp, setTaskFollowUp] = useState("");
    const [taskDue, setTaskDue] = useState("");
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const [isFormKeyValid, setIsFormKeyValid] = useState(false);
    const [selectedOption, setSelectedOption] = useState({});
    const userActionsInitialState = {
        followUp: false,
        due: false,
        assign: false,
        group: false,
    };

    const [userActionsState, setUserActionState] = useState(
        userActionsInitialState,
    );
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const lastTaskId = useRef(null);
    const [showModal, setShowModal] = useState(false);

    // side effects

    // useEffect(() => {
    //     console.log(`task`);
    //     console.log(task);
    // }, [task.id]);

    // useEffect(() => {
    //     console.log(`lastTaskId`);
    //     console.log(lastTaskId);
    // }, [lastTaskId]);

    // useEffect(() => {
    //     if (task.variables) {
    //         if (!task.assignee || task.assignee == "") {
    //             task.assignee = task?.variables?.assignee;
    //         }
    //     }
    // }, [task]);

    useEffect(() => {
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    const getData = async () => {
        const obj = await getTaskData(task);

        if ((obj.status = "SUCCESS" && obj.data === null)) {
            setIsFormKeyValid(false);
        } else if ((obj.status = "SUCCESS" && obj.data !== "")) {
            await checkIfFormKeyisValid(obj.data);
        }
    };

    useEffect(() => {
        if (task && task.id !== "" && task.id !== "new") {
            // console.log("**************** "+JSON.stringify(task));
            console.log("**************** " + task.id);
            setProcessTask(task);

            if (task.variables) {
                setProcessInsVars(tryParseJSONObject(task.variables, {}));
            }
            setRecordId("");
            setTaskDue("");
            setTaskDue("");
            setAssignee("");
            getData();
        }
    }, [task.id]);

    useEffect(() => {
        if (!isEmpty(processTask)) {
            let form_key = processTask?.variables?.form_key;
            let business_key = processTask?.variables?.businessKey;
            if (form_key && business_key && form_key !== "") {
                getRecordId(business_key, form_key);
            }
        }
    }, [processTask]);

    async function checkIfFormKeyisValid(formKey) {
        var dataRequest = {};
        dataRequest = {
            dataKeys: [
                {
                    serviceParams: formKey,
                    dataKey: "formList",
                    serviceKey: "sys.get.form",
                    mode: "formData",
                },
            ],
        };
        let promise = await new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        resolve("SUCCESS");
                        if (response.data.C_DATA.formList) {
                            let list = response.data.C_DATA.formList;
                            if (list && list.length > 0) {
                                setIsFormKeyValid(true);
                            } else {
                                setIsFormKeyValid(false);
                            }
                        } else {
                            console.log(
                                `Either list.all.forms does not exists or SQL query returns no result.`,
                            );
                        }
                    }
                })
                .catch(error => {
                    reject("FAILED");
                    console.error(error);
                });
        });

        return promise;
    }

    // event handlers

    async function handleFormActions(
        actionType,
        state = {},
        formDetails = {},
        componentsData = {},
        reqPayload = {},
        processVar = {},
    ) {
        let message = "";
        const taskVariables = getProcessVariablesFromData8(
            state,
            componentsData,
        );

        if (actionType === actions.complete) {
            if (recordId === "new") {
                const { status, id } = await updateBusinessKey(
                    state,
                    formDetails,
                    task.variables.businessKey,
                );

                if (status === "SUCCESS") {
                    if (reqPayload.id === recordId) {
                        try {
                            const response = await completeTask(
                                task,
                                taskVariables,
                            );
                            if (response === "SUCCESS") {
                                await markTaskCompleted(task);
                                handleProcessActions(actionType);
                                setProcessTask(processInitialState);
                                setProcessInsVars({});
                            }
                        } catch (error) {
                            toastEmitter(
                                "Task completion failed",
                                true,
                                "error",
                            );
                            console.error(error);
                            return;
                        }
                    }
                }
            }

            if (recordId !== "new" && recordId !== "") {
                const { status, id } = await updateBusinessKey(
                    state,
                    formDetails,
                    task.variables.businessKey,
                );
                if (status === "SUCCESS") {
                    try {
                        const response = await completeTask(
                            task,
                            taskVariables,
                        );
                        if (response === "SUCCESS") {
                            await markTaskCompleted(task);
                            handleProcessActions(actionType);
                            setProcessTask(processInitialState);
                            setProcessInsVars({});
                        }
                    } catch (error) {
                        toastEmitter("Task completion failed", true, "error");
                        console.error(error);
                        return;
                    }
                }

                // await completeTask(task, taskVariables)
                //     .then(status => {
                //         ;
                //         setProcessTask(processInitialState);
                //         setProcessInsVars({});
                //     })
                //     .catch(error => {
                //         console.error(error);
                //     });
                // setProcessTask({});
                // setProcessInsVars({});

                // console.log(taskFormDetails);
            }
            message = "Task completed.";
        } else if (actionType === actions.draft) {
            if (recordId === "new") {
                const { status, id } = await updateBusinessKey(
                    state,
                    formDetails,
                    task.variables.businessKey,
                );

                if (status === "SUCCESS") {
                    setRecordId(id);
                }
            }
            await updateTaskVariables(task, taskVariables);

            // updateBusinessKey(state, formDetails, task.business_key);
            message = "Task saved as draft.";
        }
        handleProcessActions(actionType);
        toastEmitter(message, true, "success");
    }

    async function handleVarFormActions(actionType, variables = {}) {
        let message = "";
        if (actionType === actions.update) {
            await handleUpdateProcessVariables(task, variables);

            message = "handleUpdateProcessVariables.";
        }

        if (actionType === actions.complete) {
            message = "Task Completed.";

            try {
                const response = await completeTask(task);

                if (response === "SUCCESS") {
                    handleProcessActions(actionType);
                    setProcessTask(processInitialState);
                    setProcessInsVars({});
                }
            } catch (error) {
                toastEmitter("Task completion failed", true, "error");
                console.error(error);
                return;
            }
        }

        // handleProcessActions(actionType);
        toastEmitter(message, true, "success");
    }

    async function handleClaimTask(task) {
        await claimTask(task)
            .then(status => {
                if (status === "SUCCESS") {
                    getTaskData(task);
                    handleProcessActions(actions.update);
                } else if (status === "FAILED") {
                    handleProcessActions(actions.failed);
                }
            })
            .catch(err => console.error(err));
    }

    async function handleUnclaimTask(task) {
        await unclaimTask(task)
            .then(status => {
                if (status === "SUCCESS") {
                    if (taskFilterType === "myTask") {
                        handleProcessActions(actions.complete);
                    } else {
                        handleProcessActions(actions.update);
                    }
                } else if (status === "FAILED") {
                    handleProcessActions(actions.failed);
                }
            })
            .catch(err => console.error(err));
    }

    async function handleUpdateDueDate(task) {
        await updateDueDate(task)
            .then(status => {
                if (status === "SUCCESS") {
                    handleProcessActions(actions.update);
                } else if (status === "FAILED") {
                    handleProcessActions(actions.failed);
                }
            })
            .catch(err => console.error(err));
    }
    async function handleAssignTask(task) {
        await assignTask(task)
            .then(status => {
                if (status === "SUCCESS") {
                    handleProcessActions(actions.update);
                } else if (status === "FAILED") {
                    handleProcessActions(actions.failed);
                }
            })
            .catch(err => console.error(err));
    }

    async function handleUpdateFollowUpDate(task) {
        await updateFollowUpDate(task)
            .then(status => {
                if (status === "SUCCESS") {
                    handleProcessActions(actions.update);
                } else if (status === "FAILED") {
                    handleProcessActions(actions.failed);
                }
            })
            .catch(err => console.error(err));
    }

    async function handleClearFollowUpDate(task) {
        await clearFollowUpDate(task)
            .then(status => {
                if (status === "SUCCESS") {
                    setTaskFollowUp("");
                    handleProcessActions(actions.update);
                } else if (status === "FAILED") {
                    handleProcessActions(actions.failed);
                }
            })
            .catch(err => console.error(err));
    }
    async function handleClearDueDate(task) {
        await clearDueDate(task)
            .then(status => {
                if (status === "SUCCESS") {
                    setTaskDue("");
                    handleProcessActions(actions.update);
                } else if (status === "FAILED") {
                    handleProcessActions(actions.failed);
                }
            })
            .catch(err => console.error(err));
    }

    function handleUserEvents(action) {
        // let name = event.target.name;
        let keys = Object.keys(userActionsState);
        let obj = {};
        keys.forEach(key => {
            if (action == key) obj[key] = true;
            else obj[key] = false;
        });
        setUserActionState(obj);

        if (action == "assign") {
            setModalTitle("Assign User");
            let assignee = userList.find(u => u.username == task.assignee);

            if (assignee) {
                setSelectedOption(assignee);
            } else {
                setSelectedOption({});
            }
        }

        if (action == "due") {
            setModalTitle("Set Due Date");
            setTaskDue(task.due_date);
        } else {
            setTaskDue("");
        }

        if (action == "followUp") {
            setModalTitle("Set Followup Date");
            setTaskFollowUp(task.follow_up);
        } else {
            setTaskFollowUp("");
        }
        setShowModal(true);
    }

    function handleFollowUpDate(event) {
        let value = event.target.value;
        let local = formatDateTimeToISO(value);
        let utc = localToUTCDateTime(local);
        setTaskFollowUp(utc);
        // setTask(prev => ({ ...prev, followup: value }));
    }

    function handleDueDate(event) {
        let value = event.target.value;
        let local = formatDateTimeToISO(value);
        let utc = localToUTCDateTime(local);
        setTaskDue(utc);
        // setTask(prev => ({ ...prev, followup: value }));
    }

    function handleSelectionChange(obj) {
        setSelectedOption(obj);

        let final = { ...processTask, assignee: obj.username };

        setProcessTask(final);
    }

    // utils
    function getIdFromURL() {
        let id = "";
        let currentUrl = window.location.href;

        if (currentUrl.includes(":id=")) {
            let arr = currentUrl.split(":id=");
            id = arr[1];
        }

        return id;
    }

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function getUserNameById(assignee, userList) {
        let name = "";
        if (userList) {
            const data = userList.find(user => user?.username === assignee);
            name = data ? data.username : "";
        }
        return name;
    }

    function getUserDisplayNameById(assignee, userList) {
        let name = "";
        if (userList) {
            const data = userList.find(user => user?.username === assignee);
            name = data ? data.displayname : "";
        }
        return name;
    }

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
        let date = parseDBDateTime(dateInString); //new Date(dateInString);

        // Calculate the time from now using moment.js
        return moment(date).fromNow();
    }

    // api calls  app-service

    async function updateBusinessKey(formData, formDetails, businessKey) {
        // let fieldsData = { ...formData, business_key: businessKey };
        let fieldsData = { id: formData.id, business_key: businessKey };

        let request = {};
        request.data = [];
        let entityForm = {};

        entityForm.formId = formDetails.table;
        entityForm.entity = formDetails.table;
        entityForm.action = "update";
        entityForm.fileData = [];

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
            fieldsData.id = "new";
        }

        entityForm.formData = fieldsData;

        request.data.push(entityForm);

        let promise = await new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL +
                        "?service.key=update.formData&updateBusinessKey=true",
                    request,
                )
                .then(response => {
                    if (response.data.C_STATUS == "SUCCESS") {
                        let id = response.data.C_DATA[0].formData.id;
                        resolve({ status: "SUCCESS", id: id });
                    } else {
                        reject({ status: "FAILED" });
                        console.error(response.data.C_MESSAGE);
                    }
                })
                .catch(error => {
                    reject({ status: "FAILED" });
                    console.error(error);
                });
        });

        return promise;
    }

    function getRecordId(id, _formKey) {
        var dataRequest = {
            dataKeys: [
                {
                    dataKey: "formData",
                    getFormBy: "key",
                    formKey: _formKey,
                    businessKey: id,
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=get.formRecordId", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA) {
                        let formDataTemp = response.data.C_DATA.formData;
                        if (formDataTemp) {
                            if (
                                formDataTemp.length !== undefined &&
                                formDataTemp.length === 1
                            ) {
                                setRecordId(formDataTemp[0].id);
                            } else {
                                setRecordId("new");
                            }
                        }
                    }
                } else {
                    setRecordId("new");
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    // api calls bpm-service
    async function getTaskData(task) {
        return new Promise(resolve => {
            if (task) {
                setProcessTask(task);
            }
            if (task.variables) {
                let varIn = task.variables;
                setProcessInsVars(varIn);
            }
            resolve({
                status: "SUCCESS",
                data: task.variables.form_key,
            });
        });
        // const req1 = {
        //     method: "GET",
        //     path: `/task/${task.id}`,
        //     data: {},
        // };
        // const req2 = {
        //     method: "GET",
        //     path: `/process-instance/${task.instance_id}/variables`,
        //     data: {},
        // };

        // const dataKeys = [];

        // dataKeys.push({ key: "task", request: req1 });
        // dataKeys.push({ key: "processInsVars", request: req2 });
        // const dataRequest = { dataKeys: dataKeys };
        // let promise = await new Promise((resolve, reject) => {
        //     axios
        //         .post(
        //             BPM_API_URL + "?service.key=bpm.multiKey.data",
        //             dataRequest,
        //         )
        //         .then(response => {
        //             if (response.status === 200) {
        //                 const _task = response.data.task.data;
        //                 const vars = response.data.processInsVars.data;
        //                 if (_task) {
        //                     setProcessTask(_task);
        //                 } else {
        //                     setProcessTask(processInitialState);
        //                 }
        //                 setProcessInsVars(vars);
        //                 resolve({
        //                     status: "SUCCESS",
        //                     data: _task.formKey,
        //                 });
        //             }
        //         })
        //         .catch(err => {
        //             reject({ status: "FAILED" });
        //             console.error(err);
        //         });
        // });

        // return promise;
    }

    async function completeTask(task, taskVariables) {
        const dataRequest = {
            taskId: task.id,
            processVar: taskVariables,
        };

        let promise = await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=complete.task", dataRequest)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        // var data = response.data.data;
                    }
                })
                .catch(err => {
                    reject("FAILED");
                    console.error(err);
                });
        });

        return promise;
    }
    async function handleUpdateProcessVariables(task, variables) {
        let keys = Object.keys(variables);
        keys.map(async key => {
            let instanceId = task.instance_id;
            let value = variables[key].value;

            await updateProcessVariables(instanceId, key, value, "String");
        });

        let promise = await new Promise((resolve, reject) => {
            // axios
            //     .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
            //     .then(response => {
            //         if (response.status === 200) {
            //             resolve("SUCCESS");
            //             // var data = response.data.data;
            //         }
            //     })
            //     .catch(err => {
            //         reject("FAILED");
            //         console.error(err);
            //     });
        });

        return promise;
    }

    async function updateProcessVariables(instanceId, key, value, type) {
        const dataRequest = {
            method: "PUT",
            path: `/process-instance/${instanceId}/variables/${key}`,
            data: {
                value: value,
                type: type,
            },
        };
        let promise = await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        // var data = response.data.data;
                    }
                })
                .catch(err => {
                    reject("FAILED");
                    console.error(err);
                });
        });

        return promise;
    }

    async function claimTask(task) {
        let request = {
            taskId: task.id,
            scopeId: task.scope_key,
            processId: task.process_instance_id,
            processVar: {
                assignee: task.assignee,
            },
        };
        request.processVar.assignee = userDetails.username;
        return await new Promise((resolve, reject) => {
            axios
                .post(
                    BPM_API_URL + "?service.key=update.taskVariables",
                    request,
                )
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        handleProcessActions("UPDATE");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function unclaimTask(task) {
        let request = {
            taskId: task.id,
            scopeId: task.scope_key,
            processId: task.process_instance_id,
            processVar: {
                assignee: "",
            },
        };
        return await new Promise((resolve, reject) => {
            axios
                .post(
                    BPM_API_URL + "?service.key=update.taskVariables",
                    request,
                )
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        handleProcessActions("UPDATE");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function assignTask(task) {
        let request = {
            taskId: task.id,
            scopeId: task.scope_key,
            processId: task.process_instance_id,
            processVar: {
                assignee: task.assignee,
            },
        };
        request.processVar.assignee = selectedOption.username;
        return await new Promise((resolve, reject) => {
            axios
                .post(
                    BPM_API_URL + "?service.key=update.taskVariables",
                    request,
                )
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        handleProcessActions("UPDATE");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function updateTaskVariables(task, processVar) {
        let request = {
            taskId: task.id,
            scopeId: task.scope_key,
            processId: task.process_instance_id,
            processVar: processVar,
        };
        request.processVar.assignee = selectedOption.username;
        return await new Promise((resolve, reject) => {
            axios
                .post(
                    BPM_API_URL + "?service.key=update.taskVariables",
                    request,
                )
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        handleProcessActions("UPDATE");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function claimTaskOld(task) {
        let fieldsData = {
            id: task.assignee_id,
            task_id: task.id,
            assignee: task.assignee,
            process_instance_id: task.process_instance_id,
            business_key: recordId,
        };
        fieldsData.assignee = userDetails.username;
        let request = {};
        request.data = [];
        // request.datasource = tenantId;
        let entityForm = {};
        entityForm.formId = "wf_user_task";
        entityForm.entity = "wf_user_task";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;
        entityForm.formData["date_assigned"] = "#TIMESTAMP#";
        entityForm.formData["status"] = "1";
        request.data.push(entityForm);
        return await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function unclaimTaskOld(task) {
        let fieldsData = {
            id: task.assignee_id,
            task_id: task.id,
            assignee: task.assignee,
            process_instance_id: task.process_instance_id,
            business_key: recordId,
        };
        fieldsData.assignee = "";
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "wf_user_task";
        entityForm.entity = "wf_user_task";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;
        entityForm.formData["date_assigned"] = "";
        entityForm.formData["status"] = "0";
        request.data.push(entityForm);
        return await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function assignTaskOld(task) {
        let fieldsData = {
            id: task.assignee_id,
            task_id: task.id,
            assignee: task.assignee,
            process_instance_id: task.process_instance_id,
            business_key: recordId,
        };
        fieldsData.assignee = selectedOption.username;
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "wf_user_task";
        entityForm.entity = "wf_user_task";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;
        request.data.push(entityForm);
        return await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function updateFollowUpDate(task) {
        let newDate = formatDateTimeForDataBase(taskFollowUp);
        let fieldsData = {
            id: task.assignee_id,
            task_id: task.id,
            assignee: task.assignee,
            process_instance_id: task.process_instance_id,
            business_key: recordId,
        };
        fieldsData.follow_up = newDate;
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "wf_user_task";
        entityForm.entity = "wf_user_task";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;

        request.data.push(entityForm);
        return await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function updateDueDate(task) {
        let newDate = formatDateTimeForDataBase(taskDue);
        let fieldsData = {
            id: task.assignee_id,
            task_id: task.id,
            assignee: task.assignee,
            process_instance_id: task.process_instance_id,
            business_key: recordId,
        };
        fieldsData.due_date = newDate;
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "wf_user_task";
        entityForm.entity = "wf_user_task";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;
        request.data.push(entityForm);
        return await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function clearFollowUpDate(task) {
        let fieldsData = {
            id: task.assignee_id,
            task_id: task.id,
            assignee: task.assignee,
            process_instance_id: task.process_instance_id,
            business_key: recordId,
        };
        fieldsData.follow_up = "";
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "wf_user_task";
        entityForm.entity = "wf_user_task";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;

        request.data.push(entityForm);
        return await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function clearDueDate(task) {
        let fieldsData = {
            id: task.assignee_id,
            task_id: task.id,
            assignee: task.assignee,
            process_instance_id: task.process_instance_id,
            business_key: recordId,
        };
        fieldsData.due_date = "";
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "wf_user_task";
        entityForm.entity = "wf_user_task";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;

        request.data.push(entityForm);
        return await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }

    async function markTaskCompleted(task) {
        let fieldsData = {
            id: task.assignee_id,
            task_id: task.id,
            assignee: appContext.profile.username,
            process_instance_id: task.process_instance_id,
            business_key: recordId,
        };

        fieldsData.due_date = "";
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "wf_user_task";
        entityForm.entity = "wf_user_task";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;

        request.data.push(entityForm);
        return await new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                        var data = response.data.data;
                    }
                })
                .catch(err => {
                    console.error(err);
                    reject("FAILED");
                });
        });
    }
    function renderFormViewer() {
        let form_key = processTask?.variables?.form_key;
        if (form_key === "" || recordId === "") {
            return <span>Loading...</span>;
        }
        return (
            <ProcessFormViewer
                formKey={form_key}
                businessKey={recordId}
                handleActions={handleFormActions}
                submitLabel={"Complete"}
                isProcessForm={true}
                processConfig={{
                    showActions: true,
                    showDraftButton: true,
                    hideFormTilte: false,
                    allowComplete:
                        task.assignee === userDetails.username ? true : false,
                }}
                mode={
                    task.assignee === userDetails.username
                        ? modeType.render
                        : modeType.readonly
                }
                processVariables={processInsVars}
            />
        );
    }

    return (
        <>
            {/* <div className="process-task-title">
                {task.process_name && task.process_name}
                {" > "}
                {task.variables["task_name"]} */}

            <div className="process-task-title row">
                <div className="col-sm-1 ps-1">
                    <span className="avatar">
                        <img
                            className="image-styling-navbar dropdown"
                            src={getProfileImage(
                                task.assignee
                                    ? task.assignee
                                    : task.variables["assignee"],
                            )}
                            alt="image"
                            title={getDisplayName(
                                task.assignee
                                    ? task.assignee
                                    : task.variables["assignee"],
                            )}></img>
                    </span>
                </div>
                <div className="col-sm-11">
                    <div className="col-sm-12 case-ref">
                        <span>Ref: {task.variables["case_ref"]}</span>
                    </div>
                    <div className="col-sm-12 task-sub-title">
                        <span>
                            {task.variables["processTitle"]}
                            {" > "}
                            {task.variables["task_name"]}
                        </span>
                    </div>
                </div>

                {/* <div className=""> 
                    {showComments ? (
                        <i
                            className="fa-solid fa-align-left pointer me-1"
                            title="Hide Comments & Attachments"
                            onClick={() => setShowComments(false)}></i>
                    ) : (
                        <i
                            className="fa-solid fa-align-right pointer me-1"
                            title="Show Comments & Attachments"
                            onClick={() => setShowComments(true)}></i>
                    )}
                </div>
                */}
            </div>
            <div className="s2a-process-form">
                <>
                    {!isEmpty(task) && !hideHeader && (
                        //{hideHeader &&
                        <div className="task-action-header active flex-between">
                            <div className="align-self-center pointer">
                                {task.follow_up ? (
                                    <>
                                        <span
                                            className="fa-solid fa-bell me-2"
                                            // data-bs-toggle="tooltip"
                                            data-bs-title="Set Followup"></span>
                                        <span
                                            className="default pointer"
                                            onClick={() =>
                                                handleUserEvents("followUp")
                                            }
                                            data-bs-toggle="modal"
                                            data-bs-target="#task-actions-modal"
                                            // data-bs-toggle="tooltip"
                                            title={`${formatDateTimeForUserView(
                                                task.follow_up,
                                            )}`}>
                                            Followup{" "}
                                            {getTimeAgo(task.follow_up)}
                                        </span>{" "}
                                        <span>
                                            <span
                                                // data-bs-toggle="tooltip"
                                                data-bs-title="Clear Followup"
                                                className="fa-solid fa-xmark  ms-2 pointer"
                                                onClick={() =>
                                                    handleClearFollowUpDate(
                                                        task,
                                                    )
                                                }></span>
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className="fa-solid fa-bell me-2"
                                            // data-bs-toggle="tooltip"
                                            data-bs-title="Followup Date"></span>
                                        <span
                                            // data-bs-toggle="tooltip"
                                            data-bs-title="Set Followup">
                                            <span
                                                className="pointer"
                                                onClick={() =>
                                                    handleUserEvents("followUp")
                                                }
                                                data-bs-toggle="modal"
                                                data-bs-target="#task-actions-modal">
                                                Set Followup
                                            </span>
                                        </span>
                                    </>
                                )}
                            </div>
                            <div
                                className="align-self-center pointer"
                                title="Due Date">
                                {task.due_date ? (
                                    <>
                                        <span
                                            className="fa-solid fa-calendar-days me-2"
                                            // data-bs-toggle="tooltip"
                                            data-bs-title="Clear due date"></span>
                                        <span
                                            className="default pointer"
                                            onClick={() =>
                                                handleUserEvents("due")
                                            }
                                            // data-bs-toggle="tooltip"
                                            data-bs-toggle="modal"
                                            data-bs-title="Due Date"
                                            data-bs-target="#task-actions-modal"
                                            title={`${formatDateTimeForUserView(
                                                task.due_date,
                                            )}`}>
                                            Due {getTimeAgo(task.due_date)}
                                        </span>{" "}
                                        <span>
                                            <i
                                                className="fa-solid fa-xmark ms-2 pointer"
                                                onClick={() =>
                                                    handleClearDueDate(task)
                                                }></i>
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className="fa-solid fa-calendar-days me-2"
                                            // data-bs-toggle="tooltip"
                                            data-bs-title="Due Date"></span>
                                        <span>
                                            <span
                                                onClick={() =>
                                                    handleUserEvents("due")
                                                }
                                                data-bs-toggle="modal"
                                                data-bs-title="Due Date"
                                                data-bs-target="#task-actions-modal"
                                                className="pointer">
                                                Set Due Date
                                            </span>
                                        </span>
                                    </>
                                )}
                            </div>
                            <div
                                className="align-self-center pointer"
                                onClick={() => handleUserEvents("assign")}>
                                {task?.assignee && task?.assignee !== "" && (
                                    <span
                                        title={getUserDisplayNameById(
                                            task.assignee,
                                            userList,
                                        )}>
                                        <span className="px-2 fa fa-user"></span>
                                        <span
                                            className="pointer"
                                            // data-bs-toggle="tooltip"
                                            // data-bs-title="Assignee"
                                        >
                                            <span
                                                // data-bs-toggle="modal"
                                                // data-bs-target="#task-actions-modal"
                                                className="pe-2">
                                                {getUserNameById(
                                                    task.assignee,
                                                    userList,
                                                )}
                                            </span>
                                        </span>
                                    </span>
                                )}
                                {userDetails &&
                                    (!task?.assignee ||
                                        (task?.assignee === "" &&
                                            task?.assignee !==
                                                userDetails.username)) && (
                                        <span
                                            // data-bs-toggle="tooltip"
                                            data-bs-title="Claim task">
                                            <span className="px-2 fa fa-user"></span>
                                            <span
                                                className="text-capitalize pe-2 pointer"
                                                onClick={() =>
                                                    handleClaimTask(task)
                                                }>
                                                Claim {task?.assignee}
                                            </span>
                                        </span>
                                    )}
                                {userDetails &&
                                    task.assignee === userDetails.username && (
                                        <span
                                            // data-bs-toggle="tooltip"
                                            data-bs-title="Uncalim task">
                                            <i
                                                className="fa-solid fa-xmark pointer"
                                                onClick={() =>
                                                    handleUnclaimTask(task)
                                                }></i>
                                        </span>
                                    )}
                            </div>
                        </div>
                    )}

                    {isFormKeyValid ? (
                        <div>
                            {isFormKeyValid} {renderFormViewer()}
                        </div>
                    ) : (
                        <VariableForm
                            processVariables={processInsVars}
                            handleActions={handleVarFormActions}
                            processConfig={{
                                allowUpdate:
                                    task.assignee === userDetails.username
                                        ? true
                                        : false,
                            }}
                            mode={
                                task.assignee === userDetails.username
                                    ? modeType.render
                                    : modeType.readonly
                            }
                        />
                    )}
                </>
                {/* Action Modal Here */}
                {renderModalBox()}
            </div>
        </>
    );

    function renderXyz() {
        <div
            className="s2a-modal modal fade"
            id="task-actions-modal"
            data-bs-backdrop="static"
            data-bs-keyboard="false">
            <div
                className={`modal-dialog modal-md ${
                    toggleModalWindow === "maximize"
                        ? "modal-fullscreen"
                        : "modal-md"
                } `}>
                <div className="modal-content ">
                    <div className="modal-header modal-title">
                        <div className="flex-row d-flex vw-100 justify-content-between align-items-center">
                            <div className="my-2 h5 form-label">
                                {userActionsState.assign && "Assign Task"}
                                {userActionsState.group && "Assign Group"}
                                {userActionsState.followUp &&
                                    "Set Followup Date"}
                                {userActionsState.due && "Set Due Date"}
                            </div>
                            {/* <div
                    className=""
                    data-bs-dismiss="modal"
                    data-bs-toggle="tooltip"
                    data-bs-title="Close">
                    <i className="fa-solid fa-x modal-close"></i>
                </div> */}
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
                                    onClick={() => {
                                        setTimeout(() => {
                                            formContext.setRenderPreview(false);
                                        }, 500);
                                    }}>
                                    <i className="fa-solid fa-x modal-close fs-5"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-body">
                        {userActionsState.assign && (
                            <div className="row">
                                <div className="col-sm-12 pe-0">
                                    <ReactSelect
                                        placeholder="Select User"
                                        options={userList.sort((a, b) =>
                                            a.displayname > b.displayname
                                                ? 1
                                                : -1,
                                        )}
                                        fieldLabel="displayname"
                                        fieldValue="username"
                                        selectedOption={selectedOption}
                                        handleChange={handleSelectionChange}
                                    />
                                    {/* <select
                                className="form-select form-select-sm text-capitalize"
                                name="project"
                                value={assignee.userId}
                                onChange={event => {
                                    setAssignee(prev => ({
                                        ...prev,
                                        userId: event.target.value,
                                    }));
                                }}>
                                <option value=" ">
                                    Select Assignee
                                </option>
                                {userList &&
                                    userList.map(user => (
                                        <option
                                            key={user.username}
                                            value={user.username}>
                                            {user.username}
                                        </option>
                                    ))}
                            </select> */}
                                </div>
                                <div className="col-sm-12 p-2 d-inline-flex">
                                    <button
                                        className="px-1 mx-2 btn btn-sm button-theme"
                                        onClick={() => handleAssignTask(task)}
                                        data-bs-dismiss="modal"
                                        // disabled={!taskVariables.userId}
                                    >
                                        Assign
                                    </button>
                                    <button
                                        className="px-1 mx-2 btn btn-sm button-theme"
                                        data-bs-dismiss="modal">
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {userActionsState.due && (
                            <div className="row">
                                <div className="col-sm-12">
                                    <input
                                        type="datetime-local"
                                        className={`form-control date-time-picker form-control-sm`}
                                        data={formatDateTimeForUserView(
                                            taskDue,
                                        )}
                                        value={taskDue}
                                        onChange={handleDueDate}
                                    />

                                    {/* <DateTimeHTML
                                id={task.id}
                                data={taskDue}
                                onDateChange={handleDueDate}
                            /> */}
                                </div>
                                <div className="col-sm-12 p-2 d-flex">
                                    <button
                                        className="px-2 mx-2 btn btn-sm button-theme"
                                        onClick={() =>
                                            handleUpdateDueDate(task)
                                        }
                                        data-bs-dismiss="modal"
                                        // disabled={!taskVariables.userId}
                                    >
                                        OK
                                    </button>
                                    <button
                                        className="px-2 mx-2 btn btn-sm button-theme"
                                        data-bs-dismiss="modal">
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {userActionsState.followUp && (
                            <>
                                <div className="row">
                                    <div className="col-sm-12">
                                        <input
                                            type="datetime-local"
                                            className={`form-control date-time-picker form-control-sm`}
                                            data={formatDateTimeForUserView(
                                                taskFollowUp,
                                            )}
                                            value={taskFollowUp}
                                            onChange={handleFollowUpDate}
                                        />

                                        {/* <DateTimeHTML
                                    id={task.id}
                                    data={taskFollowUp}
                                    onDateChange={
                                        handleFollowUpDate
                                    }
                                /> */}
                                    </div>
                                    <div className="col-sm-12 p-2 d-flex">
                                        <button
                                            className="px-2 mx-2 btn btn-sm button-theme"
                                            onClick={() =>
                                                handleUpdateFollowUpDate(task)
                                            }
                                            data-bs-dismiss="modal"
                                            // disabled={!taskVariables.userId}
                                        >
                                            OK
                                        </button>
                                        <button
                                            className="px-2 mx-2 btn btn-sm button-theme"
                                            data-bs-dismiss="modal">
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                        {/* {userActionsState.group && (
                        <div className="row">
                            <div className="col-sm-8">
                                <ReactSelect
                                    placeholder="Choose Groups"
                                    options={groups}
                                    selectedOption={taskGroup}
                                    handleChange={handleTaskGroup}
                                    fieldLabel="name"
                                    fieldValue="id"
                                    isMulti={true}></ReactSelect>
                            </div>
                            <div className="col-sm-4">
                                <button
                                    className="px-2 mx-2 btn btn-sm button-theme"
                                    data-bs-dismiss="modal"
                                    // disabled={!taskVariables.userId}
                                >
                                    OK
                                </button>
                                <button
                                    className="px-2 mx-2 btn btn-sm button-theme"
                                    data-bs-dismiss="modal">
                                    Close
                                </button>
                            </div>
                        </div>
                    )} */}
                    </div>
                </div>
            </div>
        </div>;
    }

    function renderModalBox() {
        function handleClose() {
            setModalTitle("");
            setShowModal(false);
        }
        return (
            <Modal
                className="s2a-modal"
                show={showModal}
                onHide={() => handleClose()}
                size={"sm"}
                fullscreen={"sm"}
                backdrop="static">
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{modalTitle}</span>
                        <i
                            className="fa-solid fa-xmark modal-close"
                            onClick={handleClose}></i>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {userActionsState.assign && (
                        <div className="row">
                            <div className="col-sm-12 pe-0">
                                <ReactSelect
                                    placeholder="Select User"
                                    options={userList.sort((a, b) =>
                                        a.displayname > b.displayname ? 1 : -1,
                                    )}
                                    fieldLabel="displayname"
                                    fieldValue="username"
                                    selectedOption={selectedOption}
                                    handleChange={handleSelectionChange}
                                />
                                {/* <select
                                className="form-select form-select-sm text-capitalize"
                                name="project"
                                value={assignee.userId}
                                onChange={event => {
                                    setAssignee(prev => ({
                                        ...prev,
                                        userId: event.target.value,
                                    }));
                                }}>
                                <option value=" ">
                                    Select Assignee
                                </option>
                                {userList &&
                                    userList.map(user => (
                                        <option
                                            key={user.username}
                                            value={user.username}>
                                            {user.username}
                                        </option>
                                    ))}
                            </select> */}
                            </div>
                            <div className="col-sm-12 p-2 d-inline-flex">
                                <button
                                    className="px-1 mx-2 btn btn-sm button-theme"
                                    onClick={() => handleAssignTask(task)}
                                    data-bs-dismiss="modal"
                                    // disabled={!taskVariables.userId}
                                >
                                    Assign
                                </button>
                                <button
                                    className="px-1 mx-2 btn btn-sm button-theme"
                                    data-bs-dismiss="modal">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {userActionsState.due && (
                        <div className="row">
                            <div className="col-sm-12">
                                <input
                                    type="datetime-local"
                                    className={`form-control date-time-picker form-control-sm`}
                                    data={formatDateTimeForUserView(taskDue)}
                                    value={parseDBDateTime(taskDue)}
                                    onChange={handleDueDate}
                                />

                                {/* <DateTimeHTML
                                id={task.id}
                                data={taskDue}
                                onDateChange={handleDueDate}
                            /> */}
                            </div>
                            <div className="col-sm-12 p-2 d-flex">
                                <button
                                    className="px-2 mx-2 btn btn-sm button-theme"
                                    onClick={() => handleUpdateDueDate(task)}
                                    data-bs-dismiss="modal"
                                    // disabled={!taskVariables.userId}
                                >
                                    OK
                                </button>
                                {/* <button
                                    className="px-2 mx-2 btn btn-sm button-theme"
                                    data-bs-dismiss="modal">
                                    Close
                                </button> */}
                            </div>
                        </div>
                    )}

                    {userActionsState.followUp && (
                        <>
                            <div className="row">
                                <div className="col-sm-12">
                                    <input
                                        type="datetime-local"
                                        className={`form-control date-time-picker form-control-sm`}
                                        data={formatDateTimeForUserView(
                                            taskFollowUp,
                                        )}
                                        value={parseDBDateTime(taskFollowUp)}
                                        onChange={handleFollowUpDate}
                                    />

                                    {/* <DateTimeHTML
                                    id={task.id}
                                    data={taskFollowUp}
                                    onDateChange={
                                        handleFollowUpDate
                                    }
                                /> */}
                                </div>
                                <div className="col-sm-12 p-2 d-flex">
                                    <button
                                        className="px-2 mx-2 btn btn-sm button-theme"
                                        onClick={() =>
                                            handleUpdateFollowUpDate(task)
                                        }
                                        data-bs-dismiss="modal"
                                        // disabled={!taskVariables.userId}
                                    >
                                        OK
                                    </button>
                                    {/* <button
                                        className="px-2 mx-2 btn btn-sm button-theme"
                                        data-bs-dismiss="modal">
                                        Close
                                    </button> */}
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer></Modal.Footer>
            </Modal>
        );
    }
}

// function formatDateTimeForUserView(date) {
//     let formatedDate = null;

//     if (date) {
//         formatedDate = moment(date);

//         if (moment(formatedDate).isValid()) {
//             formatedDate = moment(date).format(DATE_TIME_FORMAT_FOR_USER_VIEW);
//         } else {
//             formatedDate = "";
//         }
//     } else {
//         return "";
//     }

//     return formatedDate;
// }
export default StepProcessor;
