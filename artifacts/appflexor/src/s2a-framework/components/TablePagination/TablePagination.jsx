import React, { useState, useEffect, useContext, useRef } from "react";
import Pagination from "rc-pagination";
import "./TablePagination.css";

function TablePagination({ size, setSize, current, setCurrent, tableData }) {
    const PerPageChange = value => {
        setSize(value);
        const newPerPage = Math.ceil(tableData.length / value);
        if (current > newPerPage) {
            setCurrent(newPerPage);
        }
    };

    const initialPages = [5, 10, 20, 30, 40, 50, 100];
    const [pageArray, setPageArray] = useState(initialPages);

    const PaginationChange = (page, pageSize) => {
        setCurrent(page);
        setSize(pageSize);
    };

    const PrevNextArrow = (current, type, originalElement) => {
        if (type === "prev") {
            return (
                <button>
                    <i className="fa fa-angle-double-left"></i>
                </button>
            );
        }
        if (type === "next") {
            return (
                <button>
                    <i className="fa fa-angle-double-right"></i>
                </button>
            );
        }
        return originalElement;
    };

    return (
        <React.Fragment>
            <div
                id="table-pagination"
                className="card my-2">
                <div className="card-body p-1">
                    <div className="table-filter-info d-flex">
                        <div className="col-sm-2" style={{ marginLeft: "auto" }}>
                            <select                                
                                value={size}
                                onChange={e => {
                                    setSize(Number(e.target.value));
                                }}
                                className="form-select">
                                {pageArray.map((pageSize, i) => (
                                    <option
                                        key={i}
                                        value={pageSize}>
                                        {pageSize}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Pagination
                            className="pagination-data"
                            style={{ marginLeft: "auto" }}
                            showTotal={(total, range) =>
                                `Page ${range[0]}-${range[1]} of ${total}`
                            }
                            onChange={PaginationChange}
                            total={tableData && tableData.length}
                            current={current}
                            pageSize={size}
                            showSizeChanger={true}
                            itemRender={PrevNextArrow}
                            onShowSizeChange={PerPageChange}
                            showTitle={false}
                        />
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export { TablePagination };
