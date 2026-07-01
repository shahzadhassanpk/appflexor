import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
// import FormViewer, {
// } from "../data-management/form-builder/Forms/FormViewer/FormViewer";
import { AppContext } from "../../../../AppContext";
import ProcessFormViewer from "../../data-management/form-builder/Forms/FormViewer/ProcessFormViewer";
import { modeType } from "../../data-management/form-builder/Forms/FormViewer/constants";
import { BPM_API_URL } from "../CamundaConfig";
import { actions } from "../constants";
import { getProcessVariablesFromData8 } from "../helperFunctions";
function StartStepProcessor({
    id,
    handleProcessActions,
    camundaVars={},
    formVars = {},
    action = {},
}) {
    const [processId, setProcessId] = useState("");
    const [loading, setLoading] = useState(false);
    const [formDetails, setFormDetails] = useState({});
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    // side effects
    useEffect(() => {
        if (id === "") {
            let processId = getIdFromURL();
            setProcessId(processId);
        } else {
            setProcessId(id);
        }
    }, [id]);

    useEffect(() => {
        if (processId !== "") {
            getData(processId);
        }
    }, [processId]);

    // event handlers

    async function handleActions(
        actionType,
        state = {},
        formDetails = {},
        componentsData = {},
        reqPayload = {},
    ) {
        let message = "";
        setLoading(true);
        const taskVariables = getProcessVariablesFromData8(
            state,
            componentsData,
        );
        if (actionType === actions.complete) {
            let id = state.id;
            let processStarted = await startProcessInstance(id, taskVariables);
            if (processStarted.data.C_STATUS === "SUCCESS") {
                // message = "Process started successfully.";
                await updateBusinessKey(
                    state,
                    formDetails,
                    id,
                    processStarted.data.processInstanceId,
                    taskVariables,
                );
                let msg = action?.deploy_msg;
                toastEmitter(
                    msg ? msg : "Process started successfully",
                    true,
                    "success",
                );
                handleProcessActions(actions.complete);                
            } else {
                // message = "Failed to start a Process.";
                toastEmitter("Failed to start a Process", true, "error");
            }
        }
        setLoading(false);
        // toastEmitter(message, true, "success");
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

    // api calls  app-service
    function getData(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "form",
                    serviceKey: "sys.start.process",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let data = response.data.C_DATA.form[0]
                        ? response.data.C_DATA.form[0]
                        : [];
                    setFormDetails(data);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    async function updateBusinessKey(formData, formDetails, businessKey) {
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

    // async function updateBusinessKeyOld(
    //     formData,
    //     formDetails,
    //     businessKey,
    //     instanceId,
    //     variables,
    // ) {
    //     let fieldsData = { ...formData, business_key: businessKey };

    //     let request = {};
    //     request.data = [];
    //     let entityForm = {};

    //     entityForm.formId = formDetails.table;
    //     entityForm.entity = formDetails.table;
    //     entityForm.action = "update";
    //     entityForm.fileData = [];

    //     if (fieldsData.id && fieldsData.id !== "") {
    //         entityForm.id = fieldsData.id;
    //     } else {
    //         entityForm.id = "new";
    //         fieldsData.id = "new";
    //     }

    //     entityForm.formData = fieldsData;
    //     request.data.push(entityForm);

    //     let userTask = {};
    //     userTask.id = "new";
    //     userTask.formId = "wf_user_task";
    //     userTask.entity = "wf_user_task";
    //     userTask.action = "update";
    //     userTask.fileData = [];
    //     userTask.formData = {};

    //     userTask.formData.id = "new";
    //     userTask.formData.task_id = "0";
    //     userTask.formData.process_instance_id = instanceId;
    //     userTask.formData.business_key = businessKey;
    //     userTask.formData.assignee = appContext.profile.username;
    //     userTask.formData.variables = variables;
    //     request.data.push(userTask);
    //     axios
    //         .post(API_URL + "?service.key=update.formData", request)
    //         .then(response => {
    //             if (response.data.C_STATUS == "SUCCESS") {
    //                 let resObj = response.data.C_DATA[0].formData;
    //             } else {
    //                 console.error(response.data.C_MESSAGE);
    //             }
    //         })
    //         .catch(error => {
    //             console.error(error);
    //         });
    // }

    // api calls bpm-service
    function startProcessInstance(businessKey, taskVariables) {
        let variables = taskVariables ? { ...taskVariables } : camundaVars;
        variables.requester = appContext.profile.username;
        const dataRequest = {
            businessKey: businessKey,
            processId: formDetails.process_key,
            subscription: appContext.tenantSubscription.id,
            processVar: {
                ...variables,
            },
        };
        return new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=start.process", dataRequest)
                .then(response => {
                    resolve(response);
                    // if (response.status === 200) {
                    //     resolve("SUCCESS");
                    // } else {
                    //     resolve("FAILED");
                    // }
                })
                .catch(err => {
                    reject(err);
                    console.error(err);
                });
        });
    }

    return (
        <div className="s2a-process-form-viewer">
            {!processId ? (
                "Loading..."
            ) : (
                <ErrorBoundary render={Error}>
                    {loading && <span>Processing....</span>}
                    {!loading && (
                        <>
                            <div className="process-task-title">
                                {formDetails && formDetails.title}
                            </div>
                            <ProcessFormViewer
                                formKey={formDetails.form_key}
                                businessKey={"new"}
                                handleActions={handleActions}
                                submitLabel={
                                    formDetails?.submit_label !== ""
                                        ? formDetails?.submit_label
                                        : "Start"
                                }
                                processConfig={{
                                    showActions: true,
                                    allowComplete: true,
                                    hideFormTitle: true,
                                    showDraftButton: false,
                                }}
                                isInProcess={{
                                    showActions: true,
                                    showDraftButton: false,
                                    allowComplete: false,
                                }}
                                mode={modeType.render}
                                processVariables={camundaVars}
                                formVars={formVars}
                                ></ProcessFormViewer>
                        </>
                    )}
                </ErrorBoundary>
            )}
        </div>
    );
}

function Error() {
    return <div>Error occurred in Start Step Processor.</div>;
}

export default StartStepProcessor;
