import React, { useRef, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { COLUMN_NAMES } from "../COLUMN_NAMES";
import { MultiSelect } from "react-multi-select-component";

export default function Rows({
    moveCardHandler,
    setSelectedConfig,
    rowItem,
    index,
    currentColumnName,
    items,
    itemId,
    option,
    selectedOption,
    handleSelectedOption,
}) {
    const changeItemColumn = (currentItem, columnName) => {
        let updatedDim = [];
        items.forEach(dim => {
            if (dim.key === currentItem.key) {
                if (columnName === "Available Dimensions") {
                    dim.selected_option = [];
                    dim.condition = "";
                    dim.where = "";
                }

                dim.column = columnName;
                updatedDim.push(dim);
            } else {
                updatedDim.push(dim);
            }
        });
        setSelectedConfig(prev => ({
            ...prev,
            dimensions: updatedDim,
        }));
    };

    const ref = useRef(null);
    const [, drop] = useDrop({
        accept: "Our first type",
        hover(item, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) {
                return;
            }
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            moveCardHandler(dragIndex, hoverIndex, item);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: "Our first type",
        item: { index, rowItem, currentColumnName },
        // canDrag: disableDrag,
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult();
            if (dropResult) {
                const { name } = dropResult;
                const { Search_Criteria, Rows } = COLUMN_NAMES;
                switch (name) {
                    case Search_Criteria:
                        changeItemColumn(rowItem, Search_Criteria);
                        break;
                    case Rows:
                        changeItemColumn(rowItem, Rows);
                        break;
                    default:
                        break;
                }
            }
        },
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0.4 : 1;
    let style = { background: "red" };

    drag(drop(ref));
    return (
        <div
            style={{ opacity, style }}
            ref={ref}
            className="fact-title-style s2a-analytic-dim-row">
            <div className="row">
                <div className="dim-title-style">
                    <div
                        className="dim-label"
                        title={rowItem.label}>
                        {rowItem.label}
                    </div>
                    <div>
                        {"( "}
                        {`${selectedOption.length}/${option.length}`} {" )"}
                    </div>
                </div>
                <div className="modal-open">
                    <i
                        className="fa-solid fa-angle-right s2a-cursor-pointer"
                        data-bs-toggle="modal"
                        data-bs-target={`#${rowItem.id}`}></i>
                </div>
            </div>
            <div
                className="modal fade"
                id={`${rowItem.id}`}
                data-bs-backdrop="static"
                data-bs-keyboard="false"
                tabIndex="-1"
                aria-labelledby="staticBackdropLabel"
                aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1
                                title={rowItem.label}
                                className="modal-title fs-5 text-truncate"
                                id="staticBackdropLabel">
                                {rowItem.label}
                            </h1>
                            <div
                                className=""
                                data-bs-dismiss="modal"
                                data-bs-toggle="tooltip"
                                data-bs-title="Close"
                                aria-label="Close">
                                <i className="fa-solid fa-x modal-close"></i>
                            </div>
                        </div>
                        <div className="modal-body">
                            <MultiSelect
                                options={option}
                                value={selectedOption}
                                // style={styles}
                                onChange={obj =>
                                    handleSelectedOption(
                                        obj,
                                        rowItem.serviceKey,
                                    )
                                }
                                labelledBy="Select"
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-sm button-theme"
                                data-bs-dismiss="modal">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
