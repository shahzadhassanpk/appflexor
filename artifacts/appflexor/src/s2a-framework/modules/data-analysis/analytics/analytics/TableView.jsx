import React, { useContext, useEffect, useRef, useState } from "react";
import {
    useBlockLayout,
    usePagination,
    useSortBy,
    useTable,
    useFilters,
    useGlobalFilter,
} from "react-table";
import { useSticky } from "react-table-sticky";
import { AppContext } from "../../../../../AppContext";
import { noFormat } from "../../../../utils/utils";
import {
    AnalyticFilterModal,
    DefaultColumnFilter,
    NumberRange,
} from "./Filter/Filter";
import { matchSorter } from "match-sorter";
import { v4 as uuid } from "uuid";
import AnalyticContext from "./AnalyticsContext";
import ChildrenModal from "../../../../components/ChildrenModal/ChildrenModal";
import SelectedMeasureForm from "./Components/SelectedMeasureForm";
import Modal from "react-bootstrap/Modal";
import { Interweave } from "interweave";

function TableView() {
    const anayticContext = useContext(AnalyticContext);
    const {
        Data = [],
        config = {},
        showBtns,
        userMeasures,
        runTimeMeasures,
    } = anayticContext;

    const rawData = [
        {
            dimension: "No dimension get",
        },
    ];
    const data = Data ? Data : rawData;
    let Dimensions = config.dimensions ? config.dimensions : [];
    let Measures = userMeasures
        ? userMeasures
        : runTimeMeasures
        ? runTimeMeasures
        : config.measures;
    const appContext = useContext(AppContext);
    const { screenView } = appContext;
    const [dataColumns, setDataColumns] = useState([]);
    let _data = [...Data];

    useEffect(() => {
        filterDataColumns();
    }, []);

    useEffect(() => {
        if (runTimeMeasures) filterDataColumns();
    }, [runTimeMeasures]);

    function filterDataColumns() {
        let finalArr = [];
        let finalArrMobile = [];

        let dimensionsCol = {
            Header: "Dimensions",
            sticky: "left",
            columns: [],
        };

        let factsCol = {
            Header: "Measures",
            columns: [],
        };
        let dataKeysForDim = [];
        let dataKeysForMeasures = [];
        if (_data.length > 0 && _data !== undefined) {
            config.dimensions.forEach(dim => {
                if (dim.column === "Selected Dimensions") {
                    dataKeysForDim.push(dim.key);
                }
            });

            Measures.forEach(mea => {
                if (mea.selected === true) {
                    dataKeysForMeasures.push(mea.id);
                }
            });

            dataKeysForDim.forEach(column => {
                Dimensions &&
                    Dimensions.length > 0 &&
                    Dimensions.forEach(dimension => {
                        let checkKey = dimension["key"];
                        let checkColumn = column;
                        if (checkKey === checkColumn) {
                            let obj = {
                                Header: "",
                                accessor: "",
                                className: "",
                            };
                            obj.Header = dimension["label"];
                            obj.accessor = column;
                            obj.className = `${column} dimensions`;
                            obj.filter = "fuzzyText";
                            dimensionsCol.Header = "Dimensions";
                            dimensionsCol.columns.push(obj);
                        }
                    });
            });

            let dataMeasure = Data[0];

            dataKeysForMeasures.forEach(column => {
                dataMeasure &&
                    Measures.length > 0 &&
                    Measures.forEach(measure => {
                        if (column === measure["id"] && measure.selected) {
                            let obj = {
                                Header: "",
                                accessor: "",
                                Filter: NumberRange,
                                filter: "between",
                                Cell: cell => {
                                    let { value } = cell;
                                    value =
                                        typeof value === "string"
                                            ? parseFloat(value)
                                            : value;
                                    return noFormat(value, 2);
                                },
                            };
                            obj.id = uuid();
                            obj.Header =
                            measure.method == "percentile"
                            ? measure["percentile_percentage"] +
                              "<sup>th</sup>_" +
                              measure["label"]
                            : measure["label"]
                                // measure.method == "percentile"                                  
                                    // ? measure["label"] +
                                    //   "_" +
                                    //   measure["percentile_percentage"] +
                                    //   "th"
                                    // : measure["label"];
                            try {
                                obj.accessor = measure["formula"]
                                    ?.split("as")[1]
                                    ?.trim()
                                    ?.toLowerCase();
                            } catch (e) {}
                            if (!obj.accessor) {
                                obj.accessor = measure["formula"]
                                    ?.split("AS")[1]
                                    ?.trim()
                                    ?.toLowerCase();
                            }

                            obj.className = `${measure["label"]} facts`;
                            obj.ref_id = measure.id;
                            factsCol.Header = "Measures";
                            factsCol.columns.push(obj);
                        }
                        // if (finalChar === key) {
                        // }
                    });
            });

            var result = factsCol.columns.reduce((unique, o) => {
                if (
                    !unique.some(
                        obj =>
                            obj.Header === o.Header &&
                            obj.accessor === o.accessor,
                    )
                ) {
                    unique.push(o);
                }
                return unique;
            }, []);

            factsCol.columns = [];
            factsCol.columns = result;

            finalArr.push(dimensionsCol);
            finalArr.push(factsCol);
            setDataColumns(finalArr);
            return finalArrMobile;
        }
    }

    return screenView === "lg" ? (
        dataColumns.length > 0 &&
            data !== undefined &&
            data.length > 0 &&
            [] && (
                <PivotTable
                    columns={dataColumns}
                    data={data}
                    showBtns={showBtns}
                    useSticky={useSticky}
                    useBlockLayout={useBlockLayout}
                    userMeasures={userMeasures}
                />
            )
    ) : (
        <PivotTable
            columns={dataColumns}
            data={data}
            showBtns={showBtns}
            useSticky=""
            useBlockLayout=""
            userMeasures={userMeasures}
        />
    );
}
function fuzzyTextFilterFn(rows, id, filterValue) {
    return matchSorter(rows, filterValue, { keys: [row => row.values[id]] });
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = val => !val;
function PivotTable(props) {
    const { columns, data, showBtns, useSticky, useBlockLayout, userMeasures } =
        props;

    const filterTypes = React.useMemo(
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

    const defaultColumn = React.useMemo(
        () => ({
            // Let's set up our default Filter UI
            Filter: DefaultColumnFilter,
        }),
        [],
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        // rows,
        prepareRow,
        page,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data,
            initialState: { pageIndex: 0 },
            defaultColumn,
            filterTypes,
        },
        useSticky,
        useBlockLayout,
        useFilters,
        useGlobalFilter,
        useSortBy,
        usePagination,
    );
    const firstPageRows = page.slice(0, pageSize);
    const [col, setCol] = useState(null);
    const [selectedMeasure, setSelectedMeasure] = useState({});
    const [modalHeader, setModalHeader] = useState("");
    const modalRef = useRef(null);
    const handleEdit = column => {
        var selectedMeasure = userMeasures.find(
            item => item.id === column.ref_id,
        );
        if (modalRef.current) {
            modalRef.current.show();
            setModalHeader(column.Header);
            // selectedMeasure.method = _method;
            setSelectedMeasure(selectedMeasure);
        }
    };
    const [show, setShow] = useState(false);

    const openModal = column => {
        setCol(column);
        setShow(true);
        // setTimeout(() => {
        //     $(`a${column.id}`).modal("show");
        // }, 0);
    };

    return (
        <div className="table-container s2a-tableview">
            {
                <ChildrenModal
                    ref={modalRef}
                    header={modalHeader}>
                    <SelectedMeasureForm
                        modalRef={modalRef}
                        measure={selectedMeasure}
                        tableSave={true}
                    />
                </ChildrenModal>
            }
            {col && (
                <StaticModal
                    show={show}
                    handleClose={() => setShow(false)}
                    header={col}
                    id={col?.id}
                    dataListLabel={col?.Header}
                    column={col}
                />
            )}

            <div className="analytic-table-wrapper enable-scroll">
                <table
                    className="s2a-table mb-1"
                    {...getTableProps()}>
                    <thead className="s2a-table-thead">
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => {
                                    return (
                                        <th
                                            {...column.getHeaderProps()}
                                            className={`${
                                                column.Header === "Dimensions"
                                                    ? "Dimensions"
                                                    : column.Header ===
                                                      "Measures"
                                                    ? "Measures"
                                                    : column.className
                                            }`}>
                                            <div className="d-flex justify-content-between">
                                                <div
                                                    {...column.getSortByToggleProps()}
                                                    title={column.Header}
                                                    className="text-truncate">
                                                   <Interweave content={column.render("Header")}/>
                                                </div>

                                                {column.isSorted ? (
                                                    column.isSortedDesc ? (
                                                        <span className="fa-solid fa-sort-down"></span>
                                                    ) : (
                                                        <span className="fa-solid fa-sort-up"></span>
                                                    )
                                                ) : (
                                                    ""
                                                )}
                                                {column &&
                                                    column.parent !==
                                                        undefined && (
                                                        <>
                                                            {column.className.includes(
                                                                "dimensions",
                                                            ) ? (
                                                                <span
                                                                    id="modalbtn"
                                                                    className={`pt-1 fa-solid fa-filter ps-2 ${
                                                                        column.filterValue ===
                                                                        undefined
                                                                            ? ""
                                                                            : "filter-apply"
                                                                    }`}
                                                                    onClick={() =>
                                                                        openModal(
                                                                            column,
                                                                        )
                                                                    }
                                                                    // data-bs-toggle="modal"
                                                                    // data-bs-target={`#a${column.id}`}
                                                                ></span>
                                                            ) : (
                                                                <span
                                                                    className="fa fa-pencil ps-2 pt-1"
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            column,
                                                                        )
                                                                    }></span>
                                                            )}
                                                        </>
                                                    )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {firstPageRows.map((row, i) => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => {
                                        let parsedValue = parseInt(cell.value);
                                        if (parsedValue) {
                                            cell.value = noFormat(parsedValue);
                                        }
                                        return (
                                            <td
                                                className={`w-100 text-truncate ${cell.column.className}`}
                                                {...cell.getCellProps()}
                                                data-cell={cell.column.Header}>
                                                {cell.render("Cell")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {showBtns && (
                <div className="pagination">
                    <div className="pagination-btn">
                        <div
                            className="pe-1"
                            onClick={() => gotoPage(0)}
                            s
                            disabled={!canPreviousPage}
                            title="First Page">
                            {!canPreviousPage ? (
                                <i className="fa-solid fa-angles-left"></i>
                            ) : (
                                <i className="fa-solid fa-angles-left goto-enabled"></i>
                            )}
                        </div>
                        <div
                            className="pe-1"
                            onClick={() => previousPage()}
                            disabled={!canPreviousPage}
                            title="Previous Page">
                            {!canPreviousPage ? (
                                <i className="fa-solid fa-angle-left opacity-25"></i>
                            ) : (
                                <i className="fa-solid fa-angle-left goto-enabled"></i>
                            )}
                        </div>
                        <div className="page-index pe-1">
                            <strong>
                                {pageIndex + 1} of {pageOptions.length}
                            </strong>
                        </div>
                        <div
                            className="pe-1"
                            onClick={() => nextPage()}
                            title="Next Page"
                            disabled={!canNextPage}>
                            {!canNextPage ? (
                                <i className="fa-solid fa-angle-right opacity-25"></i>
                            ) : (
                                <i className="fa-solid fa-angle-right goto-enabled"></i>
                            )}
                        </div>
                        <div
                            className="pe-1"
                            onClick={() => gotoPage(pageCount - 1)}
                            title="Last Page"
                            disabled={!canNextPage}>
                            {!canNextPage ? (
                                <i className="fa-solid fa-angles-right opacity-25"></i>
                            ) : (
                                <i className="fa-solid fa-angles-right goto-enabled"></i>
                            )}
                        </div>
                    </div>
                    <div className="page-count">
                        <div className="go-to-page">
                            Page:
                            <input
                                type="number"
                                defaultValue={pageIndex + 1}
                                onChange={e => {
                                    const page = e.target.value
                                        ? Number(e.target.value) - 1
                                        : 0;
                                    gotoPage(page);
                                }}
                                className="form-control"
                            />
                        </div>
                        <div className="page-select">
                            <select
                                value={pageSize}
                                onChange={e => {
                                    setPageSize(Number(e.target.value));
                                }}
                                className="form-select">
                                {[5, 10, 20, 30, 40, 50, 100].map(pageSize => (
                                    <option
                                        key={pageSize}
                                        value={pageSize}>
                                        {pageSize}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TableView;

function StaticModal(props) {
    const { dataListLabel, show, handleClose, column } = props;
    return (
        <Modal
            className="s2a-modal"
            show={show}
            onHide={handleClose}
            backdrop="static">
            {/* <Modal.Header closeButton>
                <Modal.Title>{dataListLabel}</Modal.Title>
            </Modal.Header> */}
            <Modal.Header>
                <Modal.Title
                    className="modal-title"
                    title={dataListLabel}>
                    <span className="header text-truncate">
                        {dataListLabel}
                    </span>
                    <i
                        className="fa-solid fa-xmark modal-close"
                        onClick={handleClose}></i>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {column.canFilter && column.render("Filter")}
            </Modal.Body>
        </Modal>
    );
}
