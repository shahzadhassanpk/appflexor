import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { API_URL, REPORT_URL } from "../../Config";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";
// import useKeyboardShortcut from "../../utils/useKeyboardShortcut";
import { Modal } from "react-bootstrap";
import { AppContext } from "../../../AppContext";
import ModalBox from "../../components/Modal/Modal";
import ReactSelect from "../../components/ReactSelect/ReactSelect";
import { toastEmitter } from "../../components/Toastify/Toastify";
import {
    filterArrayByTerms,
    makeShortId,
    tryParseJSONObject,
    updateDeleteConfig,
} from "../../utils/utils";
import PreviewReport from "../content-management/page-builder/Designer/components/Report/PreviewReport";

const initialState = {
    id: "",
    name: "",
    report_key: "",
    show_filters: "YES",
    filters_position: "TOP", // TOP, LEFT
    show_links: "YES",
    links_position: "TOP", // TOP, LEFT
    filters: [],
    output_iframe: "",
};

const clone = x => JSON.parse(JSON.stringify(x));

function ReportsConfig({ activeTab }) {
    const appContext = useContext(AppContext);

    const [selectedItem, setSelectedItem] = useState(initialState);
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [reports, setReports] = useState([]);

    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const [invalidFields, setInvalidFields] = useState({});

    const [selectedFilter, setSelectedFilter] = useState({});
    const [dynamicOptions, setDynamicOptions] = useState([]);
    const [options, setOptions] = useState([]);
    const [staticicOptions, setStaticicOptions] = useState([]);

    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const [previewModal, setPreviewModal] = useState(false);

    const inputReference = useRef(null);

    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    useEffect(() => {
        if (activeTab === "REPORTS_CONFIG") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem?.name?.length > 0 &&
            selectedItem?.report_key?.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    const handleShow = () => setFormShow(true);
    const handleClose = () => setFormShow(false);

    const getPaginateData = (current, pageSize) => {
        return filteredItems.slice(
            (current - 1) * pageSize,
            current * pageSize,
        );
    };

    async function editItem(item) {
        // setSelectedItem(item);
        handleShow();

        getSelectedItem(item);
    }

    function addNewItem() {
        setSelectedItem(initialState);
        setSelectedFilter({});
        setSaveIsDisabled(true);
        handleShow();
    }

    function clearFields() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
    }

    function handleInputField(event, id) {
        let key = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

        let _inputField = { ...selectedItem, [key]: value };
        setSelectedItem(_inputField);
    }

    function handleSelectedFilterInput(event, id) {
        let key = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

        let _inputField = { ...selectedFilter, [key]: value };
        setSelectedFilter(_inputField);
    }

    const handleSearch = event => {
        let textToSearch = "";
        if (event === undefined) {
            textToSearch = inputReference.current.value;
        } else if (event) {
            textToSearch = event.target.value.toLowerCase();
        }
        const keysToSearch = ["name", "app", "reportkey"];
        let result = [];
        result = filterArrayByTerms(items, textToSearch, keysToSearch);
        setFilteredItems(result);
        if (textToSearch.length > 2) {
            setCurrent(1);
        }
    };

    function addNewFilter() {
        // const id = makeShortId(5);
        const newFilter = {
            id: "new",
            type: "TEXT",
            name: "",
            default_value: "",
        };
        // let _filters = selectedItem.filters;
        // _filters.push(newFilter);
        // setSelectedItem(prev => ({ ...prev, filters: [..._filters] }));
        setSelectedFilter(newFilter);
        setDynamicOptions([]);
        setOptions([]);
    }

    function editFilter(filter) {
        if (filter.type === "SELECT" && filter.use_static === "YES") {
            const parsedOptions = tryParseJSONObject(filter.options);
            setOptions(parsedOptions);
        }
        setSelectedFilter(filter);
    }

    // Static options
    function addRadioOption() {
        let currentState = [...options];
        const count = currentState.filter(item => item.value !== "").length;

        let newOption = {
            id: makeShortId(4),
            label: `Value ${count + 1}`,
            value: `value${count + 1}`,
        };

        currentState.push(newOption);

        setOptions(currentState);
        let fieldId = "array";

        let str = JSON.stringify(currentState);
        // handleRadioOptions(str, fieldId);
    }

    function handleOptionsChange(e, fieldId) {
        // ;
        let id = e.target.getAttribute("data-id");
        let value = e.target.value;
        let name = e.target.name;

        let _updatedArr = [];

        typeof options == "object" &&
            options.map(opt => {
                if (opt.id === id) {
                    let obj = opt;
                    obj[name] = value;

                    _updatedArr.push(obj);
                } else {
                    _updatedArr.push(opt);
                }
            });
        setOptions(_updatedArr);
        let str = JSON.stringify(_updatedArr);
        // handleRadioOptions(str, fieldId);
    }

    function handleRadioOptDelete(option, fieldId) {
        let _updatedArr = [];

        _updatedArr = options.filter(opt => opt.id !== option.id);

        setOptions(_updatedArr);
    }

    function saveFilter() {
        let filter = { ...selectedFilter };
        if (filter.id === "new") {
            const id = makeShortId(5);
            filter.id = id;
        }

        filter.key = filter.key.replaceAll(/[^A-Z0-9]+/gi, "_");

        if (filter.type === "SELECT" && filter.use_static === "YES") {
            filter.options = JSON.stringify(options);
        }

        let filtersList = selectedItem.filters;

        let status = "";
        let updatedFilters = filtersList.map(f => {
            if (f.id === filter.id) {
                status = "UPDATED";
                return filter;
            }
            return f;
        });

        if (status === "") {
            updatedFilters.push(filter);
        }

        setSelectedItem(prev => ({ ...prev, filters: [...updatedFilters] }));
        setSelectedFilter({});
    }

    function previewReport(report) {
        // setSelectedItem(report);
        getSelectedItem(report);
        setPreviewModal(true);
    }

    async function getSelectedItem(item) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: item.id,
                    dataKey: "report",
                    serviceKey: "sys.reports.configration",
                    mode: "formData",
                },
            ],
        };

        try {
            const response = await axios.post(
                API_URL + "?service.key=masterKey.tenantData",
                dataRequest,
            );

            if (response.data.C_STATUS === "SUCCESS") {
                const _report = response.data.C_DATA.report[0];
                if (_report) {
                    _report.filters = tryParseJSONObject(_report.filters, []);
                    setSelectedItem(_report);
                } else {
                    console.log("No record found.");
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    function saveData(callback) {
        let url = API_URL + "?service.key=update.formData";
        let request = {};
        request.data = [];
        let entityForm = {};

        entityForm.formId = "reports_configration"; //"formid"
        entityForm.entity = "reports_configration"; //Db- "table name"
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
        entityForm.formData.filters = selectedItem.filters.map(el => {
            el.filters = JSON.stringify(el.filters);
            return el;
        });
        request.data.push(entityForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        setSelectedItem(prev => ({
                            ...prev,
                            id: response.data.C_NEW_RECORD_ID,
                        }));
                        toastEmitter(
                            "Report Configuration saved successfully",
                            true,
                        );
                    } else {
                        toastEmitter(
                            "Report Configuration updated successfully",
                            true,
                        );
                    }
                    clearFields();
                    getData();
                    handleClose();
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
            entityForm.formId = "reports_configration";
            entityForm.entity = "reports_configration";
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
                        toastEmitter(
                            "Report Configuration deleted successfully",
                            true,
                        );
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
                    dataKey: "appReports",
                    serviceKey: "sys.reports",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "configrations",
                    serviceKey: "sys.reports.configrations",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.configrations) {
                            let data = response.data.C_DATA.configrations;
                            // let updatedData = data.map(el => {
                            //     el.filters = tryParseJSONObject(el.filters, []);
                            //     return el;
                            // });

                            setItems(data);

                            // if (selectedItem.id !== "") {
                            //     updatedData.map(el => {
                            //         if (el.id === selectedItem.id) {
                            //             setSelectedItem(prev=>({...prev,id}));
                            //         }
                            //     });
                            // }

                            if (inputReference.current.value) {
                                const keysToSearch = [
                                    "name",
                                    "app",
                                    "reportkey",
                                ];
                                let result = [];
                                result = filterArrayByTerms(
                                    data,
                                    inputReference.current.value,
                                    keysToSearch,
                                );
                                setFilteredItems(result);
                            } else {
                                setFilteredItems(data);
                            }
                        } else {
                            console.log(
                                `Eitherapp.channel does not exists or SQL query returns no result.`,
                            );
                        }

                        if (response.data.C_DATA.appReports) {
                            setReports(response.data.C_DATA.appReports);
                        } else {
                            setReports([]);
                            console.log(
                                `Either instance does not exists or SQL query returns no result.`,
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

    async function fetchDynamicOptions() {
        const serviceKey = selectedFilter.service_key;
        const serviceParams = selectedFilter.service_params;
        const mapLabel = selectedFilter.map_label;
        const mapValue = selectedFilter.map_value;
        const tenantId = appContext?.tenantSubscription?.tenant_id;

        var dataRequest = {
            tenant_id: tenantId,

            dataKeys: [
                {
                    serviceParams: serviceParams ? serviceParams : "",
                    dataKey: "list",
                    serviceKey: serviceKey,
                    mode: "formData",
                },
            ],
        };

        let response = await axios.post(
            API_URL + "?service.key=tenant.data",
            dataRequest,
        );
        if (response.data.C_STATUS === "FAIL") {
            toastEmitter(`${response.data.C_MESSAGE}`, true, "error");
        }

        if (response.data && response.data.C_STATUS === "SUCCESS") {
            let list = response.data.C_DATA.list;

            // API returns response in string when data request is invalid
            if (typeof list === "object") {
                toastEmitter(`Data fetched succesfully`, true, "success");
                let _options =
                    typeof list == "object" &&
                    list.map(item => {
                        return {
                            id: item.id ? item.id : makeShortId(5),
                            label: item[mapLabel],
                            value: item[mapValue],
                        };
                    });

                setDynamicOptions(_options);
            } else {
                toastEmitter(`Unable to fetch data`, true, "warning");
                setDynamicOptions([]);
            }
        } else {
            setDynamicOptions([]);
        }
    }

    let authKey = localStorage.getItem("AUTH_KEY");

    return (
        <div className="data-analysis-reports">
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
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"name"}
                                        headerTitle={"Name"}
                                        activeTab={activeTab.reportTemplate}
                                    />
                                </Th>
                                <Th className="col-sm-4 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"reportkey"}
                                        headerTitle={"Report Key"}
                                        activeTab={activeTab.reportTemplate}
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
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.name}
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.report_key}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            <div className="data-cell d-flex">
                                                <span
                                                    className="table-edit-font"
                                                    title="Edit"
                                                    onClick={() =>
                                                        previewReport(item)
                                                    }>
                                                    <i className="fa-regular fa-eye"></i>
                                                </span>
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
                    showModal={formShow}
                    modalTitle="Report Configrations"
                    size="xl">
                    <div className="container-fluid">
                        {/* <code>{JSON.stringify(selectedItem, null, 2)}</code> */}

                        <div className="row">
                            <div className="col-sm-6">
                                <div className="row mb-3">
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
                                                Report&nbsp;
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                placeholder="Select Option"
                                                className="form-select"
                                                name="report_key"
                                                value={selectedItem.report_key}
                                                onChange={e =>
                                                    handleInputField(e)
                                                }>
                                                <option value="">
                                                    Select a Report
                                                </option>
                                                {reports &&
                                                    reports !== undefined &&
                                                    reports.map(report => {
                                                        return (
                                                            <option
                                                                key={report.id}
                                                                value={
                                                                    report.reportkey
                                                                }>
                                                                {report.name}
                                                            </option>
                                                        );
                                                    })}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-auto">
                                        <label className="px-1 form-check-label pointer">
                                            <input
                                                type="checkbox"
                                                name="show_links"
                                                className={`form-check-input `}
                                                onChange={handleInputField}
                                                checked={
                                                    selectedItem.show_links ===
                                                    "YES"
                                                        ? true
                                                        : false
                                                }
                                            />
                                            <span className="ms-2">
                                                Show Links
                                            </span>
                                        </label>
                                    </div>
                                    <div className="col-auto">
                                        {selectedItem.show_links === "YES" && (
                                            <>
                                                <div className="form-check form-check-inline ">
                                                    <input
                                                        className="form-check-input pointer"
                                                        type="radio"
                                                        name="links_position"
                                                        id="links_position_top"
                                                        value="TOP"
                                                        onChange={
                                                            handleInputField
                                                        }
                                                        checked={
                                                            selectedItem.links_position ===
                                                            "TOP"
                                                                ? true
                                                                : false
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label pointer"
                                                        htmlFor="links_position_top">
                                                        Top
                                                    </label>
                                                </div>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input pointer"
                                                        type="radio"
                                                        name="links_position"
                                                        id="links_position_left"
                                                        onChange={
                                                            handleInputField
                                                        }
                                                        value="LEFT"
                                                        checked={
                                                            selectedItem.links_position ===
                                                            "LEFT"
                                                                ? true
                                                                : false
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label pointer"
                                                        htmlFor="links_position_left">
                                                        Left
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-auto">
                                        <label className="px-1 form-check-label pointer">
                                            <input
                                                type="checkbox"
                                                name="show_filters"
                                                className={`form-check-input `}
                                                onChange={handleInputField}
                                                checked={
                                                    selectedItem.show_filters ===
                                                    "YES"
                                                        ? true
                                                        : false
                                                }
                                            />
                                            <span className="ms-2">
                                                Show Filters
                                            </span>
                                        </label>
                                    </div>

                                    <div className="col-auto">
                                        {selectedItem.show_filters ===
                                            "YES" && (
                                            <>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input pointer"
                                                        type="radio"
                                                        name="filters_position"
                                                        id="filters_position_top"
                                                        value="TOP"
                                                        onChange={
                                                            handleInputField
                                                        }
                                                        checked={
                                                            selectedItem.filters_position ===
                                                            "TOP"
                                                                ? true
                                                                : false
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label pointer"
                                                        htmlFor="filters_position_top">
                                                        Top
                                                    </label>
                                                </div>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input pointer"
                                                        type="radio"
                                                        name="filters_position"
                                                        id="filters_position_left"
                                                        onChange={
                                                            handleInputField
                                                        }
                                                        value="LEFT"
                                                        checked={
                                                            selectedItem.filters_position ===
                                                            "LEFT"
                                                                ? true
                                                                : false
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label pointer"
                                                        htmlFor="filters_position_left">
                                                        Left
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="row mb-2">
                                    <label>Filters:</label>
                                    <div>
                                        {typeof selectedItem.filters !==
                                            "string" &&
                                            selectedItem.filters.map(filter => {
                                                return (
                                                    <div
                                                        key={filter.id}
                                                        className="selected-cell s2a-border p-2 mb-2">
                                                        {/* {JSON.stringify(
                                                            filter,
                                                            null,
                                                            2,
                                                        )} */}
                                                        {filter.name}
                                                        &nbsp;
                                                        <span className="text-muted">
                                                            ({filter.type})
                                                        </span>
                                                        <i
                                                            className="fa-solid fa-edit float-end pointer mt-1"
                                                            onClick={() => {
                                                                editFilter(
                                                                    filter,
                                                                );
                                                            }}></i>
                                                        <i
                                                            className="fa-solid fa-trash text-danger float-end pointer mt-1"
                                                            onClick={() => {
                                                                let filteredFilters =
                                                                    selectedItem.filters.filter(
                                                                        f =>
                                                                            f.id !==
                                                                            filter.id,
                                                                    );
                                                                setSelectedItem(
                                                                    prev => ({
                                                                        ...prev,
                                                                        filters:
                                                                            [
                                                                                ...filteredFilters,
                                                                            ],
                                                                    }),
                                                                );
                                                            }}></i>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6 ">
                                {/* <code>
                                    {JSON.stringify(selectedFilter, null, 2)}
                                </code> */}
                                <label className="fw-bold">
                                    Add/Edit Filter:{" "}
                                </label>
                                <div className="row p-2">
                                    <div className="col-sm-6 mt-auto"></div>
                                    <div className="col-sm-6">
                                        {!selectedFilter.id ? (
                                            <button
                                                className="btn btn-sm button-theme float-end"
                                                type="button"
                                                onClick={addNewFilter}>
                                                <i className="fa-solid fa-plus"></i>
                                                {/* Add Filer */}
                                            </button>
                                        ) : (
                                            <div className="d-flex">
                                                <button
                                                    className="btn btn-sm button-theme m-auto"
                                                    type="button"
                                                    onClick={saveFilter}
                                                    disabled={
                                                        selectedFilter.name ===
                                                            "" ||
                                                        selectedFilter.key ===
                                                            ""
                                                    }>
                                                    <i className="fa-solid fa-save"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm button-theme m-auto"
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedFilter({})
                                                    }>
                                                    <i className="fa-solid fa-cancel"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="row p-2">
                                    {selectedFilter.id && (
                                        <div className="row">
                                            <div className="col-sm-12">
                                                <label
                                                    htmlFor=""
                                                    className="d-flex fw-bold">
                                                    Filter type
                                                </label>
                                                <div className="form-check form-check-inline ">
                                                    <input
                                                        className="form-check-input pointer"
                                                        type="radio"
                                                        name="filter_type"
                                                        id="type_text"
                                                        value="TEXT"
                                                        onChange={
                                                            handleSelectedFilterInput
                                                        }
                                                        checked={
                                                            selectedFilter.filter_type ===
                                                            "TEXT"
                                                                ? true
                                                                : false
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label pointer"
                                                        htmlFor="type_text">
                                                        Text
                                                    </label>
                                                </div>
                                                <div className="form-check form-check-inline ">
                                                    <input
                                                        className="form-check-input pointer"
                                                        type="radio"
                                                        name="filter_type"
                                                        id="type_select"
                                                        onChange={
                                                            handleSelectedFilterInput
                                                        }
                                                        value="SELECT"
                                                        checked={
                                                            selectedFilter.filter_type ===
                                                            "SELECT"
                                                                ? true
                                                                : false
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label pointer"
                                                        htmlFor="type_select">
                                                        Select
                                                    </label>
                                                </div>
                                                {selectedFilter.filter_type ===
                                                    "SELECT" && (
                                                    <label className="px-1 form-check-label pointer">
                                                        <input
                                                            type="checkbox"
                                                            name="use_static"
                                                            className={`form-check-input `}
                                                            onChange={
                                                                handleSelectedFilterInput
                                                            }
                                                            checked={
                                                                selectedFilter.use_static ===
                                                                "YES"
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <span className="ms-2">
                                                            Use Static Options
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {selectedFilter.filter_type === "TEXT" && (
                                        <>
                                            <div className="row mb-2">
                                                <div className="col">
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
                                                            value={
                                                                selectedFilter.name
                                                            }
                                                            onChange={
                                                                handleSelectedFilterInput
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="form-group">
                                                        <label className="mt-1 fw-bold">
                                                            Key&nbsp;
                                                            <span className="text-danger">
                                                                *
                                                            </span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="key"
                                                            value={
                                                                selectedFilter.key
                                                            }
                                                            onChange={
                                                                handleSelectedFilterInput
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="form-group">
                                                        <label className="mt-1 fw-bold">
                                                            Default Value&nbsp;
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="default_value"
                                                            value={
                                                                selectedFilter.default_value
                                                            }
                                                            onChange={
                                                                handleSelectedFilterInput
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-sm-12">
                                                    <label
                                                        htmlFor=""
                                                        className="fw-bold">
                                                        Final Filter
                                                    </label>
                                                    <div className="form-group border my-2 p-2 border-color rounded">
                                                        <label className="mt-1 fw-bold">
                                                            {
                                                                selectedFilter.name
                                                            }
                                                            &nbsp;
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="default_value"
                                                            value={
                                                                selectedFilter.default_value
                                                            }
                                                            disabled
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedFilter.filter_type ===
                                        "SELECT" && (
                                        <>
                                            <div className="row mb-2">
                                                <div className="col">
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
                                                            value={
                                                                selectedFilter.name
                                                            }
                                                            onChange={
                                                                handleSelectedFilterInput
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="form-group">
                                                        <label className="mt-1 fw-bold">
                                                            Key&nbsp;
                                                            <span className="text-danger">
                                                                *
                                                            </span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="key"
                                                            value={
                                                                selectedFilter.key
                                                            }
                                                            onChange={
                                                                handleSelectedFilterInput
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <div className="form-group">
                                                        <label className="mt-1 fw-bold">
                                                            Default Value&nbsp;
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="default_value"
                                                            value={
                                                                selectedFilter.default_value
                                                            }
                                                            onChange={
                                                                handleSelectedFilterInput
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedFilter.use_static !==
                                                "YES" && (
                                                <>
                                                    <div className="row">
                                                        <div className="d-flex justify-content-between">
                                                            <label className="fw-bold">
                                                                Default Values
                                                            </label>
                                                            <div>
                                                                <button
                                                                    className="btn btn-sm button-theme float-end"
                                                                    type="button"
                                                                    disabled={
                                                                        !selectedFilter[
                                                                            "map_value"
                                                                        ] ||
                                                                        !selectedFilter[
                                                                            "map_label"
                                                                        ] ||
                                                                        !selectedFilter[
                                                                            "service_key"
                                                                        ]
                                                                    }
                                                                    onClick={
                                                                        fetchDynamicOptions
                                                                    }>
                                                                    <i className="fa-solid fa-bolt"></i>
                                                                    {/* Add Filer */}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-sm-4">
                                                            <div className="form-group">
                                                                <label className="mt-1 fw-bold">
                                                                    Service
                                                                    Key&nbsp;
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    name="service_key"
                                                                    value={
                                                                        selectedFilter.service_key
                                                                    }
                                                                    onChange={
                                                                        handleSelectedFilterInput
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-4">
                                                            <div className="form-group">
                                                                <label className="mt-1 fw-bold">
                                                                    Form
                                                                    Field&nbsp;
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    name="form_field"
                                                                    value={
                                                                        selectedFilter.form_field
                                                                    }
                                                                    onChange={
                                                                        handleSelectedFilterInput
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-4">
                                                            <div className="form-group">
                                                                <label className="mt-1 fw-bold">
                                                                    Filter
                                                                    By&nbsp;
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    name="filter_by"
                                                                    value={
                                                                        selectedFilter.filter_by
                                                                    }
                                                                    onChange={
                                                                        handleSelectedFilterInput
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="form-group">
                                                                <label className="mt-1 fw-bold">
                                                                    Map
                                                                    Label&nbsp;
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    name="map_label"
                                                                    value={
                                                                        selectedFilter.map_label
                                                                    }
                                                                    onChange={
                                                                        handleSelectedFilterInput
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="form-group">
                                                                <label className="mt-1 fw-bold">
                                                                    Map
                                                                    Value&nbsp;
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    name="map_value"
                                                                    value={
                                                                        selectedFilter.map_value
                                                                    }
                                                                    onChange={
                                                                        handleSelectedFilterInput
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-sm-12">
                                                            <label
                                                                htmlFor=""
                                                                className="fw-bold">
                                                                Final Filter
                                                            </label>
                                                            <div className="form-group border my-2 p-2 border-color rounded">
                                                                <label className="mt-1 fw-bold">
                                                                    {
                                                                        selectedFilter.name
                                                                    }
                                                                    &nbsp;
                                                                </label>

                                                                <ReactSelect
                                                                    options={
                                                                        dynamicOptions
                                                                    }
                                                                    selectedOption={{}}
                                                                    handleChange={() => {}}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {selectedFilter.use_static ===
                                                "YES" && (
                                                <>
                                                    <div>
                                                        <label className="form-label">
                                                            Static Values
                                                        </label>
                                                        <span className="float-end">
                                                            <span className="me-1 px-2 rounded-circle">
                                                                {options.length}
                                                            </span>
                                                            <span
                                                                className="float-end pointer"
                                                                data-bs-toggle="tooltip"
                                                                data-bs-title="Create new list item"
                                                                onClick={
                                                                    addRadioOption
                                                                }>
                                                                <i className="fs-5 fa-solid fa-plus"></i>
                                                            </span>
                                                        </span>
                                                    </div>

                                                    <div
                                                        id={`array-selection`}
                                                        className="form-accordion accordion accordion-flush">
                                                        {typeof options ==
                                                            "object" &&
                                                            options.map(
                                                                (
                                                                    option,
                                                                    index,
                                                                ) => {
                                                                    const accordionId =
                                                                        "accord" +
                                                                        option?.id;
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                option.id
                                                                            }>
                                                                            <div className="accordion-item">
                                                                                <h2 className="accordion-header">
                                                                                    <button
                                                                                        className="accordion-button p-2 collapsed"
                                                                                        type="button"
                                                                                        id={
                                                                                            accordionId
                                                                                        }
                                                                                        data-bs-toggle="collapse"
                                                                                        data-bs-target={`#a${index}`}>
                                                                                        {
                                                                                            option.label
                                                                                        }
                                                                                    </button>
                                                                                </h2>
                                                                                <div
                                                                                    id={`a${index}`}
                                                                                    className="accordion-collapse collapse"
                                                                                    data-bs-parent={`#array-selection`}>
                                                                                    <div className="accordion-body py-1 px-2 d-flex">
                                                                                        <div className="me-1">
                                                                                            <label className="mb-0 form-label">
                                                                                                Label
                                                                                            </label>
                                                                                            <input
                                                                                                className="form-control form-control-sm "
                                                                                                type="text"
                                                                                                data-id={
                                                                                                    option.id
                                                                                                }
                                                                                                name="label"
                                                                                                value={
                                                                                                    option.label
                                                                                                }
                                                                                                onChange={e =>
                                                                                                    handleOptionsChange(
                                                                                                        e,
                                                                                                        "array",
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                        <div className="">
                                                                                            <label className="mb-0 form-label">
                                                                                                Value
                                                                                            </label>
                                                                                            <input
                                                                                                className="form-control form-control-sm"
                                                                                                type="text"
                                                                                                name="value"
                                                                                                data-id={
                                                                                                    option.id
                                                                                                }
                                                                                                value={
                                                                                                    option.value
                                                                                                }
                                                                                                onChange={e =>
                                                                                                    handleOptionsChange(
                                                                                                        e,
                                                                                                        "array",
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                        <div
                                                                                            onClick={() =>
                                                                                                handleRadioOptDelete(
                                                                                                    option,
                                                                                                    "array",
                                                                                                )
                                                                                            }
                                                                                            className="d-flex justify-content-center align-items-center pointer">
                                                                                            <i className=" fa-solid fa-trash text-danger ps-2 mt-4"></i>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-sm-12">
                                                            <label
                                                                htmlFor=""
                                                                className="fw-bold">
                                                                Final Filter
                                                            </label>
                                                            <div className="form-group border my-2 p-2 border-color rounded">
                                                                <label className="mt-1 fw-bold">
                                                                    {
                                                                        selectedFilter.name
                                                                    }
                                                                    &nbsp;
                                                                </label>

                                                                <ReactSelect
                                                                    options={
                                                                        options
                                                                    }
                                                                    selectedOption={{}}
                                                                    handleChange={() => {}}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer pe-0">
                            {/* {selectedItem.id !== "" && (
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={() => openTestURL()}>
                                    <i className="fa fa-check pe-1"></i>
                                    Test Report
                                </button>
                            )} */}
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
                            {/* <button
                                className="btn button-theme btn-sm m-0"
                                onClick={() => handleClose()}>
                                <i className="fa-solid fa-xmark pe-1"></i>
                                Close
                            </button> */}
                        </div>
                    </div>
                </ModuleFormViewer>
            </div>
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Report Configration"}
                setState={setDeleteConfig}
                modalType="deleteModal"
            />

            <Modal
                className="s2a-modal"
                show={previewModal}
                onHide={() => setPreviewModal(false)}
                keyboard={false}
                animation={true}
                size="xl"
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{selectedItem.name}</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={() => setPreviewModal(false)}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <PreviewReport reportId={selectedItem.id} />
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default ReportsConfig;
