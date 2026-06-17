import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../Config";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";

function ObjectStore({ isAuthorized, activeTab }) {
    let initialState = {
        id: "",
        code: "",
        name: "",
        db: "",
        description: "",
        instance_id: "",
    };
    const [items, setItems] = useState([]);
    const [instance, setInstance] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);

    const getPaginateData = (current, pageSize) => {
        return items.slice((current - 1) * pageSize, current * pageSize);
    };
    // const [selectedInstance, setSelectedInstance] = useState({});
    //   const API_URL ="/app/service";

    useEffect(() => {
        getData();
        getInstance();
    }, [isAuthorized, activeTab.objectStore]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem.name.length > 0 &&
            selectedItem.db.length > 0 &&
            selectedItem.instance_id.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    function editItem(item) {
        setSelectedItem(item);
    }

    function addNewItem() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
    }

    function clearFields() {
        addNewItem();
    }

    function getNameById(id) {
        let result = "";
        instance.forEach(obj => {
            if (obj.id === id) {
                result = obj.name;
            }
        });
        return result ? result : "";
    }

    function handleInstance(event) {
        let value = event.target.value;

        setSelectedItem(prev => ({
            ...prev,
            instance_id: value,
        }));
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

        entityForm.formId = "object_store"; //"formid"
        entityForm.entity = "object_store"; //Db- "table name"
        entityForm.action = "update";

        // selectedItem.instance_id = selectedInstance

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
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
        getData();
    }

    function deleteData(item) {
        if (window.confirm("Are you sure to delete?") == true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "object_store";
            entityForm.entity = "object_store";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        getData();
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            // console.log("you press cancel")
        }
        getData();
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "object_store",
                    serviceKey: "object.store",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=multiKey.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.object_store) {
                            setItems(response.data.C_DATA.object_store);
                        } else {
                            console.log(
                                `Either object.store does not exists or SQL query returns no result.`,
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
                            setInstance(response.data.C_DATA.instance);
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
        <React.Fragment>
            <div className="row my-2 px-3">
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
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"db"}
                                        headerTitle={"Db"}
                                    />
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    Instance
                                </Th>
                                <Th className="col-sm-3 table-row text-left">
                                    Description
                                </Th>
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
                                            {item.db}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {getNameById(item.instance_id)}
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.description}
                                        </Td>
                                        <Td className="col-sm-1 table-row text-left">
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
                <div className="form col-sm-12 form-border my-2 px-3">
                    <div className="row">
                        <div className="col-sm-3">
                            <div className="form-group">
                                <label className="mt-1 fw-bold">
                                    Code&nbsp;
                                    <span className="text-danger"></span>
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
                        <div className="col-sm-3">
                            <div className="form-group">
                                <label className="mt-1 fw-bold">
                                    Name&nbsp;
                                    <span className="text-danger">*</span>
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
                        <div className="col-sm-3">
                            <div className="form-group">
                                <label className="mt-1 fw-bold">
                                    Db&nbsp;
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="db"
                                    value={selectedItem.db}
                                    onChange={handleInputField}
                                />
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <label className="mt-1 fw-bold">
                                Instance&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <select
                                className="form-select"
                                value={selectedItem.instance_id}
                                name="instance_id"
                                onChange={handleInstance}>
                                <option defaultValue=" ">
                                    Select Instance
                                </option>
                                {instance.map(_instance => (
                                    <option
                                        key={_instance.id}
                                        value={_instance.id}>
                                        {_instance.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-sm-3">
                            <div className="form-group">
                                <label className="mt-1 fw-bold">
                                    Description&nbsp;
                                    <span className="text-danger"></span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="description"
                                    value={selectedItem.description}
                                    onChange={handleInputField}
                                />
                            </div>
                        </div>
                    </div>

                    {selectedItem.id === "" && (
                        <button
                            className="btn button-theme btn-sm pull-left m-2 ms-0"
                            onClick={() => saveData()}
                            disabled={saveIsDisabled}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>{" "}
                            Save
                        </button>
                    )}
                    {selectedItem.id !== "" && (
                        <button
                            className="btn button-theme btn-sm pull-left m-2 ms-0"
                            onClick={() => saveData()}
                            disabled={saveIsDisabled}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            Update
                        </button>
                    )}
                    {selectedItem.id === "" && (
                        <button
                            className="btn button-theme btn-sm pull-left m-2 text-light"
                            onClick={clearFields}>
                            <i className="fa-solid fa-xmark pe-1"></i>
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}

export { ObjectStore };
