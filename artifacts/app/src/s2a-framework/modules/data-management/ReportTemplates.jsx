import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { API_URL } from "../../Config";
import FileUploader from "../../components/FileUploader/FileUploader";
// import FileUploaderNew from "../../components/FileUploader/FileUploaderNew.jsx";
import ModuleFormViewer from "../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";
// import useKeyboardShortcut from "../../utils/useKeyboardShortcut";
import ModalBox from "../../components/Modal/Modal";
import { filterArrayByTerms, updateDeleteConfig } from "../../utils/utils";
import { toastEmitter } from "../../components/Toastify/Toastify";
const initialState = {
    id: "",
    name: "",
    app: "",
    reportkey: "",
    masterreportfile: "",
    subreportfile: "",
    datasource: "",
};

export default function ReportTemplates({ activeTab }) {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [instanceItems, setInstanceItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const inputReference = useRef(null);
    const [size, setSize] = useState(5);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    useEffect(() => {
        if (activeTab === "JASPER_REPORT") {
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (
            selectedItem &&
            selectedItem?.name?.length > 0 &&
            selectedItem?.app?.length > 0 &&
            selectedItem?.reportkey?.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    const getPaginateData = (current, pageSize) => {
        return filteredItems.slice(
            (current - 1) * pageSize,
            current * pageSize,
        );
    };

    const handleClose = () => setFormShow(false);
    const handleShow = () => setFormShow(true);

    function editItem(item) {
        getSelectedItem(item.id);
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

    function saveData(closeModal = false) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "reports"; //"formid"
        entityForm.entity = "reports"; //Db- "table name"
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
        entityForm.formData = { ...selectedItem };

        // delete entityForm.formData.masterreportfile;
        // delete entityForm.formData.subreportfile;

        request.data.push(entityForm);

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        let newId = response.data?.C_DATA[0]?.formData?.id;
                        if (newId) {
                            setSelectedItem(prev => ({
                                ...prev,
                                id: newId,
                            }));
                        }
                        toastEmitter(
                            "Report Template saved successfully",
                            true,
                        );
                        // selectedItem.id = response.data.C_NEW_RECORD_ID;
                    } else {
                        toastEmitter(
                            "Report Template updated successfully",
                            true,
                        );
                    }
                    if (closeModal) {
                        handleClose();
                    }
                    // clearFields();
                    getData();
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
            entityForm.formId = "reports";
            entityForm.entity = "reports";
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
                            "Report Template deleted successfully",
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
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.appReports) {
                            setItems(response.data.C_DATA.appReports);
                            let data = response.data.C_DATA.appReports;
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

                        if (response.data.C_DATA.instance) {
                            setInstanceItems(response.data.C_DATA.instance);
                        } else {
                            setInstanceItems([]);
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

    async function getSelectedItem(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "report",
                    serviceKey: "sys.report.details",
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
                    setSelectedItem(_report);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    function openTestURL(params) {
        var url = "https://www.google.com/";
        // "/jw/web/json/plugin/com.s2a.rest.plugins.JasperService/service?id=#form.reports.id#&DATE_FROM=" +
        // $("[name=startDate]").val() +
        // "&DATE_TO=" +
        // $("[name=endDate]").val();
        window.open(url);
    }

    return (
        <div className="data-analysis-reports">
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Report Template"}
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
                                <Th className="col-sm-3 table-row text-left">
                                    <TableSorting
                                        state={filteredItems}
                                        setState={setFilteredItems}
                                        fieldName={"app"}
                                        headerTitle={"App"}
                                        activeTab={activeTab.reportTemplate}
                                    />
                                </Th>
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
                                            {item.app}
                                        </Td>
                                        <Td className="col-sm-3 table-row text-left">
                                            {item.name}
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.reportkey}
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
                        tableData={filteredItems}
                    />
                </div>
                <ModuleFormViewer
                    handleClose={() => {
                        clearFields();
                        handleClose();
                    }}
                    showModal={formShow}
                    modalTitle="Report Templates"
                    size="lg">
                    <>
                        <div className="form col-sm-12 form-background">
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            App&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="app"
                                            value={selectedItem.app}
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
                                            Report Key&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="reportkey"
                                            value={selectedItem.reportkey}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
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
                                            onChange={e => handleInputField(e)}>
                                            <option value="">Default</option>
                                            {instanceItems &&
                                                instanceItems !== undefined &&
                                                instanceItems.map(instance => {
                                                    return (
                                                        <option
                                                            key={instance.id}
                                                            value={
                                                                instance.code
                                                            }>
                                                            {instance.name}
                                                        </option>
                                                    );
                                                })}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Master Report File&nbsp;
                                            <span className="text-danger"></span>
                                        </label>
                                        <FileUploader
                                            item={selectedItem}
                                            setItem={setSelectedItem}
                                            entity="reports"
                                            field_id="masterreportfile"
                                            record_id={selectedItem.id}
                                            getData={getData}
                                        />
                                        {/* <FileUploaderNew
                                            item={selectedItem}
                                            entity="reports"
                                            field_id="masterreportfile"
                                            record_id={selectedItem.id}
                                            getData={getData}
                                        /> */}
                                    </div>
                                </div>
                                <div className="col-sm-12">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Sub Report File&nbsp;
                                            <span className="text-danger"></span>
                                        </label>
                                        <FileUploader
                                            item={selectedItem}
                                            setItem={setSelectedItem}
                                            entity="reports"
                                            field_id="subreportfile"
                                            record_id={selectedItem.id}
                                            getData={getData}
                                        />
                                    </div>
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
                                    onClick={() => saveData(true)}
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
                    </>
                </ModuleFormViewer>
            </div>
        </div>
    );
}
