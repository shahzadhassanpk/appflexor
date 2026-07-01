import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { AppContext } from "../../../AppContext";
import { API_URL, FILE_URL } from "../../Config";
import ModalBox from "../../components/Modal/Modal";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";
import { filterArrayByTerms, updateDeleteConfig } from "../../utils/utils";

const DB_TABLE = "reports";

const STATUS = {
    none: "NONE",
    create: "CREATE",
    update: "UPDATE",
};

const INITIAL_STATE = {
    id: "",
    name: "",
    app: "",
    reportkey: "",
    masterreportfile: "",
    subreportfile: "",
    datasource: "",
};

const config = {
    headers: {
        "Content-Type": "multipart/form-data",
    },
};

export default function ReportTemplates({ activeTab }) {
    const appContext = useContext(AppContext);

    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(INITIAL_STATE);
    const [formStatus, setFormStatus] = useState(STATUS.none);
    const [instanceItems, setInstanceItems] = useState([]);

    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const [showDiscardDataModal, setShowDiscardDataModal] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("maximize");

    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    const [masterEncodedFiles, setMasterEncodedFiles] = useState([]);

    useEffect(() => {
        if (activeTab === "JASPER_REPORT") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem?.name?.length > 0 &&
            selectedItem?.app?.length > 0 &&
            selectedItem?.reportkey?.length > 0
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
        setSelectedItem(item);
        handleShow();
    }

    function addNewItem() {
        setFormStatus(STATUS.create);
        setSelectedItem(INITIAL_STATE);
        setSaveIsDisabled(true);
        handleShow();
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
                    dataKey: "appReports",
                    serviceKey: "sys.reports",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "instance",
                    serviceKey: "sys.instance",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.appReports) {
                        let data = response.data.C_DATA.appReports;
                        setItems(data);
                    } else {
                        console.log(
                            `Eitherapp.channel does not exists or SQL query returns no result.`,
                        );
                    }

                    if (response.data.C_DATA.instance) {
                        setInstanceItems(response.data.C_DATA.instance);
                    } else {
                        setInstanceItems([]);
                        console.log(
                            `Either instance does not exists or SQL query returns no result.`,
                        );
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

    function handleFileUpload(event) {
        let key = event.target.id;
        let filesSelected = event.target.files;
        let fileNames = "";

        let fileEncodeCounter = 0;

        for (let i = 0; i < filesSelected.length; i++) {
            let fileReader = new FileReader();
            let fileName = filesSelected[i].name;

            fileNames += fileName + ";";

            fileReader.onload = fileLoadedEvent => {
                fileEncodeCounter++;
                // data: base64
                let name = filesSelected[i].name;
                let nameWithoutExt = name.split(".").slice(0, -1).join();
                let content = fileLoadedEvent.target.result;
                let contentBase64 = fileLoadedEvent.target.result;
                let newArr = content.split("base64,");
                let encodedData = "";
                if (newArr[1]) {
                    encodedData = newArr[1];
                }

                setMasterEncodedFiles(prev => {
                    return [
                        ...prev,
                        {
                            fileName: name,
                            content: encodedData,
                            contentBase64: contentBase64,
                            column: key,
                        },
                    ];
                });

                if (filesSelected.length === fileEncodeCounter) {
                    setSelectedItem(prev => ({
                        ...prev,
                        [key]: fileNames,
                    }));

                    uploadFilesToServer(key, fileNames);
                }
            };
            fileReader.readAsDataURL(filesSelected[i]);
        }
    }

    function saveData(field, value) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = DB_TABLE; //"formid"
        entityForm.entity = DB_TABLE; //Db- "table name"
        entityForm.action = "update";

        if (
            !selectedItem.id ||
            selectedItem.id == "" ||
            selectedItem.id == "new"
        ) {
            entityForm.id = "new";
            selectedItem.id = "new";
        } else {
            entityForm.id = selectedItem.id;
        }

        entityForm.formData = selectedItem;
        if (field && value) {
            entityForm.formData = { ...entityForm.formData, [field]: value };
        }

        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        let newId = response.data?.C_DATA[0]?.formData?.id;
                        if (newId) {
                            uploadFilesToServer(newId);
                        }
                    }
                }
            });
        } catch (e) {
            console.log("save processMap error:" + e);
        }
    }

    async function uploadFilesToServer(key, fileNames) {
        const tenantId = appContext?.tenantSubscription?.tenant_id;
        const request = {
            datasource: tenantId,
            data: [
                {
                    formId: DB_TABLE,
                    entity: DB_TABLE,
                    action: "update",
                    id: selectedItem.id,
                    formData: {
                        ...selectedItem,
                        [key]: fileNames,
                    },
                    fileData: [],
                },
            ],
        };

        const masterreportfileArr = fileNames.split(";");

        masterreportfileArr.map(async fileName => {
            if (fileName) {
                const encodedFiles = masterEncodedFiles.filter(
                    f => f.fileName === fileName,
                );

                if (encodedFiles.length > 0) {
                    const encodedFile = encodedFiles[0];
                    request.data[0].fileData.push({
                        fileName: fileName,
                        content: encodedFile.content,
                    });
                }
            }
        });

        const response = await axios.post(
            API_URL + "?service.key=update.formData",
            request,
        );
        if (response.data.C_STATUS === "SUCCESS") {
            if (selectedItem.id === "new" || selectedItem.id === "") {
                let newId = response.data?.C_DATA[0]?.formData?.id;
                if (newId) {
                    setSelectedItem(prev => ({ ...prev, id: newId }));
                }
            }
        }
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

    return (
        <div className="data-analysis-reports">
            <div className="row py-2 m-0">
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"app"}
                                        headerTitle={"App"}
                                    />
                                </Th>
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"name"}
                                        headerTitle={"Name"}
                                    />
                                </Th>
                                <Th className="col-sm-4 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"reportkey"}
                                        headerTitle={"Report Key"}
                                    />
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
                                            {item.app}
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.name}
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.reportkey}
                                        </Td>

                                        <Td className="col-sm-2 table-row text-left">
                                            <span
                                                className="table-edit-font"
                                                title="Edit"
                                                onClick={() => editItem(item)}>
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
                        <Modal.Title>Form Settings</Modal.Title>
                        <div className="d-flex">
                            <div
                                className={`mx-2 pointer ${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
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
                                data-bs-title="Restore Window">
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
                            <code>
                                {JSON.stringify(
                                    masterEncodedFiles.length,
                                    null,
                                    2,
                                )}
                                {JSON.stringify(selectedItem, null, 2)}
                            </code>

                            <div className="form col-sm-12 form-background py-2 px-3">
                                <div className="row">
                                    <div className="col-sm-6 mb-2">
                                        <div className="form-group">
                                            <label className="mt-1 fw-bold">
                                                App&nbsp;
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="app"
                                                value={selectedItem.app}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-sm-6 mb-2">
                                        <div className="form-group">
                                            <label className="mt-1 fw-bold">
                                                Name&nbsp;
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="name"
                                                value={selectedItem.name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="form-group">
                                            <label className="mt-1 fw-bold">
                                                Report Key&nbsp;
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="reportkey"
                                                value={selectedItem.reportkey}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-sm-6">
                                        <div className="form-group">
                                            <label className="mt-1 fw-bold">
                                                Datasource&nbsp;
                                                <span className="text-danger"></span>
                                            </label>
                                            <select
                                                placeholder="Select Option"
                                                className="form-select"
                                                name="datasource"
                                                value={
                                                    selectedItem &&
                                                    selectedItem.datasource
                                                }
                                                onChange={e => handleChange(e)}>
                                                <option value="">
                                                    Default
                                                </option>
                                                {instanceItems &&
                                                    instanceItems !==
                                                        undefined &&
                                                    instanceItems.map(
                                                        instance => {
                                                            return (
                                                                <option
                                                                    key={
                                                                        instance.id
                                                                    }
                                                                    value={
                                                                        instance.code
                                                                    }>
                                                                    {
                                                                        instance.name
                                                                    }
                                                                </option>
                                                            );
                                                        },
                                                    )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-sm-6 mb-2">
                                        <div className="form-group">
                                            <label className="mt-1 fw-bold">
                                                Master Report File&nbsp;{" "}
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                id="masterreportfile"
                                                multiple
                                                onChange={handleFileUpload}
                                            />
                                            <span>
                                                <RenderServerFiles
                                                    data={selectedItem}
                                                    setData={setSelectedItem}
                                                    field={"masterreportfile"}
                                                    saveData={saveData}
                                                />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-sm-6 mb-2">
                                        <div className="form-group">
                                            <label className="mt-1 fw-bold">
                                                Sub Report File&nbsp;{" "}
                                                {/* <span className="text-danger"></span> */}
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                id="subreportfile"
                                                multiple
                                                onChange={handleFileUpload}
                                            />
                                            <span>
                                                {selectedItem.subreportfile}
                                            </span>{" "}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer pe-0">
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={() =>
                                        handleModalClose(formStatus)
                                    }>
                                    <i className="fa-solid fa-xmark pe-1"></i>
                                    Cancel
                                </button>

                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={() => saveData()}
                                    disabled={saveIsDisabled}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                            </div>
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
                            className="btn button-theme btn-sm m-0"
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
                    header={"Delete Form"}
                    setState={setDeleteConfig}
                    modalType="deleteModal"
                />
            </div>
        </div>
    );
}

function RenderServerFiles({ data, setData, field, saveData }) {
    const [fileArray, setFileArray] = useState([]);

    useEffect(() => {
        try {
            const arr = data[field].split(";");
            setFileArray(arr);
        } catch (error) {
            console.log(error);
        }
    }, [data]);

    function removeFile(name) {
        const arr = fileArray.filter(f => f !== name);
        let str = arr.join(";");
        setFileArray(arr);

        // setData(prev => ({
        //     ...prev,
        //     [field]: str,
        // }));

        try {
            axios
                .delete(`/file/service/${DB_TABLE}/${data.id}/${name}`, config)
                .then(function (response) {
                    saveData(field, str);
                });
        } catch (e) {
            console.error("Error while sending delete request:" + e);
        }
    }

    return (
        <>
            {fileArray.length > -1 &&
                fileArray.map((name, index) => {
                    return (
                        <div
                            key={index}
                            className="m-0">
                            <a
                                className="file"
                                href={`/file/service/${DB_TABLE}/${data.id}/${name}`}
                                key={index}>
                                {name}
                            </a>
                            <span
                                className="ps-2 text-danger removeBtn"
                                onClick={() => removeFile(name)}>
                                remove
                            </span>
                        </div>
                    );
                })}
        </>
    );
}
