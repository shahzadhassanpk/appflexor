import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "../../Config";
import useKeyboardShortcut from "../../utils/useKeyboardShortcut";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";
function MultiTenantRestConsole({
    isAuthorized,
    errorMessage,
    fadeIn,
    activeTab,
}) {
    let initialState = {
        id: "",
        app: "",
        servicekey: "",
        desc: "",
        sql: "",
        instance_id: "",
        store_id: "",
    };

    const [items, setItems] = useState([]);
    const [searchFilterItems, setSearchFilterItems] = useState([]);
    const [instanceFilterItems, setInstanceFilterItems] = useState([]);
    const [storeFilterItems, setStoreFilterItems] = useState([]);

    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [width, setWidth] = useState("desktop");
    const [deleteIsDisabled, setDeleteIsDisabled] = useState(true);
    const [copySuccess, setCopySuccess] = useState("Copy");
    const inputReference = useRef(null);
    const textAreaRef = useRef(null);
    const [instance, setInstance] = useState([]);
    const [store, setStore] = useState([]);
    const [filter, setFilter] = useState({
        search: "",
        instance: "",
        store: "",
    });

    const [size, setSize] = useState(7);
    const [current, setCurrent] = useState(1);

    const getPaginateData = (current, pageSize) => {
        return items.slice((current - 1) * pageSize, current * pageSize);
    };

    // useEffect(() => {
    //   getData();
    //   getCurrentWidthAndHeight();
    // });

    useEffect(() => {
        getData();
        getCurrentWidthAndHeight();
    }, [activeTab.multiTenantRestConsole]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem.sql.length > 0 &&
            selectedItem.servicekey.length > 0
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

    useKeyboardShortcut(
        ["Control", "/"],
        shortcutKeys => {
            inputReference.current.focus();
        },
        {
            overrideSystem: false,
            ignoreInputFields: false,
            repeatOnHold: false,
        },
    );

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

    function handleSearch(event) {
        let valueToSearch = event.target.value.toLowerCase();
        setFilter(prev => ({
            ...prev,
            search: valueToSearch,
        }));
        let resultOne = [];
        let resultTwo = [];
        let resultThree = [];

        if (filter.instance !== "") {
            resultOne = filterIt(filter.instance, items);
        } else {
            resultOne = items;
        }

        if (filter.store !== "") {
            resultTwo = filterIt(filter.store, resultOne);
        } else {
            resultTwo = resultOne;
        }

        resultThree = filterIt(valueToSearch, resultTwo);
        setSearchFilterItems(resultThree);
    }

    function handleInstanceSearch(event) {
        let valueToSearch = event.target.value.toLowerCase();
        setFilter(prev => ({
            ...prev,
            instance: valueToSearch,
        }));
        let resultOne = [];
        let resultTwo = [];
        let resultThree = [];

        if (filter.search !== "") {
            resultOne = filterIt(filter.search, items);
        } else {
            resultOne = items;
        }

        if (filter.store !== "") {
            resultTwo = filterIt(filter.store, resultOne);
        } else {
            resultTwo = resultOne;
        }

        resultThree = filterIt(valueToSearch, resultTwo);
        setSearchFilterItems(resultThree);
    }

    function handleStoreSearch(event) {
        let valueToSearch = event.target.value.toLowerCase();
        setFilter(prev => ({
            ...prev,
            store: valueToSearch,
        }));
        let resultOne = [];
        let resultTwo = [];
        let resultThree = [];

        if (filter.search !== "") {
            resultOne = filterIt(filter.search, items);
        } else {
            resultOne = items;
        }

        if (filter.instance !== "") {
            resultTwo = filterIt(filter.instance, resultOne);
        } else {
            resultTwo = resultOne;
        }

        resultThree = filterIt(valueToSearch, resultTwo);
        setSearchFilterItems(resultThree);
    }

    function getselectedItem(item) {
        setSelectedItem(item);
    }

    function addNewItem() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
    }

    function clearFields() {
        addNewItem();
    }

    function handleInputField(event) {
        let name = event.target.name;
        let value = event.target.value;
        setSelectedItem({
            ...selectedItem,
            [name]: value,
        });
    }

    function handleInstance(event) {
        let value = event.target.value;

        setSelectedItem(prev => ({
            ...prev,
            instance_id: value,
        }));
    }

    function handleStore(event) {
        let value = event.target.value;

        setSelectedItem(prev => ({
            ...prev,
            store_id: value,
        }));
    }

    function getNameById(arr, id) {
        let result = "";
        arr.forEach(obj => {
            if (obj.id === id) {
                result = obj.name;
            }
        });
        return result ? result : "";
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
        let fieldsData = selectedItem;
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

        entityForm.formData = fieldsData;
        request.data.push(entityForm);
        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    getData();
                    clearFields();
                    // if (fieldsData.id === "" || fieldsData.id === "new") {
                    //     fieldsData.id = response.data.C_NEW_RECORD_ID;
                    // }
                } else {
                    console.error("Unable to save data.....");
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function deleteData() {
        if (window.confirm("Are you sure to delete?") == true) {
            let fieldsData = selectedItem;

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
                        getData();
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            // console.log("you press cancel")
        }
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "apiKeys",
                    serviceKey: "api.data",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "objectStore",
                    serviceKey: "object.store",
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
                if (response.status === 200) {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.apiKeys) {
                            setItems(response.data.C_DATA.apiKeys);
                            setSearchFilterItems(response.data.C_DATA.apiKeys);
                            setInstanceFilterItems(
                                response.data.C_DATA.apiKeys,
                            );
                            setStoreFilterItems(response.data.C_DATA.apiKeys);

                            if (selectedItem.id !== "") {
                                let _updatedItem = getObjectById(
                                    response.data.C_DATA.apiKeys,
                                    selectedItem.id,
                                );
                                setSelectedItem(_updatedItem);
                            }
                        } else {
                            console.log(
                                `Either api.data does not exists or SQL query returns no result.`,
                            );
                        }
                        if (response.data.C_DATA.objectStore) {
                            setStore(response.data.C_DATA.objectStore);
                            // console.log("response object_store");
                            // console.log(response.data.C_DATA.instance);
                            // console.log(items);
                        } else {
                            console.log(
                                `Either object.store does not exists or SQL query returns no result.`,
                            );
                        }
                        if (response.data.C_DATA.instance) {
                            setInstance(response.data.C_DATA.instance);
                            // console.log("response instance");
                            // console.log(response.data.C_DATA.instance);
                            // console.log(items);
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
            {!isAuthorized && (
                <div className="row m-2">
                    <div className="col-sm-12">
                        <center>
                            <div className="h5 mt-2 text-muted">
                                Click login to get authorized
                            </div>
                            <div className={`${fadeIn} h6 mt-2 text-danger`}>
                                {errorMessage}
                            </div>
                        </center>
                    </div>
                </div>
            )}
            {isAuthorized && (
                <div className="row my-2 px-3">
                    <div className="col-sm-12">
                        <div className="row">
                            <div className="col-sm-3 mb-2 p-0">
                                <div className="input-group mb-1">
                                    <input
                                        ref={inputReference}
                                        type="text"
                                        className="form-control"
                                        onChange={handleSearch}
                                        placeholder="Search Service Keys"
                                    />
                                    <span className="input-group-text fs-6">
                                        Ctrl + /
                                    </span>
                                </div>
                            </div>
                            <div className="col-sm-2 mb-2">
                                <select
                                    className="form-select form-select-override"
                                    name="name"
                                    onChange={handleInstanceSearch}>
                                    <option value="">Search Instance</option>
                                    {instance &&
                                        instance.length > 0 &&
                                        instance.map((item, index) => {
                                            return (
                                                <option
                                                    value={item.id}
                                                    key={index}>
                                                    {item.name}
                                                </option>
                                            );
                                        })}
                                </select>
                            </div>
                            <div className="col-sm-2 mb-2">
                                <select
                                    className="form-select form-select-override"
                                    onChange={handleStoreSearch}>
                                    <option value="">Search Store</option>
                                    {store &&
                                        store.length > 0 &&
                                        store.map((item, index) => {
                                            return (
                                                <option
                                                    value={item.id}
                                                    key={index}>
                                                    {item.name}
                                                </option>
                                            );
                                        })}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-8 ps-0 table-height ">
                        <Table className="s2a-table table-bordered table-hover mb-0">
                            <Thead className="thead">
                                <Tr className="tableHeader">
                                    <Th className="col-sm-2 table-row text-left">
                                        Instance
                                    </Th>
                                    <Th className="col-sm-2 table-row text-left">
                                        Store
                                    </Th>
                                    <Th className="col-sm-2 table-row text-left">
                                        App
                                    </Th>
                                    <Th className="col-sm-2 table-row text-left">
                                        <TableSorting
                                            state={items}
                                            setState={setItems}
                                            fieldName={"servicekey"}
                                            headerTitle={"Service Key"}
                                        />
                                    </Th>
                                    <Th className="col-sm-4 table-row text-left">
                                        Description
                                    </Th>
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
                                            }`}
                                            onClick={() =>
                                                getselectedItem(item)
                                            }>
                                            <Td className="col-sm-2 table-row text-left">
                                                {getNameById(
                                                    instance,
                                                    item.instance_id,
                                                )}
                                            </Td>
                                            <Td className="col-sm-2 table-row text-left">
                                                {getNameById(
                                                    store,
                                                    item.store_id,
                                                )}
                                            </Td>
                                            <Td className="col-sm-2 table-row text-left">
                                                {item.app}
                                            </Td>
                                            <Td className="col-sm-2 table-row text-left">
                                                {item.servicekey}
                                            </Td>
                                            <Td className="col-sm-8 table-row text-left">
                                                {item.desc}
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>
                        <div className="row">
                            <div className="col-sm-6">
                                <span
                                    type="button"
                                    className="button-theme btn btn-sm pull-left my-2"
                                    onClick={addNewItem}>
                                    <i className="fa-solid fa-plus pe-1"></i>
                                    Add New
                                </span>
                            </div>
                            <div className="col-sm-6">
                                <TablePagination
                                    size={size}
                                    setSize={setSize}
                                    current={current}
                                    setCurrent={setCurrent}
                                    tableData={items}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-4">
                        <div className="form-border py-2 px-3">
                            <div className="form-group mb-2">
                                <label className="mt-1 fw-bold">
                                    Instance&nbsp;
                                    <span className="text-danger"></span>
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
                            <div className="form-group mb-2">
                                <label className="mt-1 fw-bold">
                                    Store&nbsp;
                                    <span className="text-danger"></span>
                                </label>
                                <select
                                    className="form-select"
                                    value={selectedItem.store_id}
                                    name="store_id"
                                    onChange={handleStore}>
                                    <option defaultValue=" ">
                                        Select Store
                                    </option>
                                    {store.map(_store => (
                                        <option
                                            key={_store.id}
                                            value={_store.id}>
                                            {_store.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group mb-2">
                                <label className="mt-1 fw-bold">
                                    App&nbsp;
                                    <span className="text-danger"></span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ fontFamily: "Courier New" }}
                                    name="app"
                                    value={selectedItem.app}
                                    onChange={handleInputField}
                                    readOnly={
                                        selectedItem.servicekey === "api.data"
                                    }
                                />
                            </div>
                            <div className="form-group mb-2">
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
                            <div className="form-group mb-2">
                                <label className="mt-1 fw-bold">
                                    Description
                                    <span className="text-danger"></span>
                                </label>
                                <textarea
                                    type="text"
                                    rows="3"
                                    className="form-control"
                                    style={{ fontFamily: "Courier New" }}
                                    name="desc"
                                    value={selectedItem.desc}
                                    onChange={handleInputField}
                                />
                            </div>
                            <div className="form-group mb-2">
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
                                            className="button-theme btn btn-sm mb-2"
                                            onClick={copyToClipboard}>
                                            <i className="fa-regular fa-copy pe-1"></i>
                                            {copySuccess}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    type="text"
                                    rows="9"
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
                            {selectedItem.id === "" && (
                                <button
                                    className="btn button-theme btn-sm pull-left m-2 ms-0"
                                    onClick={() => saveData()}
                                    disabled={saveIsDisabled}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
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
                            <button
                                className="btn button-theme btn-sm pull-left m-2 text-light"
                                onClick={clearFields}>
                                <i className="fa-solid fa-xmark pe-1"></i>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger del-btn-theme btn-sm pull-left m-2"
                                onClick={deleteData}
                                disabled={deleteIsDisabled}>
                                <i className="fa-regular fa-trash-can pe-1"></i>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}

export { MultiTenantRestConsole };
