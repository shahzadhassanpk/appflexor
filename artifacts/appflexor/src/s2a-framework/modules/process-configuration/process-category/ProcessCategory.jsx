import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { AppContext } from "../../../../AppContext";
import { API_URL } from "../../../Config";
import ModalBox from "../../../components/Modal/Modal";
import ModuleFormViewer from "../../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import { updateDeleteConfig } from "../../../utils/utils";
import { BPM_API_URL } from "../../camunda/CamundaConfig";
import ProcessesContext from "../../camunda/ProcessesContext";
import { toastEmitter } from "../../../components/Toastify/Toastify";

function ProcessMap({ activeTab }) {
    let initialState = {
        id: "",
        title: "",
        key: "",
    };

    const [items, setItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [size, setSize] = useState(5);
    const [error, setError] = useState([]);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const handleClose = () => setFormShow(false);
    const handleShow = () => setFormShow(true);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    const getPaginateData = (current, pageSize) => {
        return items.slice((current - 1) * pageSize, current * pageSize);
    };

    useEffect(() => {
        if (activeTab === "PROCESS_CATEGORY") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedItem.title !== "" && selectedItem.key !== "") {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

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

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "processCategory",
                    serviceKey: "process.category",
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
                    setItems(response.data.C_DATA.processCategory);
                }
            })
            .catch(error => {
                console.error(error);
            });
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

        entityForm.formId = "process_category"; //"formid"
        entityForm.entity = "process_category"; //Db- "table name"
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
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (
                            selectedItem.id === "new" ||
                            selectedItem.id === ""
                        ) {
                            const newId = response.data.C_DATA[0].formData.id;
                            setItems(prev => [
                                ...prev,
                                {
                                    ...selectedItem,
                                    id: newId,
                                },
                            ]);
                            toastEmitter(
                                "Process Category saved successfully",
                                true,
                            );
                        } else {
                            let updatedItem = items.map(el => {
                                if (el.id === selectedItem.id) {
                                    return selectedItem;
                                } else return el;
                            });

                            setItems(updatedItem);
                            toastEmitter(
                                "Process Category updated successfully",
                                true,
                            );
                        }

                        clearFields();
                        handleClose();
                    }
                }
            });
        } catch (e) {
            console.log("save processCategory error:" + e);
        }
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "process_category";
            entityForm.entity = "process_category";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        // getData();
                        let deletedId = response.data.C_DATA[0].id;
                        let updatedItem = items.filter(
                            el => el.id !== deletedId,
                        );

                        setItems(updatedItem);

                        updateDeleteConfig(false, {}, setDeleteConfig);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            updateDeleteConfig(true, item, setDeleteConfig);
        }
    }

    return (
        <div className="process-configuration-category">
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Process Category"}
                setState={setDeleteConfig}
                modalType="deleteModal"
            />
            <div className="row p-2 m-0">
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-5 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"title"}
                                        headerTitle={"Title"}
                                    />
                                </Th>
                                <Th className="col-sm-5 table-row text-left">
                                    Key
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
                                        <Td className="col-sm-5 table-row text-left">
                                            {item.title}
                                        </Td>
                                        <Td className="col-sm-5 table-row text-left">
                                            {item.key}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            <div className="data-cell d-flex">
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
                    modalTitle="Process Category"
                    size="lg">
                    <div className="form col-sm-12 form-background pt-2 pb-3 px-3">
                        <div className="row">
                            <div className="col-sm-12">
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
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Key&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="key"
                                        value={selectedItem.key}
                                        onChange={handleInputField}
                                    />
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
                </ModuleFormViewer>
            </div>
        </div>
    );
}

export default ProcessMap;
