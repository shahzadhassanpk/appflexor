import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "../../../Config";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import TableSorting from "../../../components/TableSorting/TableSorting";
import ModuleFormViewer from "../../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
// import useKeyboardShortcut from "../../../utils/useKeyboardShortcut";
import {
    deleteItem,
    filterArrayByTerms,
    insertItem,
    updateItem,
} from "../../../utils/utils";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";
import DeleteConfimation from "../../../components/delete-confimation";

function Group({ activeTab }) {
    const scrollHeight = document.body.scrollHeight;
    let initialState = {
        id: "",
        name: "",
        code: "",
        description: "",
    };
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [filteredItems, setFilteredItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [formShow, setFormShow] = useState(false);
    const handleClose = () => setFormShow(false);
    const handleShow = () => setFormShow(true);
    const inputReference = useRef(null);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const deleteModalRef = useRef(null);

    const getPaginateData = (current, pageSize) => {
        return filteredItems.slice(
            (current - 1) * pageSize,
            current * pageSize,
        );
    };

    useEffect(() => {
        if (activeTab === "GROUPS") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem.name.length > 0 &&
            selectedItem.code.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    function editItem(item) {
        setSelectedItem(item);
        handleShow();
        window.scrollTo(0, scrollHeight);
    }

    function addNewItem() {
        setSelectedItem(initialState);
        handleShow();
    }

    function clearFields() {
        addNewItem();
    }

    function handleInputField(event) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    const handleSearch = event => {
        let textToSearch = "";
        if (event === undefined) {
            textToSearch = inputReference.current.value;
        } else if (event) {
            textToSearch = event.target.value.toLowerCase();
        }
        const keysToSearch = ["name", "code", "description"];
        let result = [];
        result = filterArrayByTerms(items, textToSearch, keysToSearch);
        setFilteredItems(result);
        if (textToSearch.length > 2) {
            setCurrent(1);
        }
    };

    function saveData() {
        var fields = { ...selectedItem };
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};
        let groupState = "";

        entityForm.formId = "dir_group"; //"formid"
        entityForm.entity = "dir_group"; //Db- "table name"
        entityForm.action = "update";

        if (!fields.id || fields.id == "" || fields.id == "new") {
            entityForm.id = "new";
            fields.id = "new";
            fields.type = "APP";
            groupState = "Created";
        } else {
            entityForm.id = fields.id;
            // delete fields.code;
            groupState = "Updated";
        }

        entityForm.formData = fields;
        request.data.push(entityForm);

        try {
            axios.post(url, request).then(function (response) {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (fields.id === "new" || fields.id === "") {
                        fields.id = response.data.C_DATA[0].formData.id;
                        setSelectedItem(prev => ({
                            ...prev,
                            id: fields.id,
                        }));
                        insertItem(setItems, fields);
                        insertItem(setFilteredItems, fields);
                    } else {
                        updateItem(setItems, fields);
                        updateItem(setFilteredItems, fields);
                    }
                    // getData();
                    clearFields();
                    handleClose();
                    toastEmitter(`Group ${groupState} Successfully`, true);
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
    }

    function deleteData(item) {
        let fieldsData = item;

        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "dir_group";
        entityForm.entity = "dir_group";
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
                    toastEmitter(`Group Deleted Successfully`, true);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "dirGroup",
                    serviceKey: "sys.dir.group",
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
                    if (response.data.C_DATA.dirGroup) {
                        setItems(response.data.C_DATA.dirGroup);

                        if (inputReference.current.value) {
                            const keysToSearch = [
                                "name",
                                "code",
                                "description",
                            ];
                            let result = [];
                            result = filterArrayByTerms(
                                response.data.C_DATA.dirGroup,
                                inputReference.current.value,
                                keysToSearch,
                            );
                            setFilteredItems(result);
                        } else {
                            setFilteredItems(response.data.C_DATA.dirGroup);
                        }
                    } else {
                        console.log(
                            `Either dir.group does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <React.Fragment>
            <ChildrenModal
                centered
                size="md"
                header="Delete Security Group"
                ref={deleteModalRef}>
                <DeleteConfimation
                    item={selectedItem}
                    deleteModalRef={deleteModalRef}
                    handleDelete={deleteData}
                    message={"Are you sure to Delete Security Group?"}
                />
            </ChildrenModal>
            <div className="user-managemet-groups pt-2 s2a-group">
                <div className="col-sm-3 mb-2">
                    <div className="search-input input-group mb-1">
                        <i className="input-search-icon fa-solid fa-magnifying-glass text-muted"></i>
                        <input
                            ref={inputReference}
                            type="text"
                            className="form-control"
                            onChange={handleSearch}
                            placeholder="Search..."
                        />
                        {/* <span className="input-group-text fs-6">Ctrl + /</span> */}
                    </div>
                </div>
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"name"}
                                        headerTitle={"Name"}
                                        activeTab={activeTab.group}
                                    />
                                </Th>
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"code"}
                                        headerTitle={"Code"}
                                        activeTab={activeTab.group}
                                    />
                                </Th>
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"category"}
                                        headerTitle={"Category"}
                                        activeTab={activeTab.group}
                                    />
                                </Th>
                                <Th className="col-sm-4 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"description"}
                                        headerTitle={"Description"}
                                        activeTab={activeTab.group}
                                    />
                                </Th>
                                <Th className="col-sm-1 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"type"}
                                        headerTitle={"Type"}
                                        activeTab={activeTab.group}
                                    />
                                </Th>
                                <Th className="col-sm-1 table-row text-left"></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {getPaginateData(current, size).map((item, i) => {
                                // {filteredItems.map(item => {
                                return (
                                    <Tr
                                        key={item.id}
                                        className={` ${
                                            item.id === selectedItem.id
                                                ? "selected-cell"
                                                : " "
                                        }`}>
                                        <Td className="col-sm-3 table-row text-left">
                                            <div className="data-cell">
                                                {item.name}
                                            </div>
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            <div className="data-cell">
                                                {item.code}
                                            </div>
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            <div className="data-cell">
                                                {item.category}
                                            </div>
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            <div className="data-cell">
                                                {item.description}
                                            </div>
                                        </Td>
                                        <Td className="col-sm-1 table-row text-left">
                                            <div className="data-cell">
                                                {item.type}
                                            </div>
                                        </Td>
                                        <Td className="col-sm-1 table-row text-left">
                                            <div className="data-cell">
                                                {item.type != "SYS" && (
                                                    <>
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
                                                            onClick={() => {
                                                                setSelectedItem(
                                                                    item,
                                                                );
                                                                deleteModalRef.current.show();
                                                            }}>
                                                            <i className="fa-regular fa-trash-can"></i>
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </div>
            </div>
            <div className="row m-0">
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
                    showModal={formShow}
                    modalTitle="Group"
                    size="lg">
                    <>
                        <div className="form col-sm-12 form-background mb-2">
                            <div className="row">
                                <div className="col-sm-4">
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
                                            onChange={e => handleInputField(e)}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Code&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            disabled={selectedItem.id}
                                            type="text"
                                            className="form-control"
                                            name="code"
                                            value={selectedItem.code}
                                            onChange={e => handleInputField(e)}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Category&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="category"
                                            value={selectedItem.category}
                                            onChange={e => handleInputField(e)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Description&nbsp;
                                            <span className="text-danger"></span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            type="text"
                                            className="form-control"
                                            name="description"
                                            value={selectedItem.description}
                                            onChange={e =>
                                                handleInputField(e)
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
        </React.Fragment>
    );
}

export default Group;
