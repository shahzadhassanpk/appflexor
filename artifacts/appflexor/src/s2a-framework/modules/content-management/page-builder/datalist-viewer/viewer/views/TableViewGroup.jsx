import React, { useMemo, useState } from "react";
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
        groupBy="txn_type", // string: column id to group by
        aggregates = {}, // object: { columnId: "sum" | "avg" | "min" | "max" }
    } = props;

    const screenWidth = useScreenWidth(parentDivWidth);
    const [expandedGroups, setExpandedGroups] = useState({});

    // --- Helper: aggregate calculation ---
    const computeAggregate = (rows, columnId, fn) => {
        const values = rows
            .map(r => parseFloat(r.values[columnId]))
            .filter(v => !isNaN(v));
        if (values.length === 0) return "";

        switch (fn) {
            case "sum":
                return numberFormat(values.reduce((a, b) => a + b, 0));
            case "avg":
                return numberFormat(
                    values.reduce((a, b) => a + b, 0) / values.length,
                );
            case "min":
                return numberFormat(Math.min(...values));
            case "max":
                return numberFormat(Math.max(...values));
            default:
                return "";
        }
    };

    // --- Group rows ---
    const groupedRows = useMemo(() => {
        if (!groupBy || groupBy=="") return [{ key: "All Rows", rows: page }];
        const map = new Map();
        page.forEach(row => {
            const key = row.original[groupBy] ?? "Unknown";
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(row);
        });

        return Array.from(map.entries()).map(([key, rows]) => ({
            key,
            rows,
        }));
    }, [page, groupBy]);

    // --- Toggle collapse ---
    const toggleGroup = key => {
        setExpandedGroups(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <table className="s2a-table table" {...getTableProps()}>
            <DatalistHeader
                headerGroups={headerGroups}
                onFilterClick={onFilterClick}
            />

            <tbody {...getTableBodyProps()} className="s2a-table-body">
                {groupedRows.map((group, gi) => {
                    const isExpanded = expandedGroups[group.key] ?? true;
                    const aggValues = {};

                    // compute group aggregates
                    if (Object.keys(aggregates).length > 0) {
                        for (let colId in aggregates) {
                            aggValues[colId] = computeAggregate(
                                group.rows,
                                colId,
                                aggregates[colId],
                            );
                        }
                    }

                    return (
                        <React.Fragment key={gi}>
                            {/* Group Header */}
                            <tr
                                className="table-group-header bg-light fw-bold cursor-pointer"
                                onClick={() => toggleGroup(group.key)}>
                                <td colSpan={headerGroups[0].headers.length}>
                                    <i
                                        className={`fa-solid ${
                                            isExpanded
                                                ? "fa-chevron-down"
                                                : "fa-chevron-right"
                                        } me-2`}
                                    />
                                    {groupBy}: {group.key}{" "}
                                    <span className="text-muted">
                                        ({group.rows.length})
                                    </span>
                                </td>
                            </tr>

                            {/* Group Rows */}
                            {isExpanded &&
                                group.rows.map((row, ri) => {
                                    prepareRow(row);
                                    return (
                                        <tr key={ri} {...row.getRowProps()}>
                                            {row.cells.map((cell, ci) => {
                                                const db_column =
                                                    typeof cell.column.Header !==
                                                    "function"
                                                        ? cell.column.Header
                                                        : "";
                                                return (
                                                    <td
                                                        key={ci}
                                                        className={
                                                            db_column +
                                                            " " +
                                                            (screenWidth > 400
                                                                ? "s2a-table-data"
                                                                : "s2a-table-data")
                                                        }
                                                        title={
                                                            titleShowingFields[
                                                                cell.column
                                                                    .datatype
                                                            ]
                                                                ? cell.value
                                                                : ""
                                                        }
                                                        {...cell.getCellProps()}
                                                        data-cell={db_column}>
                                                        <div className="s2a-cell">
                                                            {cell.render("Cell")}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}

                            {/* Group Aggregate Row */}
                            {isExpanded &&
                                Object.keys(aggregates).length > 0 && (
                                    <tr className="bg-light-subtle fw-semibold text-end">
                                        {headerGroups[0].headers.map(
                                            (col, ci) => (
                                                <td key={ci}>
                                                    {aggregates[col.id]
                                                        ? aggValues[col.id]
                                                        : ""}
                                                </td>
                                            ),
                                        )}
                                    </tr>
                                )}
                        </React.Fragment>
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
                                                title={JSON.stringify(column?.filterValue)}
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
