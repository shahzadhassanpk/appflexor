import React, { useEffect, useRef } from "react";
// import { Label } from "recharts";

const GalleryView = props => {
    const {
        page,
        prepareRow,
        titleShowingFields,
        screenWidth,
        columns = 4,
        datalist_type,
    } = props;

    const galleryRef = useRef(null);

    useEffect(() => {
        if (galleryRef?.current) {
            galleryRef.current.style.gridTemplateColumns = `repeat(${columns}, auto)`;
        }
    }, []);

    return (
        <div
            className="s2a-gallery"
            ref={galleryRef}>
            {/* <div className="s2a-gallery table-container s2a-react-table"> */}
            <div className="row">
                {page.map((row, i) => {
                    prepareRow(row);
                    return (
                        <div
                            key={i}
                            className={`gallery-cell col-sm-${12 / columns}`}
                            {...row.getRowProps()}>
                            <div className="gallery-item">
                                {row.cells.map(cell => {
                                    const db_column =
                                        typeof cell.column.Header !== "function"
                                            ? cell.column.Header
                                            : "";
                                    return (
                                        <div
                                            className={
                                                db_column + " " + screenWidth >
                                                700
                                                    ? "s2a-gallery-data"
                                                    : // ? "s2a-gallery-data cell-text"
                                                      "s2a-gallery-data"
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
                                                {datalist_type === "TABLE" ||
                                                datalist_type ===
                                                    "EDITABLE-GRID" ? (
                                                    <div className="col-sm-12 label">
                                                        {cell.column.Header}
                                                    </div>
                                                ) : (
                                                    ""
                                                )}
                                                {cell.render("Cell")}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GalleryView;
