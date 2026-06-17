import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { API_URL } from "../../Config";
import ChildrenModal from "../../components/ChildrenModal/ChildrenModal";
import {
    ExportForm,
    exportData,
} from "../../components/ExportForm/ExportFunctions";
import ModalBox from "../../components/Modal/Modal";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";
import { Email } from "../../components/SendEmail/SendEmail";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";
import TextEditor from "../../components/TextEditor/RichTextEditor";
import { getData as globalGetData } from "../../components/CrudApiCall";

import {
    JsonToCsv,
    deleteItem,
    filterArrayByTerms,
    insertItem,
    jsonExport,
    updateDeleteConfig,
    updateItem,
} from "../../utils/utils";
import CsvModal from "../data-management/datalist-builder/custom-action-modal/CsvModal";
import { toastEmitter } from "../../components/Toastify/Toastify";

function EmailTemplates({ activeTab }) {
    let initialState = {
        id: "",
        title: "",
        emailkey: "",
        sql: "",
        template: "",
        profile: "",
    };
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [emailProfiles, setEmailProfiles] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [showEditor, setShowEditor] = useState(false);
    const inputReference = useRef(null);
    const [size, setSize] = useState(8);
    const [current, setCurrent] = useState(1);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const fields = ["id", "title", "emailkey", "sql", "template", "profile"];
    const [csvModal, setCsvModal] = useState(false);
    const handleCloseCsv = () => setCsvModal(false);
    const handleShowCsv = () => setCsvModal(true);
    const modalRef = useRef(null);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    const getPaginateData = (current, pageSize) => {
        let arr = [];
        arr = filteredItems
            ? filteredItems.slice((current - 1) * pageSize, current * pageSize)
            : [];
        if (arr) return arr;
        else return [];
    };
    useEffect(() => {
        if (
            selectedItem &&
            selectedItem?.title?.length > 0 &&
            selectedItem?.emailkey?.length > 0 &&
            selectedItem?.sql?.length > 0 &&
            selectedItem?.template?.length > 0 &&
            selectedItem?.profile?.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    useEffect(() => {
        if (activeTab === "EMAIL_TEMPLATES") {
            getData();
        }
    }, [activeTab]);

    async function editItem(item) {
        const res = await globalGetData({
            keys: [
                {
                    params: item.id,
                    dataKey: "emailtemplate",
                    serviceKey: "sys.selected.emailtemplate",
                    mode: "formData",
                },
            ],
            url: API_URL + "?service.key=masterKey.tenantData",
        });
        if (res.data.C_DATA.emailtemplate) {
            item = res.data.C_DATA.emailtemplate[0];
            setSelectedItem(item);
        } else {
            toastEmitter("item not found", true, "error");
        }
        handleShow();
    }

    function addNewItem() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
        handleShow();
    }

    function clearFields() {
        addNewItem();
    }

    function handleInputField(event, id) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleSearch(event) {
        let value = "";
        if (event === undefined) {
            value = inputReference.current.value;
        } else if (event) {
            value = event.target.value.toLowerCase();
        }
        let result = [];
        result = filterArrayByTerms(items, value, fields);
        setFilteredItems(result);
        if (value.length > 2) {
            setCurrent(1);
        }
    }

    function saveData(callback) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "email_service"; //"formid"
        entityForm.entity = "email_service"; //Db- "table name"
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
        let _selectedItem = { ...selectedItem };
        delete _selectedItem.selected;

        entityForm.formData = _selectedItem;
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        const fieldData = { ...selectedItem };
                        if (
                            selectedItem.id === "new" ||
                            selectedItem.id === ""
                        ) {
                            fieldData.id = response.data.C_DATA[0].formData.id;
                            insertItem(setItems, fieldData);
                            insertItem(setFilteredItems, fieldData);
                        } else {
                            updateItem(setItems, fieldData);
                            updateItem(setFilteredItems, fieldData);
                        }
                        const status =
                            selectedItem.id == "new" || selectedItem.id == ""
                                ? "Saved"
                                : "Updated";
                        toastEmitter(
                            `Email Template ${status} Successfully`,
                            true,
                        );
                        clearFields();
                        handleClose();
                        // getData();
                        setShowEditor(false);
                    } else if (response.data.C_STATUS === "FAIL") {
                        toastEmitter(
                            `${response.data.C_MESSAGE}`,
                            false,
                            "error",
                        );
                    }
                }
            });
        } catch (e) {
            console.log("Save error:" + e);
        }
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "email_service";
            entityForm.entity = "email_service";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        handleClose();
                        deleteItem(setItems, fieldsData);
                        deleteItem(setFilteredItems, fieldsData);
                        // getData();
                        toastEmitter(
                            "Email Template Deleted Successfully",
                            true,
                        );

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

    function getData(callback) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "emailServices",
                    serviceKey: "sys.email.services",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "emailProfiles",
                    serviceKey: "sys.emailtemplate.profiles",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.emailServices) {
                            setItems(response.data.C_DATA.emailServices);
                            let data = response.data.C_DATA.emailServices;
                            if (inputReference.current.value) {
                                let result = [];
                                result = filterArrayByTerms(
                                    data,
                                    inputReference.current.value,
                                    fields,
                                );
                                setFilteredItems(result);
                            } else {
                                setFilteredItems(data);
                            }
                        } else {
                            console.log(
                                `Either app.channel does not exists or SQL query returns no result.`,
                            );
                        }
                        if (response.data.C_DATA.emailProfiles) {
                            setEmailProfiles(
                                response.data.C_DATA.emailProfiles,
                            );
                        } else {
                            console.log(
                                `Either app.channel does not exists or SQL query returns no result.`,
                            );
                        }

                        if (callback) callback();
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function handleInput(e) {
        const { id, value } = e.target;

        setSelectedItem(prevState => ({
            ...prevState,
            [id]: value,
        }));
    }

    function selectItemsForExport(selectedItem, check) {
        let _items = [...filteredItems];

        let index = _items.findIndex(item => item.id === selectedItem.id);
        _items[index].selected = check;
        setFilteredItems(_items);
    }

    function selectedRecordExport() {
        try {
            exportData(
                modalRef,
                filteredItems,
                setFilteredItems,
                "_email-template",
            );
        } catch (error) {
            console.log(error);
        }
    }

    function nameExport(title) {
        jsonExport(filteredItems, setFilteredItems, title, "_email-template");
        modalRef.current.close();
    }

    return (
        <div className="content-management-email-template">
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Email Template"}
                setState={setDeleteConfig}
                modalType="deleteModal"
            />
            <ChildrenModal
                ref={modalRef}
                header="Export Email Templates">
                <ExportForm nameExport={nameExport} />
            </ChildrenModal>
            <CsvModal
                csvModal={csvModal}
                handleClose={handleCloseCsv}
                getData={getData}
                tableName="email_service"
                title={"Email Templates Import"}
            />

            <div className="row py-2 m-0">
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
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="table-row text-left"></Th>
                                <Th className="col-sm-4 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"title"}
                                        headerTitle={"Title"}
                                    />
                                </Th>
                                <Th className="col-sm-5 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"emailkey"}
                                        headerTitle={"Email Key"}
                                    />
                                </Th>
                                <Th className="col-sm-2 table-row text-left"></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {getPaginateData(current, size).map((item, i) => {
                                return (
                                    <Tr
                                        key={item.id}
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
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.title}
                                        </Td>
                                        <Td className="col-sm-5 table-row text-left">
                                            {item.emailkey}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            <div className="data-cell d-flex">
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
                <div className="col-sm-8 p-0 my-2">
                    <span
                        type="button"
                        className="button-theme btn btn-sm me-2"
                        onClick={addNewItem}>
                        <i className="fa-solid fa-plus pe-1"></i>
                        Add New
                    </span>
                    <span
                        type="button"
                        className="button-theme btn btn-sm me-2"
                        onClick={() => handleShowCsv()}>
                        <i className="fa-solid fa-file-import pe-1"></i>
                        Import
                    </span>
                    <span
                        type="button"
                        className="button-theme btn btn-sm me-2"
                        onClick={() => selectedRecordExport()}>
                        <i className="fa-solid fa-file-export pe-1"></i>
                        Export
                    </span>
                </div>
                <div className="col-sm-4 p-0">
                    <TablePagination
                        size={size}
                        setSize={setSize}
                        current={current}
                        setCurrent={setCurrent}
                        tableData={filteredItems}
                    />
                </div>
            </div>
            <ModuleFormViewer
                handleClose={handleClose}
                showModal={show}
                modalTitle="Email Template"
                size="xl">
                <>
                    <div className="form col-sm-12 form-background">
                        <div className="row mt-1">
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Title&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="title"
                                        value={selectedItem.title}
                                        onChange={handleInputField}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Email Key&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="emailkey"
                                        value={selectedItem.emailkey}
                                        onChange={handleInputField}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Email Profile&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        name="profile"
                                        className="form-select"
                                        value={selectedItem.profile}
                                        onChange={e => handleInputField(e)}>
                                        <option value="">Select Profile</option>
                                        {emailProfiles &&
                                            emailProfiles.map((item, index) => (
                                                <option
                                                    key={index}
                                                    value={item.id}>
                                                    {item.host}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="row my-1">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        SQL&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        type="text"
                                        className="form-control"
                                        name="sql"
                                        value={selectedItem.sql}
                                        onChange={handleInputField}
                                        // rows="6"
                                        // style={{ height: "38px" }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row my-1">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Template&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                </div>
                                <TextEditor
                                    id="template"
                                    value={selectedItem.template}
                                    height="300px"
                                    onChange={handleInput}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer pe-0">
                        {selectedItem.id === "" && (
                            <button
                                className="btn button-theme btn-sm me-2 m-0"
                                onClick={() => saveData()}
                                disabled={saveIsDisabled}>
                                <i className="fa-solid fa-floppy-disk pe-1"></i>{" "}
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
                        {selectedItem.id !== "" && (
                            <div className=" me-2 m-0">
                                <Email emailkey={selectedItem.emailkey} />
                            </div>
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
    );
}

export default EmailTemplates;
