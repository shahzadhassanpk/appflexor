import classNames from "classnames";
import React, { useContext, useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useDrag } from "react-dnd";
import DesignerContext from "../../Context/DesignerContext";
import { COLUMN } from "../ComponentRegistry";
import DropZone from "./DropZone";
import Wrapper from "./Wrapper";
import { makeid } from "../../../../../utils/utils";
import { read, write } from "../../../../../utils/localStorage";
import {
    createInstanceOfColumnForCopy,
    createInstanceOfColumnForPaste,
} from "../helpers/dnd-helpers";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";

const Column = ({
    columnData,
    components,
    handleDrop,
    htmlCollection,
    path,
}) => {
    // console.log({ columnData, components });
    const context = useContext(DesignerContext);
    const [inputField, setInputField] = useState({});
    const ref = useRef(null);
    const splittedPath = path.split("-");
    const rowIndex = Number(splittedPath[0]);
    const colIndex = Number(splittedPath[1]);
    const componentIndex = Number(splittedPath[2]);
    const bsColClasses = [
        { name: "Auto Column", value: "col" },
        { name: "One Column", value: "col-sm-1" },
        { name: "Two Columns", value: "col-sm-2" },
        { name: "Three Columns", value: "col-sm-3" },
        { name: "Four Columns", value: "col-sm-4" },
        { name: "Five Columns", value: "col-sm-5" },
        { name: "Six Columns", value: "col-sm-6" },
        { name: "Seven Columns", value: "col-sm-7" },
        { name: "Eight Columns", value: "col-sm-8" },
        { name: "Nine Columns", value: "col-sm-9" },
        { name: "Ten Columns", value: "col-sm-10" },
        { name: "Eleven Columns", value: "col-sm-11" },
        { name: "Twelve Columns", value: "col-sm-12" },
    ];

    useEffect(() => {
        const splitItemPath = path.split("-");
        const updatedLayout = [...context.layout];
        const rowIndex = Number(splitItemPath.slice(0, 1));
        const colIndex = Number(splitItemPath.slice(1));

        // Update the specific node's children
        // updatedLayout[rowIndex].children[colIndex].classes;

        setInputField(prev => ({
            ...prev,
            title: updatedLayout[rowIndex].children[colIndex].title,
            code: updatedLayout[rowIndex].children[colIndex].code,
            column: updatedLayout[rowIndex].children[colIndex].classes,
            classNames: updatedLayout[rowIndex].children[colIndex].classNames,
        }));
    }, []);

    const [{ isDragging }, drag] = useDrag({
        item: {
            type: COLUMN,
            id: columnData.id,
            children: columnData.children,
            path,
        },
        type: COLUMN,
        canDrag: false,
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(ref);

    let columnStyles = classNames({
        move: !context.forbidDrag,
        default: context.forbidDrag,
    });

    // const component = components[componentData.id];
    // component.path = path;
    const isSelected = context.selectedColumn.id === columnData.id;

    let modalId = makeid(8);

    const handleInputField = event => {
        let name = event.target.name;
        let value = event.target.value;
        setInputField(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    function handleUpdateColumnData() {
        // console.log(context.layout);
        const splitItemPath = path.split("-");
        const updatedLayout = [...context.layout];
        const rowIndex = Number(splitItemPath.slice(0, 1));
        const colIndex = Number(splitItemPath.slice(1));

        // Update the specific node's children
        updatedLayout[rowIndex].children[colIndex].classes = inputField.column;
        updatedLayout[rowIndex].children[colIndex].classNames =
            inputField.classNames;
        updatedLayout[rowIndex].children[colIndex].title = inputField.title;
        updatedLayout[rowIndex].children[colIndex].code = inputField.code;

        // console.log({ updatedLayout });

        context.setLayout(updatedLayout);

        // let tempComponentData = _components[componentDetails.id];

        // previous
        // tempComponentData = { ...tempComponentData, ...dataToSet }

        //  current
        //   tempComponentData = {};
        //   tempComponentData = { ...dataToSet };

        //   _components[componentDetails.id].data = { ...tempComponentData };
        //   context.setComponents(_components);
    }

    function removeOneGridFromCol(classes) {
        let str = "col";

        try {
            let colNum = parseInt(classes.slice(-1));

            if (colNum > 1) {
                colNum = colNum - 1;
                str = classes.slice(0, -1) + colNum;
            } else {
                str = classes;
            }
        } catch (error) {
            console.log(error);
        }

        return str;
    }

    function copyColumnToClipboard() {
        const currentColumn = structuredClone(context.selectedColumn);
        const components = context.components;
        const htmlCollection = context.htmlCollection;
        const images = context.images;

        if (currentColumn) {
            const newColumn = createInstanceOfColumnForCopy(
                currentColumn,
                components,
                htmlCollection,
                images,
            );
            write("page.column", newColumn);
            toastEmitter(`Copied to column clipboard.`);
        } else {
            toastEmitter(`Failed to copy.`, true, "error");
        }
    }

    function pasteColumnToRight() {
        const columnFromClipboard = read("page.column");
        // TODO : Add schema valisation
        const type = columnFromClipboard?.data?.type;
        if (type != "DB Column" || !columnFromClipboard) {
            toastEmitter(
                `Clipbaord data is invalid. Please copy column again.`,
                true,
                "error",
            );
        } else {
            const currentLayout = structuredClone(context.layout);
            const updatedColumnFromClipboard =
                createInstanceOfColumnForPaste(columnFromClipboard);
            let left = currentLayout[rowIndex].children.slice(0, colIndex + 1);
            let right = currentLayout[rowIndex].children.slice(colIndex + 1);
            let temp = [
                {
                    ...updatedColumnFromClipboard.data,
                    id: makeid(8),
                },
            ];
            currentLayout[rowIndex].children = [...left, ...temp, ...right];
            context.setLayout(currentLayout);

            context.setComponents({
                ...context.components,
                ...updatedColumnFromClipboard.content.components,
            });

            context.setHtmlCollection({
                ...context.htmlCollection,
                ...updatedColumnFromClipboard.content.htmlCollection,
            });

            context.setImages({
                ...context.images,
                ...updatedColumnFromClipboard.content.images,
            });

            toastEmitter(`Column pasted.`);
        }
    }

    function pasteNewComponent() {
        const componentFromClipboard = read("page.component");
        const type = componentFromClipboard?.componentData?.type;
        if (!type || !componentFromClipboard) {
            toastEmitter(
                `Clipbaord data is invalid. Please copy component again.`,
                true,
                "error",
            );
        } else {
            if (type == "HTML") {
                let htmlCollection = structuredClone(context.htmlCollection);
                const newHtmlId = makeid(8);
                componentFromClipboard.componentData.data.html_id = newHtmlId;
                htmlCollection[newHtmlId] =
                    componentFromClipboard.content.htmlCollection;

                context.setHtmlCollection(htmlCollection);
            }

            if (type == "imageview") {
                let images = structuredClone(context.images);

                const newImageId = makeid(8);
                componentFromClipboard.componentData.data.image_id = newImageId;
                images[newImageId] = componentFromClipboard.content.images;

                context.setImages(images);
            }
            const updatedLayout = structuredClone(context.layout);
            const newComponentId = makeid(8);

            // added new component id to layout
            updatedLayout[rowIndex].children[colIndex].children.push({
                id: newComponentId,
                type: "component",
            });

            let newComponent = {
                ...componentFromClipboard.componentData,
                id: newComponentId,
            };

            context.setLayout(updatedLayout);

            context.setComponents({
                ...context.components,
                [newComponentId]: newComponent,
            });
        }
    }

    function getColNumber(classes) {
        let number = "auto";

        try {
            let arr = classes.split("-");
            let colNum = 0;
            if (arr.length) {
                colNum = parseInt(arr[2]);
            }

            if (colNum) {
                number = colNum;
            } else {
                number = "auto";
            }
        } catch (error) {
            console.log(error);
        }

        return number;
    }

    const renderComponent = (component, currentPath) => {
        return (
            <Wrapper
                key={component.id}
                componentData={component}
                components={components}
                path={currentPath}
                htmlCollection={htmlCollection}
            />
        );
    };
    const renderTooltip = (props, text) => (
        <Tooltip
            id="selected-component-tooltip"
            {...props}>
            {text}
        </Tooltip>
    );
    return (
        <div
            ref={ref}
            style={{ opacity }}
            className={`s2a-column base my-1 draggable position-relative ${removeOneGridFromCol(
                columnData.classes,
            )} ${true ? "col-outline" : ""}  ${columnStyles}`}
            onClick={() => context.handleSelectColumn(columnData)}>
            {isSelected && (
                <span className="d-flex flex-column position-absolute column-edit-right-actions">
                    <span
                        className="pointer"
                        onClick={() => {
                            context.editColumn();
                        }}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Edit Column")
                            }>
                            <span className="fa-solid fa-edit m-1 "></span>
                        </OverlayTrigger>
                    </span>
                    <span
                        className="pointer "
                        onClick={() => {
                            context.removeColumn(path);
                        }}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Delete Column")
                            }>
                            <span className="fa-solid fa-trash m-1 text-danger"></span>
                        </OverlayTrigger>
                    </span>
                    <span
                        className="pointer "
                        onClick={() => {
                            copyColumnToClipboard();
                        }}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Copy Column")
                            }>
                            <span className="fa-solid fa-copy m-1"></span>
                        </OverlayTrigger>
                    </span>
                    <span
                        className="pointer "
                        onClick={pasteColumnToRight}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Paste column here")
                            }>
                            <span className="fa-solid fa-paste m-1"></span>
                        </OverlayTrigger>
                    </span>
                </span>
            )}

            {isSelected ? (
                <>
                    <span
                        data-bs-toggle="modal"
                        data-bs-target={`#${modalId}`}
                        className="position-absolute col-grid-pos bg-warning rounded px-2 text-dark pointer">
                        <i className="fa-solid fa-gear"></i>{" "}
                        {getColNumber(columnData.classes)}
                    </span>
                    <span className="position-absolute component-paste-top-column-actions">
                        <span
                            className="pointer inline-block "
                            onClick={pasteNewComponent}>
                            <OverlayTrigger
                                overlay={props =>
                                    renderTooltip(props, "Paste component here")
                                }>
                                <span className="fa-solid fa-paste m-1"></span>
                            </OverlayTrigger>
                        </span>
                    </span>
                </>
            ) : (
                <span className="position-absolute col-grid-pos bg-warning rounded px-2 text-dark pointer">
                    <i className="fa-solid fa-border-all"></i>{" "}
                    {getColNumber(columnData.classes)}
                </span>
            )}
            {/* {isSelected && (
                <span
                    className="pointer position-absolute col-delete-pos"
                    onClick={() => {
                        context.removeColumn(path);
                    }}
                >
                    <OverlayTrigger placement="top" overlay={renderTooltip}>
                        <span className="fa-solid fa-trash m-1 text-danger"></span>
                    </OverlayTrigger>
                </span>
            )} */}
            {columnData.children.map((component, index) => {
                const currentPath = `${path}-${index}`;

                return (
                    <React.Fragment key={component.id}>
                        <DropZone
                            data={{
                                path: currentPath,
                                childrenCount: columnData.children.length,
                            }}
                            onDrop={handleDrop}
                        />
                        {renderComponent(component, currentPath)}
                    </React.Fragment>
                );
            })}
            <DropZone
                data={{
                    path: `${path}-${columnData.children.length}`,
                    childrenCount: columnData.children.length,
                }}
                onDrop={handleDrop}
                isLast
            />
            <div
                className="modal modal-lg fade"
                id={`${modalId}`}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">Column Settings</div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-sm-3">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Title
                                        </label>
                                        <input
                                            className="form-control"
                                            name="title"
                                            value={inputField["title"]}
                                            onChange={e =>
                                                handleInputField(e)
                                            }></input>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Code
                                        </label>
                                        <input
                                            className="form-control"
                                            name="code"
                                            value={inputField["code"]}
                                            onChange={e =>
                                                handleInputField(e)
                                            }></input>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Classes
                                        </label>
                                        <input
                                            className="form-control"
                                            name="classNames"
                                            value={inputField["classNames"]}
                                            onChange={e =>
                                                handleInputField(e)
                                            }></input>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Column
                                        </label>
                                        <select
                                            className="form-select"
                                            name="column"
                                            value={inputField["column"]}
                                            onChange={e => handleInputField(e)}>
                                            {bsColClasses.map((item, index) => (
                                                <option
                                                    key={index}
                                                    value={item.value}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="d-flex justify-content-end align-items-center">
                                <button
                                    className="btn btn-sm button-theme me-1 align-self-center"
                                    data-bs-dismiss="modal">
                                    Close
                                </button>
                                <button
                                    className="btn btn-sm button-theme align-self-center"
                                    data-bs-dismiss="modal"
                                    onClick={() => handleUpdateColumnData()}>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Column;
