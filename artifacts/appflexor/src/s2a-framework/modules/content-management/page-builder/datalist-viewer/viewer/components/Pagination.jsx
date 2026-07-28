import React from "react";

const Pagination = ({
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
    totalRows,
}) => {
    const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
    const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

    const getVisiblePages = () => {
        const total = pageOptions.length;
        if (total === 0) return [];
        if (total <= 6) return pageOptions.map(i => i);

        const pages = new Set([
            0,
            total - 1,
            pageIndex,
            pageIndex - 1,
            pageIndex + 1,
        ].filter(p => p >= 0 && p < total));

        return Array.from(pages).sort((a, b) => a - b);
    };

    const pages = getVisiblePages();

    return (
        <div className="s2a-dl-pagination">
            {/* Showing X–Y of Z */}
            <span className="s2a-dl-pag-info">
                Showing {startRow}–{endRow} of {totalRows}
            </span>

            {/* Rows per page */}
            <div className="s2a-dl-pag-rows">
                <span>Rows:</span>
                <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}>
                    {pageArray.map(ps => (
                        <option key={ps} value={ps}>{ps}</option>
                    ))}
                </select>
            </div>

            {/* Navigation */}
            <div className="s2a-dl-pag-nav">
                <button
                    className="s2a-dl-pag-prev"
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}>
                    <i className="fa-solid fa-angle-left"></i> Previous
                </button>

                {pages.map((p, idx) => {
                    const prevP = pages[idx - 1];
                    return (
                        <React.Fragment key={p}>
                            {prevP !== undefined && p - prevP > 1 && (
                                <span className="s2a-dl-pag-ellipsis">…</span>
                            )}
                            <button
                                className={`s2a-dl-pag-num${p === pageIndex ? " s2a-pag-active" : ""}`}
                                onClick={() => gotoPage(p)}>
                                {p + 1}
                            </button>
                        </React.Fragment>
                    );
                })}

                <button
                    className="s2a-dl-pag-next"
                    onClick={() => nextPage()}
                    disabled={!canNextPage}>
                    Next <i className="fa-solid fa-angle-right"></i>
                </button>
            </div>
        </div>
    );
};

export default Pagination;
