import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { toast } from "react-toastify";
import { AppContext } from "../../../../AppContext";
import { API_URL } from "../../../Config";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import { BPM_API_URL } from "../../camunda/CamundaConfig";
import { getProcessVariablesFromData, getProcessVariablesFromData8 } from "../../camunda/helperFunctions";
import ProcessesContext from "../../camunda/ProcessesContext";
import FormViewer, {
    modeType,
} from "../../data-management/form-builder/Forms/FormViewer";
import ProcessFormViewer from "../../data-management/form-builder/Forms/FormViewer/ProcessFormViewer";
import { SOURCE } from "../ProcessEngine";

const actions = {
    update: "UPDATE",
    complete: "COMPLETE",
    failed: "FAILED",
    draft: "DRAFT",
};

const processEngineInitState = {
    source_engine: SOURCE.CAMUNDA_EIGHT,
};

function ProcessSelection({ componentData }) {
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
    const [processEngine, setProcesEngine] = useState(processEngineInitState);
    const [processDefList, setProcessDefList] = useState([]);
    const [processList, setProcessList] = useState([]);
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [formState, setFormState] = useState("EDIT");
    const [show, setShow] = useState(false);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const getPaginateData = (current, pageSize) => {
        return processList.slice((current - 1) * pageSize, current * pageSize);
    };
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    useEffect(() => {
        if (componentData.category) {
            getData();
            getProcessDefination();
        }
    }, [componentData]);

    function StartProcess(item) {
        setFormState("EDIT");
        setSelectedItem(item);
        setShow(true);
    }

    function addNewItem() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
    }

    function clearFields() {
        addNewItem();
    }

    function getProcessDefination() {
        // https://docs.camunda.org/manual/7.18/reference/rest/process-definition/get-query/

        let path = "";

        if (tenantId === "") {
            path = `/process-definition?withoutTenantId=true&latestVersion=true`;
        } else {
            path = `/process-definition?tenantIdIn=${tenantId}&latestVersion=true`;
        }

        const dataRequest = {
            path,
            method: "GET",
            data: {},
        };

        axios
            .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    let data = response.data.data;
                    if (data) {
                        setProcessDefList(data);
                        // setLoaded(true);
                    }
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function handleSelectedForms(e) {
        let value = e.target.value;

        setSelectedItem(prev => ({
            ...prev,
            form_id: value,
        }));
    }

    function handleSelectedProcess(e) {
        let value = e.target.value;

        setSelectedItem(prev => ({
            ...prev,
            process_key: value,
        }));
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
                {
                    serviceParams: "",
                    dataKey: "engine",
                    serviceKey: "bpm.process.engine",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let data = response.data.C_DATA.engine;
                    if (data && data.length > 0) {
                        setProcesEngine(data[0]);
                    } else {
                        setProcesEngine(processEngineInitState);
                    }

                    setProcessList(response.data.C_DATA.process);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getProcessByName(id) {
        let name = "";
        processDefList.forEach(item => {
            if (item.key === id) {
                name = item.name;
            }
        });
        return name ? name : "";
    }

    function handleInputField(event, id) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleActions(
        actionType,
        state = {},
        formDetails = {},
        componentsData = {},
        reqPayload = {},
    ) {
        if (actionType === actions.complete) {
            //  processKey, businessKey
            const taskVariables = getProcessVariablesFromData(
                state,
                componentsData,
            );
            startProcessInstance(
                selectedItem.process_key,
                state.id,
                taskVariables,
            );
            setSelectedItem(prev => ({ ...prev, id: state.id }));
            updateBusinessKey(state, formDetails, state.id);
            setFormState("SUCCESS");
        }
    }

    function startProcessInstance(processKey, businessKey, taskVariables) {
        let path = "";

        if (tenantId === "") {
            path = `/process-definition/key/${processKey}/start`;
        } else {
            path = `/process-definition/key/${processKey}/tenant-id/${tenantId}/start`;
        }
        let variables = taskVariables ? { ...taskVariables } : camundaVars;
        variables["tenantId"] = { value: tenantId, type: "string" };

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

    // function startProcessInstance(processKey, businessKey, taskVariables) {
    //     console.log(
    //         "*********** startProcessInstance businessKey:" + businessKey,
    //     );
    //     let variables = taskVariables ? { ...taskVariables } : camundaVars;
    //     const dataRequest = {
    //         businessKey: businessKey,
    //         processId: processKey,
    //         subscription: appContext.tenantSubscription.id,
    //         processVar: {
    //             ...variables,
    //         },
    //     };
    //     return new Promise((resolve, reject) => {
    //         axios
    //             .post(BPM_API_URL + "?service.key=start.process", dataRequest)
    //             .then(response => {
    //                 resolve("SUCCESS");
    //                 // if (response.status === 200) {
    //                 //     resolve("SUCCESS");
    //                 // } else {
    //                 //     resolve("FAILED");
    //                 // }
    //             })
    //             .catch(err => {
    //                 reject(err);
    //                 console.error(err);
    //             });
    //     });
    // }

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
            <div className="container-fluid">
                <div className="datalist-viewer">
                    {componentData.title && (
                        <div className="row">
                            <div className="col-sm-12 s2a-datalist-header">
                                <span className="title-text">
                                    {componentData.title}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="row">
                        <div className="col-sm-12 p-0">
                            <Table className="s2a-table datalist-viewer table-bordered table-hover mb-0">
                                <Thead className="table-header">
                                    <Tr className="">
                                        {componentData.showCategory ===
                                            "YES" && (
                                            <Th className="col-sm-2 datalist-header text-left">
                                                <TableSorting
                                                    state={processList}
                                                    setState={setProcessList}
                                                    fieldName={"category_title"}
                                                    headerTitle={"Category"}
                                                />
                                            </Th>
                                        )}
                                        {componentData.showTitle === "YES" && (
                                            <Th className="col-sm-3 datalist-header text-left">
                                                <TableSorting
                                                    state={processList}
                                                    setState={setProcessList}
                                                    fieldName={"process_title"}
                                                    headerTitle={
                                                        "Process Title"
                                                    }
                                                />
                                            </Th>
                                        )}
                                        {componentData.showProcess ===
                                            "YES" && (
                                            <Th className="col-sm-2 datalist-header text-left">
                                                <TableSorting
                                                    state={processList}
                                                    setState={setProcessList}
                                                    fieldName={"process_key"}
                                                    headerTitle={"Process"}
                                                />
                                            </Th>
                                        )}
                                        {componentData.showForm === "YES" && (
                                            <Th className="col-sm-2 datalist-header text-left">
                                                <TableSorting
                                                    state={processList}
                                                    setState={setProcessList}
                                                    fieldName={"form_name"}
                                                    headerTitle={"Form"}
                                                />
                                            </Th>
                                        )}
                                        <Th className="col-sm-2 datalist-header text-left">
                                            Action
                                        </Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {getPaginateData(current, size).map(
                                        item => {
                                            return (
                                                <Tr
                                                    key={item.id}
                                                    className={` ${
                                                        item.id ===
                                                        selectedItem.id
                                                            ? "selected-cell"
                                                            : " "
                                                    }`}>
                                                    {componentData.showTitle ===
                                                        "YES" && (
                                                        <Td className="col-sm-3 table-row text-left">
                                                            {item.process_title}
                                                        </Td>
                                                    )}
                                                    {componentData.showCategory ===
                                                        "YES" && (
                                                        <Td className="col-sm-2 table-row text-left">
                                                            {
                                                                item.category_title
                                                            }
                                                        </Td>
                                                    )}
                                                    {componentData.showProcess ===
                                                        "YES" && (
                                                        <Td className="col-sm-2 table-row text-left">
                                                            {getProcessByName(
                                                                item.process_key,
                                                            )}
                                                        </Td>
                                                    )}
                                                    {componentData.showForm ===
                                                        "YES" && (
                                                        <Td className="col-sm-2 table-row text-left">
                                                            {item.form_name}
                                                        </Td>
                                                    )}
                                                    <Td className="col-sm-2 table-row text-left">
                                                        <span
                                                            className="table-edit-font"
                                                            title="Start Process"
                                                            onClick={() =>
                                                                StartProcess(
                                                                    item,
                                                                )
                                                            }>
                                                            {componentData?.actionLabel && (
                                                                <span>
                                                                    {
                                                                        componentData.actionLabel
                                                                    }
                                                                </span>
                                                            )}{" "}
                                                            <i className="ps-2 fa-solid fa-play"></i>
                                                        </span>
                                                    </Td>
                                                </Tr>
                                            );
                                        },
                                    )}
                                </Tbody>
                            </Table>
                        </div>

                        <div className="p-0">
                            <TablePagination
                                size={size}
                                setSize={setSize}
                                current={current}
                                setCurrent={setCurrent}
                                tableData={processList}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                className="s2a-modal"
                show={show}
                onHide={() => setShow(false)}
                size="lg"
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <div>
                    <Modal.Header>
                        <Modal.Title className="modal-title">
                            <span>{selectedItem.process_title}</span>
                            <div className="d-flex">
                                <div
                                    className={`${
                                        toggleModalWindow === "maximize"
                                            ? "visually-hidden"
                                            : ""
                                    } `}
                                    onClick={() =>
                                        setToggleModalWindow("maximize")
                                    }
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
                                    onClick={() =>
                                        setToggleModalWindow("restore")
                                    }
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Restore Window">
                                    <i className="fa-regular fa-window-restore modal-resize"></i>
                                </div>
                                <i
                                    className="fa-solid fa-xmark modal-close"
                                    onClick={() => setShow()}></i>
                            </div>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {formState === "EDIT" && (
                            <ProcessFormViewer
                                formKey={selectedItem.form_key}
                                formId={selectedItem.form_id}
                                businessKey={"new"}
                                getData={getData}
                                handleActions={handleActions}
                                submitLabel={componentData.formActionLabel}
                                mode={modeType.render}
                                onClose={() => setShow()}
                            />
                        )}

                        {formState === "SUCCESS" && (
                            <>
                                {componentData.formSubmission
                                    ? componentData.formSubmission
                                    : "Form saved successfully"}
                                <button
                                    className="btn button-theme btn-sm float-end"
                                    onClick={() => setShow(false)}>
                                    Close
                                </button>
                            </>
                        )}
                    </Modal.Body>
                </div>
            </Modal>
        </React.Fragment>
    );
}

export default ProcessSelection;
