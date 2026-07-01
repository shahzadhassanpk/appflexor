import React, { useRef, useState, useEffect } from "react";

const ListingView = props => {
    const {
        page,
        prepareRow,
        titleShowingFields,
        screenWidth,
        datalist_type,
        handleListEdit,
        selectedObject,
    } = props;

    const [selectedRow, setSelectedRow] = useState({});
    const listingRef = useRef(null);

    useEffect(() => {
        if (selectedObject?.id) {
            setSelectedRow(selectedObject);
        }
    }, [selectedObject]);
    return (
        <div
            className="s2a-list s2a-scroll enable-scroll"
            ref={listingRef}>
            {/* <div className="s2a-gallery table-container s2a-react-table"> */}
            {page.map((row, i) => {
                prepareRow(row);
                return (
                    <div
                        key={i}
                        className={`list-item ${
                            selectedRow?.id === row?.original?.id
                                ? "active"
                                : ""
                        }`}
                        //shahzad
                        {...row.getRowProps()}
                        onClick={() => {
                            handleListEdit(row);
                            setSelectedRow(row.original);
                        }}>
                        {row.cells.map((cell, cellIndex) => {
                            const db_column =
                                typeof cell.column.Header !== "function"
                                    ? cell.column.Header
                                    : "";
                            return (
                                <div
                                    className={`s2a-list-data ${cell?.column?.className} ${
                                        db_column + " " + screenWidth > 700
                                            ? ""
                                            : // ? "cell-text"
                                              ""
                                    } ${cellIndex === 0 ? "heading" : ""}`}
                                    title={
                                        titleShowingFields[cell.column.datatype]
                                            ? cell.value
                                            : ""
                                    }
                                    {...cell.getCellProps()}
                                    data-cell={db_column}>
                                    <div
                                        className={`s2a-cell ${cell.column.className}`}
                                        title={cell.column.Header}>
                                        <span>{cell.render("Cell")}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default ListingView;
