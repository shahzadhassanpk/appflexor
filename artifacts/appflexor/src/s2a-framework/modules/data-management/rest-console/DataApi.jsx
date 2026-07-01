import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
// import useKeyboardShortcut from "../../../utils/useKeyboardShortcut";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";
import {
    ExportForm,
    exportData,
} from "../../../components/ExportForm/ExportFunctions";
import ModalBox from "../../../components/Modal/Modal";
import ModuleFormViewer from "../../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import {
    JsonToCsv,
    deleteItem,
    filterArrayByTerms,
    formatDateForDataBase,
    insertItem,
    jsonExport,
    updateDeleteConfig,
    updateItem,
} from "../../../utils/utils";
import CsvModal from "../datalist-builder/custom-action-modal/CsvModal";
import { toastEmitter } from "../../../components/Toastify/Toastify";

function DataApi({ activeTab }) {
    let initialState = {
        id: "",
        app: "",
        desc: "",
        servicekey: "",
        sql: "",
        instance_id: "",
        store_id: "",
        datasource: "",
    };

    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [instanceItems, setInstanceItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [width, setWidth] = useState("desktop");
    const [deleteIsDisabled, setDeleteIsDisabled] = useState(true);
    const [copySuccess, setCopySuccess] = useState("Copy");
    const inputReference = useRef(null);
    const textAreaRef = useRef(null);
    const [size, setSize] = useState(7);
    const [current, setCurrent] = useState(1);
    const [dataApiTab, setDataApiTab] = useState("");
    const [csvModal, setCsvModal] = useState(false);
    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);
    const [formShow, setFormShow] = useState(false);
    const handleClose = () => setFormShow(false);
    const handleShow = () => setFormShow(true);
    const modalRef = useRef(null);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    const getPaginateData = (current, pageSize) => {
        return filteredItems.slice(
            (current - 1) * pageSize,
            current * pageSize,
        );
    };

    useEffect(() => {
        if (activeTab === "DATA_APIS") {
            getData();
            getInstance();
            getCurrentWidthAndHeight();
        }
        // will disable eslint warning only for next line
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem?.sql?.length > 0 &&
            selectedItem?.servicekey?.length > 0
        ) {
            // if (selectedItem.serviceKey.length > 0 && selectedItem.query.length > 0) {
            if (selectedItem.servicekey === "api.data") {
                setSaveIsDisabled(true);
            } else {
                setSaveIsDisabled(false);
            }
            // setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }

        if (selectedItem.servicekey === "api.data") {
            setDeleteIsDisabled(true);
        } else {
            setDeleteIsDisabled(false);
        }
    }, [selectedItem]);

    function copyToClipboard(e) {
        textAreaRef.current.select();
        document.execCommand("copy");
        // e.target.focus();
        setCopySuccess("Copied!");
        setTimeout(() => {
            setCopySuccess("Copy");
        }, 2500);
    }

    function filterIt(terms, arr) {
        if ("" === terms || terms.length < 3) return arr;
        const words = terms.match(/\w+|"[^"]+"/g);
        words.push(terms);
        return arr.filter(a => {
            const v = Object.values(a);
            const f = JSON.stringify(v).toLowerCase();

            return words.every(val => f.includes(val));
        });
    }

    const handleSearch = event => {
        let textToSearch = "";
        if (event === undefined) {
            textToSearch = inputReference.current.value;
        } else if (event) {
            textToSearch = event.target.value.toLowerCase();
        }
        const keysToSearch = ["app", "servicekey", "desc", "datemodified"];
        let result = [];
        result = filterArrayByTerms(items, textToSearch, keysToSearch);
        setFilteredItems(result);
        if (textToSearch.length > 2) {
            setCurrent(1);
        }
    };

    function getselectedItem(item) {
        setSelectedItem(item);
        handleShow();
    }

    function addNewItem() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
        handleShow();
    }

    function clearFields() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
    }

    function handleInputField(event) {
        let name = event.target.name;
        let value = event.target.value;
        setSelectedItem({
            ...selectedItem,
            [name]: value,
        });
    }

    function getCurrentWidthAndHeight() {
        function checkWidth() {
            if (window.innerWidth > 576) {
                setWidth("desktop");
            } else if (window.innerWidth < 576) {
                setWidth("mobile");
            }
        }

        checkWidth();

        window.addEventListener("resize", checkWidth);

        return () => {
            window.removeEventListener("resize", checkWidth);
        };
    }

    function getObjectById(arr, id) {
        let result = null;
        arr.forEach(obj => {
            if (obj.id === id) {
                result = obj;
            }
        });
        return result ? result : initialState;
    }

    function saveData() {
        let fieldsData = { ...selectedItem };
        let request = {};
        let entityForm = {};
        request.data = [];

        entityForm.formId = "api_service";
        entityForm.entity = "api_service";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        delete fieldsData.datecreated;
        delete fieldsData.datemodified;
        delete fieldsData.selected;

        entityForm.formData = fieldsData;
        request.data.push(entityForm);
        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    fieldsData.id = response.data.C_DATA[0].formData.id;

                    if (selectedItem.id && selectedItem.id !== "new") {
                        updateItem(setItems, fieldsData);
                        updateItem(setFilteredItems, fieldsData);
                    } else {
                        insertItem(setItems, fieldsData);
                        insertItem(setFilteredItems, fieldsData);
                    }
                    const status =
                        selectedItem.id == "new" || selectedItem.id == ""
                            ? "Saved"
                            : "Updated";
                    toastEmitter(`Api ${status} Successfully`, true);
                    clearFields();
                    handleClose();
                } else if (response.data.C_STATUS === "FAIL") {
                    toastEmitter(`${response.data.C_MESSAGE}`, false, "error");
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "api_service";
            entityForm.entity = "api_service";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        deleteItem(setItems, fieldsData);
                        deleteItem(setFilteredItems, fieldsData);
                        updateDeleteConfig(false, {}, setDeleteConfig);
                        toastEmitter("Api Deleted Successfully", true);
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

    function getData(callback) {
        axios
            .post(API_URL + "?service.key=api.data&mode=formData")
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA) {
                            setItems(response.data.C_DATA);

                            if (inputReference.current.value) {
                                const keysToSearch = [
                                    "app",
                                    "servicekey",
                                    "desc",
                                    "datemodified",
                                ];
                                let result = [];
                                result = filterArrayByTerms(
                                    response.data.C_DATA,
                                    inputReference.current.value,
                                    keysToSearch,
                                );
                                setFilteredItems(result);
                            } else {
                                setFilteredItems(response.data.C_DATA);
                            }

                            if (selectedItem.id !== "") {
                                let _updatedItem = getObjectById(
                                    response.data.C_DATA,
                                    selectedItem.id,
                                );
                                setSelectedItem(_updatedItem);
                            }
                            if (callback) {
                                callback();
                            }
                        } else {
                            console.log(
                                `Either api.data does not exists or SQL query returns no result.`,
                            );
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getInstance() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "instance",
                    serviceKey: "sys.module.instances",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                    console.log(`UNAUTHORIZED, please login.`);
                } else if (response.data.C_STATUS === "SUCCESS") {
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

    function selectItemsForExport(selectedItem, check) {
        let _items = [...filteredItems];

        let index = _items.findIndex(item => item.id === selectedItem.id);
        _items[index].selected = check;
        setFilteredItems(_items);
    }

    function selectedRecordExport() {
        try {
            exportData(modalRef, filteredItems, setFilteredItems, "_data-api");
        } catch (error) {
            console.log(error);
        }
    }

    function nameExport(title) {
        jsonExport(filteredItems, setFilteredItems, title, "_data-api");
        modalRef.current.close();
    }
    return (
        <div className="data-management-data-apis">
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Data Api"}
                setState={setDeleteConfig}
                modalType="deleteModal"
            />
            <ChildrenModal
                ref={modalRef}
                header="Export Data Apis">
                <ExportForm nameExport={nameExport} />
            </ChildrenModal>
            <CsvModal
                csvModal={csvModal}
                handleClose={handleCloseCsv}
                getData={getData}
                tableName="api_service"
                title={"Api's Import"}
            />
            <div
                id="api-console"
                className="row py-2 m-0">
                <div className="col-sm-12">
                    <div className="row">
                        <div className="col-sm-3 mb-2 p-0">
                            <div className="search-input input-group mb-1">
                                <i className="input-search-icon fa-solid fa-magnifying-glass text-muted"></i>
                                <input
                                    ref={inputReference}
                                    type="text"
                                    className="form-control"
                                    onChange={handleSearch}
                                    placeholder="Search..."
                                />
                                {/* <span className="input-group-text fs-6">
                                    Ctrl + /
                                </span> */}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-12 p-0">
                    <div className="col-sm-12 p-0 table-height">
                        <Table className="s2a-table table-bordered table-hover mb-0">
                            <Thead className="thead">
                                <Tr className="tableHeader">
                                    <Th className="table-row text-left"></Th>
                                    <Th className="col-sm-2 table-row text-left">
                                        <TableSorting
                                            state={filteredItems}
                                            setState={setFilteredItems}
                                            fieldName={"app"}
                                            headerTitle={"App"}
                                            activeTab={activeTab}
                                        />
                                    </Th>
                                    <Th className="col-sm-2 table-row text-left">
                                        <TableSorting
                                            state={filteredItems}
                                            setState={setFilteredItems}
                                            fieldName={"servicekey"}
                                            headerTitle={"Service Key"}
                                            activeTab={activeTab}
                                        />
                                    </Th>
                                    <Th className="col-sm-2 table-row text-left">
                                        <TableSorting
                                            state={filteredItems}
                                            setState={setFilteredItems}
                                            fieldName={"datasource"}
                                            headerTitle={"Data Source"}
                                            activeTab={activeTab}
                                        />
                                    </Th>
                                    <Th className="col-sm-3 table-row text-left">
                                        Description
                                    </Th>
                                    <Th className="col-sm-2 table-row text-left">
                                        <TableSorting
                                            state={filteredItems}
                                            setState={setFilteredItems}
                                            fieldName={"datemodified"}
                                            headerTitle={"Date Modified"}
                                            activeTab={activeTab.apiConsole}
                                        />
                                    </Th>
                                    <Th className="col-sm-1 table-row text-left"></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {getPaginateData(current, size).map(
                                    (item, i) => {
                                        return (
                                            <Tr
                                                key={i}
                                                className={` ${
                                                    item.id === selectedItem.id
                                                        ? "selected-cell"
                                                        : " "
                                                }`}>
                                                <Td className="table-row text-left">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={item.selected}
                                                        onChange={e =>
                                                            selectItemsForExport(
                                                                item,
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                </Td>
                                                <Td className="col-sm-2 table-row text-left">
                                                    {item.app}
                                                </Td>
                                                <Td className="col-sm-2 table-row text-left">
                                                    {item.servicekey}
                                                </Td>
                                                <Td className="col-sm-2 table-row text-left">
                                                    {item.datasource}
                                                </Td>
                                                <Td className="col-sm-3 table-row text-left">
                                                    {item.desc}
                                                </Td>
                                                <Td className="col-sm-2 table-row text-left">
                                                    {formatDateForDataBase(
                                                        item.datemodified,
                                                    )}
                                                </Td>
                                                <Td className="col-sm-1 table-row text-left">
                                                    <div className="data-cell d-flex">
                                                        <span
                                                            className="table-edit-font"
                                                            title="Edit"
                                                            onClick={() =>
                                                                getselectedItem(
                                                                    item,
                                                                )
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
                                    },
                                )}
                            </Tbody>
                        </Table>
                    </div>
                    <div className="row">
                        <div className="col-sm-6">
                            <button
                                type="button"
                                className="btn button-theme btn-sm pull-left m-2 ms-0"
                                onClick={addNewItem}>
                                <i className="fa-solid fa-plus pe-1"></i>
                                Add New
                            </button>
                            <button
                                type="button"
                                className="btn button-theme btn-sm pull-left m-2 ms-0"
                                onClick={() => handleShowCsv()}>
                                <i className="fa-solid fa-file-import pe-1"></i>
                                Import
                            </button>
                            <button
                                type="button"
                                className="btn button-theme btn-sm pull-left m-2 ms-0"
                                onClick={() => selectedRecordExport()}>
                                <i className="fa-solid fa-file-export pe-1"></i>
                                Export
                            </button>
                            {/* <div className="col-sm-3">
                                <div className="row">
                                    <div className="col-sm-3 p-0">
                                        <div className="mt-2">
                                            <button
                                                className="btn btn-sm button-theme"
                                                onClick={() => handleShowCsv()}>
                                                <i className="fa-solid fa-file-import"></i>
                                                Import
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-sm-3 p-0">
                                        <div className="mt-2">
                                            <button
                                                className="btn btn-sm button-theme"
                                                onClick={() =>
                                                    selectedRecordExport()
                                                }>
                                                <i className="fa-solid fa-file-export"></i>
                                                Export
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                        <div className="col-sm-6">
                            <TablePagination
                                size={size}
                                setSize={setSize}
                                current={current}
                                setCurrent={setCurrent}
                                tableData={filteredItems}
                            />
                        </div>
                    </div>
                </div>
                <ModuleFormViewer
                    handleClose={handleClose}
                    showModal={formShow}
                    modalTitle="Data Api's"
                    size="lg">
                    <>
                        <div className="form col-sm-12">
                            <div className="row">
                                <div className="col-sm-6 form-group mb-2">
                                    <label className="mt-1 fw-bold">
                                        App&nbsp;
                                        <span className="text-danger"></span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{
                                            fontFamily: "Courier New",
                                        }}
                                        name="app"
                                        value={selectedItem.app}
                                        onChange={handleInputField}
                                        readOnly={
                                            selectedItem.servicekey ===
                                            "api.data"
                                        }
                                    />
                                </div>
                                <div className="col-sm-6 form-group mb-2">
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
                                        onChange={handleInputField}
                                        readOnly={
                                            selectedItem.servicekey ===
                                            "api.data"
                                        }>
                                        {/* <option
                                            key={0}
                                            defaultValue="">
                                            Default
                                        </option> */}
                                        <option value="">Default</option>
                                        {instanceItems &&
                                            instanceItems !== undefined &&
                                            instanceItems.map(instance => {
                                                return (
                                                    <option
                                                        key={instance.id}
                                                        value={instance.code}>
                                                        {instance.name}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                </div>
                            </div>
                            <div className="col-sm-12 form-group mb-2">
                                <label className="mt-1 fw-bold">
                                    Service Key&nbsp;
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ fontFamily: "Courier New" }}
                                    name="servicekey"
                                    value={selectedItem.servicekey}
                                    onChange={handleInputField}
                                    readOnly={
                                        selectedItem.servicekey === "api.data"
                                    }
                                />
                            </div>
                            <div className="col-sm-12 form-group mb-2">
                                <div className="d-flex justify-content-center">
                                    <div className="flex-grow-1">
                                        <label className="mt-1 fw-bold">
                                            Query&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                    </div>
                                    <div className="d-inline">
                                        <button
                                            className="button-theme btn btn-sm mb-1"
                                            onClick={copyToClipboard}>
                                            <i className="fa-regular fa-copy pe-1"></i>
                                            {copySuccess}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    type="text"
                                    rows="3"
                                    className="form-control"
                                    style={{ fontFamily: "Courier New" }}
                                    name="sql"
                                    value={selectedItem.sql}
                                    onChange={handleInputField}
                                    readOnly={
                                        selectedItem.servicekey === "api.data"
                                    }
                                    ref={textAreaRef}
                                />
                            </div>
                            <div className="col-sm-12 form-group mb-2">
                                <label className="mt-1 fw-bold">
                                    Description
                                    <span className="text-danger"></span>
                                </label>
                                <textarea
                                    type="text"
                                    rows="2"
                                    className="form-control"
                                    style={{ fontFamily: "Courier New" }}
                                    name="desc"
                                    value={selectedItem.desc}
                                    onChange={handleInputField}
                                />
                            </div>
                        </div>
                        <div className="text-end pe-0">
                            {selectedItem.id === "" && (
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={() => saveData()}
                                    disabled={saveIsDisabled}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                            )}
                            {selectedItem.id !== "" && (
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={() => saveData()}
                                    disabled={saveIsDisabled}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Update
                                </button>
                            )}
                            {selectedItem.id === "" && (
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={clearFields}>
                                    <i className="fa-solid fa-ban pe-1"></i>
                                    Clear
                                </button>
                            )}
                            <button
                                className="btn button-theme btn-sm m-0"
                                onClick={() => handleClose()}>
                                <i className="fa-solid fa-xmark pe-1"></i>
                                Close
                            </button>
                        </div>
                    </>
                </ModuleFormViewer>
            </div>
        </div>
    );
}

export default DataApi;
