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
import { MultiSelect } from "react-multi-select-component";
import ProcessesContext from "../../camunda/ProcessesContext";
import { toastEmitter } from "../../../components/Toastify/Toastify";

function ProcessMap({ activeTab }) {
    let initialState = {
        id: "",
        title: "",
        process_key: "",
        form_id: "",
        category: "",
        is_active: "YES",
        allow_draft: "YES",
    };
    const [items, setItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [size, setSize] = useState(5);
    const [processList, setProcessList] = useState([]);
    const [formList, setFormList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [error, setError] = useState([]);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const [groups, setGroups] = useState([]);
    const [channels, setChannels] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedChannels, setSelectedChannels] = useState([]);
    const handleClose = () => setFormShow(false);
    const handleShow = () => setFormShow(true);
    const appContext = useContext(AppContext);
    const channel = appContext.channel;
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const getPaginateData = (current, pageSize) => {
        if (items) {
            return items.slice((current - 1) * pageSize, current * pageSize);
        }
        return [];
    };
    const [deleteConfig, setDeleteConfig] = useState({
        show: false,
        item: {},
    });

    useEffect(() => {
        if (activeTab === "PROCESS_MAP") {
            getData();
            getChannels();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedItem?.id) {
            getAuth(selectedItem);
        }
    }, [selectedItem?.id]);

    useEffect(() => {
        if (
            selectedItem.process_key !== "" &&
            selectedItem.category !== "" &&
            selectedItem.title !== "" &&
            selectedItem.form_id !== "" &&
            selectedChannels.length > 0 &&
            selectedGroups.length > 0 &&
            selectedItem.submit_label
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    function editItem(item) {
        setSelectedItem(item);
        handleShow();
    }

    async function getAuth(selectedItem) {
        let filterArr = [];
        // selectedItem = await getSelectedItem(
        //     selectedItem.id,
        //     "sys.user.selected.authorization",
        // );
        // moduleFeatures.forEach(module => {
        //     if (selectedItem.module === module.module_id) {
        //         filterArr.push(module);
        //     }
        // });

        // let ids = selectedItem.module_feature;
        // let idsArr = ids.split(";");
        // let finalArr = [];

        // idsArr.forEach(id => {
        //     filterArr.forEach(module => {
        //         if (id === module.id) {
        //             finalArr.push(module);
        //         }
        //     });
        // });

        let _ids = selectedItem.group;
        let _idsArr = _ids.split(";");
        let _finalArr = [];
        _idsArr.forEach(id => {
            groups.forEach(group => {
                if (id === group.id) {
                    _finalArr.push(group);
                }
            });
        });

        let __ids = selectedItem.channel;
        let __idsArr = __ids.split(";");
        let __finalArr = [];
        __idsArr.forEach(id => {
            channels.forEach(channel => {
                if (id === channel.id) {
                    __finalArr.push(channel);
                }
            });
        });

        // setFilteredModules(_modules);
        // setFilteredModuleFeatures(filterArr);
        setSelectedGroups(_finalArr);
        setSelectedChannels(__finalArr);
        // setSelectedModuleFeatures(finalArr);
        setSelectedItem(selectedItem);
    }

    function getSelectedItem(id, serviceKey) {
        const dataRequest = {};
        dataRequest.dataKeys = [
            {
                serviceParams: id,
                dataKey: "selectedItem",
                serviceKey: serviceKey,
                mode: "formData",
            },
        ];
        return new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(res => {
                    const data = res.data.C_DATA.selectedItem[0];
                    resolve(data);
                });
        });
    }

    function handleGroupChange(selectedObjects) {
        setSelectedGroups(selectedObjects);
        let ids = "";
        selectedObjects.forEach(obj => {
            ids += obj.id;
            if (ids !== "") ids += ";";
        });

        setSelectedItem(prev => ({
            ...prev,
            group: ids,
        }));
    }

    function handleChannelChange(selectedObjects) {
        setSelectedChannels(selectedObjects);
        let ids = "";
        selectedObjects.forEach(obj => {
            ids += obj.id;
            if (ids !== "") ids += ";";
        });

        setSelectedItem(prev => ({
            ...prev,
            channel: ids,
        }));
    }

    function addNewItem() {
        setSelectedItem(initialState);
        setSelectedGroups([]);
        setSelectedChannels([]);
        setSaveIsDisabled(true);
        handleShow();
    }

    function clearFields() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
    }

    function getProcessDefination() {
        // https://docs.camunda.org/manual/7.18/reference/rest/process-definition/get-query/

        let path = "";

        if (tenantId === "") {
            path = `/process-definition?withoutTenantId=true&latestVersion=true`;
        } else {
            path = `/process-definition?tenantIdIn=${tenantId}&latestVersion=true`;
        }

        const dataRequest = {
            path,
            method: "GET",
            data: {},
        };
        axios
            .post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    let data = response.data.data;
                    if (data) {
                        setProcessList(data);
                        // setLoaded(true);
                    }
                }
            })
            .catch(err => {
                console.error(err);
            });
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
        // Find the full process object based on selected value
        const selectedProcess = processList.find(
            process => process.process_def_key === value,
        );
        setSelectedItem(prev => ({
            ...prev,
            process_key: value,
            title: selectedProcess ? selectedProcess.title : "",
        }));
    }
    function getChannels() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: channel.subscription,
                    dataKey: "appChannel",
                    serviceKey: "sys.site.administration",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=master.data", dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    if (response.data.C_DATA.appChannel) {
                        let mainArr = response.data.C_DATA.appChannel;
                        let finalArr = [];

                        mainArr.forEach(item => {
                            item.label = item.brand_title;
                            item.value = item.id;
                            finalArr.push(item);
                        });
                        setChannels(finalArr);
                    }
                    // setChannels(channels);
                    // }
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
                    dataKey: "formList",
                    serviceKey: "sys.list.forms",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "processMap",
                    serviceKey: "process.map",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "processCategory",
                    serviceKey: "process.category",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "tenantProcess",
                    serviceKey: "sys.tenant.process",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "groups",
                    serviceKey: "sys.console.dir.group",
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
                    setFormList(response.data.C_DATA.formList);
                    setItems(response.data.C_DATA.processMap);
                    setProcessList(response.data.C_DATA.tenantProcess);
                    setCategoryList(response.data.C_DATA.processCategory);
                    if (response.data.C_DATA.groups) {
                        let mainArr = response.data.C_DATA.groups;
                        let finalArr = [];

                        mainArr.forEach(item => {
                            item.label = item.name;
                            item.value = item.id;
                            finalArr.push(item);
                        });
                        setGroups(finalArr);
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function handleInputField(event, id) {
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

        entityForm.formId = "process_map"; //"formid"
        entityForm.entity = "process_map"; //Db- "table name"
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
                        const newId = response.data.C_DATA[0].formData.id;
                        setItems(prev => [
                            ...prev,
                            {
                                ...selectedItem,
                                id: newId,
                            },
                        ]);
                        toastEmitter("Record saved successfully", true);
                    } else {
                        let updatedItem = items.map(el => {
                            if (el.id === selectedItem.id) {
                                return selectedItem;
                            } else return el;
                        });

                        setItems(updatedItem);
                        toastEmitter("Record updated successfully", true);
                    }
                    // getData();
                    clearFields();
                    handleClose();
                }
            });
        } catch (e) {
            console.log("save processMap error:" + e);
        }
    }

    function deleteData(item, isDelete) {
        if (isDelete === true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "process_map";
            entityForm.entity = "process_map";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
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
            // console.log("you press cancel")
        }
    }

    function getNameById(id) {
        let name = "";
        formList.forEach(item => {
            if (item.id === id) {
                name = item.name;
            }
        });
        return name ? name : "";
    }

    function getProcessByName(id) {
        let name = "";
        processList.forEach(item => {
            if (item.key === id) {
                name = item.name;
            }
        });
        return name ? name : "";
    }

    function getCategoryByKey(key) {
        let title = "";
        categoryList.forEach(item => {
            if (item.key === key) {
                title = item.title;
            }
        });
        return title ? title : "";
    }

    return (
        <div className="process-configuration-map">
            <ModalBox
                state={deleteConfig}
                message={"Are you sure to delete this item"}
                operation={deleteData}
                header={"Delete Process Config"}
                setState={setDeleteConfig}
                modalType="deleteModal"
            />
            <div className="row p-2 m-0">
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-1 table-row text-left">
                                    Active
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    <TableSorting
                                        state={items}
                                        setState={setItems}
                                        fieldName={"title"}
                                        headerTitle={"Title"}
                                    />
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    Category
                                </Th>
                                <Th className="col-sm-2 table-row text-left">
                                    Form
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
                                            {item.title}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {getCategoryByKey(item.category)}
                                        </Td>
                                        <Td className="col-sm-2 table-row text-left">
                                            {getNameById(item.form_id)}
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
                        tableData={items}
                    />
                </div>
                <ModuleFormViewer
                    handleClose={handleClose}
                    showModal={formShow}
                    modalTitle="Process Config"
                    size="lg">
                    <>
                        <div className="form col-sm-12 form-background py-2 px-3">
                            <div className="row">
                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Process&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            placeholder="Select Form"
                                            className="form-select"
                                            name="process_key"
                                            value={
                                                selectedItem &&
                                                selectedItem.process_key
                                            }
                                            onChange={e =>
                                                handleSelectedProcess(e)
                                            }>
                                            <option
                                                key={0}
                                                defaultValue="">
                                                Select Process
                                            </option>
                                            {processList &&
                                                processList !== undefined &&
                                                processList.map(process => {
                                                    return (
                                                        <option
                                                            key={process.id}
                                                            value={
                                                                process.process_def_key
                                                            }>
                                                            {process.title}
                                                        </option>
                                                    );
                                                })}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Category&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            placeholder="Select Category"
                                            className="form-select"
                                            name="category"
                                            value={
                                                selectedItem &&
                                                selectedItem.category
                                            }
                                            onChange={handleInputField}>
                                            <option
                                                key={0}
                                                defaultValue="">
                                                Select Category
                                            </option>
                                            {categoryList &&
                                                categoryList !== undefined &&
                                                categoryList.map(category => {
                                                    return (
                                                        <option
                                                            key={category.id}
                                                            value={
                                                                category.key
                                                            }>
                                                            {category.title}
                                                        </option>
                                                    );
                                                })}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Process Title&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
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

                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Start Form&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            placeholder="Select Form"
                                            className="form-select"
                                            name="form_id"
                                            value={
                                                selectedItem &&
                                                selectedItem.form_id
                                            }
                                            onChange={e =>
                                                handleSelectedForms(e)
                                            }>
                                            <option
                                                key={0}
                                                defaultValue="">
                                                Select Start Form
                                            </option>
                                            {formList &&
                                                formList !== undefined &&
                                                formList.map(form => {
                                                    return (
                                                        <option
                                                            key={form.id}
                                                            value={form.id}>
                                                            {form.name}
                                                        </option>
                                                    );
                                                })}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Site (s)&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <MultiSelect
                                            options={channels}
                                            value={selectedChannels}
                                            onChange={handleChannelChange}
                                            labelledBy="Select"
                                        />
                                    </div>
                                </div>

                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            User Group(s)&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <MultiSelect
                                            options={groups}
                                            value={selectedGroups}
                                            onChange={handleGroupChange}
                                            labelledBy="Select"
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-6 d-flex mt-4">
                                    <div className="col-sm-6 mb-2">
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
                                                    onChange={handleInputField}
                                                />
                                                <label className="form-check-label fw-bold">
                                                    Is Active&nbsp;
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-sm-6 mb-2">
                                        <div className="form-group">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="hide_inbox_start"
                                                    checked={
                                                        selectedItem.hide_inbox_start ===
                                                        "YES"
                                                            ? true
                                                            : false
                                                    }
                                                    onChange={handleInputField}
                                                />
                                                <label className="form-check-label fw-bold">
                                                    Hide Inbox Start&nbsp;
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6 mb-2">
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Submit Label&nbsp;
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="submit_label"
                                            value={selectedItem.submit_label}
                                            onChange={handleInputField}
                                        />
                                    </div>
                                </div>
                            </div>
                            {selectedItem.id !== "new" && (
                                <div className="row">
                                    <div className="col-sm-12 mb-2">
                                        <label className="mt-1 fw-bold">
                                            Process Start URL:
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={`/app/process-start?processId=${selectedItem.id}&embed=true`}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            )}
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

export default ProcessMap;
