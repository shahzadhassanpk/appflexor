import { sql } from "@codemirror/lang-sql";
import CodeMirror from "@uiw/react-codemirror";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import ReactSelect from "../../../components/ReactSelect/ReactSelect";
import { v4 } from "uuid";
import { API_URL } from "../../../Config";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";
import { getData } from "../../../components/CrudApiCall";
import Listing from "../../../components/Listing/listing";
import ModalBox from "../../../components/Modal/Modal";
import Scroll from "../../../components/Scroll/Scroll";
import SearchItem from "../../../components/Searching/SearchItem";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import DndWrapper from "../../../components/drag-and-drop-listing";
import { DndCard } from "../../../components/drag-and-drop-listing/Card";
import DynamicCheckBoxs from "../../../components/dynamic-checkbox/Checkbox";
import DynamicInput from "../../../components/dynamic-input/DynamicInput";
import DynamicRadio from "../../../components/dynamic-radio/radio";
import TableWrapper from "../../../components/react-table/TableWrapper";
import {
    JsonToCsv,
    deleteItem,
    filterArrayByTerms,
    updateDeleteConfig,
    validArray,
} from "../../../utils/utils";
import { tryToParse } from "../form-builder/Forms/FormViewer/utils";
import { Label } from "recharts";
import { name } from "plotly.js/dist/plotly-cartesian";

const initialInstance = {
    label: "",
    queries: "",
};

const SchemaManagement = props => {
    // props
    const { activeTab } = props;
    const [showLoader, setShowLoader] = useState(false);
    // states
    // const [sqlQuery, setSqlQuery] = useState("");
    const [exportConfig, setExportConfig] = useState({
        name: "",
        exportByName: () => {},
    });
    const [selectedTable, setSelectedTable] = useState({});
    const [hide, setHide] = useState({
        columns: true,
    });
    const [tables, setTables] = useState([]);
    const [dataSources, setDataSources] = useState([]);
    const [selectedDataSource, setSelectedDataSource] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [filteredTables, setFilteredTables] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [selectedColumn, setSelectedColumn] = useState({});
    const [selectedFilteredColumns, setSelectedFilteredColumns] = useState([]);
    const savedInstances =
        typeof localStorage !== "undefined" &&
        localStorage.getItem("instances");
    const parsedInstances = tryToParse(savedInstances);

    const initialQuery = { id: v4(), label: "Tab", queries: "" };
    const instanceExist = elementExist(parsedInstances);
    const initialInstances = instanceExist ? parsedInstances : [initialQuery];
    const [instances, setInstances] = useState(initialInstances);
    const [selectedInstance, setSelectedInstance] = useState(
        instanceExist ? initialInstances[0] : initialQuery,
    );
    const [deleteClosure, setDeleteClosure] = useState({
        name: "",
        delFunc: () => {},
    });
    const [prefix, setPrefix] = useState("NO");

    // refs
    const gridRef = useRef(null);
    const queryRef = useRef(null);
    const tableRef = useRef(null);
    const columnsRef = useRef(null);
    const windowWidth = useRef(null);
    const deleteTabModalRef = useRef(null);
    const importModalRef = useRef(null);
    const exportModalRef = useRef(null);
    const updateTabModalRef = useRef(null);
    const modalColConstraint = useRef(null);
    const tableSearchTxt = useRef(null);
    const colsSearchTxt = useRef(null);

    const [deleteTableConfig, setDeleteTableConfig] = useState({
        show: false,
        item: {},
    });
    const [deleteColConfig, setDeleteColConfig] = useState({
        show: false,
        item: {},
    });
    let device = window.innerWidth > 576 ? "desktop" : "mobile";

    // effects

    useEffect(() => {
        if (activeTab === "SCHEMA_EXPLORER") {
            getTables();
            getDataSources();
        }
    }, [activeTab]);

    useEffect(() => {
        getTables();
    }, [selectedDataSource]);

    useEffect(() => {
        if (activeTab === "SCHEMA_EXPLORER") {
            const checkWidth = () => {
                windowWidth.current = window.innerWidth;
                device = windowWidth.current > 650 ? "desktop" : "mobile";
                if (device === "mobile") {
                    gridRef.current.style.gridTemplate = `repeat(3,1fr) / 1fr`;
                    tableRef.current.style.gridColumn = `span 12`;
                    columnsRef.current.style.gridColumn = `span 12`;
                    queryRef.current.style.gridColumn = `span 12`;
                    tableRef.current.style.marginBottom = "8px";
                    columnsRef.current.style.marginBottom = "8px";
                } else {
                    tableRef.current.style.gridColumn = `span 3`;
                    columnsRef.current.style.gridColumn = `span 3`;
                    queryRef.current.style.gridColumn = `span 6`;
                    gridRef.current.style.gridTemplate = `1fr / repeat(12,1fr)`;
                    tableRef.current.style.marginBottom = "";
                    columnsRef.current.style.marginBottom = "";
                }
            };
            window.addEventListener("resize", checkWidth);

            return () => {
                window.removeEventListener("resize", checkWidth);
            };
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedTable?.code) {
            getSelectedTableColumns(selectedTable?.code);
        }
    }, [selectedTable?.code]);

    useEffect(() => {
        if (!hide.columns) {
            queryRef.current.style.gridColumn = "span 9";
        } else {
            if (selectedTable?.code) {
                queryRef.current.style.gridColumn = "span 6";
            } else {
                queryRef.current.style.gridColumn = "span 9";
            }
        }
    }, [hide.columns, selectedTable?.code]);

    function elementExist(item) {
        return validArray(item) && item.length > 0;
    }

    const updatedInSession = (key, value) =>
        localStorage.setItem(key, JSON.stringify(value));

    async function getDataSources() {
        let keys = [
            {
                serviceParams: "",
                dataKey: "datasources",
                serviceKey: "sys.instance",
                mode: "formData",
            },
        ];
        let url = API_URL + "?service.key=masterKey.tenantData";
        let datasource = "";
        let tenant_id = "";
        const res = await getData({ keys, url, datasource, tenant_id });

        if (res.data.C_STATUS === "SUCCESS") {
            if (res.data.C_DATA && res.data.C_DATA.datasources) {
                let list = res.data.C_DATA.datasources;
                list.push({ name: "Default", code: "" });
                setDataSources(list);
            }
        }
    }

    async function getTables() {
        setShowLoader(true);
        let keys = [
            {
                serviceParams: "",
                dataKey: "tables",
                serviceKey: "schema.get.all.tables",
                mode: "formData",
            },
        ];
        let url = API_URL + "?service.key=masterKey.tenantData";
        let datasource = selectedDataSource?.code || "";
        let tenant_id = "";
        const res = await getData({ keys, url, datasource, tenant_id });

        if (res.data.C_STATUS === "SUCCESS") {
            if (res.data.C_DATA && res.data.C_DATA.tables) {
                const list = res.data.C_DATA.tables;
                const _list = list.map(item => {
                    let name = item.table_name;
                    let newName = name.replace("app_fd_", "");

                    return {
                        code: name,
                        label: newName,
                        delDisabled: `${name}`.startsWith("dir_"),
                    };
                });

                setTables(_list);

                const txt = tableSearchTxt?.current?.value;
                if (txt) {
                    const result = filterArrayByTerms(_list, txt, ["label"]);
                    setFilteredTables(result);
                } else {
                    setFilteredTables(_list);
                }
                setShowLoader(false);
            }
        }
    }

    async function getSelectedTableColumns(table) {
        let keys = [
            {
                params: table,
                dataKey: "columns",
                serviceKey: "schema.get.all.columns",
                mode: "formData",
            },
        ];
        let url = API_URL + "?service.key=masterKey.tenantData";
        let datasource = selectedDataSource?.code || "";
        let tenant_id = "";
        const res = await getData({ keys, url, datasource, tenant_id });
        if (
            res?.data?.C_STATUS === "SUCCESS" &&
            res?.data?.C_DATA &&
            res?.data?.C_DATA?.columns
        ) {
            const list = res.data.C_DATA.columns;
            const _list = list.map(item => {
                let name = item.column_name;
                let newName = name.replace("c_", "");

                return {
                    code: name,
                    label: newName,
                    delDisabled: !`${name}`.includes("c_"),
                };
            });
            setSelectedColumns(_list);
            setSelectedFilteredColumns(_list);
        }
    }

    const deleteTable = async (item, isDelete) => {
        if (isDelete === true) {
            const usePrefix = item?.code.includes("app_fd");
            let request = {
                table: item?.label,
                usePrefix: usePrefix,
            };
            let url = API_URL + "?service.key=schema.del.tables";
            let datasource = selectedDataSource?.code || "";
            request.datasource = datasource;
            const res = await axios.post(url, request);
            if (res.data.C_STATUS === "SUCCESS") {
                deleteItem(setTables, item, "code");
                deleteItem(setFilteredTables, item, "code");

                setSelectedFilteredColumns([]);
                setSelectedTable({});

                updateDeleteConfig(false, {}, setDeleteTableConfig);
                toastEmitter("Table Deleted Successfully", true);
            } else {
                toastEmitter("Table Deletion failed", true);
            }
        } else {
            updateDeleteConfig(true, item, setDeleteTableConfig);
        }
    };

    const deleteColumn = async (item, isDelete) => {
        if (isDelete === true) {
            const usePrefix = item?.code.includes("c_");
            let request = {
                table: selectedTable?.label,
                column: item?.label,
                usePrefix: usePrefix,
            };
            let datasource = selectedDataSource?.code || "";
            request.datasource = datasource;
            let url = API_URL + "?service.key=schema.del.columns";
            const res = await axios.post(url, request);
            if (res.data.C_STATUS === "SUCCESS") {
                deleteItem(setSelectedColumns, item, "code");
                deleteItem(setSelectedFilteredColumns, item, "code");

                toastEmitter("Column Deleted Successfully", true);
            } else {
                toastEmitter("Column Deletion failed", true);
            }
            updateDeleteConfig(false, {}, setDeleteColConfig);
        } else {
            updateDeleteConfig(true, item, setDeleteColConfig);
        }
    };

    const runQuery = query => {
        const pg_end_point = API_URL + "?service.key=db.explorer";
        let dataSource = selectedDataSource?.code || "";
        const url = pg_end_point + `&datasource=${dataSource}`;

        const request = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "data",
                    sql: query,
                    mode: "lowerCase",
                },
            ],
        };
        if (query) {
            axios.post(url, request).then(res => {
                if (res.status === 200 && res.data.C_STATUS === "SUCCESS") {
                    
                    const response = res.data.C_DATA.data;
                    const rowsAffected = response?.rowsAffected;
                    if(response?.error){
                        toastEmitter(response.error, true, "error");
                        return;
                    }
                    const data = typeof response === "object" ? response : [];
                    setTableData(data);
                    if (rowsAffected > 0) {
                        toastEmitter(
                            "Query executed successfully",
                            true,
                            "success",
                        );
                    } else if (rowsAffected === 0) {
                        toastEmitter(
                            "Query returned empty data",
                            true,
                            "error",
                        );
                    }

                    if (typeof response === "string") {
                        toastEmitter(response.slice(5), true, "error");
                    } else if (res.data.C_DATA.data.length === 0) {
                        toastEmitter(
                            "Query Returned Empty Data",
                            true,
                            "error",
                        );
                    }
                }else{
                    toastEmitter(res.data.C_MESSAGE || res.data.C_DATA.data.error, true, "error");
                }
            });
        } else {
            setTableData([]);
            toastEmitter("Please insert sql", true, "warning");
        }
    };

    const getSelectedTablesData = () => {
        const pg_end_point = API_URL + "?service.key=analytics.sqlData";
        const dataSource = selectedDataSource?.code || "";
        const url = pg_end_point + `&datasource=${dataSource}`;

        const request = {
            dataKeys: [],
        };

        selectedTables.forEach(item => {
            request.dataKeys.push({
                serviceParams: "",
                dataKey: item,
                sql: `select * from ${item}`,
                mode: "lowerCase",
            });
        });

        return axios.post(url, request);
    };

    async function handleCopy() {
        toastEmitter("Text copy successfully", true);
    }

    const lenOfArr = item => item.length;

    const handleExport = async (exportItems, modalRef) => {
        if (validArray(exportItems) && lenOfArr(exportItems) > 0) {
            const res = await getSelectedTablesData();
            const dataObj = res?.data?.C_DATA;
            const data = [];
            data.push(dataObj);

            if (exportItems.length === 1) {
                JsonToCsv(data, exportItems[0]);
            } else if (exportItems.length > 1) {
                modalRef.current.show();

                const exportByName = name => {
                    JsonToCsv(data, name);

                    setExportConfig({
                        name: "",
                        exportByName: () => {},
                    });
                    modalRef.current.close();
                };
                setExportConfig(prev => ({
                    ...prev,
                    exportByName: exportByName,
                }));
            }
        }
    };

    const createInstance = () => {
        // const length = instances.length;
        const label = `Tab `;
        // const label = `Tab  ${length + 1} `;
        const instance = { id: v4(), label, queries: "" };
        const updatedInstances = [...instances, instance];
        setInstances(updatedInstances);
        setSelectedInstance(instance);
        updatedInSession("instances", updatedInstances);
    };

    const changeInstance = (instance, event) => {
        if (!event.target.closest(".fa-xmark")) {
            setSelectedInstance(instance);
            const updatedInstance = instances.map(item =>
                item.id === selectedInstance.id ? selectedInstance : item,
            );
            setInstances(updatedInstance);
            updatedInSession("instances", updatedInstance);
            setTableData([]);
        }
    };

    const saveInstances = (message, msgType) => {
        if (typeof localStorage !== "undefined") {
            const updatedInstance = instances.map(item =>
                item.id === selectedInstance.id ? selectedInstance : item,
            );
            setInstances(updatedInstance);
            updatedInSession("instances", updatedInstance);
            toastEmitter(message, true, msgType);
        }
    };

    const updatedInstance = () => {
        saveInstances("Updated Record");
        updateTabModalRef.current.close();
    };

    const deleteAnInstance = _item => {
        const id = _item.id;
        deleteTabModalRef.current.show();
        const innerFun = () => {
            const updatedInstances = instances.filter(item => item.id !== id);
            setInstances(updatedInstances);
            setSelectedInstance(initialInstance);
            updatedInSession("instances", updatedInstances);
            toastEmitter("Item Deleted", true, "error");
            setDeleteClosure({
                name: "",
                delFunc: () => {},
            });
            deleteTabModalRef.current.close();
        };
        setDeleteClosure({
            name: _item.label,
            delFunc: innerFun,
        });
    };

    const readOnly = () => {
        // until tab is created and select one of the tab

        let readOnly = false;
        readOnly =
            validArray(instances) &&
            instances.length > 0 &&
            selectedInstance.label
                ? ""
                : "nocursor";
        return readOnly;
    };

    const handleChangeDataSource = item => {
        console.log("Selected Data Source: ", item);
        setSelectedDataSource(item);
    };

    const handleImport = () => {
        importModalRef.current.show();
    };

    const handleColumnConstraint = (colItem, tableItem) => {
        modalColConstraint.current.show();
        setSelectedColumn(colItem);
    };

    return (
        <div
            className="schema-container s2a-schema-management"
            ref={gridRef}>
            <ModalBox
                state={deleteTableConfig}
                message={"Are you sure to delete this item"}
                operation={deleteTable}
                header={"Delete Table"}
                setState={setDeleteTableConfig}
                modalType="deleteModal"
            />
            <ModalBox
                state={deleteColConfig}
                message={"Are you sure to delete this item"}
                operation={deleteColumn}
                header={"Delete Column"}
                setState={setDeleteColConfig}
                modalType="deleteModal"
            />
            <ChildrenModal
                ref={importModalRef}
                header="Import File"
                centered={true}>
                <ImportForm
                    modalRef={importModalRef}
                    getTables={getTables}
                    setPrefix={setPrefix}
                    prefix={prefix}
                />
            </ChildrenModal>
            <ChildrenModal
                ref={exportModalRef}
                header="Export Name"
                centered={true}>
                <ExportForm
                    exportConfig={exportConfig}
                    setExportConfig={setExportConfig}
                />
            </ChildrenModal>
            <ChildrenModal
                ref={updateTabModalRef}
                header="Tab Name"
                centered={true}>
                <UpdateForm
                    selectedInstance={selectedInstance}
                    setSelectedInstance={setSelectedInstance}
                    updatedInstance={updatedInstance}
                />
            </ChildrenModal>
            <ChildrenModal
                ref={deleteTabModalRef}
                header="Delete Item"
                centered={true}>
                <DeleteTabForm deleteClosure={deleteClosure} />
            </ChildrenModal>
            <ChildrenModal
                ref={modalColConstraint}
                header="Apply Column Constraint">
                <ColumnConstraint
                    column={selectedColumn}
                    table={selectedTable}
                    modalColConstraint={modalColConstraint}
                />
            </ChildrenModal>

            <div
                ref={tableRef}
                className="tables s2a-border-scroll pe-1">
                <div className="p-2">
                    <div className="fw-bold listing-header d-flex justify-content-between">
                        <div className="col-sm-6">
                        <ReactSelect
                            options={dataSources}
                            fieldLabel="name"
                            fieldValue="code"
                            handleChange={handleChangeDataSource}
                            selectedOption={selectedDataSource?selectedDataSource:{code: "", name: "Default"}}
                            // selectedOption={dataSources.find(
                            //     item =>
                            //         item.code === inputField?.datasource,
                            // )}
                        />
                        </div>
                        <div className="col-sm-6 text-center">
                            <i className="fa-solid fa-table me-1"></i>
                            Tables ({filteredTables.length}){" "}
                        </div>
                    </div>
                    <div>
                        <div className="d-flex justify-content-between">
                            <div className="col-sm-10 ps-2">
                                <SearchItem
                                    searchInput={tableSearchTxt}
                                    keysToSearch={["label"]}
                                    placeholder="Search..."
                                    items={filteredTables}
                                    setItems={setFilteredTables}
                                    _items={tables}
                                />
                            </div>
                            <div className="col-sm-2 pt-2">
                                <i
                                    title="Import"
                                    className="fa-solid fa-file-import pointer s2a-import"
                                    onClick={handleImport}></i>
                                {selectedTables && selectedTables.length > 0 ? (
                                    <i
                                        title="Export"
                                        className="fa-solid fa-file-export pointer s2a-export"
                                        onClick={() =>
                                            handleExport(
                                                selectedTables,
                                                exportModalRef,
                                            )
                                        }></i>
                                ) : (
                                    <i
                                        title="Please check atleast one item"
                                        className="fa-solid fa-file-export s2a-export opacity-50"></i>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <Scroll height="57vh">
                    <div className="pe-2">
                        <Listing
                            items={filteredTables}
                            keys={[{ label: "code", code: "code" }]}
                            setSelectedItem={setSelectedTable}
                            selectedItemValue={selectedTable.code}
                            handleDelete={deleteTable}
                            handleCopy={handleCopy}
                            getSelectedItems={selectedItems =>
                                setSelectedTables(selectedItems)
                            }
                            type="table"
                            checkBox={true}
                        />
                    </div>
                </Scroll>
            </div>
            {selectedTable?.code && hide.columns && (
                <div
                    ref={columnsRef}
                    className="columns s2a-border-scroll pe-1">
                    <div className="">
                        <div className="fw-bold mb-2">
                            <i className="fa fa-columns me-1"></i>
                            Columns ({selectedFilteredColumns.length})
                        </div>
                        <SearchItem
                            searchInput={colsSearchTxt}
                            keysToSearch={["code", "label"]}
                            placeholder="Search..."
                            items={selectedFilteredColumns}
                            setItems={setSelectedFilteredColumns}
                            _items={selectedColumns}
                        />
                    </div>
                    <Scroll height="57vh">
                        <div className="pe-2">
                            <Listing
                                items={selectedFilteredColumns}
                                keys={[{ label: "code", code: "code" }]}
                                handleDelete={deleteColumn}
                                handleCopy={handleCopy}
                                handleItemConfig={item =>
                                    handleColumnConstraint(item, selectedTable)
                                }
                                type="column"
                            />
                        </div>
                    </Scroll>
                </div>
            )}
            <div
                ref={queryRef}
                className="query-editor">
                <div className="query-input">
                    <div className="flex-between mb-1">
                        <span className="fw-bold">
                            {selectedTable && selectedTable.label ? (
                                <span
                                    onClick={() =>
                                        setHide({ columns: !hide.columns })
                                    }>
                                    <span>
                                        {hide.columns ? (
                                            <>
                                                <i className="fa-solid fa-align-right me-1"></i>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-align-left me-1"></i>
                                            </>
                                        )}
                                    </span>
                                </span>
                            ) : (
                                <></>
                                // <span
                                //     title="SQL Query already expanded"
                                //     className="opacity-50 me-2">
                                //     <i className="fas fa-expand me-1"></i>
                                // </span>
                            )}
                            SQL Query
                        </span>
                        <div>
                            {validArray(instances) && instances.length > 0 ? (
                                <span
                                    className="btn btn-sm button-theme me-2"
                                    onClick={() =>
                                        saveInstances("Save Record")
                                    }>
                                    <i className="fa-regular fa-floppy-disk me-1"></i>
                                    Save
                                </span>
                            ) : (
                                <span
                                    className="btn btn-sm button-theme me-2 opacity-50"
                                    title="Please create tab">
                                    <i className="fa-regular fa-floppy-disk me-1"></i>
                                    Save
                                </span>
                            )}
                            <span
                                className="btn btn-sm button-theme me-2"
                                onClick={createInstance}>
                                <i className="fa-solid fa-database me-1"></i>
                                Add Query
                            </span>
                            <span
                                className="btn btn-sm button-theme"
                                onClick={() =>
                                    runQuery(selectedInstance?.queries)
                                }>
                                {/* onClick={() => runQuery(sqlQuery)}> */}
                                <i className="fa-solid fa-play px-1"></i> Run
                            </span>
                        </div>
                    </div>
                    {validArray(instances) && instances.length > 0 && (
                        <DndWrapper>
                            <div className="instances">
                                {instances.map((instance, index) => (
                                    <div key={index}>
                                        <DndCard
                                            id={index}
                                            index={index}
                                            setItems={setInstances}>
                                            <div
                                                className={
                                                    instance?.id ===
                                                    selectedInstance?.id
                                                        ? "selected-tab"
                                                        : "tab"
                                                }
                                                style={{ cursor: "move" }}
                                                onClick={e =>
                                                    changeInstance(instance, e)
                                                }
                                                onDoubleClick={() =>
                                                    updateTabModalRef.current.show()
                                                }>
                                                {instance.label}
                                                <i
                                                    style={{
                                                        cursor: "default",
                                                    }}
                                                    className="fa-solid fa-xmark p-1"
                                                    onClick={() =>
                                                        deleteAnInstance(
                                                            instance,
                                                        )
                                                    }></i>
                                            </div>
                                        </DndCard>
                                    </div>
                                ))}
                            </div>
                        </DndWrapper>
                    )}
                    <CodeMirror
                        value={selectedInstance?.queries}
                        // value={sqlQuery}
                        // height="100%"
                        theme="dark"
                        extensions={[sql()]}
                        onChange={(value, viewUpdate) => {
                            setSelectedInstance(prev => ({
                                ...prev,
                                queries: value,
                            }));
                            // setSqlQuery(value);
                        }}
                        readOnly={readOnly()}
                    />
                </div>
                <div className="mt-2">
                    <div className="query-table">
                        {typeof tableData === "object" &&
                            tableData.length > 0 && (
                                <TableWrapper
                                    data={tableData}
                                    tableName="Data Set"
                                    show_pagination={true}
                                />
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchemaManagement;

const ExportForm = props => {
    const { exportConfig, setExportConfig } = props;
    return (
        <>
            <DynamicInput
                label="Name"
                formData={exportConfig}
                setFormData={setExportConfig}
                db_column={"name"}
                required={true}
            />
            <button
                className="button-theme float-end mt-2"
                disabled={exportConfig?.name ? false : true}
                title={
                    exportConfig?.name
                        ? "export data"
                        : "Please provide export file name"
                }
                onClick={() => exportConfig.exportByName(exportConfig?.name)}>
                Export
            </button>
        </>
    );
};

const UpdateForm = props => {
    const { selectedInstance, setSelectedInstance, updatedInstance } = props;
    return (
        <>
            <DynamicInput
                formData={selectedInstance}
                setFormData={setSelectedInstance}
                db_column={"label"}
                required={true}
            />
            <button
                className="button-theme float-end mt-2"
                disabled={selectedInstance?.label ? false : true}
                title={
                    selectedInstance?.label
                        ? "Export data"
                        : "Please provide export file name"
                }
                onClick={() => updatedInstance()}>
                Update
            </button>
        </>
    );
};

const ImportForm = props => {
    const { modalRef, getTables, prefix, setPrefix } = props;

    const [disable, setDisable] = useState(true);
    const [tables, setTables] = useState([]);

    const handleFile = e => {
        try {
            const { files } = e.target;
            if (files[0].type.includes("json")) {
                const fileReader = new FileReader();

                fileReader.onload = e => {
                    const result = e.target.result;
                    const data = tryToParse(result);
                    setTables(data);
                    setDisable(false);
                };

                fileReader.readAsText(files[0]);
            } else {
                toastEmitter("File must be a json type", true, "error");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const makeRequest = tables => {
        const request = {
            data: [],
            saveOrUpdate: "YES",
            usePrefix: prefix,
        };

        for (let table in tables) {
            const records = tables[table];

            for (let record of records) {
                request.data.push({
                    formId: table,
                    entity: table,
                    action: "update",
                    id: record?.id,
                    formData: record,
                });
            }
        }

        return request;
    };

    const saveData = tables => {
        try {
            if (tables && tables[0]) {
                const request = makeRequest(tables[0]);
                let url = API_URL + "?service.key=update.formData";

                axios.post(url, request).then(res => {
                    if (res.status === 200) {
                        toastEmitter("Tables Inserted", true);
                        modalRef.current.close();
                        setPrefix("NO");
                        getTables();
                    }
                });
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            <div className="file">
                <label
                    htmlFor="file"
                    className="fw-bold mb-1">
                    Import File
                </label>
                <input
                    className="form-control"
                    type="file"
                    id="file"
                    name="file"
                    onChange={handleFile}
                />
            </div>
            <div className="prefix">
                <label
                    htmlFor="prefix"
                    className="fw-bold my-1">
                    Prefix
                </label>
                <DynamicRadio
                    items={[
                        { code: "YES", label: "Yes" },
                        { code: "NO", label: "No" },
                    ]}
                    selectedItem={prefix}
                    handleChange={value => setPrefix(value)}
                    classes={{ main: "d-flex gap-2" }}
                />
            </div>
            <button
                className={
                    disable
                        ? "button-theme opacity-50 float-end mt-2"
                        : "button-theme float-end mt-2"
                }
                title={disable ? "Select json file first" : ""}
                disabled={disable}
                onClick={() => saveData(tables)}>
                Save
            </button>
        </>
    );
};

const DeleteTabForm = props => {
    const { deleteClosure } = props;
    return (
        <>
            <div className="mb-1">
                Are you sure to delete {deleteClosure?.name} ?
            </div>
            <div className="s2a-border"></div>
            <button
                className="button-theme float-end mt-2"
                onClick={deleteClosure?.delFunc}>
                Yes
            </button>
        </>
    );
};

const ColumnConstraint = props => {
    const { column, table } = props;
    const [format, setFormat] = useState("");
    const [formatPrefix, setFormatPrefix] = useState("");
    const [selectedConstraint, setSelectedConstraint] = useState([]);
    const [selectedAction, setSelectedAction] = useState({
        unique: "",
        increment: "",
    });
    const defaultColumns = [
        "id",
        "createdby",
        "modifiedby",
        "datecreated",
        "datemodified",
    ];

    useEffect(() => {
        checkColumnStatus(column, table);
    }, []);

    const handleMark = (item, checked, code, table, column) => {
        setSelectedAction(prev => ({
            ...prev,
            [code]: checked,
        }));
        // updatedStatus(checked, code, table, column, item);
    };
    function updatedStatus() {
        updatedColumnConstraint(
            selectedAction.unique,
            table?.code,
            column?.code,
            "column.unique",
            "unique",
        );
        updatedColumnConstraint(
            selectedAction.increment,
            table?.code,
            column?.code,
            "column.auto.increment",
            "increment",
        );
        props.modalColConstraint.current.close();
    }

    async function updatedColumnConstraint(bool, table, col, operation, item) {
        const markStatus = bool ? "mark" : "unmark";

        const url = `${API_URL}?service.key=schema.${markStatus}.${operation}`;

        const req = {
            table: table,
            column: col,
            usePrefix: false,
        };
        if (markStatus && item == "increment") {
            req.prefix = formatPrefix;
            req.format = format;
        }
        // let tableItem = { code: table };

        axios.post(url, req).then(res => {
            if (res.data.C_STATUS === "SUCCESS") {
                // let selectedConstraint =[];
                // selectedConstraint.push(item);
                // setSelectedConstraint(item);
                toastEmitter(res.data.C_MESSAGE, true);
            } else {
                toastEmitter(res.data.C_MESSAGE, true, "error");
            }
        });
    }

    function checkColumnStatus(col, table) {
        const url = `${API_URL}?service.key=masterKey.tenantData`;
        const tableName = table.code;
        const req = {
            dataKeys: [
                {
                    serviceParams: tableName,
                    dataKey: "constraints",
                    serviceKey: "schema.table.column",
                    mode: "formData",
                },
            ],
        };

        axios.post(url, req).then(res => {
            if (res.data.C_STATUS === "SUCCESS") {
                const data = res.data.C_DATA.constraints;
                const selectedItem = data.find(
                    item => item.column_name === col.code,
                );

                let selectedConstraint = [];
                if (selectedItem.column_default) {
                    selectedConstraint.push("increment");
                    setSelectedAction(prev => ({
                        ...prev,
                        increment: true,
                    }));
                    setFormatPrefix(selectedItem.prefix);
                    setFormat(selectedItem.format);
                }
                if (selectedItem.constraint_type) {
                    selectedConstraint.push("unique");
                    setSelectedAction(prev => ({
                        ...prev,
                        unique: true,
                    }));
                }
                setSelectedConstraint(selectedConstraint);
            } else {
                toastEmitter(`${res.C_MESSAGE}`, true, "error");
            }
        });
    }

    function disableCheckBox(columns, selectedConstraint, code) {
        let bool = false;

        if (code === selectedConstraint) return true;

        for (let col of columns) {
            if (col === column.code) {
                bool = true;
                break;
            }
        }

        return bool;
    }

    const handleInputChange = event => {
        const { name, value } = event.target;

        if (name === "format") {
            setFormat(value);
        } else if (name === "prefix") {
            setFormatPrefix(value);
        }
    };

    return (
        <>
            <div className="col-sm-12">
                <DynamicCheckBoxs
                    items={[{ label: "Mark Unique", code: "unique" }]}
                    selectedItem={
                        selectedConstraint.includes("unique")
                            ? "unique"
                            : column["constraint"]
                    }
                    handleChange={(item, e) =>
                        handleMark(
                            item,
                            e.target.checked,
                            "unique",
                            table,
                            column,
                        )
                    }
                />
            </div>
            <div className="col-sm-12">
                <DynamicCheckBoxs
                    items={[
                        { label: "Mark Auto Increment", code: "increment" },
                    ]}
                    selectedItem={
                        selectedConstraint.includes("increment")
                            ? "increment"
                            : column["constraint"]
                    }
                    handleChange={(item, e) =>
                        handleMark(
                            item,
                            e.target.checked,
                            "increment",
                            table,
                            column,
                        )
                    }
                />
            </div>

            {selectedAction.increment && (
                <div className="row pt-3">
                    <div className="col-sm-6">
                        <div className="form-group">
                            <label>Prefix</label>
                            <input
                                type="text"
                                className="form-control"
                                name="prefix"
                                value={formatPrefix}
                                onChange={handleInputChange}></input>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="form-group">
                            <label>Format</label>
                            <input
                                type="text"
                                name="format"
                                value={format}
                                onChange={handleInputChange}
                                className="form-control"></input>
                        </div>
                    </div>
                </div>
            )}
            <div className="col-sm-12 py-2">
                <button
                    className="btn button-theme btn-sm me-2"
                    onClick={() => updatedStatus()}>
                    Ok
                </button>
                <button
                    className="btn button-theme btn-sm"
                    onClick={() => props.modalColConstraint.current.close()}>
                    Cancel
                </button>
            </div>
        </>
    );
};
