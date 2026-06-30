import React from "react";
import ReactTable from "./ReactTable";

export default function TableWrapper({
    data,
    actionsRequired,
    tableName,
    callBackActions,
    hideCols = [],
    customActions,
    colsWithDataTypes = [],
    show_pagination = false,
    customColPosition,
}) {
    let availableAction = customActions
        ? [
              { id: "edit", lable: "Edit" },
              { id: "delete", lable: "Delete" },
              ...customActions,
          ]
        : [
              { id: "edit", lable: "Edit" },
              { id: "delete", lable: "Delete" },
          ];

    let tableData = {
        Header: tableName ? tableName : "Data",
        columns: [],
    };

    let tableAction = {
        Header: "Action",
        sticky: "right",
        columns: [],
    };

    const columns = React.useMemo(() => tableColumn(), [data]);

    function tableColumn() {
        let finalColumns = [];

        actionFormat();
        dataFormat();
        finalColumns.push(tableData);
        if (actionsRequired) finalColumns.push(tableAction);

        return finalColumns;
    }

    function dataFormat() {
        if (data && data.length > 0) {
            try {
                let lastIndex = data.length - 1;
                let object = data[lastIndex];
                if (customColPosition) {
                    for (let key of customColPosition) {
                        if (hideCols && hideCols.includes(key) === false) {
                            if (colsWithDataTypes[key] === "image") {
                                let obj1 = {
                                    Header: key.toUpperCase(),
                                    accessor: key,
                                    className: `table-data ${key}`,
                                    Cell: ({ cell }) => {
                                        return (
                                            <img
                                                height={20}
                                                width={20}
                                                style={{ borderRadius: "50%" }}
                                                loading="lazy"
                                                src={cell.value}
                                                alt="thumbnail"
                                            />
                                        );
                                    },
                                };
                                tableData.columns.push(obj1);
                            } else {
                                let obj1 = {
                                    Header: key.toUpperCase(),
                                    accessor: key,
                                    className: `table-data ${key}`,
                                };
                                tableData.columns.push(obj1);
                            }
                        }
                    }
                } else {
                    for (let key in object) {
                        if (hideCols && hideCols.includes(key) === false) {
                            if (colsWithDataTypes[key] === "image") {
                                let obj1 = {
                                    Header: key.toUpperCase(),
                                    accessor: key,
                                    className: `table-data ${key}`,
                                    Cell: ({ cell }) => {
                                        return (
                                            <img
                                                height={20}
                                                width={20}
                                                style={{ borderRadius: "50%" }}
                                                loading="lazy"
                                                src={cell.value}
                                                alt="thumbnail"
                                            />
                                        );
                                    },
                                };
                                tableData.columns.push(obj1);
                            } else {
                                let obj1 = {
                                    Header: key.toUpperCase(),
                                    accessor: key,
                                    className: `table-data ${key}`,
                                };
                                tableData.columns.push(obj1);
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

    function actionFormat() {
        let allAcitonInline = {
            filterable: false,
            accessor: "all-actions",
            className: `actions`,
            Cell: ({ cell }) => {
                return (
                    <div className="actions-wrapper d-flex align-items-center gap-2">
                        {availableAction.map(action => {
                            return (
                                <>
                                    {action.id === "edit" && (
                                        <div
                                            onClick={() =>
                                                handleAction(
                                                    cell.row.original,
                                                    "EDIT",
                                                )
                                            }>
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </div>
                                    )}
                                    {action.id === "delete" && (
                                        <div
                                            onClick={() =>
                                                handleAction(
                                                    cell.row.original,
                                                    "DELETE",
                                                )
                                            }>
                                            <i className="fa-regular fa-trash-can text-danger"></i>
                                        </div>
                                    )}
                                    {action.id === "play" && (
                                        <div
                                            onClick={() =>
                                                handleAction(
                                                    cell.row.original,
                                                    "PLAY",
                                                )
                                            }>
                                            <i className="fa-solid fa-play"></i>
                                        </div>
                                    )}
                                </>
                            );
                        })}
                    </div>
                );
            },
        };
        tableAction.columns.push(allAcitonInline);
    }

    function handleAction(obj, action) {
        callBackActions(obj, action);
    }
    if (typeof data === "object" && typeof columns === "object")
        return (
            <div className="s2a-datalist-wrapper">
                <ReactTable
                    data={data}
                    columns={columns}
                    show_pagination={show_pagination}
                />
            </div>
        );
}
