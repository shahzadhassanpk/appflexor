import classNames from "classnames";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useDrag } from "react-dnd";
import AppContext from "./AppContext";
import { COLUMN } from "./ComponentRegistry";
import DropZone from "./DropZone";
import Wrapper from "./Wrapper";
import { makeid } from "../../../../utils/utils";

const Column = ({
    columnData,
    components,
    handleDrop,
    htmlCollection,
    path,
}) => {
    // console.log({ columnData, components });
    const context = useContext(AppContext);
    const [inputField, setInputField] = useState({});
    const ref = useRef(null);

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
            column: updatedLayout[rowIndex].children[colIndex].classes,
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
    // const isSelected = context.selectedColumn.id === columnData.id;

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

    const renderComponent = (component, currentPath) => {
        return (
            <Wrapper
                key={component.id}
                componentData={component}
                components={components}
                htmlCollection={htmlCollection}
                path={currentPath}
            />
        );
    };

    return (
        <div
            ref={ref}
            style={{ opacity }}
            className={`base draggable ${removeOneGridFromCol(
                columnData.classes,
            )} ${false ? "outlinePurple" : ""}  ${columnStyles}`}
            // onClick={() => context.handleSelectColumn(columnData)}
        >
            {/* {isSelected ? (
                <span
                    data-bs-toggle="modal"
                    data-bs-target={`#${modalId}`}
                    className="float-end bg-warning rounded px-2 text-dark pointer"
                >
                    <i className="fa-solid fa-gear"></i>{" "}
                    {getColNumber(columnData.classes)}
                </span>
            ) : (
                <span className="float-end bg-warning rounded px-2 text-dark">
                    <i className="fa-solid fa-border-all"></i>{" "}
                    {getColNumber(columnData.classes)}
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
                            <div className="col-sm-4">
                                <div className="mb-3">
                                    <label className="form-label">Column</label>
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
                        <div className="modal-footer">
                            <div className="d-flex justify-content-end align-items-center">
                                <button
                                    className="btn btn-sm button-theme me-1 align-self-center"
                                    data-bs-dismiss="modal">
                                    Close
                                </button>
                                <button
                                    className="btn btn-sm button-theme align-self-center"
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
