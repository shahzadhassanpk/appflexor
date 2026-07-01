import classNames from "classnames";
import React, { useContext, useRef } from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useDrag } from "react-dnd";
import DesignerContext from "../../Context/DesignerContext";
import { COLUMN, COMPONENTS_STORED_IN_LAYOUT, ROW } from "../ComponentRegistry";
import Column from "./Column";
import DropZone from "./DropZone";
import { read, write } from "../../../../../utils/localStorage";
import { makeid, makeShortId } from "../../../../../utils/utils";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import {
    createInstanceOfColumnForPaste,
    createInstanceOfRowForCopy,
    createInstanceOfRowForPaste,
    handleMoveSidebarComponentIntoParent,
} from "../helpers/dnd-helpers";
const Row = ({
    rowData,
    components,
    images,
    htmlCollection,
    handleDrop,
    path,
}) => {
    // console.log({ rowData, components });
    const ref = useRef(null);
    const context = useContext(DesignerContext);

    const [{ isDragging }, dragRef] = useDrag({
        item: {
            type: ROW,
            id: rowData.id,

            children: rowData.children,
            path,
        },
        type: ROW,
        canDrag: false,
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0.2 : 1;
    const isSelected = context.selectedRow.id === rowData.id;

    dragRef(ref);

    let rowStyles = classNames({
        // move: !context.forbidDrag,
        default: context.forbidDrag,
    });

    const insertNewRowBelow = () => {
        const indexToInsertRow = parseInt(path) + 1;
        const currentLayout = structuredClone(context.layout);
        const left = currentLayout.slice(0, indexToInsertRow);
        const right = currentLayout.slice(indexToInsertRow);
        const newRow = [
            {
                type: ROW,
                id: `${makeid(8)}`,
                children: [
                    {
                        type: COLUMN,
                        id: `${makeid(8)}`,
                        classes: "col-sm",
                        children: [],
                    },
                ],
            },
        ];

        const updatedLayout = [...left, ...newRow, ...right];
        context.setLayout(updatedLayout);
    };

    const inserNewtRowAbove = () => {
        const currentLayout = structuredClone(context.layout);
        const newRow = [
            {
                type: ROW,
                id: `${makeid(8)}`,
                children: [
                    {
                        type: COLUMN,
                        id: `${makeid(8)}`,
                        classes: "col-sm",
                        children: [],
                    },
                ],
            },
        ];

        const updatedLayout = [...newRow, ...currentLayout];

        context.setLayout(updatedLayout);
    };

    function copyRowToClipboard() {
        const components = context.components;
        const htmlCollection = context.htmlCollection;
        const images = context.images;
        const currentRow = structuredClone(context.selectedRow);

        if (currentRow) {
            const newRow = createInstanceOfRowForCopy(
                currentRow,
                components,
                htmlCollection,
                images,
            );
            write("page.row", newRow);
            toastEmitter(`Copied row to clipboard.`);
        } else {
            toastEmitter(`Failed to copy.`, true, "error");
        }
    }

    const pasteRowBelow = () => {
        const rowFromClipboard = read("form.row");
        // TODO: Add scheme validation here
        const type = rowFromClipboard?.data?.type;
        if (!rowFromClipboard || type != "row") {
            toastEmitter(
                `Clipbaord data is invalid. Please copy row again.`,
                true,
                "error",
            );
        } else {
            const currentLayout = structuredClone(context.layout);
            const updatedRowFromClipboard =
                createInstanceOfRowForPaste(rowFromClipboard);
            const indexToInsertRow = parseInt(path) + 1;
            const left = currentLayout.slice(0, indexToInsertRow);
            const temp = [
                {
                    ...updatedRowFromClipboard.data,
                    id: makeid(8),
                },
            ];
            const right = currentLayout.slice(indexToInsertRow);

            const updatedLayout = [...left, ...temp, ...right];

            context.setComponents({
                ...context.components,
                ...updatedRowFromClipboard.content.components,
            });

            context.setHtmlCollection({
                ...context.htmlCollection,
                ...updatedRowFromClipboard.content.htmlCollection,
            });

            // context.setImages({
            //     ...context.images,
            //     ...updatedRowFromClipboard.content.images,
            // });

            context.setLayout(updatedLayout);
            toastEmitter(`Row pasted.`);
        }
    };

    const pasteRowAbove = () => {
        const rowFromClipboard = read("form.row");
        // TODO: Add scheme validation here
        const type = rowFromClipboard?.data?.type;
        if (!rowFromClipboard || type != "row") {
            toastEmitter(
                `Clipbaord data is invalid. Please copy row again.`,
                true,
                "error",
            );
        } else {
            const currentLayout = structuredClone(context.layout);
            const updatedRowFromClipboard =
                createInstanceOfRowForPaste(rowFromClipboard);

            const newRow = [
                {
                    ...updatedRowFromClipboard.data,
                    id: makeid(8),
                },
            ];

            context.setComponents({
                ...context.components,
                ...updatedRowFromClipboard.content.components,
            });

            context.setHtmlCollection({
                ...context.htmlCollection,
                ...updatedRowFromClipboard.content.htmlCollection,
            });

            context.setImages({
                ...context.images,
                ...updatedRowFromClipboard.content.images,
            });

            context.setLayout([...newRow, ...currentLayout]);
            toastEmitter(`Row pasted.`);
        }
    };

    function renderColumn(column, currentPath) {
        return (
            <Column
                key={column.id}
                columnData={column}
                components={components}
                images={images}
                htmlCollection={htmlCollection}
                handleDrop={handleDrop}
                path={currentPath}></Column>
        );
    }

    const renderTooltip = (props, text) => (
        <Tooltip
            id="selected-component-tooltip"
            {...props}>
            {text}
        </Tooltip>
    );

    return (
        <div className="position-relative">
            {/* Only Show this one first row at index 0 */}
            {path == "0" && (
                <span className="z-3 position-absolute row-paste-top-actions d-flex">
                    {/* <span
                        className="pointer me-1 inline-block "
                        onClick={inserNewtRowAbove}>
                        <OverlayTrigger
                            overlay={props =>
                                renderTooltip(props, "Create new row")
                            }>
                            <span className="fa-solid fa-plus m-1"></span>
                        </OverlayTrigger>
                    </span> */}
                </span>
            )}
            {isSelected && (
                <div className="position-absolute row-edit-top-actions d-flex ">
                    {/* <span
                        className="pointer me-1 inline-block "
                        onClick={pasteRowAbove}>
                        <OverlayTrigger
                            overlay={props =>
                                renderTooltip(props, "Paste row Here")
                            }>
                            <span className="fa-solid fa-paste m-1"></span>
                        </OverlayTrigger>
                    </span> */}
                    <div
                        className="pointer me-1 inline-block "
                        onClick={pasteRowBelow}>
                        <OverlayTrigger
                            overlay={props =>
                                renderTooltip(props, "Paste Row")
                            }>
                            <span className="fa-solid fa-paste m-1"></span>
                        </OverlayTrigger>
                    </div>
                    <div
                        className="pointer me-1 inline-block "
                        onClick={copyRowToClipboard}>
                        <OverlayTrigger
                            overlay={props => renderTooltip(props, "Copy Row")}>
                            <span className="fa-solid fa-copy m-1"></span>
                        </OverlayTrigger>
                    </div>
                    <div
                        className="pointer"
                        onClick={() => {
                            context.editRow();
                        }}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props => renderTooltip(props, "Edit Row")}>
                            <span className="fa-solid fa-edit m-1 "></span>
                        </OverlayTrigger>
                    </div>

                    <div
                        className="pointer "
                        onClick={() => {
                            context.removeRow(path);
                        }}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Remove Row")
                            }>
                            <span className="fa-solid fa-trash m-1 text-danger"></span>
                        </OverlayTrigger>
                    </div>
                </div>
            )}
            <div
                ref={ref}
                style={{ opacity }}
                className={`position-relative base draggable row s2a-row px-0 m-0 ${
                    true ? "row-outilne" : ""
                }  ${rowStyles}`}
                onClick={() => context.handleSelectRow(rowData)}>
                {rowData.children.map((column, index) => {
                    const currentPath = `${path}-${index}`;
                    return (
                        <React.Fragment key={column.id}>
                            <DropZone
                                data={{
                                    path: currentPath,
                                    childrenCount: rowData.children.length,
                                }}
                                onDrop={handleDrop}
                                className="horizontalDrag"
                            />
                            {renderColumn(column, currentPath)}
                        </React.Fragment>
                    );
                })}

                <DropZone
                    data={{
                        path: `${path}-${rowData.children.length}`,
                    }}
                    onDrop={handleDrop}
                    className="horizontalDrag"
                    isLast
                />                
            </div>
            {/* <span className="z-3 position-absolute d-flex row-paste-bottom-actions">
                <span
                    className="pointer me-1 inline-block "
                    onClick={insertNewRowBelow}>
                    <OverlayTrigger
                        overlay={props =>
                            renderTooltip(props, "Insert row here")
                        }>
                        <span className="fa-solid fa-plus m-1"></span>
                    </OverlayTrigger>
                </span>
                <span
                    className="pointer me-1 inline-block "
                    onClick={pasteRowBelow}>
                    <OverlayTrigger
                        overlay={props =>
                            renderTooltip(props, "Paste row Here")
                        }>
                        <span className="fa-solid fa-paste m-1"></span>
                    </OverlayTrigger>
                </span>
            </span> */}
        </div>
    );
};

export default Row;
