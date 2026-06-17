import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import ReactBpmn from "react-bpmn";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { AppContext } from "../../../../AppContext";
import { API_URL, BPM_API_URL, FILE_URL } from "../../../Config";
import ModalBox from "../../../components/Modal/Modal";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import { tryParseJSONObject, updateDeleteConfig } from "../../../utils/utils";
import { toastEmitter } from "../../../components/Toastify/Toastify";

const DB_TABLE = "process";
const STATUS = {
    none: "NONE",
    create: "CREATE",
    update: "UPDATE",
};
const INITIAL_STATE = {
    id: "",
    title: "",
    process_def_key: "",
    process_file: "",
    file_url: "",
};

function Processes({ activeTab }) {
    const appContext = useContext(AppContext);

    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(INITIAL_STATE);
    const [formStatus, setFormStatus] = useState(STATUS.none);
    const [fileStatus, setFileStatus] = useState("");
    const [processes, setProcesses] = useState([]);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const [showDiscardDataModal, setShowDiscardDataModal] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("maximize");
    const [toggleBpmnViewer, setToggleBpmnViewer] = useState("restore");
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });
    const { id, process_file } = selectedItem;
    const url = FILE_URL + "/" + DB_TABLE + "/" + id + "/" + process_file;

    useEffect(() => {
        if (activeTab === "PROCESSES") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (
            selectedItem.title !== "" &&
            selectedItem.process_def_key !== "" &&
            selectedItem.process_file !== ""
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    const getPaginateData = (current, pageSize) => {
        if (items) {
            return items.slice((current - 1) * pageSize, current * pageSize);
        }
        return [];
    };

    function editItem(item) {
        setFormStatus(STATUS.update);
        handleShow();
        setToggleBpmnViewer("restore");
        setSelectedItem(item);
        let _processes = tryParseJSONObject(item.processes, [
            { name: item.title, id: item.process_def_key },
        ]);
        setProcesses(_processes);
        //  getSelectedItem(item)
    }

    async function getSelectedItem(item) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: item.id,
                    dataKey: "report",
                    serviceKey: "sys.reports.configration",
                    mode: "formData",
                },
            ],
        };

        try {
            const response = await axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                dataRequest,
            );

            if (response.data.C_STATUS === "SUCCESS") {
                const _report = response.data.C_DATA.report[0];
                if (_report) {
                    _report.filters = tryParseJSONObject(_report.filters, []);
                    setSelectedItem(_report);
                } else {
                    console.log("No record found.");
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    function addNewItem() {
        setFormStatus(STATUS.create);
        setSelectedItem(INITIAL_STATE);
        setSaveIsDisabled(true);
        setProcesses([]);
        handleShow();
        setToggleBpmnViewer("restore");
    }

    function clearFields() {
        setSelectedItem(INITIAL_STATE);
        setSaveIsDisabled(true);
    }

    const closeModal = () => setFormShow(false);
    const handleShow = () => setFormShow(true);

    const handleModalClose = status => {
        if (status === STATUS.create && selectedItem.id !== "") {
            setShowDiscardDataModal(true);
        } else if (status === STATUS.create && selectedItem.id === "") {
            clearFields();
            setFormShow(false);
        } else if (status === STATUS.update) {
            setFormShow(false);
        }
        setFileStatus("");
    };

    async function handleDiscardConfirm() {
        let request = {
            data: [
                {
                    id: selectedItem.id,
                    formId: DB_TABLE,
                    entity: DB_TABLE,
                    action: "delete",
                },
            ],
        };

        let response = await axios.post(
            API_URL + "?service.key=update.formData",
            request,
        );

        if (response.data.C_STATUS === "SUCCESS") {
            clearFields();
            getData();
            setShowDiscardDataModal(false);
            setFormShow(false);
        }
    }

    function getData() {
        const tenantId = appContext?.tenantSubscription?.tenant_id;
        const dataRequest = {
            tenant_id: tenantId,
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "engine",
                    serviceKey: "bpm.list.process",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    try {
                        let data = response.data.C_DATA.engine;
                        if (data && data.length > 0) {
                            setItems(data);
                        } else {
                            setItems([]);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function handleChange(event, id) {
        let value = "";
        let name = event.target.name;
        let type = event.target.type;

        if (type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleDeleteFileClick(event) {
        let fileName = selectedItem.process_file;
        if (
            confirm(
                'You can not undo delete process file "' +
                    fileName +
                    '". \nAre you sure?',
            )
        ) {
            setFileStatus("deleted");
            setProcesses([]);
            setSelectedItem(prevState => ({
                ...prevState,
                process_def_key: "",
            }));
            selectedItem.process_file = "";
            event.target.value = "";
            deleteFromServer(fileName, "");
        }
    }

    const handleProcessSelected = process => {
        setSelectedItem(prevState => ({
            ...prevState,
            title: process.name,
            process_def_key: process.id,
        }));
    };

    const handleFileUpload = event => {
        let selectedFile = event.target.files[0];
        let fileName = selectedFile.name;
        let fileReader = new FileReader();

        fileReader.onload = fileLoadedEvent => {
            let content = fileLoadedEvent.target.result;
            let newArr = content.split("base64,");
            let encodedData = "";
            if (newArr[1]) {
                encodedData = newArr[1];
            }
            uploadFilesToServer(fileName, encodedData);

            // Parsing XML content
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(
                atob(encodedData),
                "application/xml",
            );
            const processElements = xmlDoc.getElementsByTagName("bpmn:process");
            const parsedProcesses = Array.from(processElements).map(
                process => ({
                    id: process.getAttribute("id"),
                    name: process.getAttribute("name"),
                }),
            );
            setProcesses(parsedProcesses);
            if (parsedProcesses.length > 0) {
                handleProcessSelected(parsedProcesses[0]);
            }
        };

        fileReader.readAsDataURL(selectedFile);

        setSelectedItem(prevState => ({
            ...prevState,
            process_file: fileName,
        }));
    };

    function onShown() {
        console.log("diagram shown");
    }

    function onLoading() {
        console.log("diagram loading");
    }

    function onError(err) {
        console.log(err);
        console.log("failed to show diagram");
        // toastEmitter(err, true);
    }

    async function deleteFromServer(fileName, encodedData) {
        const tenantId = appContext?.tenantSubscription?.tenant_id;
        const id = selectedItem.id ? selectedItem.id : "new";
        const formData = { ...selectedItem, id: id, process_file: "" };
        const request = {
            data: [
                {
                    formId: DB_TABLE,
                    entity: DB_TABLE,
                    action: "update",
                    id: id,
                    formData: formData,
                    fileData: [
                        {
                            fileName: fileName,
                            content: encodedData,
                        },
                    ],
                },
            ],
        };

        const response = await axios.post(
            API_URL + "?service.key=update.formData",
            request,
        );

        if (response.status === 200) {
            if (response.data.C_STATUS === "SUCCESS") {
                if (response.data.C_DATA.length > 0) {
                    let res = response.data.C_DATA[0];
                    let recordId = res.formData.id;
                    let fileName = res.formData.process_file;

                    // const origin = window.location.origin;
                    const url =
                        FILE_URL +
                        "/" +
                        DB_TABLE +
                        "/" +
                        recordId +
                        "/" +
                        fileName;
                    setSelectedItem(prev => ({
                        ...prev,
                        id: recordId,
                        process_file: fileName,
                        file_url: url,
                    }));
                } else {
                    console.log("No response found.");
                }
            }
        }
    }

    async function uploadFilesToServer(fileName, encodedData) {
        const tenantId = appContext?.tenantSubscription?.tenant_id;
        const id = selectedItem.id ? selectedItem.id : "new";
        const formData = { ...selectedItem, id: id, process_file: fileName };
        const request = {
            data: [
                {
                    formId: DB_TABLE,
                    entity: DB_TABLE,
                    action: "update",
                    id: id,
                    formData: formData,
                    fileData: [
                        {
                            fileName: fileName,
                            content: encodedData,
                        },
                    ],
                },
            ],
        };

        const response = await axios.post(
            API_URL + "?service.key=update.formData",
            request,
        );

        if (response.status === 200) {
            if (response.data.C_STATUS === "SUCCESS") {
                if (response.data.C_DATA.length > 0) {
                    let res = response.data.C_DATA[0];
                    let recordId = res.formData.id;
                    let fileName = res.formData.process_file;

                    // const origin = window.location.origin;
                    const url =
                        FILE_URL +
                        "/" +
                        DB_TABLE +
                        "/" +
                        recordId +
                        "/" +
                        fileName;
                    setSelectedItem(prev => ({
                        ...prev,
                        id: recordId,
                        process_file: fileName,
                        file_url: url,
                    }));
                    setFileStatus("");
                } else {
                    console.log("No response found.");
                }
            }
        }
    }

    function saveData(item) {
        let fieldsData = { ...item };
        fieldsData["processes"] = processes;
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = DB_TABLE; //"formid"
        entityForm.entity = DB_TABLE; //Db- "table name"
        entityForm.action = "update";

        if (!fieldsData.id || fieldsData.id == "" || fieldsData.id == "new") {
            entityForm.id = "new";
            fieldsData.id = "new";
        } else {
            entityForm.id = fieldsData.id;
        }

        entityForm.formData = fieldsData;
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (fieldsData.id === "new" || fieldsData.id === "") {
                        fieldsData.id = response.data.C_DATA[0].formData.id;
                    }
                    getData();
                    clearFields();
                    closeModal();
                    toastEmitter("Record saved successfully", true);
                }
            });
        } catch (e) {
            console.log("save processMap error:" + e);
        }
    }
    const viewFile = async (url, headers) => {
        fetch(url, {
            method: "GET",
            headers: headers,
        })
            .then(res => res.blob())
            .then(blob => {
                var _url = window.URL.createObjectURL(blob);
                window.open(_url, "_blank").focus();
            });
    };
    function openMonitor(item) {
        // let url = "/monitor/"+localStorage.getItem("AUTH_KEY")+"/views/processes/"+item.process_id;
        let url = "/monitor/views/processes/" + item.process_id;
        // let headers = { AUTH_KEY: localStorage.getItem("AUTH_KEY") };
        // viewFile(url, headers);
        window.open(url);
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = DB_TABLE;
            entityForm.entity = DB_TABLE;
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        getData();
                        updateDeleteConfig(false, {}, setDeleteConfig);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            updateDeleteConfig(true, item, setDeleteConfig);
            // console.log("you press cancel")
        }
    }

    const deployProcess = process => {
        const url = `${BPM_API_URL}?service.key=deploy.process`;
        const process_engine = appContext.tenantSubscription.process_engine;
        const id = process.id;
        const fileName = process.process_file;
        const request = {
            id: id,
            entity: DB_TABLE,
            fileName: fileName,
            mainProcessDefKey: process.process_def_key,
            process_engine: process_engine,
        };

        axios.post(url, request).then(res => {
            if (res.data.C_STATUS === "SUCCESS") {
                const data = res.data.C_DATA;
                const item = {
                    ...process,
                    version: data.version,
                    process_id: data.process_id,
                    deployment: data.deployment,
                };
                saveData(item);
                toastEmitter("Process Deployed Successfully", true);
            } else {
                toastEmitter("Process Deployment Failed", true, "error");
            }
        });
    };

    return (
        <div className="process-configuration-map">
            {/* <code>{JSON.stringify(items, null, 2)}</code> */}

            <div className="row p-2 m-0">
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-2 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"title"}
                                        headerTitle={"Select Main Process"}
                                    />
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"process_def_key"}
                                        headerTitle={"Main Process Def Key"}
                                    />
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    Process file
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    Current Deployment
                                </Th>
                                <Th className="col-sm-2 table-row text-left"></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {getPaginateData(current, size).map(item => {
                                return (
                                    <Tr
                                        key={item.id}
                                        className={` ${
                                            item.id === selectedItem.id
                                                ? "selected-cell"
                                                : " "
                                        }`}>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.title}
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.process_def_key}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {item.process_file}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {item?.version}
                                        </Td>

                                        <Td className="col-sm-2 table-row text-left">
                                            <div className="data-cell d-flex">
                                                <span
                                                    className="table-edit-font px-2"
                                                    title="Deploy process"
                                                    disabled={!item.id}
                                                    onClick={() =>
                                                        deployProcess(item)
                                                    }>
                                                    <i className="fa fa-retweet m-0"></i>
                                                </span>
                                                <span
                                                    className="table-edit-font"
                                                    title="Edit"
                                                    onClick={() =>
                                                        editItem(item)
                                                    }>
                                                    <i className="fa-regular fa-edit"></i>
                                                </span>
                                                <span
                                                    className="table-del-font"
                                                    title="Delete"
                                                    onClick={() =>
                                                        deleteData(item)
                                                    }>
                                                    <i className="fa-regular fa-trash-can"></i>
                                                </span>
                                            </div>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </div>
                <div className="col-sm-8 p-0">
                    <span
                        type="button"
                        className="button-theme btn btn-sm pull-left my-2"
                        onClick={addNewItem}>
                        <i className="fa-solid fa-plus pe-1"></i>
                        Add New
                    </span>
                </div>
                <div className="col-sm-4 p-0">
                    <TablePagination
                        size={size}
                        setSize={setSize}
                        current={current}
                        setCurrent={setCurrent}
                        tableData={items}
                    />
                </div>

                <Modal
                    show={formShow}
                    onHide={() => handleShow()}
                    backdrop="static"
                    keyboard={true}
                    animation={true}
                    size="lg"
                    fullscreen={toggleModalWindow === "maximize"}>
                    <Modal.Header className="d-flex align-tems-center justify-content-between">
                        <Modal.Title>Process BPMN Model</Modal.Title>
                        <div className="d-flex">
                            <div
                                className={`mx-2 pointer ${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window"
                                title="Maximize window">
                                <i className="fa-regular fa-window-maximize fs-5"></i>
                            </div>

                            <div
                                className={`mx-2 pointer ${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window"
                                title="Restore window">
                                <i className="fa-regular fa-window-restore fs-5"></i>
                            </div>
                            <div
                                className={`mx-2 pointer`}
                                onClick={() => handleModalClose(formStatus)}>
                                <i className="fa-solid fa-xmark fs-5"></i>
                            </div>
                        </div>
                    </Modal.Header>
                    <Modal.Body>
                        <>
                            {toggleBpmnViewer === "restore" && (
                                <div className="form col-sm-12 form-background py-2 px-3">
                                    <div className="row">
                                        <div className="col-sm-4 mb-2">
                                            <div className="col-sm-12 mb-2">
                                                <div className="form-group">
                                                    <label className="mt-1 fw-bold">
                                                        Select Main Process
                                                        &nbsp;
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <select
                                                        className="form-control"
                                                        name="title"
                                                        value={
                                                            selectedItem.title
                                                        }
                                                        onChange={e =>
                                                            handleProcessSelected(
                                                                processes.find(
                                                                    process =>
                                                                        process.name ===
                                                                        e.target
                                                                            .value,
                                                                ),
                                                            )
                                                        }>
                                                        {processes.map(
                                                            (
                                                                process,
                                                                index,
                                                            ) => (
                                                                <option
                                                                    key={index}
                                                                    value={
                                                                        process.name
                                                                    }>
                                                                    {
                                                                        process.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-sm-12 mb-2">
                                                <div className="form-group">
                                                    <label className="mt-1 fw-bold">
                                                        Main Process Def
                                                        Key&nbsp;
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="process_def_key"
                                                        value={
                                                            selectedItem.process_def_key
                                                        }
                                                        onChange={handleChange}
                                                        readOnly={true}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-sm-12 mb-2">
                                                <div className="form-group">
                                                    <label className="mt-1 fw-bold">
                                                        BPMN File&nbsp;{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    {(selectedItem?.process_file ==
                                                        "" ||
                                                        fileStatus ===
                                                            "deleted") && (
                                                        <>
                                                            <input
                                                                type="file"
                                                                className="form-control"
                                                                required={true}
                                                                multiple={false}
                                                                accept=".bpmn"
                                                                value=""
                                                                onClick={event => {
                                                                    event.target.value =
                                                                        null;
                                                                }}
                                                                onChange={event => {
                                                                    handleFileUpload(
                                                                        event,
                                                                    );
                                                                    // <XMLParserExample
                                                                    //     onProcessSelected={
                                                                    //         handleProcessSelected
                                                                    //     }
                                                                    // />;
                                                                }}
                                                            />
                                                        </>
                                                    )}
                                                    {selectedItem.process_file &&
                                                        selectedItem.process_file !==
                                                            "" && (
                                                            <span
                                                                className={`p-2 mt-1 form-control ${
                                                                    fileStatus &&
                                                                    fileStatus ==
                                                                        "deleted"
                                                                        ? "deleted-text"
                                                                        : ""
                                                                }`}>
                                                                {
                                                                    selectedItem.process_file
                                                                }
                                                                {selectedItem?.process_file && (
                                                                    <i
                                                                        title="Delete"
                                                                        className="text-danger fa-solid fa-trash  pointer ms-1"
                                                                        onClick={event => {
                                                                            handleDeleteFileClick(
                                                                                event,
                                                                            );
                                                                        }}></i>
                                                                )}
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                            <div className="modal-footer pe-0">
                                                <button
                                                    className="btn button-theme btn-sm me-2 m-0"
                                                    onClick={() =>
                                                        handleModalClose(
                                                            formStatus,
                                                        )
                                                    }>
                                                    <i className="fa-solid fa-xmark pe-1"></i>
                                                    Close
                                                </button>

                                                <button
                                                    className="btn button-theme btn-sm me-2 m-0"
                                                    onClick={() =>
                                                        saveData(selectedItem)
                                                    }
                                                    disabled={saveIsDisabled}>
                                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-sm-8 mb-2">
                                            <div
                                                className="s2a-bpmn-viewer position-relative"
                                                style={{
                                                    height: "80vh",
                                                    position: "absolute",
                                                    left: "0px",
                                                    width: "100%",
                                                    overflow: "hidden",
                                                }}>
                                                <span
                                                    style={{
                                                        zIndex: 1000,
                                                    }}
                                                    className="position-absolute top-0 end-0 mt-2">
                                                    {selectedItem.process_file ===
                                                    "" ? (
                                                        <></>
                                                    ) : (
                                                        <>
                                                            <span
                                                                onClick={() =>
                                                                    setToggleBpmnViewer(
                                                                        "maximize",
                                                                    )
                                                                }>
                                                                <i className="fa-solid fa-expand pointer text-dark fs-5 me-2"></i>
                                                            </span>
                                                            <a
                                                                className="fa-solid fa-download pointer text-decoration-none text-dark fs-5 me-2"
                                                                href={`/file/service/${DB_TABLE}/${id}/${process_file}?a=${new Date().getMilliseconds()}`}></a>
                                                        </>
                                                    )}
                                                </span>
                                                {fileStatus !== "deleted" && (
                                                    <ReactBpmn
                                                        url={
                                                            url +
                                                            "?a=" +
                                                            new Date().getMilliseconds()
                                                        }
                                                        onShown={onShown}
                                                        onLoading={onLoading}
                                                        onError={onError}
                                                        width={300}
                                                        heigt={300}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {toggleBpmnViewer === "maximize" && (
                                <div className="s2a-bpmn-viewer-max position-relative">
                                    <span
                                        style={{
                                            zIndex: 1000,
                                        }}
                                        className="position-absolute top-0 end-0 mt-4">
                                        <span
                                            onClick={() =>
                                                setToggleBpmnViewer("restore")
                                            }>
                                            <i className="fa-solid fa-compress text-dark pointer fs-5 me-2"></i>
                                        </span>

                                        <a
                                            className="fa-solid fa-download pointer text-decoration-none text-dark fs-5 me-2"
                                            href={`${selectedItem.file_url}`}></a>
                                    </span>
                                    <span className="p-2">
                                        {selectedItem.process_file}
                                    </span>
                                    <ReactBpmn
                                        url={url}
                                        onShown={onShown}
                                        onLoading={onLoading}
                                        onError={onError}
                                    />
                                </div>
                            )}
                        </>
                    </Modal.Body>
                </Modal>

                <Modal
                    show={showDiscardDataModal}
                    onHide={() => setShowDiscardDataModal(false)}
                    backdrop="static"
                    className="s2a-modal"
                    keyboard={true}
                    animation={true}
                    size="md">
                    <Modal.Header>
                        <Modal.Title className="modal-title">
                            Confirm Disard
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        There are unsaved changes. Are you sure you want to
                        discard them?
                    </Modal.Body>

                    <Modal.Footer>
                        <button
                            className="btn button-theme btn-sm m-0 me-2"
                            onClick={() => setShowDiscardDataModal(false)}>
                            <i className="fa-solid fa-xmark pe-1"></i>
                            No
                        </button>
                        <button
                            className="btn button-theme btn-sm me-2 m-0"
                            onClick={handleDiscardConfirm}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            Yes
                        </button>
                    </Modal.Footer>
                </Modal>

                <ModalBox
                    state={deleteConfig}
                    message={"Are you sure to delete this item"}
                    operation={deleteData}
                    header={"Delete Process Deployment"}
                    setState={setDeleteConfig}
                    modalType="deleteModal"
                />
            </div>
        </div>
    );
}

export default Processes;
