import classNames from "classnames";
import React, { useContext, useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useDrag } from "react-dnd";
import DesignerContext from "../../Context/DesignerContext";
import { COLUMN, COMPONENTS_STORED_IN_LAYOUT } from "../ComponentRegistry";
import DropZone from "./DropZone";
import Wrapper from "./Wrapper";
import { isEmpty, makeid } from "../../../../../utils/utils";
import { read, write } from "../../../../../utils/localStorage";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";
import {
    createInstanceOfColumnForCopy,
    createInstanceOfColumnForPaste,
} from "../helpers/dnd-helpers";

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

const Column = ({
    columnData,
    components,
    images,
    htmlCollection,
    handleDrop,
    path,
}) => {
    // console.log({ columnData, components });
    const context = useContext(DesignerContext);

    const splittedPath = path.split("-");
    const rowIndex = Number(splittedPath[0]);
    const colIndex = Number(splittedPath[1]);
    const componentIndex = Number(splittedPath[2]);

    const [inputField, setInputField] = useState({});
    const ref = useRef(null);

    useEffect(() => {
        const updatedLayout = [...context.layout];
        setInputField(prev => ({
            ...prev,
            column: updatedLayout[rowIndex].children[colIndex].classes,
            classNames: updatedLayout[rowIndex].children[colIndex].classNames,
            title: updatedLayout[rowIndex].children[colIndex].title,
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
        // move: !context.forbidDrag,
        default: context.forbidDrag,
    });

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
        const updatedLayout = [...context.layout];

        // Update the specific node's children
        updatedLayout[rowIndex].children[colIndex].classes = inputField.column;
        updatedLayout[rowIndex].children[colIndex].classNames =
            inputField.classNames;
        updatedLayout[rowIndex].children[colIndex].title = inputField.title;

        context.setLayout(updatedLayout);
    }

    function addNewColumnToLeft() {
        const newColumn = [
            {
                id: makeid(8),
                type: COLUMN,
                classes: "col-sm",
                className: "",
                title: "",
                classNames: "",
                children: [],
            },
        ];
        const currentLayout = structuredClone(context.layout);
        const right = currentLayout[rowIndex].children;

        currentLayout[rowIndex].children = [...newColumn, ...right];
        context.setLayout(currentLayout);
    }

    function addNewColumnToRight() {
        const newColumn = [
            {
                id: makeid(8),
                type: COLUMN,
                classes: "col-sm",
                className: "",
                title: "",
                classNames: "",
                children: [],
            },
        ];

        const currentLayout = structuredClone(context.layout);
        const left = currentLayout[rowIndex].children.slice(0, colIndex + 1);
        const right = currentLayout[rowIndex].children.slice(colIndex + 1);

        currentLayout[rowIndex].children = [...left, ...newColumn, ...right];
        context.setLayout(currentLayout);
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
            write("form.column", newColumn);
            toastEmitter(`Copied to column clipboard.`);
        } else {
            toastEmitter(`Failed to copy.`, true, "error");
        }
    }

    function pasteColumnToLeft() {
        const columnFromClipboard = read("form.column");
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
            let right = currentLayout[rowIndex].children;
            let temp = [
                {
                    ...updatedColumnFromClipboard.data,
                    id: makeid(8),
                },
            ];
            currentLayout[rowIndex].children = [...temp, ...right];
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

    function pasteColumnToRight() {
        const columnFromClipboard = read("form.column");
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
        const componentFromClipboard = read("form.component");
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

    function getColNumber(classes) {
        let number = "auto";

        try {
            let colNum = parseInt(classes.slice(-1));

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

    function handleColumnSelection() {
        context.handleSelectColumn(columnData);
        const currentComponent = context.selectedComponent;

        if (!isEmpty(currentComponent)) {
            let hasCurrentChild = false;
            const children = columnData.children;
            children.map(child => {
                let id = currentComponent["id"] || "";
                if (child.id == id) {
                    hasCurrentChild = true;
                }
            });
            if (!hasCurrentChild) {
                context.handleSelectComponent({});
            }
        }
    }

    const renderComponent = (component, currentPath) => {
        return (
            <Wrapper
                key={component.id}
                componentData={component}
                components={components}
                images={images}
                htmlCollection={htmlCollection}
                path={currentPath}
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
            onClick={handleColumnSelection}>
            {/* {colIndex == "0" && (
                <span className="d-flex flex-column position-absolute column-paste-left-actions">
                    <span
                        className="pointer"
                        onClick={() => {
                            addNewColumnToLeft();
                        }}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Add new Column")
                            }>
                            <span className="fa-solid fa-plus m-1 "></span>
                        </OverlayTrigger>
                    </span>

                    <span
                        className="pointer "
                        onClick={pasteColumnToLeft}>
                        <OverlayTrigger
                            placement="top"
                            overlay={props =>
                                renderTooltip(props, "Paste Column Here")
                            }>
                            <span className="fa-solid fa-paste m-1"></span>
                        </OverlayTrigger>
                    </span>
                </span>
            )} */}
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

            {isSelected && columnData.children.length == 0 && (
                <span className="z-3 position-absolute component-paste-top-column-actions">
                    <span
                        className="pointer me-1 inline-block "
                        onClick={pasteNewComponent}>
                        <OverlayTrigger
                            overlay={props =>
                                renderTooltip(props, "Paste component here")
                            }>
                            <span className="fa-solid fa-paste m-1"></span>
                        </OverlayTrigger>
                    </span>
                </span>
            )}

            <div
                className="modal modal-lg fade"
                id={`${modalId}`}>
                <div className="modal-dialog ">
                    <div className="modal-content">
                        <div className="modal-header">Column Settings</div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-sm-4">
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
                                <div className="col-sm-4">
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
                                <div className="col-sm-4">
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
