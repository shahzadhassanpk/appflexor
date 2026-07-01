import React from "react";

const Pagination = props => {
    const {
        gotoPage,
        canPreviousPage,
        previousPage,
        pageOptions,
        pageIndex,
        canNextPage,
        nextPage,
        pageCount,
        pageSize,
        setPageSize,
        pageArray,
    } = props;
    return (
        <div className="pagination">
            <div className="pagination-btn">
                <div
                    className="pe-1"
                    onClick={() => gotoPage(0)}
                    disabled={!canPreviousPage}>
                    {!canPreviousPage ? (
                        <i className="fa-solid fa-angles-left opacity-25"></i>
                    ) : (
                        <i className="fa-solid fa-angles-left goto-enabled"></i>
                    )}
                </div>
                <div
                    className="pe-1"
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}>
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
                        {pageArray.map((pageSize, i) => (
                            <option
                                key={i}
                                value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
export default Pagination;
