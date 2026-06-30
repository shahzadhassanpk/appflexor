import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { toast } from "react-toastify";
import { AppContext } from "../../../../AppContext";
import { API_URL } from "../../../Config";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import { BPM_API_URL } from "../../camunda/CamundaConfig";
import ProcessesContext from "../../camunda/ProcessesContext";
import { getProcessVariablesFromData8 } from "../../camunda/helperFunctions";
import FormViewer, {
    modeType,
} from "../../data-management/form-builder/Forms/FormViewer";
import ProcessFormViewer from "../../data-management/form-builder/Forms/FormViewer/ProcessFormViewer";
import { toastEmitter } from "../../../components/Toastify/Toastify";

const actions = {
    update: "UPDATE",
    complete: "COMPLETE",
    failed: "FAILED",
    draft: "DRAFT",
};

const toastConfigs = {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "light",
};

function ProcessStatFormSelection({ componentData }) {
    let initialState = {
        id: "new",
        process_key: "",
        process_title: "",
        category: "",
        form_id: "",
        form_key: "",
        form_name: "",
        table: "",
        category_title: "",
        design: "",
    };

    const [selectedItem, setSelectedItem] = useState(initialState);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isFormSubmit, setIsFormSubmit] = useState(false);
    const [processList, setProcessList] = useState([]);
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    useEffect(() => {
        if (componentData.category) {
            getData();
        }
    }, [componentData]);

    useEffect(() => {
        if (componentData.process_id && processList.length > 0) {
            let process = processList.filter(
                p => p.id === componentData.process_id,
            );
            if (process[0]) {
                setSelectedItem(process[0]);
                setIsLoaded(true);
            }
        }
    }, [processList, componentData]);

    function handleActions(
        actionType,
        state = {},
        formDetails = {},
        componentsData = {},
        reqPayload = {},
    ) {
        if (actionType === actions.complete) {
            //  processKey, businessKey
            startProcessInstance(
                selectedItem.process_key,
                state.id,
                state,
                componentsData,
            );
            setSelectedItem(prev => ({ ...prev, id: state.id }));
            updateBusinessKey(state, formDetails, state.id);
            setIsFormSubmit(true);
            setTimeout(() => {
                setIsFormSubmit(false);
            }, 3000);
        }
    }

    function updateProcessData(data) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "process_data"; //"formid"
        entityForm.entity = "process_data"; //Db- "table name"
        entityForm.action = "update";

        if (!data.id || data.id == "" || data.id == "new") {
            entityForm.id = "new";
            data.id = "new";
        } else {
            entityForm.id = data.id;
        }

        entityForm.formData = data;
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                }
            });
        } catch (e) {
            console.log("save processMap error:" + e);
        }
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: componentData.category,
                    dataKey: "process",
                    serviceKey: "sys.process.cat",
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

    function startProcessInstance(
        processKey,
        businessKey = "",
        componentsData,
    ) {
        let path = "";
        if (tenantId === "") {
            path = `/process-definition/key/${processKey}/start`;
        } else {
            path = `/process-definition/key/${processKey}/tenant-id/${tenantId}/start`;
        }
        let variables = {};
        variables["requestor"] = {
            value: appContext?.profile?.username,
            type: "string",
        };

        const dataRequest = {
            path,
            method: "POST",
            data: {
                businessKey: businessKey,
                requestor: appContext.profile.username,
            },
        };

        axios
            .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "INVALID_REQUEST") {
                        // toast.error(
                        //     `Unable to start process. Request has invalid format`,
                        //     toastConfigs,
                        // );
                        toastEmitter(
                            `Unable to start process. Request has invalid format`,
                            true,
                            "error",
                        );
                    } else {
                        toastEmitter(`Process started successfully`);

                        let obj = {
                            business_key: businessKey,
                            process_key: selectedItem.process_key,
                            form_key: selectedItem.form_key,
                            status: "SUCCESS",
                        };

                        updateProcessData(obj);
                    }
                }
            })
            .catch(err => {
                let obj = {
                    business_key: "",
                    process_key: selectedItem.process_key,
                    form_key: selectedItem.form_key,
                    status: "FAILED",
                };

                updateProcessData(obj);
                console.error(err);
            });
    }
    function startProcessInstance8(
        processKey,
        businessKey = "",
        state,
        componentData,
    ) {
        const taskVariables = getProcessVariablesFromData8({}, componentData);

        let variables = taskVariables ? { ...taskVariables } : camundaVars;

        const dataRequest = {
            businessKey: businessKey,
            processId: processKey,
            subscription: tenantId,
            processVar: {
                ...variables,
            },
        };

        return new Promise((resolve, reject) => {
            axios
                .post(BPM_API_URL + "?service.key=start.process", dataRequest)
                .then(response => {
                    resolve("SUCCESS");
                    toastEmitter(`Process started successfully`);
                })
                .catch(err => {
                    reject(err);
                    console.error(err);
                });
        });

        // axios
        //     .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
        //     .then(response => {
        //         if (response.status === 200) {
        //             if (response.data.C_STATUS === "INVALID_REQUEST") {
        //                 toast.error(
        //                     `Unable to start process. Request has invalid format`,
        //                     toastConfigs,
        //                 );
        //             } else {
        //                 toast.success(
        //                     `Process started successfully`,
        //                     toastConfigs,
        //                 );

        //                 // let obj = {
        //                 //     business_key: businessKey,
        //                 //     process_key: selectedItem.process_key,
        //                 //     form_key: selectedItem.form_key,
        //                 //     status: "SUCCESS",
        //                 // };

        //                 // updateProcessData(obj);
        //             }
        //         }
        //     })
        //     .catch(err => {
        //         let obj = {
        //             business_key: "",
        //             process_key: selectedItem.process_key,
        //             form_key: selectedItem.form_key,
        //             status: "FAILED",
        //         };

        //         updateProcessData(obj);
        //         console.error(err);
        //     });
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

    return (
        <React.Fragment>
            <div className="container-fluid ps-0">
                <>
                    {!isFormSubmit && componentData.title && (
                        <div className="process-list-viewer-title">
                            <h5 className="m-0">{componentData.title}</h5>
                        </div>
                    )}
                </>
                {!isFormSubmit && isLoaded && (
                    <ProcessFormViewer
                        formKey={selectedItem.form_key}
                        formId={selectedItem.form_id}
                        businessKey={"new"}
                        handleActions={handleActions}
                        submitLabel={componentData.formActionLabel}
                        mode={modeType.render}
                    />
                )}
                {isFormSubmit && (
                    <div className="process-form-submit">
                        <span className="form-submit-msg">
                            {componentData.formSubmission ? (
                                <Interweave
                                    content={
                                        componentData.formSubmission
                                    }></Interweave>
                            ) : (
                                "Form submited successfully"
                            )}
                        </span>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
}

export default ProcessStatFormSelection;
