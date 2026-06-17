import axios from "axios";
import React, { useEffect, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { API_URL } from "../../Config";
import ModalBox from "../../components/Modal/Modal";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";
import {
    deleteItem,
    insertItem,
    updateDeleteConfig,
    updateItem,
} from "../../utils/utils";
import { getData as globalGetData } from "../../components/CrudApiCall";
import { toastEmitter } from "../../components/Toastify/Toastify";

function JdbcDataSource({ activeTab }) {
    let initialState = {
        id: "",
        code: "",
        name: "",
        driver: "",
        url: "",
        user: "",
        password: "",
        description: "",
    };
    const [items, setItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);

    const handleClose = () => setFormShow(false);
    const handleShow = () => setFormShow(true);
    const [showPassword, setShowPassword] = useState({
        password: false,
    });
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    const getPaginateData = (current, pageSize) => {
        return items.slice((current - 1) * pageSize, current * pageSize);
    };

    useEffect(() => {
        if (activeTab === "JDBC_DATA_SOURCES") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem.code.length > 0 &&
            selectedItem.name.length > 0 &&
            selectedItem.driver.length > 0 &&
            selectedItem.url.length > 0 &&
            selectedItem.user.length > 0 &&
            selectedItem.password.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    async function editItem(item) {
        const res = await globalGetData({
            keys: [
                {
                    params: item.id,
                    dataKey: "instance",
                    serviceKey: "sys.selected.instance",
                    mode: "formData",
                },
            ],
            url: API_URL + "?service.key=masterKey.tenantData",
        });
        if (res.data.C_DATA.instance) {
            item = res.data.C_DATA.instance[0];
        }
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

    function handleInputField(event, id) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function saveData(callback) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "instance"; //"formid"
        entityForm.entity = "instance"; //Db- "table name"
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
                if (response.data.C_STATUS === "SUCCESS") {
                    var item = response.data.C_DATA[0].formData;
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        setSelectedItem(prev => ({
                            ...prev,
                            id: item.id,
                        }));
                        insertItem(setItems, item);
                    } else {
                        updateItem(setItems, item);
                    }
                    const status =
                        selectedItem.id == "new" || selectedItem.id == ""
                            ? "Saved"
                            : "Updated";
                    toastEmitter(`Datasource ${status} Successfully`, true);
                    clearFields();
                    handleClose();
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "instance";
            entityForm.entity = "instance";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        deleteItem(setItems, fieldsData);
                        updateDeleteConfig(false, {}, setDeleteConfig);
                        toastEmitter("Datasource Deleted Successfully", true);
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

    function getData() {
        var dataRequest = {
            dataKeys: [
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
                if (response.status === 200) {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.instance) {
                            setItems(response.data.C_DATA.instance);
                        } else {
                            console.log(
                                `Either instance does not exists or SQL query returns no result.`,
                            );
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <div className="jdbc-datasources">
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Datasource"}
                setState={setDeleteConfig}
                modalType="deleteModal"
            />
            <div className="row py-2 m-0">
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-2 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"code"}
                                        headerTitle={"Code"}
                                    />
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"name"}
                                        headerTitle={"Name"}
                                    />
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    Driver
                                </Th>
                                <Th className="col-sm-1 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"user"}
                                        headerTitle={"User"}
                                    />
                                </Th>
                                <Th className="col-sm-4 table-row text-left">
                                    Url
                                </Th>
                                {/* <Th className="col-sm-2 table-row text-left">Description</Th> */}
                                <Th className="col-sm-1 table-row text-left"></Th>
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
                                        <Td className="col-sm-2 table-row text-left">
                                            {item.code}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {item.name}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {item.driver}
                                        </Td>
                                        <Td className="col-sm-1 table-row text-left">
                                            {item.user}
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.url}
                                        </Td>
                                        {/* <Td className="col-sm-2 table-row text-left">
                      {item.description}
                    </Td> */}
                                        <Td className="col-sm-1 table-row text-left">
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
                        tableData={items}
                    />
                </div>
                <ModuleFormViewer
                    handleClose={handleClose}
                    showModal={formShow}
                    modalTitle="Data Sources"
                    size="lg">
                    <>
                        <div className="form col-sm-12 py-2 px-6">
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Code&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="code"
                                            value={selectedItem.code}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-6">
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
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Driver&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="driver"
                                            value={selectedItem.driver}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            User&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="user"
                                            value={selectedItem.user}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-6">
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
                                                    showPassword.password
                                                        ? "text"
                                                        : "password"
                                                }
                                                className="form-control"
                                                name="password"
                                                value={selectedItem.password}
                                                onChange={handleInputField}
                                            />
                                            <span
                                                className="show-pass"
                                                onClick={() =>
                                                    setShowPassword({
                                                        ...showPassword,
                                                        password:
                                                            !showPassword.password,
                                                    })
                                                }>
                                                {showPassword &&
                                                showPassword.password ? (
                                                    <i className="fa-regular fa-eye"></i>
                                                ) : (
                                                    <i className="fa-regular fa-eye-slash"></i>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Url&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="url"
                                            value={selectedItem.url}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Description&nbsp;
                                            <span className="text-danger"></span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            type="text"
                                            className="form-control"
                                            name="description"
                                            value={selectedItem.description}
                                            onChange={
                                                handleInputField
                                            }></textarea>
                                    </div>
                                </div>
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

export default JdbcDataSource;
