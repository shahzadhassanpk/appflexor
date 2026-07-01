import React from "react";
import useScreenWidth from "../../../../../../components/custom-hooks/useScreenWidth";
import { numberFormat } from "../../../../../../utils/utils";

const TableView = props => {
    const {
        getTableProps,
        getTableBodyProps,
        page,
        prepareRow,
        footerGroups,
        notIncludeFooter,
        headerGroups,
        onFilterClick,
        titleShowingFields,
        parentDivWidth,
    } = props;

    const screenWidth = parentDivWidth;

    return (
        <table
            className="s2a-table table"
            {...getTableProps()}>
            <DatalistHeader
                headerGroups={headerGroups}
                onFilterClick={onFilterClick}
            />
            <tbody
                {...getTableBodyProps()}
                className="s2a-table-body">
                {page.map((row, i) => {
                    prepareRow(row);
                    return (
                        <tr
                            key={i}
                            className="table-row"
                            {...row.getRowProps()}>
                            {row.cells.map(cell => {
                                const db_column =
                                    typeof cell.column.Header !== "function"
                                        ? cell.column.Header
                                        : "";
                                return (
                                    <td
                                        className={
                                            db_column + " " + screenWidth > 400
                                                ? "s2a-table-data"
                                                : // ? "s2a-table-data cell-text"
                                                  "s2a-table-data"
                                        }
                                        title={
                                            titleShowingFields[
                                                cell.column.datatype
                                            ]
                                                ? cell.value
                                                : ""
                                        }
                                        {...cell.getCellProps()}
                                        data-cell={db_column}>
                                        <div className="s2a-cell">
                                            {/* {cell.column.datatype=="autoincrement"? numberFormat(parseInt(cell.value)) :cell.render("Cell")} */}
                                            {cell.render("Cell")}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
            <DatalistFooter
                footerGroups={footerGroups}
                notIncludeFooter={notIncludeFooter}
            />
        </table>
    );
};

export default TableView;

export const DatalistHeader = props => {
    const { headerGroups, onFilterClick } = props;
    return headerGroups.map((headerGroup, i) => {
        return (
            <thead
                className="table-header"
                key={i}>
                <tr
                    {...headerGroup.getHeaderGroupProps()}
                    key={i}>
                    {headerGroup.headers.map((column, i) => {
                        return column.hideHeader === false ||
                            column.id === "selection_placeholder_0" ? null : (
                            <th
                                className={`datalist-header ${column.className}`}
                                key={i}>
                                <div className="d-flex">
                                    {column &&
                                        column.parent &&
                                        column.parent.Header !== "Action" &&
                                        column.hideFilter && (
                                            <span
                                                className="me-1 column-filter cursor-pointer"
                                                onClick={() =>
                                                    onFilterClick(column)
                                                }>
                                                <i
                                                    className={
                                                        !column.filterValue
                                                            ? "fa-solid fa-filter"
                                                            : "fa-solid fa-filter apply-filter-color"
                                                    }></i>
                                            </span>
                                        )}
                                    <div
                                        className="sortBy"
                                        {...column.getHeaderProps(
                                            column.getSortByToggleProps(),
                                        )}>
                                        {column.render("Header")}
                                        {column.isSorted &&
                                            (column.isSortedDesc ? (
                                                <span className="ps-1">
                                                    <i className="fa-solid fa-sort-down"></i>
                                                </span>
                                            ) : (
                                                <span className="ps-1">
                                                    <i className="fa-solid fa-sort-up"></i>
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            </th>
                        );
                    })}
                </tr>
            </thead>
        );
    });
};

export const DatalistFooter = props => {
    const { footerGroups, notIncludeFooter } = props;

    return (
        <tfoot>
            {footerGroups.map((group, i) => {
                return (
                    <tr
                        {...group.getFooterGroupProps()}
                        key={i}>
                        {group.headers.map((column, i) => {
                            return (
                                !notIncludeFooter[column.originalId] &&
                                !notIncludeFooter[column.id] && (
                                    <td
                                        key={i}
                                        {...column.getFooterProps()}>
                                        {column.render("Footer")}
                                    </td>
                                )
                            );
                        })}
                    </tr>
                );
            })}
        </tfoot>
    );
};
