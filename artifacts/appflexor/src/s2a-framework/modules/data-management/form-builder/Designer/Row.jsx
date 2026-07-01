import classNames from "classnames";
import React, { useContext, useRef } from "react";
import { useDrag } from "react-dnd";
import AppContext from "./AppContext";
import Column from "./Column";
import { ROW } from "./ComponentRegistry";
import DropZone from "./DropZone";
const Row = ({ rowData, components, handleDrop, path }) => {
    // console.log({ rowData, components });
    const ref = useRef(null);
    const context = useContext(AppContext);
    const [{ isDragging }, dragRef] = useDrag({
        item: {
            type: ROW,
            id: rowData.id,

            children: rowData.children,
            path,
        },
        type: ROW,
        canDrag: false,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0.2 : 1;

    dragRef(ref);

    let rowStyles = classNames({
        move: !context.forbidDrag,
        default: context.forbidDrag,
    });

    function renderColumn(column, currentPath) {
        return (
            <Column
                key={column.id}
                columnData={column}
                components={components}
                handleDrop={handleDrop}
                path={currentPath}
            ></Column>
        );
    }

    return (
        <div
            ref={ref}
            style={{ opacity }}
            className={`base draggable row ${rowStyles}`}
        >
            <div className="row">
                {rowData.children.map((column, index) => {
                    const currentPath = `${path}-${index}`;

                    return (
                        <React.Fragment key={column.id}>
                            {/* <DropZone
                                data={{
                                    path: currentPath,
                                    childrenCount: rowData.children.length,
                                }}
                                onDrop={handleDrop}
                                className="horizontalDrag"
                            /> */}
                            {renderColumn(column, currentPath)}
                        </React.Fragment>
                    );
                })}
                {/* <DropZone
                    data={{
                        path: `${path}-${rowData.children.length}`,
                    }}
                    onDrop={handleDrop}
                    className="horizontalDrag"
                    isLast
                /> */}
            </div>
        </div>
    );
};

export default Row;
