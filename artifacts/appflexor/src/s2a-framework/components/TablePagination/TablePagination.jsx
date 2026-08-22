import React from "react";
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

    const pageArray = [5, 10, 20, 30, 40, 50, 100];

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
                    <div className="table-filter-info">
                        <label className="table-page-size">
                            <span>Rows per page</span>
                            <select
                                value={size}
                                onChange={e => PerPageChange(Number(e.target.value))}
                                className="form-select">
                                {pageArray.map((pageSize, i) => (
                                    <option
                                        key={i}
                                        value={pageSize}>
                                        {pageSize}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Pagination
                            className="pagination-data"
                            showTotal={(total, range) =>
                                `Showing ${range[0]}-${range[1]} of ${total}`
                            }
                            onChange={PaginationChange}
                            total={tableData && tableData.length}
                            current={current}
                            pageSize={size}
                            showSizeChanger={false}
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
