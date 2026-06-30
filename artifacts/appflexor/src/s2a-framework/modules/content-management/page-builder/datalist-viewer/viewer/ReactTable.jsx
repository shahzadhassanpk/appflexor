import React, { useState, useMemo, useEffect, useRef } from "react";
import { matchSorter } from "match-sorter";
import {
    useTable,
    usePagination,
    useSortBy,
    useFilters,
    useGlobalFilter,
    useRowSelect,
} from "react-table";
import {
    DefaultColumnFilter,
    jsonExportAll,
} from "../datalist-filter-helpers/DatalistFilters";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import {
    multiDelete,
    selectedJsonExport,
} from "../datalist-filter-helpers/DatalistFilters";
import DatalistActionsButtons from "./components/DatalistActionsButtons";
import { datalistDataTypes } from "../datalist-filter-helpers/DatalistFilters";
import ChildrenModal from "../../../../../components/ChildrenModal/ChildrenModal";
import { JsonToCsv } from "../../../../../utils/utils";
import TableView from "./views/TableView";
import useScreenWidth from "../../../../../components/custom-hooks/useScreenWidth";
import { initialPages, notIncludeKeys } from "./variables/VARIABLES";
import GalleryView from "./views/GalleryView";
import Pagination from "./components/Pagination";
import ListingView from "./views/ListingView";
import { modeType } from "../../Designer/Designer";
import { getData, handleSave } from "../../../../../components/CrudApiCall";
import axios from "axios";
import { API_URL } from "../../../../../Config";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import { Col, Container, Form, Row } from "react-bootstrap";
import SearchInput from "../../Designer/components/Waap/components/SearchInput";

const IndeterminateCheckbox = React.forwardRef(
    ({ indeterminate, ...rest }, ref) => {
        const defaultRef = React.useRef();
        const resolvedRef = ref || defaultRef;

        React.useEffect(() => {
            resolvedRef.current.indeterminate = indeterminate;
        }, [resolvedRef, indeterminate]);

        return (
            <>
                <input
                    className="form-check-input"
                    type="checkbox"
                    ref={resolvedRef}
                    {...rest}
                />
            </>
        );
    },
);

function fuzzyTextFilterFn(rows, id, filterValue) {
    return matchSorter(rows, filterValue, { keys: [row => row.values[id]] });
}

fuzzyTextFilterFn.autoRemove = val => !val;

export default function ReactTable({
    columns,
    data,
    flag,
    setViewerBtn,
    setFlag,
    setSelectedRowsLength,
    selectedItem,
    selectedObject,
    updateMyData,
    EditableCell,
    deleteAllAction,
    selectedExportAction,
    resetAllFiltersAction,
    handleListEdit,
    handleAddNewAction,
    viewerBtnAction,
    setViewerBtnAction,
    apiResponse,
    dataKey,
    setDataKeys,
    mode,
}) {
    const currentDivRef = useRef(null);
    const [currentDivWidth, setCurrentDivWidth] = useState(0);
    const lookupModalRef = useRef(null);
    const [lookupOptions, setLookupOptions] = useState([]);
    const [selectedLookupIds, setSelectedLookupIds] = useState([]);
    const [selectedBulkActionId, setSelectedBulkActionId] = useState({});
    const [searchBulkAction, setSearchBulkAction] = useState("");
    const bulkActions = selectedItem?.layout?.actions?.filter(
        action => action?.selected && action?.type === "bulk",
    );
    const selectedBulkAction = bulkActions?.find(
        bulkAction => bulkAction.code === selectedBulkActionId,
    );

    useEffect(() => {
        // console.log(currentDivRef.current.offsetWidth)
        setCurrentDivWidth(currentDivRef.current.offsetWidth);
    }, []);

    const notIncludeFooter = {
        Action: true,
        selection_placeholder_0: true,
        "Table Data": true,
    };
    const datalistType = selectedItem.datalist_type;
    const defaultColumn = useMemo(
        !datalistType || datalistType === "TABLE"
            ? () => ({
                  // Let's set up our default Filter UI
                  Filter: DefaultColumnFilter,
              })
            : () => ({
                  // Let's set up our default Filter UI
                  Filter: DefaultColumnFilter,
                  Cell: EditableCell,
              }),
        [datalistType, mode],
    );
    const filterTypes = useMemo(
        () => ({
            // Add a new fuzzyTextFilterFn filter type.
            fuzzyText: fuzzyTextFilterFn,
            // Or, override the default text filter to use
            // "startWith"
            text: (rows, id, filterValue) => {
                return rows.filter(row => {
                    const rowValue = row.values[id];
                    return rowValue !== undefined
                        ? String(rowValue)
                              .toLowerCase()
                              .startsWith(String(filterValue).toLowerCase())
                        : true;
                });
            },
        }),
        [],
    );

    function fuzzyTextFilterFn(rows, id, filterValue) {
        return matchSorter(rows, filterValue, {
            keys: [row => row.values[id]],
        });
    }

    const regexGlobalFilter = (rows, columnIds, filterValue) => {
        if (!filterValue) return rows;

        try {
            const regex = new RegExp(filterValue, "gi"); // 'i' flag for case-insensitive matching

            const filterRows = rows.filter(row => {
                return columnIds.some(columnId => {
                    const cellValue = row.values[columnId];
                    const bool = regex.test(String(cellValue));
                    return bool;
                });
            });
            // console.log(filterRows);
            return filterRows;
        } catch (e) {
            return rows; // Return all rows if regex is invalid
        }
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        footerGroups,
        rows,
        prepareRow,
        page, // Instead of using 'rows', we'll use page,
        // which has only the rows for the active page

        // The rest of these things are super handy, too ;)
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        selectedFlatRows,
        visibleColumns,
        preGlobalFilteredRows,
        setGlobalFilter,
        state: { pageIndex, pageSize, globalFilter, selectedRowIds },
        ...setAllFilters
    } = useTable(
        {
            columns,
            data,
            globalFilter: regexGlobalFilter,
            initialState: { pageIndex: 0, pageSize: 10 },
            defaultColumn,
            updateMyData,
            filterTypes,
            autoResetPage: false,
            autoResetFilters: false,
            autoResetSortBy: false,
            autoResetGlobalFilter: false,
        },
        useFilters, // useFilters!
        useGlobalFilter, // useGlobalFilter!
        useSortBy,
        usePagination,
        useRowSelect,
        hooks => {
            if (flag && flag.allowall === true) {
                hooks.visibleColumns.push(columns => [
                    // Let's make a column for selection
                    {
                        id: "selection",
                        // The header can use the table's getToggleAllRowsSelectedProps method
                        // to render a checkbox
                        Header: ({ getToggleAllRowsSelectedProps }) => (
                            <div>
                                {mode === modeType.render && (
                                    <IndeterminateCheckbox
                                        {...getToggleAllRowsSelectedProps()}
                                    />
                                )}
                            </div>
                        ),
                        // The cell can use the individual row's getToggleRowSelectedProps method
                        // to the render a checkbox
                        Cell: ({ row }) => (
                            <div>
                                {mode === modeType.render && (
                                    <IndeterminateCheckbox
                                        {...row.getToggleRowSelectedProps()}
                                    />
                                )}
                            </div>
                        ),
                    },
                    ...columns,
                ]);
            }
        },
    );
    const [pageArray, setPageArray] = useState(initialPages);
    const screenWidth = useScreenWidth();

    const filterRef = useRef(null);
    const [filterCol, setFilterCol] = useState({});
    let message;
    const titleShowingFields = {};

    useEffect(() => {
        footerGroups.map((column, index) => {
            if (
                !notIncludeFooter[column.originalId] &&
                !notIncludeFooter[column.id]
            ) {
                // console.log(
                //     index + "***********************" + column.originalId,
                // );
            }
        });

        // {footerGroups.map((group, i) => {
        //     return (
        //         <tr
        //             {...group.getFooterGroupProps()}
        //             key={i}>
        //             {group.headers.map((column, i) => {
        //                 return (
        //                     !notIncludeFooter[column.originalId] &&
        //                     !notIncludeFooter[column.id] && (
        //                         <td
        //                             key={i}
        //                             {...column.getFooterProps()}>

        //                             {column.render("Footer")}
        //                         </td>
        //                     )
        //                 );
        //             })}
        //         </tr>
        //     );
        // })}
    }, [data]);

    useEffect(() => {
        setViewerBtn(pre => ({
            ...pre,
            preGlobalFilteredRows: preGlobalFilteredRows,
            globalFilter: globalFilter,
            setGlobalFilter: setGlobalFilter,
            selectedFlatRows: selectedFlatRows || [],
        }));

        const keysArr = Object.keys(datalistDataTypes);
        keysArr.forEach(key => {
            if (!notIncludeKeys.includes(key)) {
                titleShowingFields[key] = true;
            }
        });
    }, []);

    useEffect(() => {
        if (rows && rows.length) {
            setSelectedRowsLength(rows.length);
        } else {
            setSelectedRowsLength(0);
        }
    }, [rows]);

    useEffect(() => {
        if (flag.defaultpage) {
            updateDefaultPage();
        }

        if (flag && flag.deleteAll === true) {
            deleteAll();
            setFlag(prev => ({
                ...prev,
                deleteAll: false,
            }));
        }
        if (flag && flag.exportAll === true) {
            // const actions = flag.actions;
            // const exportAction = actions.find(item => item.code === "export");
            const exportAction = selectedItem?.datalist_export_type;
            if (exportAction === "JSON") {
                // if (exportAction.json_export === true) {
                const arr =
                    selectedFlatRows &&
                    selectedFlatRows.map(item => item?.original);
                JsonToCsv(arr, selectedItem.name);
            } else {
                selectedExport(selectedFlatRows, flag);
            }
            setFlag(prev => ({
                ...prev,
                exportAll: false,
            }));
        }
        if (flag && flag.reset === true) {
            resetFilters();
            setFlag(prev => ({
                ...prev,
                reset: false,
            }));
        }
    }, [flag.defaultpage, flag.deleteAll, flag.exportAll, flag.reset]);

    function updateDefaultPage() {
        let defaultPage = flag.defaultpage ? parseInt(flag.defaultpage) : "";
        if (!defaultPage) {
            defaultPage = 10;
        }
        let index = pageArray.indexOf(defaultPage);
        if (index === -1) {
            pageArray.push(defaultPage);
            setPageArray(pageArray.sort((a, b) => a - b));
        }
        setPageSize(defaultPage);
    }

    function deleteAll() {
        if (selectedFlatRows && selectedFlatRows.length === 0) {
            return toastEmitter("Select record first", true, "warning");
        } else if (selectedFlatRows.length > 0) {
            multiDelete(selectedFlatRows, flag);
        }
    }

    function selectedExport() {
        if (flag.allowall === true) {
            if (selectedFlatRows && selectedFlatRows.length === 0) {
                return toastEmitter("Select record first", true, "warning");
            } else if (selectedFlatRows.length > 0) {
                selectedJsonExport(selectedFlatRows, flag);
            }
        } else {
            jsonExportAll(data, columns, selectedItem.name);
        }
    }

    function resetFilters() {
        setAllFilters.setAllFilters([]);
        // let column = { filters: "reset" };
        // DefaultColumnFilter(column);
    }

    const onFilterClick = column => {
        setFilterCol(column);
        filterRef.current.show();
    };
    // somewhere at you code

    const checkApiResponseOrData = () => {
        let length = 0;
        let showDatalist = false;
        let _message = "";
        const notFound = (
            <>
                <i className="fa-solid fa-magnifying-glass search__icon"></i>
                <h2>No Record Found</h2>
                <p>Try changing the filters or search terms for this view.</p>
            </>
        );
        if (apiResponse === "resolve") {
            length = data ? data.length : 0;
            if (length > 0 && page.length === 0) {
                showDatalist = false;

                _message = notFound;
            } else if (length === 0 && page.length === 0) {
                // table not exist
                _message = notFound;

                showDatalist = false;
            } else {
                _message = notFound;

                showDatalist = true;
            }
        } else if (apiResponse === "pending") {
            _message = "Loading please wait...";
        } else if (apiResponse === "failed") {
            showDatalist = true;
            _message = notFound;
        }

        message = _message;
        return showDatalist;
    };

    const Gallery = (
        <>
            {/* <div className="s2a-gallery-header">
                <Header
                    headerGroups={headerGroups}
                    onFilterClick={onFilterClick}
                />
            </div> */}
            <GalleryView
                page={page}
                prepareRow={prepareRow}
                titleShowingFields={titleShowingFields}
                screenWidth={screenWidth}
                columns={selectedItem?.gallery_columns}
                datalist_type={selectedItem?.datalist_type}
            />
        </>
    );

    const Table = (
        <TableView
            parentDivWidth={currentDivWidth}
            getTableProps={getTableProps}
            getTableBodyProps={getTableBodyProps}
            page={page}
            prepareRow={prepareRow}
            screenWidth={screenWidth}
            headerGroups={headerGroups}
            onFilterClick={onFilterClick}
            footerGroups={footerGroups}
            notIncludeFooter={notIncludeFooter}
            titleShowingFields={titleShowingFields}
        />
    );

    const Listing = (
        <ListingView
            page={page}
            prepareRow={prepareRow}
            handleListEdit={handleListEdit}
            titleShowingFields={titleShowingFields}
            screenWidth={screenWidth}
            columns={selectedItem?.gallery_columns}
            datalist_type={selectedItem?.datalist_type}
            selectedObject={selectedObject}
        />
    );

    const RenderView = selectedItem => {
        const viewMap = {
            GALLERY: Gallery,
            TABLE: Table,
            "EDITABLE-GRID": Table,
            LIST: Listing,
        };

        let view = selectedItem["view"];

        if (!view) {
            view = selectedItem["datalist_type"];
        }

        return viewMap[view];
    };

    const executeBulkAction = async (bulkAction, isLookupSubmit) => {
        // comma for multiple value seperation and semi colon for column seperation
        console.log(bulkAction, selectedFlatRows);
        if (!selectedFlatRows.length) {
            return toastEmitter("No Master Item Selected", true, "error");
        }
        setSelectedBulkActionId(bulkAction.code);
        const {
            enableLookup,
            enableStatic,
            options,
            valueExpression,
            triggerServiceKey,
            hyper_parameters: hyper_parameters,
            serviceKey,
            mapLabel,
            mapValue,
            selectionOrder,
        } = bulkAction;

        if (enableLookup && !isLookupSubmit) {
            lookupModalRef.current.show();

            if (enableStatic === "STATIC") {
                setLookupOptions(options);
            } else {
                try {
                    const response = await getData({
                        url: API_URL + "?service.key=multiKey.data",
                        keys: [
                            {
                                serviceKey,
                                dataKey: serviceKey,
                            },
                        ],
                    });
                    if (response?.data?.C_STATUS === "SUCCESS") {
                        const data = response?.data?.C_DATA[serviceKey];

                        const _data = data.map(option => {
                            return {
                                label: option[mapLabel],
                                value: option[mapValue],
                            };
                        });
                        setLookupOptions(_data);
                    } else {
                        toastEmitter("Failed to fetch options", true, "error");
                        setLookupOptions([]);
                    }
                } catch (error) {
                    console.log(error);
                    toastEmitter("Failed to fetch options", true, "error");
                    setLookupOptions([]);
                }
            }
            return;
        }

        const url = `${API_URL}?service.key=update.formData`;
        const request = {
            datasource: "",
            data: [],
        };
        let master_params = "";
        let lookup_params = "";
        let temp_params = "";

        selectedFlatRows.forEach((selectedRow, index) => {
            const data = selectedRow.original;

            const isLastItem = index + 1 === selectedFlatRows.length;
            const seperater = isLastItem ? "" : ",";
            master_params += `'${data["id"]}'` + seperater;
        });

        selectedLookupIds.forEach((lookupId, index) => {
            const isLastItem = index + 1 === selectedLookupIds.length;
            const seperater = isLastItem ? "" : ",";
            lookup_params += `'${lookupId}'` + seperater;
        });

        temp_params = master_params;

        if (selectionOrder === "LOOKUP_FIRST") {
            master_params = lookup_params;
            lookup_params = temp_params;
        }

        request.data = [
            {
                action: "trigger",
                id: "na",
                executeUpdate: triggerServiceKey.split(";").map(serviceKey => ({
                    serviceKey: serviceKey,
                    serviceParams: valueExpression || "",
                    PARAM_IN_1: master_params,
                    PARAM_IN_2: lookup_params,
                })),
            },
        ];

        // console.log(request);

        try {
            await axios.post(url, request);
        } catch (error) {
            console.log(error);
            toastEmitter("Failed to trigger action", true, "error");
        } finally {
            lookupModalRef.current.close();
        }
    };

    const handleLookupSelection = option => {
        const exist = selectedLookupIds.find(id => id === option?.value);

        if (exist) {
            setSelectedLookupIds(prev =>
                prev.filter(id => id !== option?.value),
            );
        } else {
            setSelectedLookupIds(prev => [...prev, option?.value]);
        }
    };

    const handleLookupSingleSelection = option => {
        setSelectedLookupIds([option.value]);
    };

    const resetCallback = () => {
        setSelectedLookupIds([]);
        setSelectedBulkActionId("");
        setSearchBulkAction("");
        setLookupOptions([]);
    };

    return (
        <div
            ref={currentDivRef}
            className="table-container s2a-react-table">
            <ChildrenModal
                ref={lookupModalRef}
                resetCallback={resetCallback}
                header="Lookup Options">
                <div>
                    {/* lookup
                    <pre>
                        <code>
                            {JSON.stringify(selectedBulkAction, null, 2)}
                            {JSON.stringify(selectedLookupIds, null, 2)}
                        </code>
                    </pre> */}
                    <div className="px-2">
                        <SearchInput
                            onChange={e => setSearchBulkAction(e.target.value)}
                        />
                    </div>
                    <Container>
                        {lookupOptions
                            .filter(option =>
                                option.label
                                    .toLowerCase()
                                    .includes(searchBulkAction.toLowerCase()),
                            )
                            ?.map(option => (
                                <Row
                                    onClick={
                                        selectedBulkAction?.selectionType ===
                                        "MULTIPLE"
                                            ? () =>
                                                  handleLookupSelection(option)
                                            : () =>
                                                  handleLookupSingleSelection(
                                                      option,
                                                  )
                                    }>
                                    <Col>
                                        <div className="d-flex flex-row align-items-center gap-2 mb-2 ">
                                            <Form.Check // prettier-ignore
                                                type={
                                                    selectedBulkAction?.selectionType ===
                                                    "MULTIPLE"
                                                        ? "checkbox"
                                                        : "radio"
                                                }
                                                name="label"
                                                value={option?.value}
                                                checked={selectedLookupIds?.some(
                                                    id => id === option?.value,
                                                )}
                                            />
                                            <span>{option?.label}</span>
                                        </div>
                                    </Col>
                                </Row>
                            ))}

                        <button
                            onClick={() =>
                                executeBulkAction(selectedBulkAction, true)
                            }
                            className="btn btn-sm button-theme float-end">
                            Ok
                        </button>
                    </Container>
                </div>
            </ChildrenModal>
            <div className="table-wrap enable-scroll">
                <ChildrenModal
                    ref={filterRef}
                    size="md"
                    header={
                        filterCol && filterCol.accessor
                            ? ` Filter ${selectedItem.title} by ${filterCol?.Header}`
                            : "filter"
                    }>
                    {filterCol && filterCol.canFilter
                        ? filterCol.render("Filter")
                        : null}
                </ChildrenModal>

                {/* <button onClick={() => resetFilters()}>Reset</button>; */}
                {checkApiResponseOrData() ? (
                    RenderView(selectedItem)
                ) : (
                    <DatalistNotification message={message} />
                )}
            </div>
            {mode === modeType.render && (
                <div className="datalist-footer flex-between flex-wrap">
                    <div className="s2a-datalist-actions">
                        <DatalistActionsButtons
                            deleteAll={deleteAllAction}
                            selectedExport={selectedExportAction}
                            resetAllFilters={resetAllFiltersAction}
                            flag={flag}
                            handleAddNew={handleAddNewAction}
                            viewerBtn={viewerBtnAction}
                            setViewerBtn={setViewerBtnAction}
                            bulkActions={bulkActions}
                            executeBulkAction={executeBulkAction}
                        />
                    </div>
                    <div className="s2a-datalist-pagination">
                        {flag.pagination === true && (
                            <Pagination
                                gotoPage={gotoPage}
                                canPreviousPage={canPreviousPage}
                                previousPage={previousPage}
                                pageOptions={pageOptions}
                                pageIndex={pageIndex}
                                canNextPage={canNextPage}
                                nextPage={nextPage}
                                pageCount={pageCount}
                                pageSize={pageSize}
                                setPageSize={setPageSize}
                                pageArray={pageArray}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function DatalistNotification(props) {
    const { message } = props;

    return (
        <div className="fallback__datalist">
            {message === "Loading please wait..." && (
                <div
                    className="spinner-border"
                    role="status"></div>
            )}
            {message}
        </div>
    );
}
