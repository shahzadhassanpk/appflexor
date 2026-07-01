import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
// import useKeyboardShortcut from "../../utils/useKeyboardShortcut";
import { API_URL } from "../../Config";
import ModalBox from "../../components/Modal/Modal";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";
import {
    deleteItem,
    filterArrayByTerms,
    insertItem,
    updateDeleteConfig,
    updateItem,
} from "../../utils/utils";
import { getData as globalGetData } from "../../components/CrudApiCall";
import { toastEmitter } from "../../components/Toastify/Toastify";

function EmailProfiles({ activeTab }) {
    let initialState = {
        id: "",
        email: "",
        host: "",
        sslport: "",
        emailpassword: "",
    };
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const inputReference = useRef(null);
    const [size, setSize] = useState(8);
    const [current, setCurrent] = useState(1);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [showPassword, setShowPassword] = useState({
        emailpassword: false,
    });
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
    const fields = ["id", "email", "host", "sslport", "emailpassword"];

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem?.email?.length > 0 &&
            selectedItem?.host?.length > 0 &&
            selectedItem?.sslport?.length > 0 &&
            selectedItem?.emailpassword?.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    useEffect(() => {
        if (activeTab === "EMAIL_PROFILE") {
            getData();
        }
    }, [activeTab]);

    async function editItem(item) {
        const res = await globalGetData({
            keys: [
                {
                    params: item.id,
                    dataKey: "emailProfile",
                    serviceKey: "sys.selected.emailprofile",
                    mode: "formData",
                },
            ],
            url: API_URL + "?service.key=masterKey.tenantData",
        });
        if (res.data.C_DATA.emailProfile) {
            item = res.data.C_DATA.emailProfile[0];
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

        entityForm.formId = "email_profile"; //"formid"
        entityForm.entity = "email_profile"; //Db- "table name"
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
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    const fieldData = { ...selectedItem };
                    if (selectedItem.id === "new" || selectedItem.id === "") {
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
                    toastEmitter(`Email Profile ${status} Successfully`, true);
                    clearFields();
                    handleClose();

                    // getData();
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
            entityForm.formId = "email_profile";
            entityForm.entity = "email_profile";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        handleClose();
                        deleteItem(setItems, item);
                        deleteItem(setFilteredItems, item);
                        // getData();
                        toastEmitter(
                            "Email Profile Deleted Successfully",
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
                    dataKey: "emailProfiles",
                    serviceKey: "sys.email.profiles",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.emailProfiles) {
                            setItems(response.data.C_DATA.emailProfiles);
                            let data = response.data.C_DATA.emailProfiles;
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

                        if (callback) callback();
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <div className="content-management-email-profile">
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Email Profile"}
                setState={setDeleteConfig}
                modalType="deleteModal"
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
                                <Th className="col-sm-4 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"email"}
                                        headerTitle={"Email"}
                                    />
                                </Th>
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"host"}
                                        headerTitle={"Host"}
                                    />
                                </Th>
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"sslport"}
                                        headerTitle={"SSL Port"}
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
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.email}
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.host}
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.sslport}
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
                        tableData={filteredItems}
                    />
                </div>
                <ModuleFormViewer
                    handleClose={handleClose}
                    showModal={show}
                    modalTitle="Email Profile"
                    size="lg">
                    <>
                        <div className="form col-sm-12 form-background">
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Email&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="email"
                                            value={selectedItem.email}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Host&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="host"
                                            value={selectedItem.host}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            SSL Port&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="sslport"
                                            value={selectedItem.sslport}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Password&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <div className="s2a-passfield position-relative">
                                            <input
                                                type={
                                                    showPassword.emailpassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                className="form-control"
                                                name="emailpassword"
                                                value={
                                                    selectedItem.emailpassword
                                                }
                                                onChange={handleInputField}
                                            />
                                            <span
                                                className="show-pass"
                                                onClick={() =>
                                                    setShowPassword({
                                                        ...showPassword,
                                                        emailpassword:
                                                            !showPassword.emailpassword,
                                                    })
                                                }>
                                                {showPassword &&
                                                showPassword.emailpassword ? (
                                                    <i className="fa-regular fa-eye"></i>
                                                ) : (
                                                    <i className="fa-regular fa-eye-slash"></i>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer pe-0">
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

export default EmailProfiles;
