import React, { useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import PivotTableUI from "react-pivottable/PivotTableUI";
import TableRenderers from "react-pivottable/TableRenderers";
import createPlotlyComponent from "react-plotlyjs";
import createPlotlyRenderers from "react-pivottable/PlotlyRenderers";
import Plotly from "plotly.js/dist/plotly-cartesian";
import { API_URL } from "../../../Config";
import { AppContext } from "../../../../AppContext";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import DataSet from "../TableData/DataSet";
import ChildrenModal from "../../ChildrenModal/ChildrenModal";
import SaveSettingForm from "./SaveSettingForm";
import ModalBox from "../../Modal/Modal";
import { tryToParse } from "../../../modules/data-management/form-builder/Forms/FormViewer/utils";
import Messsage from "../../Subscription Message/Messsage";
import { SubscriptionAllowViewer } from "../../../utils/utils";
import { config } from "dotenv";
import RecordTable from "./RecordTable";

export default function ReactPivottable(props) {
    const { mode, modeType } = props;
    let initialState = {
        id: "",
        key: "",
    };
    const appContext = useContext(AppContext);
    const [data, setData] = useState(initialState);
    const [dataItems, setDataItems] = useState([]);
    const [list, setList] = useState([]);
    const [state, setState] = useState({});
    const [dataSources, setDataSources] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [showDataSet, setShowDataSet] = useState(true);
    const initialSaveConfig = {
        id: "",
        title: "",
        selected_dataset: "",
        config: {},
    };
    const [saveConfig, setSaveConfig] = useState(initialSaveConfig);
    const Plot = createPlotlyComponent(Plotly);
    const PlotlyRenderers = createPlotlyRenderers(Plot);
    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const childRef = useRef(null);
    const [selectedDataSetList, setSelectedDataSetList] = useState([]);
    const [deleteModal, setDeleteModal] = useState({
        item: "",
        show: false,
    });
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const isAdmin = appContext.userGroups?.groupid?.includes("ADMIN") || false;

    const handleCellClick = (e, value, filters, pivotData) => {
        // filters example: { year: "2025", category: "MONEY_IN" }
        const filteredRecords = dataItems.filter(record => {
            return Object.entries(filters).every(([key, value]) => {
                // normalize keys (since pivot may use different cases)
                const recordValue =
                    record[key] ??
                    record[key.toLowerCase()] ??
                    record[key.toUpperCase()];
                return recordValue == value; // use == to handle type differences
            });
        });

        setSelectedRecords(filteredRecords);
        setShowModal(true);
    };

    useEffect(() => {
        if (!config?.id && selectedDataSetList.length > 0) {
            setConfig(selectedDataSetList[0]);
        }
    }, [selectedDataSetList]);

    useEffect(() => {
        if (!selectedId) {
            handleSelect(list[0]?.id);
        }
    }, [list]);

    useEffect(() => {
        if (tenantId) {
            getData();
        }
    }, [tenantId]);

    useEffect(() => {
        if (selectedId && JSON.stringify(state) !== "{}") {
            const config = setter();
            setSaveConfig({
                ...saveConfig,
                config: config,
            });
        }
    }, [state]);

    const setter = () => {
        if (state && JSON.stringify(state) !== "{}") {
            let _state = { ...state };
            const notReq = [
                "renderers",
                "data",
                "tableColorScaleGenerator",
                "aggregators",
                "onChange",
            ];
            for (let key in _state) {
                if (notReq.includes(key)) {
                    delete _state[key];
                }
            }
            return JSON.stringify(_state);
        }
    };

    const getData = condition => {
        var dataRequest = {};
        if (condition === "SAVE" || condition === "DELETE") {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "pivotDataSet",
                        serviceKey: "sys.pivot.table.data",
                        mode: "formData",
                    },
                ],
            };
        } else {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "pivotDataSet",
                        serviceKey: "sys.pivot.table.data",
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
        }

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                    console.log(`UNAUTHORIZED, please login.`);
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.pivotDataSet) {
                        // debugger;
                        let items = response.data.C_DATA.pivotDataSet;
                        setList(items);
                    } else {
                        console.log(
                            `Either sys.pivot.table.data does not exists or SQL query returns no result.`,
                        );
                    }
                    if (
                        response.data.C_DATA.instance &&
                        condition === undefined
                    ) {
                        setDataSources(response.data.C_DATA.instance);
                    } else {
                        console.log(
                            `Either sys.instance does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    };

    const getDataWithKey = key => {
        let dataRequest = {
            tenant_id: tenantId,
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "tableData",
                    serviceKey: `${key}`,
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=tenant.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let data = response.data.C_DATA.tableData;
                    data = typeof data === "object" ? data : [];
                    setDataItems(data);
                }
            });
    };
    const getSelectedDataSets = key => {
        let dataRequest = {
            tenant_id: tenantId,
            dataKeys: [
                {
                    serviceParams: key,
                    dataKey: "selectedDataSet",
                    serviceKey: "sys.selected.dataset.config",
                    mode: "formData",
                },
            ],
        };

        if (key) {
            return new Promise((resolve, reject) => {
                axios
                    .post(
                        API_URL + "?service.key=masterKey.tenantData",
                        dataRequest,
                    )
                    .then(response => {
                        if (response.data.C_STATUS === "SUCCESS") {
                            let list = response.data.C_DATA.selectedDataSet;
                            let _data = typeof list === "object" ? list : [];
                            setSelectedDataSetList(_data);
                            resolve(_data);
                        }
                    });
            });
        }
    };
    const getDataWithSql = item => {
        let dataRequest = {
            datasource: item.data_source,
            tenant_id: tenantId,
            query: item.sql,
        };

        axios
            .post(API_URL + "?service.key=bi.data&mode=formData", dataRequest)
            .then(response => {
                if (response.data.C_DATA.tableData) {
                    let data = response.data.C_DATA.tableData;
                    data = typeof data === "object" ? data : [];
                    setDataItems(data);
                } else {
                    let data = response.data.C_DATA;
                    data = typeof data === "object" ? data : [];
                    setDataItems(data);
                }
            });
    };

    const handleSelect = (value, e) => {
        // if (
        //     e &&
        //     (e.target.closest(".form-check-input") ||
        //         e.target.closest(".dropdown"))
        // )
        //     return;

        setState([]);
        var initialSaveConfig = {
            id: "",
            title: "",
            selected_dataset: value,
            config: {},
        };
        setSaveConfig(initialSaveConfig);
        setSelectedId(value);
        let _item = list.find(item => item.id === value);
        if (_item && _item.type === "SERVICE-KEY") {
            getDataWithKey(_item.key);

            setData(prev => ({
                ...prev,
                key: _item.id,
            }));
        } else if (_item && _item.type === "SQL") {
            getDataWithSql(_item);

            setData({ ...data, key: _item.id });
        } else {
            setData(initialState);
            setDataItems([]);
            setState({});
        }

        if (_item && _item.id) {
            getSelectedDataSets(_item.id);
        }
    };

    const refreshSelectedItemData = async value => {
        handleSelect(value);
        setConfig(saveConfig);
    };

    const getNameById = id => {
        let _length = list.length;
        for (let i = 0; i < _length; i++) {
            if (list[i].id == id) {
                return list[i].title;
            }
        }
    };

    const hanldeSaveConfig = async () => {
        const url = API_URL + "?service.key=update.formData";
        const dataRequest = {};
        dataRequest.data = [];
        let obj = {
            formId: "dataset_config",
            entity: "dataset_config",
            action: "update",
            formData: saveConfig,
            id: saveConfig.id,
        };
        dataRequest.data.push(obj);
        const res = await axios.post(url, dataRequest);
        const savedObj = res.data.C_DATA[0].formData;
        if (!saveConfig.id) {
            setSelectedDataSetList(prev => [...prev, savedObj]);
        } else {
            const arr = [];
            selectedDataSetList.forEach(item => {
                if (item.id === savedObj.id) {
                    arr.push(savedObj);
                } else {
                    arr.push(item);
                }
            });
            setSelectedDataSetList(arr);
        }
        if (childRef.current) {
            childRef.current.close();
        }
        console.log(res);
    };

    const handleInput = e => {
        const { name, value } = e.target;
        setSaveConfig({ ...saveConfig, [name]: value });
    };

    const setConfig = item => {
        setState(tryToParse(item.config));
        setSaveConfig({ ...saveConfig, title: item.title, id: item.id });
    };

    const deleteItem = (id, condition) => {
        if (condition === undefined) {
            setDeleteModal(prev => ({
                ...prev,
                item: id,
                show: true,
            }));
        } else {
            let req = {
                datasource: "",
                data: [
                    {
                        formId: "dataset_config",
                        entity: "dataset_config",
                        action: "delete",
                        id: id,
                    },
                ],
            };
            let url = API_URL + "?service.key=update.formData";
            axios.post(url, req).then(res => {
                if (res.status === 200) {
                    setSelectedDataSetList(prev =>
                        prev.filter(item => item.id !== id),
                    );
                }
            });
            setDeleteModal(prev => ({
                ...prev,
                item: {},
                show: false,
            }));
            setState({});
            setSaveConfig(prev => ({
                ...prev,
                config: {},
            }));
        }
    };

    const handleEdit = item => {
        if (childRef.current) {
            childRef.current.show();
            setSaveConfig({ ...saveConfig, title: item.title, id: item.id });
        }
    };

    const addNewQuery = () => {
        setState({});
        setSaveConfig({
            ...saveConfig,
            id: "",
            title: "",
            config: {},
        });
        childRef.current.show();
    };

    return (
        <ErrorBoundary>
            {mode === modeType.design && (
                <div className="pivot-table-setting">
                    <span className="fa-solid fa-magnifying-glass-chart pe-2"></span>
                    Pivot Table
                </div>
            )}
            {(mode === modeType.render || mode === modeType.preview) && (
                <>
                    <ModalBox
                        state={deleteModal}
                        message="Are you sure to delete?"
                        operation={deleteItem}
                        header="Delete Query"
                        setState={setDeleteModal}
                    />
                    <ChildrenModal
                        header="Add View"
                        ref={childRef}>
                        <SaveSettingForm
                            saveConfig={saveConfig}
                            hanldeSaveConfig={hanldeSaveConfig}
                            handleInput={handleInput}
                        />
                    </ChildrenModal>
                    <div className="container-fluid react-pivot">
                        <div className="row">
                            {showDataSet && (
                                <div className="col-sm-3 left-menu">
                                    <DataSet
                                        handleSelect={handleSelect}
                                        list={list}
                                        dataSources={dataSources}
                                        getData={getData}
                                        selectedId={selectedId}
                                        setShowDataSet={setShowDataSet}
                                    />
                                </div>
                            )}

                            <div
                                className={
                                    showDataSet
                                        ? "react-pv-table col-sm-9"
                                        : "react-pv-table col-sm-12"
                                }>
                                <div className="row s2a-form-title m-1 align-items-center justify-content-between my-2">
                                    <div className="col-sm-2">
                                        <div className="dataset-title">
                                            {selectedId && (
                                                <div>
                                                    {showDataSet ? (
                                                        <i
                                                            className="fa-solid fa-align-right me-1"
                                                            title="Expand View Width"
                                                            onClick={() =>
                                                                setShowDataSet(
                                                                    false,
                                                                )
                                                            }></i>
                                                    ) : (
                                                        <i
                                                            className="fa-solid fa-align-right me-1"
                                                            title="Restore View Width"
                                                            onClick={() =>
                                                                setShowDataSet(
                                                                    true,
                                                                )
                                                            }></i>
                                                    )}
                                                </div>
                                            )}
                                            {getNameById(selectedId)}
                                        </div>
                                    </div>
                                    {selectedId && (
                                        <>
                                            <div className="col-sm-8">
                                                <div className="row ms-2">
                                                    {selectedDataSetList &&
                                                        selectedDataSetList?.map(
                                                            item => {
                                                                return (
                                                                    <div
                                                                        onClick={() =>
                                                                            setConfig(
                                                                                item,
                                                                            )
                                                                        }
                                                                        className={`pivot-badge flex-between s2a-fit-content col-sm-2  ${
                                                                            item.id ===
                                                                            saveConfig.id
                                                                                ? "selected-pill"
                                                                                : ""
                                                                        }`}>
                                                                        <span>
                                                                            <i className="fa-solid fa-magnifying-glass-chart"></i>{" "}
                                                                            {
                                                                                item?.title
                                                                            }
                                                                        </span>
                                                                        <DropDownComp
                                                                            handle={() =>
                                                                                handleEdit(
                                                                                    item,
                                                                                )
                                                                            }
                                                                            handleDelete={
                                                                                deleteItem
                                                                            }
                                                                            item={
                                                                                item
                                                                            }
                                                                            actionName="Edit"
                                                                        />
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                </div>
                                            </div>
                                            <div className="col-sm-2 d-flex justify-content-end">
                                                {saveConfig.id && (
                                                    <>
                                                        <span
                                                            title="Refresh Data"
                                                            className="cursor-pointer p-2"
                                                            onClick={() =>
                                                                refreshSelectedItemData(
                                                                    selectedId,
                                                                )
                                                            }>
                                                            <i className="fa-solid fa-refresh"></i>
                                                        </span>
                                                    </>
                                                )}
                                                {isAdmin && (
                                                    <span
                                                        title="Add View"
                                                        className="cursor-pointer p-2"
                                                        onClick={() =>
                                                            addNewQuery()
                                                        }>
                                                        <i className="fa fa-plus"></i>
                                                    </span>
                                                )}

                                                {isAdmin && saveConfig.id && (
                                                    <span
                                                        title="Save View Changes"
                                                        className="cursor-pointer p-2"
                                                        onClick={
                                                            hanldeSaveConfig
                                                        }>
                                                        <i className="fa-solid fa-floppy-disk"></i>
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {selectedId ? (
                                    <div className="pv-table-wrapper enable-scroll">
                                        <PivotTableUI
                                            data={dataItems}
                                            onChange={s => setState(s)}
                                            renderers={Object.assign(
                                                {},
                                                TableRenderers,
                                                PlotlyRenderers,
                                            )}
                                            {...state}
                                            tableOptions={{
                                                clickCallback: handleCellClick, //handle clicks
                                            }}
                                        />
                                        {/* Transaction Modal */}
                                        {showModal && (
                                            <div
                                                className="modal fade show"
                                                style={{
                                                    display: "block",
                                                }}
                                                tabIndex="-1"
                                                role="dialog">
                                                <div className="modal-dialog modal-xl">
                                                    <div className="modal-content">
                                                        <div className="modal-header">
                                                            <h5 className="modal-title">
                                                                Transaction
                                                                Details
                                                            </h5>
                                                            <button
                                                                type="button"
                                                                className="btn-close"
                                                                onClick={() =>
                                                                    setShowModal(
                                                                        false,
                                                                    )
                                                                }></button>
                                                        </div>
                                                        <div className="modal-body enable-scroll">
                                                            {selectedRecords.length >
                                                            0 ? (
                                                                <RecordTable
                                                                    selectedRecords={
                                                                        selectedRecords
                                                                    }
                                                                />
                                                            ) : (
                                                                <p>
                                                                    No records
                                                                    found for
                                                                    this summary
                                                                    cell.
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="modal-footer">
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() =>
                                                                    setShowModal(
                                                                        false,
                                                                    )
                                                                }>
                                                                Close
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="col task-view-panel">
                                        <div className="no-task-border">
                                            <div className="no-task-wrap">
                                                <i className="fa-solid fa-info no-task-info-icon me-2"></i>
                                                <span className="no-task-text">
                                                    Select data set in the list
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </ErrorBoundary>
    );
}

function DropDownComp(props) {
    const { handle, handleDelete, item, actionName } = props;
    return (
        <span className="dropdown">
            <span
                className="fa-solid fa-ellipsis-vertical show show-hide-button p-2"
                data-bs-toggle="dropdown"></span>
            <ul className="dropdown-menu">
                <li>
                    <span
                        className="dropdown-item"
                        title="Edit"
                        onClick={() => handle(item)}>
                        <i className="fa fa-pen"></i>
                        {actionName}
                    </span>
                </li>
                <li>
                    <span
                        className="dropdown-item dropdown-item-del"
                        title="Delete"
                        onClick={() => handleDelete(item.id)}>
                        <i className="fa-regular fa-trash-can"></i>
                        Delete
                    </span>
                </li>
            </ul>
        </span>
    );
}

//  create Plotly React component via dependency injection

// create Plotly renderers via dependency injection

// see documentation for supported input formats
