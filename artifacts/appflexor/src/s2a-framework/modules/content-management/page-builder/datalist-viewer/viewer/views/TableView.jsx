import React, {useEffect, useState} from "react";
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
        hideLabel,
        hideSearch,
        hidePagination,
        hideCheckBoxes,
        hideActions,
        hideFormDatalistLabel,
    } = props;
    const screenWidth = parentDivWidth;
    const [footer, setFooter] = useState(false);

    useEffect(() => {
            if(hideActions && hidePagination){
                setFooter(false);
            }else{
                setFooter(true);
            }
        }, [hideActions, hidePagination]);

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
                {page.length === 0 && (
                    <tr>
                        <td colSpan={headerGroups?.[0]?.headers?.length || 1} className="text-center py-4">
                            {props.emptyMessage || "No records found."}
                        </td>
                    </tr>
                )}
            </tbody>
            {footer && 
                <DatalistFooter
                    footerGroups={footerGroups}
                    notIncludeFooter={notIncludeFooter}
                />
            }
        </table>
    );
};

export default TableView;

export const DatalistHeader = props => {
    const { headerGroups, onFilterClick } = props;
    const extractHeaderText = value => {
        if (typeof value === "string" || typeof value === "number") {
            return String(value);
        }
        if (Array.isArray(value)) {
            return value.map(extractHeaderText).join(" ");
        }
        if (React.isValidElement(value)) {
            return extractHeaderText(value.props?.children);
        }
        return "";
    };

    const isActionIdentifier = value => {
        const normalized = String(value || "").trim().toLowerCase();
        return (
            /(^|[\s_-])actions?($|[\s_-])/.test(normalized) ||
            normalized.includes("action")
        );
    };

    return headerGroups.map((headerGroup, i) => {
        return (
            <thead
                className="table-header"
                key={i}>
                <tr
                    {...headerGroup.getHeaderGroupProps()}
                    key={i}>
                    {headerGroup.headers.map((column, i) => {
                        const renderedHeader = column.render("Header");
                        const renderedHeaderText = extractHeaderText(
                            renderedHeader,
                        );
                        const headerLabel =
                            typeof column?.Header === "string"
                                ? column.Header
                                : typeof column?.parent?.Header === "string"
                                  ? column.parent.Header
                                  : "";
                        const isAction = [
                            headerLabel,
                            renderedHeaderText,
                            column?.id,
                            column?.originalId,
                            column?.className,
                            typeof column?.accessor === "string"
                                ? column.accessor
                                : "",
                        ].some(isActionIdentifier);
                        return column.hideHeader === false ||
                            column.id === "selection_placeholder_0" ? null : (
                            <th
                                className={`datalist-header ${column.className}`}
                                key={i}>
                                <div className="d-flex">
                                    {!isAction && column?.parent && column.hideFilter && (
                                        <span
                                            className="me-1 column-filter cursor-pointer"
                                            onClick={() => onFilterClick(column)}>
                                            <i
                                                className={
                                                    !column.filterValue
                                                        ? "fa-solid fa-filter"
                                                        : "fa-solid fa-filter apply-filter-color"
                                                }></i>
                                        </span>
                                    )}
                                    <div
                                        className={
                                            !isAction && column.canSort
                                                ? "sortBy"
                                                : ""
                                        }
                                        {...(isAction
                                            ? column.getHeaderProps()
                                            : column.getHeaderProps(
                                                  column.getSortByToggleProps(),
                                              ))}>
                                        {renderedHeader}
                                        {/* Always-visible sort arrows */}
                                        {!isAction && column.canSort && (
                                            <span
                                                className={`s2a-sort-pair${column.isSorted ? " is-sorted" : ""}`}>
                                                <i className={`fa-solid fa-sort-up${column.isSorted && !column.isSortedDesc ? "" : ""}`}></i>
                                                <i className={`fa-solid fa-sort-down${column.isSorted && column.isSortedDesc ? "" : ""}`}></i>
                                            </span>
                                        )}
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
