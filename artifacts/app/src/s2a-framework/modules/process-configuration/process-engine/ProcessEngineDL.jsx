import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { API_URL } from "../../../Config";
import ModalBox from "../../../components/Modal/Modal";
import ModuleFormViewer from "../../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import { updateDeleteConfig } from "../../../utils/utils";

function ProcessEngine({ activeTab }) {
    let initialState = {
        id: "",
        source_engine: "",
        service_url: "",
        username: "",
        password: "",
    };
    const [list, setList] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const handleClose = () => setFormShow(false);
    const handleShow = () => setFormShow(true);

    const getPaginateData = (current, pageSize) => {
        if (list) {
            return list.slice((current - 1) * pageSize, current * pageSize);
        }
        return [];
    };
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    useEffect(() => {
        if (activeTab === "PROCESS_ENGINE") {
            getData();
        }
    }, [activeTab]);

    function editItem(item) {
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
                    serviceParams: "",
                    dataKey: "engine",
                    serviceKey: "bpm.process.engine.list",
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
                            setList(data);
                        } else {
                            setList([]);
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

    function saveData(callback) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "process_engine"; //"formid"
        entityForm.entity = "process_engine"; //Db- "table name"
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
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        selectedItem.id = response.data.C_NEW_RECORD_ID;
                    }
                    getData();
                    clearFields();
                    handleClose();
                }
            });
        } catch (e) {
            console.log("save processMap error:" + e);
        }
        getData();
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "process_engine";
            entityForm.entity = "process_engine";
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
        getData();
    }

    return (
        <div className="process-engine">
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Form"}
                setState={setDeleteConfig}
                modalType="deleteModal"
            />
            <div className="row py-2 m-0">
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-1 table-row text-left">
                                    Active
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    <TableSorting
                                        state={list}
                                        setState={setList}
                                        fieldName={"source_engine"}
                                        headerTitle={"Engine Type"}
                                    />
                                </Th>

                                <Th className="col-sm-2 table-row text-left">
                                    Service URL
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    Username
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
                                        <Td className="col-sm-1 table-row text-left">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={
                                                    item.is_active === "YES"
                                                        ? true
                                                        : false
                                                }
                                            />
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.source_engine}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {item.service_url}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {item.username}
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
                        tableData={list}
                    />
                </div>
                <ModuleFormViewer
                    handleClose={handleClose}
                    showModal={formShow}
                    modalTitle="Process Engine"
                    size="lg">
                    <>
                        <div className="form col-sm-12 form-background py-2 px-3">
                            <div className="row">
                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Engine Type&nbsp;
                                            {/* <span className="text-danger"></span> */}
                                        </label>
                                        <select
                                            placeholder="Select Form"
                                            className="form-select"
                                            name="source_engine"
                                            value={selectedItem.source_engine}
                                            onChange={e => handleChange(e)}>
                                            <option value="">
                                                Select Engine Type
                                            </option>
                                            <option value="CAMUNDA_SEVEN">
                                                Camunda v7
                                            </option>
                                            <option value="CAMUNDA_EIGHT">
                                                Camunda v8
                                            </option>
                                            <option value="JOGET">Joget</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-sm-6 mb-2"></div>
                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Username&nbsp;
                                            {/* <span className="text-danger"></span> */}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="username"
                                            value={selectedItem.username}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-sm-6 mb-3 pass-input">
                                    <label className="form-label label">
                                        Password
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            className="form-control"
                                            name="password"
                                            value={selectedItem.password}
                                            onChange={handleChange}
                                            required
                                        />

                                        <span
                                            className="input-group-text"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }>
                                            {showPassword ? (
                                                <i className="fa-regular fa-eye"></i>
                                            ) : (
                                                <i className="fa-regular fa-eye-slash"></i>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="col-sm-12 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Service URL&nbsp;
                                            {/* <span className="text-danger"></span> */}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="service_url"
                                            value={selectedItem.service_url}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-12 mb-2">
                                    <div className="form-group">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="is_active"
                                                checked={
                                                    selectedItem.is_active ===
                                                    "YES"
                                                        ? true
                                                        : false
                                                }
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label fw-bold">
                                                Is Active&nbsp;
                                            </label>
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
                                    // disabled={saveIsDisabled}
                                >
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                            )}
                            {selectedItem.id !== "" && (
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={() => saveData()}
                                    // disabled={saveIsDisabled}
                                >
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

export default ProcessEngine;
