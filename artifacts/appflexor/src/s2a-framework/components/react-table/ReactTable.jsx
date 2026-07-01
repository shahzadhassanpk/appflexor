import React, { useEffect, useState } from "react";
import { useTable, usePagination, useSortBy } from "react-table";
import "./table.css";
import Scroll from "../Scroll/Scroll";

export default function ReactTable({ data, columns, show_pagination }) {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
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
        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data,
            initialState: { pageIndex: 0 },
        },
        useSortBy,
        usePagination,
    );

    const firstPageRows = page.slice(0, pageSize);

    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    useEffect(() => {
        // Function to update the state with the current window width
        const updateScreenWidth = () => {
            setScreenWidth(window.innerWidth);
        };

        // Attach event listener for window resize
        window.addEventListener("resize", updateScreenWidth);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener("resize", updateScreenWidth);
        };
    }, []);

    if (data && data.length < 1) return;
    return (
        <>
            <div className="s2a-datalist-table">
                <table
                    className="s2a-table table"
                    {...getTableProps()}>
                    <thead className="table-header">
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => {
                                    if (column.parent === undefined) return;
                                    return (
                                        <th
                                            className={
                                                column.parent !== undefined
                                                    ? "datalist-header text-lowercase"
                                                    : "datalist-header"
                                            }
                                            {...column.getHeaderProps(
                                                column.getSortByToggleProps(),
                                            )}>
                                            <div className="flex-between">
                                                {column.render("Header")}
                                                <span className="ps-1">
                                                    {column.isSorted ? (
                                                        column.isSortedDesc ? (
                                                            <i className="fa-solid fa-sort-down"></i>
                                                        ) : (
                                                            <i className="fa-solid fa-sort-up"></i>
                                                        )
                                                    ) : (
                                                        ""
                                                    )}
                                                </span>
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
                                <tr
                                    {...row.getRowProps()}
                                    className="table-row">
                                    {row.cells.map(cell => {
                                        return (
                                            <td
                                                {...cell.getCellProps()}
                                                data-cell={cell.column.Header}>
                                                <div
                                                    title={cell.value}
                                                    className={
                                                        screenWidth > 700
                                                            ? ""
                                                            : // ? "cell-text"
                                                              ""
                                                    }>
                                                    {cell.render("Cell")}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {show_pagination && (
                <div className="d-flex gap-2 align-items-center mt-2">
                    <div className="d-flex">
                        <div
                            onClick={() => gotoPage(0)}
                            disabled={!canPreviousPage}>
                            {!canPreviousPage ? (
                                <i className="fa-solid fa-angles-left"></i>
                            ) : (
                                <i className="fa-solid fa-angles-left"></i>
                            )}
                        </div>
                        <div
                            onClick={() => previousPage()}
                            disabled={!canPreviousPage}>
                            {!canPreviousPage ? (
                                <i className="fa-solid fa-angle-left opacity-25"></i>
                            ) : (
                                <i className="fa-solid fa-angle-left"></i>
                            )}
                        </div>
                        <div
                            onClick={() => nextPage()}
                            disabled={!canNextPage}>
                            {!canNextPage ? (
                                <i className="fa-solid fa-angle-right opacity-25"></i>
                            ) : (
                                <i className="fa-solid fa-angle-right"></i>
                            )}
                        </div>
                        <div
                            onClick={() => gotoPage(pageCount - 1)}
                            disabled={!canNextPage}>
                            {!canNextPage ? (
                                <i className="fa-solid fa-angles-right opacity-25"></i>
                            ) : (
                                <i className="fa-solid fa-angles-right"></i>
                            )}
                        </div>
                    </div>
                    <div className="page-count d-flex gap-2 align-items-center">
                        <div className="page-index">
                            Page
                            <strong>
                                {pageIndex + 1} of {pageOptions.length}
                            </strong>
                        </div>
                        <div className="go-to-page d-flex gap-2 align-items-center">
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
                                style={{ width: "70px" }}
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
        </>
    );
}
