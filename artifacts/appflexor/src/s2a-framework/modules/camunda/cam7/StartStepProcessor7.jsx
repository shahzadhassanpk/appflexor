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
import { getProcessVariablesFromData } from "../helperFunctions";
function StartStepProcessor({
    id,
    handleProcessActions,
    camundaVars = {},
    formVars = {},
    action = {},
}) {
    const [processId, setProcessId] = useState("");
    const [formDetails, setFormDetails] = useState({});
    const appContext = useContext(AppContext);
    const tenantId = appContext.tenantSubscription.tenant_id;

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

        const taskVariables = getProcessVariablesFromData(
            state,
            componentsData,
        );

        if (actionType === actions.complete) {
            let id = state.id;
            let processStarted = await startProcessInstance(id, taskVariables);

            if (processStarted === "SUCCESS") {
                message = "Process started successfully.";
                updateBusinessKey(state, formDetails, id);
                handleProcessActions(actions.complete, "process");
            } else {
                message = "Failed to start a Process.";
            }
        }

        toastEmitter(
            action.deploy_msg ? action.deploy_msg : message,
            true,
            "success",
        );
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

    function updateBusinessKey(formData, formDetails, businessKey) {
        let fieldsData = { ...formData, business_key: businessKey };

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

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    let resObj = response.data.C_DATA[0].formData;
                } else {
                    console.error(response.data.C_MESSAGE);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    // api calls bpm-service
    function startProcessInstance(businessKey, taskVariables) {
        let path = "";

        if (tenantId === "") {
            path = `/process-definition/key/${formDetails.process_key}/start`;
        } else {
            path = `/process-definition/key/${formDetails.process_key}/tenant-id/${tenantId}/start`;
        }
        let variables = taskVariables ? { ...taskVariables } : camundaVars;
        variables["requestor"] = { "value": appContext?.profile?.username, "type": "string" };
        
        const dataRequest = {
            path,
            method: "POST",
            data: {
                // businessKey: "test",
                businessKey: businessKey,
                variables: variables,
            },
        };
        return new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
                .then(response => {
                    if (response.status === 200) {
                        resolve("SUCCESS");
                    } else {
                        resolve("FAILED");
                    }
                })
                .catch(err => {
                    reject(err);
                    console.error(err);
                });
        });
    }

    return (
        <div className="">
            {!processId ? (
                "Loading..."
            ) : (
                <ErrorBoundary render={Error}>
                    <>
                        <div className="process-task-title">
                            {formDetails && formDetails.title}
                        </div>
                        <ProcessFormViewer
                            formKey={formDetails.form_key}
                            businessKey={"new"}
                            handleActions={handleActions}
                            submitLabel={"Start"}
                            processConfig={{
                                showActions: true,
                                allowComplete: true,
                                hideFormTitle: true,
                                showDraftButton: false,
                            }}
                            isInProcess={{
                                showActions: true,
                                showDraftButton: true,
                                allowComplete: false,
                            }}
                            mode={modeType.render}
                            processVariables={camundaVars}
                            formVars={formVars}></ProcessFormViewer>
                    </>
                </ErrorBoundary>
            )}
        </div>
    );
}

function Error() {
    return <div>Error occurred in Start Step Processor.</div>;
}

export default StartStepProcessor;
