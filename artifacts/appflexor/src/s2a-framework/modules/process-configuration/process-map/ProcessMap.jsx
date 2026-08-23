import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { AppContext } from "../../../../AppContext";
import { API_URL } from "../../../Config";
import ModalBox from "../../../components/Modal/Modal";
import ModuleFormViewer from "../../../components/ModuleFormViewer/ModuleFormViewer";
import TextEditor from "../../../components/TextEditor/RichTextEditor";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import TableSorting from "../../../components/TableSorting/TableSorting";
import { updateDeleteConfig } from "../../../utils/utils";
import { BPM_API_URL } from "../../camunda/CamundaConfig";
import { MultiSelect } from "react-multi-select-component";
import ProcessesContext from "../../camunda/ProcessesContext";
import { toastEmitter } from "../../../components/Toastify/Toastify";

const DEFAULT_URGENCY_LEVELS = {
    High: { slaValue: 24, slaUnit: "hours" },
    Medium: { slaValue: 72, slaUnit: "hours" },
    Low: { slaValue: 7, slaUnit: "days" },
};

const URGENCY_LEVELS = ["High", "Medium", "Low"];

function normalizeUrgencyLevels(value) {
    let urgencyLevels = value;

    if (typeof urgencyLevels === "string") {
        try {
            urgencyLevels = JSON.parse(urgencyLevels);
        } catch {
            urgencyLevels = {};
        }
    }

    return URGENCY_LEVELS.reduce((result, level) => {
        const configuredLevel = urgencyLevels?.[level] || {};
        const parsedValue = Number.parseInt(configuredLevel.slaValue, 10);

        result[level] = {
            slaValue:
                Number.isInteger(parsedValue) && parsedValue > 0
                    ? parsedValue
                    : DEFAULT_URGENCY_LEVELS[level].slaValue,
            slaUnit: ["hours", "days"].includes(configuredLevel.slaUnit)
                ? configuredLevel.slaUnit
                : DEFAULT_URGENCY_LEVELS[level].slaUnit,
        };
        return result;
    }, {});
}

function ProcessMap({ activeTab }) {
    let initialState = {
        id: "",
        title: "",
        process_key: "",
        form_id: "",
        category: "",
        business_area: "",
        is_active: "YES",
        allow_draft: "YES",
        description: "",
        urgency_levels: normalizeUrgencyLevels(),
    };
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);
    const [size, setSize] = useState(5);
    const [processList, setProcessList] = useState([]);
    const [formList, setFormList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [governingBodyList, setGoverningBodyList] = useState([]);
    const [businessAreaList, setBusinessAreaList] = useState([]);
    const [error, setError] = useState([]);
    const [current, setCurrent] = useState(1);
    const [formShow, setFormShow] = useState(false);
    const [groups, setGroups] = useState([]);
    const [channels, setChannels] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedChannels, setSelectedChannels] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const handleClose = () => setFormShow(false);
    const handleShow = () => setFormShow(true);
    const appContext = useContext(AppContext);
    const channel = appContext.channel;
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const getPaginateData = (current, pageSize) => {
        const data = getFilteredItems();
        if (data) {
            return data.slice((current - 1) * pageSize, current * pageSize);
        }
        return [];
    };

    function getFilteredItems() {
        if (!searchTerm || searchTerm.trim() === "") return items;
        const q = searchTerm.trim().toLowerCase();
        return items.filter(it => {
            const title = (it.title || "").toString().toLowerCase();
            const key = (it.process_key || "").toString().toLowerCase();
            const category = (it.category || "").toString().toLowerCase();
            const business = (it.business_area || "").toString().toLowerCase();
            return (
                title.indexOf(q) > -1 ||
                key.indexOf(q) > -1 ||
                category.indexOf(q) > -1 ||
                business.indexOf(q) > -1
            );
        });
    }
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
        setCurrent(1);
    }, [searchTerm]);

    useEffect(() => {
        if (selectedItem?.id) {
            getAuth(selectedItem);
        }
    }, [selectedItem?.id]);

    useEffect(() => {
        if (
            selectedItem.process_key !== "" &&
            selectedItem.business_area !== "" &&
            selectedItem.process_gov !== "" &&
            selectedItem.category !== "" &&
            selectedItem.title !== "" &&
            selectedItem.form_id !== "" &&
            selectedChannels.length > 0 &&
            selectedGroups.length > 0
        ) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    function editItem(item) {
        setSelectedItem({
            ...item,
            urgency_levels: normalizeUrgencyLevels(item.urgency_levels),
        });
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
        setShowPreview(false);
        handleShow();
    }

    function clearFields() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
        setShowPreview(false);
    }

    function getStartProcessUrl() {
        if (!selectedItem?.id || selectedItem.id === "new") {
            return "";
        }
        return `/app/process-start?processId=${selectedItem.id}&embed=true`;
    }

    function copyStartProcessUrl() {
        const url = getStartProcessUrl();
        if (!url) {
            toastEmitter("Save the process first to generate a start URL", false);
            return;
        }

        if (navigator?.clipboard?.writeText) {
            navigator.clipboard
                .writeText(url)
                .then(() => toastEmitter("Start URL copied", true))
                .catch(() => toastEmitter("Unable to copy URL", false));
            return;
        }

        toastEmitter("Clipboard is not available in this browser", false);
    }

    function isFieldEmpty(value) {
        return (value || "").toString().trim() === "";
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
                    dataKey: "processGov",
                    serviceKey: "process.gov",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "processBusinessArea",
                    serviceKey: "process.business.area",
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
                    setGoverningBodyList(response.data.C_DATA.processGov);
                    setBusinessAreaList(response.data.C_DATA.processBusinessArea);
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

    function handleSlaChange(level, field, value) {
        setSelectedItem(prev => ({
            ...prev,
            urgency_levels: {
                ...normalizeUrgencyLevels(prev.urgency_levels),
                [level]: {
                    ...normalizeUrgencyLevels(prev.urgency_levels)[level],
                    [field]:
                        field === "slaValue"
                            ? Math.max(1, Number.parseInt(value, 10) || 1)
                            : value,
                },
            },
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
        // debugger
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

    function getCategoryById(id) {
        let title = "";
        categoryList.forEach(item => {
            if (item.id === id) {
                title = item.title;
            }
        });
        return title ? title : "";
    }

    function getBusinessAreaById(id) {
        let title = "";
        businessAreaList.forEach(item => {
            if (item.id === id) {
                title = item.title;
            }
        });
        return title ? title : "";
    }

    function getGoverningBodyById(id) {
        let title = "";
        governingBodyList.forEach(item => {
            if (item.id === id) {
                title = item.title;
            }
        });
        return title ? title : "";
    }

    function getBusinessAreaByKey(key) {
        let title = "";
        businessAreaList.forEach(item => {
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
            <div className="proc-list-wrap">
                {/* ── Search bar ── */}
                <div className="proc-list-search">
                    <span className="proc-list-search-icon"><i className="fa fa-search" /></span>
                    <input
                        type="text"
                        placeholder="Search by title, key or category…"
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrent(1); }}
                    />
                    {searchTerm && (
                        <button className="proc-list-search-clear" onClick={() => setSearchTerm("")} title="Clear">
                            <i className="fa fa-times" />
                        </button>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="proc-list-table-wrap">
                    <Table className="proc-list-table">
                        <Thead>
                            <Tr>
                                <Th style={{ width: "6rem" }}>
                                    <TableSorting state={items} setState={setItems} fieldName="is_active" headerTitle="Active" />
                                </Th>
                                <Th>
                                    <TableSorting state={items} setState={setItems} fieldName="title" headerTitle="Process Title" />
                                </Th>
                                <Th>SLA</Th>
                                <Th>Category</Th>
                                <Th>Business Area</Th>
                                <Th>Governing Body</Th>
                                <Th>Form</Th>
                                <Th style={{ width: "6rem" }} />
                            </Tr>
                        </Thead>
                        <Tbody>
                            {getPaginateData(current, size).map(item => (
                                <Tr
                                    key={item.id}
                                    className={item.id === selectedItem.id ? "proc-row-selected" : ""}>
                                    <Td>
                                        <span className={`proc-list-badge ${item.is_active === "YES" ? "proc-list-badge-active" : "proc-list-badge-inactive"}`}>
                                            {item.is_active === "YES" ? "Active" : "Inactive"}
                                        </span>
                                    </Td>
                                    <Td>{item.title}</Td>
                                    <Td>
                                        <div className="d-flex flex-wrap gap-1">
                                            {item?.urgency_levels && URGENCY_LEVELS.map(level => {
                                                const sla = normalizeUrgencyLevels(item.urgency_levels)[level];
                                                return (
                                                    <span
                                                        key={level}
                                                        className="badge rounded-pill text-bg-light border text-dark"
                                                        title={`${level} urgency SLA`}>
                                                        {level}: {sla.slaValue} {sla.slaUnit}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </Td>
                                    <Td>{getCategoryById(item.category)}</Td>
                                    <Td>{getBusinessAreaById(item?.business_area)}</Td>
                                    <Td>{getGoverningBodyById(item?.process_gov)}</Td>
                                    <Td>{getNameById(item.form_id)}</Td>
                                    <Td>
                                        <div className="proc-list-actions">
                                            <button className="proc-list-action-btn" title="Edit" onClick={() => editItem(item)}>
                                                <i className="fa-regular fa-edit" />
                                            </button>
                                            <button className="proc-list-action-btn danger" title="Delete" onClick={() => deleteData(item)}>
                                                <i className="fa-regular fa-trash-can" />
                                            </button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </div>

                {/* ── Footer: add + pagination ── */}
                <div className="proc-list-footer">
                    <button className="button-theme btn btn-sm" onClick={addNewItem}>
                        <i className="fa-solid fa-plus pe-1" />Add New
                    </button>
                    <TablePagination
                        size={size}
                        setSize={setSize}
                        current={current}
                        setCurrent={setCurrent}
                        tableData={getFilteredItems()}
                    />
                </div>
                <ModuleFormViewer
                    handleClose={handleClose}
                    showModal={formShow}
                    modalTitle="Process Configuration"
                    size="lg">
                    <>
                        <div className="form col-sm-12 form-background py-2 px-3">
                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-header bg-light fw-bold">Process Details</div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-sm-6">
                                            <label className="mt-1 fw-bold">
                                                Process
                                                <span className="text-danger"> *</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="process_key"
                                                value={selectedItem?.process_key || ""}
                                                onChange={e => handleSelectedProcess(e)}>
                                                <option key={0} defaultValue="">
                                                    Select Process
                                                </option>
                                                {processList &&
                                                    processList.map(process => (
                                                        <option
                                                            key={process.id}
                                                            value={process.process_def_key}>
                                                            {process.title}
                                                        </option>
                                                    ))}
                                            </select>
                                            {isFieldEmpty(selectedItem?.process_key) && (
                                                <div className="form-text text-danger">Process is required.</div>
                                            )}
                                        </div>

                                        <div className="col-sm-6">
                                            <label className="mt-1 fw-bold">
                                                Process Title
                                                <span className="text-danger"> *</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="title"
                                                value={selectedItem?.title || ""}
                                                onChange={handleInputField}
                                            />
                                            {isFieldEmpty(selectedItem?.title) && (
                                                <div className="form-text text-danger">Title is required.</div>
                                            )}
                                        </div>
                                        <div className="col-sm-12">
                                            <label className="mt-1 fw-bold">
                                                Sub Title
                                                <span className="text-danger"> *</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="subtitle"
                                                value={selectedItem?.subtitle || ""}
                                                onChange={handleInputField}
                                            />
                                            {isFieldEmpty(selectedItem?.subtitle) && (
                                                <div className="form-text text-danger">Sub Title is required.</div>
                                            )}
                                        </div>
                                        <div className="col-sm-12">
                                            <label className="mt-1 fw-bold">Description</label>
                                            <TextEditor
                                                name="description"
                                                value={selectedItem?.description || ""}
                                                height={220}
                                                onChange={handleInputField}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-header bg-light fw-bold">Governance</div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-sm-4">
                                            <label className="mt-1 fw-bold">
                                                Business Area
                                                <span className="text-danger"> *</span>
                                                <span className="ms-1" title="Business Area defines the business domain of the process.">?</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="business_area"
                                                value={selectedItem?.business_area || ""}
                                                onChange={handleInputField}>
                                                <option key={0} defaultValue="">
                                                    Select Business Area
                                                </option>
                                                {businessAreaList &&
                                                    businessAreaList.map(barea => (
                                                        <option key={barea.id} value={barea.id}>
                                                            {barea.title}
                                                        </option>
                                                    ))}
                                            </select>                                            
                                        </div>

                                        <div className="col-sm-4">
                                            <label className="mt-1 fw-bold">
                                                Governing Body
                                                <span className="text-danger"> *</span>
                                                <span className="ms-1" title="Governing Body identifies the owner team responsible for approvals and policy.">?</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="process_gov"
                                                value={selectedItem?.process_gov || ""}
                                                onChange={handleInputField}>
                                                <option key={0} defaultValue="">
                                                    Select Governing Body
                                                </option>
                                                {governingBodyList &&
                                                    governingBodyList.map(gb => (
                                                        <option key={gb.id} value={gb.id}>
                                                            {gb.title}
                                                        </option>
                                                    ))}
                                            </select>                                            
                                            {isFieldEmpty(selectedItem?.process_gov) && (
                                                <div className="form-text text-danger">Governing Body is required.</div>
                                            )}
                                        </div>

                                        <div className="col-sm-4">
                                            <label className="mt-1 fw-bold">
                                                Category
                                                <span className="text-danger"> *</span>
                                                <span className="ms-1" title="Category represents the organization’s strategic intent behind a process to highlight internal priorities and value creation.">?</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="category"
                                                value={selectedItem?.category || ""}
                                                onChange={handleInputField}>
                                                <option key={0} defaultValue="">
                                                    Select Category
                                                </option>
                                                {categoryList &&
                                                    categoryList.map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.title}
                                                        </option>
                                                    ))}
                                            </select>
                                            {isFieldEmpty(selectedItem?.category) && (
                                                <div className="form-text text-danger">Category is required.</div>
                                            )}                                            
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-header bg-light fw-bold">Access Control</div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-sm-4">
                                            <label className="mt-1 fw-bold">
                                                Start Form
                                                <span className="text-danger"> *</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="form_id"
                                                value={selectedItem?.form_id || ""}
                                                onChange={e => handleSelectedForms(e)}>
                                                <option key={0} defaultValue="">
                                                    Select Start Form
                                                </option>
                                                {formList &&
                                                    formList.map(form => (
                                                        <option key={form.id} value={form.id}>
                                                            {form.name}
                                                        </option>
                                                    ))}
                                            </select>
                                            {isFieldEmpty(selectedItem?.form_id) && (
                                                <div className="form-text text-danger">Start Form is required.</div>
                                            )}
                                        </div>

                                        <div className="col-sm-4">
                                            <label className="mt-1 fw-bold">
                                                User Group(s)
                                                <span className="text-danger"> *</span>
                                                <span className="ms-1" title="Only selected groups can initiate and access this process.">?</span>
                                            </label>
                                            <MultiSelect
                                                options={groups}
                                                value={selectedGroups}
                                                onChange={handleGroupChange}
                                                labelledBy="Select"
                                            />
                                            {selectedGroups.length === 0 && (
                                                <div className="form-text text-danger">At least one user group is required.</div>
                                            )}
                                        </div>

                                        <div className="col-sm-4">
                                            <label className="mt-1 fw-bold">
                                                Site(s)
                                                <span className="text-danger"> *</span>
                                                <span className="ms-1" title="Selected sites determine where this process is visible.">?</span>
                                            </label>
                                            <MultiSelect
                                                options={channels}
                                                value={selectedChannels}
                                                onChange={handleChannelChange}
                                                labelledBy="Select"
                                            />
                                            {selectedChannels.length === 0 && (
                                                <div className="form-text text-danger">At least one site is required.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-header bg-light fw-bold">Service Level Agreements</div>
                                <div className="card-body">
                                    <p className="form-text mt-0 mb-3">
                                        Set the completion target for each predefined urgency level.
                                    </p>
                                    <div className="row g-3">
                                        {URGENCY_LEVELS.map(level => {
                                            const sla = normalizeUrgencyLevels(
                                                selectedItem?.urgency_levels,
                                            )[level];

                                            return (
                                                <div className="col-12 col-md-4" key={level}>
                                                    <fieldset className="border rounded p-3 h-100">
                                                        <legend className="float-none w-auto px-2 fs-6 fw-bold mb-1">
                                                            {level}
                                                        </legend>
                                                        <div className="row g-2">
                                                            <div className="col-6">
                                                                <label className="form-label fw-bold" htmlFor={`sla-value-${level}`}>
                                                                    SLA Number
                                                                </label>
                                                                <input
                                                                    id={`sla-value-${level}`}
                                                                    type="number"
                                                                    className="form-control"
                                                                    min="1"
                                                                    step="1"
                                                                    inputMode="numeric"
                                                                    value={sla.slaValue}
                                                                    onChange={event =>
                                                                        handleSlaChange(
                                                                            level,
                                                                            "slaValue",
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="col-6">
                                                                <label className="form-label fw-bold" htmlFor={`sla-unit-${level}`}>
                                                                    Unit
                                                                </label>
                                                                <select
                                                                    id={`sla-unit-${level}`}
                                                                    className="form-select"
                                                                    value={sla.slaUnit}
                                                                    onChange={event =>
                                                                        handleSlaChange(
                                                                            level,
                                                                            "slaUnit",
                                                                            event.target.value,
                                                                        )
                                                                    }>
                                                                    <option value="hours">Hours</option>
                                                                    <option value="days">Days</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </fieldset>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-header bg-light fw-bold">Behavior</div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-sm-6">
                                            <div className="form-check border rounded p-3 h-100">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="is_active"
                                                    checked={selectedItem?.is_active === "YES"}
                                                    onChange={handleInputField}
                                                />
                                                <label className="form-check-label fw-bold ms-1">Is Active</label>
                                                <div className="form-text mb-0">Inactive processes are hidden from end users.</div>
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <div className="form-check border rounded p-3 h-100">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="hide_inbox_start"
                                                    checked={selectedItem?.hide_inbox_start === "YES"}
                                                    onChange={handleInputField}
                                                />
                                                <label className="form-check-label fw-bold ms-1">Hide Inbox Start</label>
                                                <div className="form-text mb-0">Removes this process from the inbox quick-start options.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <details className="card border-0 shadow-sm mb-3" open={false}>
                                <summary className="card-header bg-light fw-bold" style={{ cursor: "pointer" }}>
                                    Advanced Settings
                                </summary>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-sm-6">
                                            <label className="mt-1 fw-bold">Submit Label (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="submit_label"
                                                value={selectedItem?.submit_label || ""}
                                                onChange={handleInputField}
                                                placeholder="Example: Submit for Approval"
                                            />
                                        </div>

                                        <div className="col-sm-6">
                                            <label className="mt-1 fw-bold">Process Start URL</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={getStartProcessUrl()}
                                                    placeholder="Available after first save"
                                                    readOnly
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={copyStartProcessUrl}
                                                    title="Copy start link">
                                                    <i className="fa-regular fa-copy me-1"></i>
                                                    Copy Link
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </details>

                            {/* <div className="card border-0 shadow-sm mb-2">
                                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">Preview</span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => setShowPreview(prev => !prev)}>
                                        {showPreview ? "Hide Preview" : "Show Preview"}
                                    </button>
                                </div>
                                {showPreview && (
                                    <div className="card-body">
                                        <h6 className="mb-1">{selectedItem?.title || "Untitled Process"}</h6>
                                        <div className="text-muted small mb-2">
                                            {(selectedItem?.process_key || "No process selected") + " • " + (getBusinessAreaById(selectedItem?.business_area) || "No business area")}
                                        </div>
                                        <div
                                            className="border rounded p-2"
                                            style={{ minHeight: "100px", background: "#fff" }}
                                            dangerouslySetInnerHTML={{ __html: selectedItem?.description || "<em>No description provided yet.</em>" }}
                                        />
                                    </div>
                                )}
                            </div> */}
                        </div>
                        <div className="modal-footer pe-0">
                            {selectedItem.id === "" && (
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={() => saveData()}
                                    disabled={saveIsDisabled}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Save Changes
                                </button>
                            )}
                            {selectedItem.id !== "" && (
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={() => saveData()}
                                    disabled={saveIsDisabled}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Save Changes
                                </button>
                            )}
                            {selectedItem.id === "" && (
                                <button
                                    className="btn button-theme btn-sm me-2 m-0"
                                    onClick={clearFields}>
                                    <i className="fa-solid fa-ban pe-1"></i>
                                    Clear Form
                                </button>
                            )}
                            <button
                                className="btn button-theme btn-sm me-2 m-0"
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
