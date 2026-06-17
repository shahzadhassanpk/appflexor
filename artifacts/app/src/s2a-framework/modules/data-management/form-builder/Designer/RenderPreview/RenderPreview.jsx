import React, { useContext, useEffect, useRef, useState } from "react";
import AppContext from "../../Context/AppContext";
import { componentList } from "../ComponentRegistry";

const RenderPreview = ({ layout, components, mode }) => {
    const [stateObj, setStateObj] = useState({});
    const [infoMsg, setInfoMsg] = useState("");

    useEffect(() => {
        if (mode === "PREVIEW_MODE" && !isEmpty(components) && layout.length !== 0) {
            setObjectSchemeForValidation(layout, components);
        }
    }, [layout, components]);

    useEffect(() => {
        if (!isEmpty(stateObj)) {
            let keys = Object.keys(stateObj);
            if (isArrayEmpty(keys)) setInfoMsg("Column required for validation are empty. This can lead to false validation results.");
        }
    }, [stateObj]);

    const handleInputFields = (key = "", value = "") => {
        setStateObj((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const setObjectSchemeForValidation = (layout, components) => {
        let tempObj = {};
        layout.map((row) => {
            row.children.map((column) => {
                column.children.map((component) => {
                    let foundComponent = components[component.id];
                    let key = foundComponent.data.db_column;

                    if (key !== undefined) {
                        tempObj = {
                            ...tempObj,
                            [key]: "",
                        };
                    }
                });
            });
        });
        // setStateObj((prev) => ({ ...prev, ...tempObj }));
        setStateObj({});
        setStateObj(tempObj);
    };

    // TODO: check validations
    const checkValidation = (objToValidate, layout, components) => {
        let isValid = false;
        let invalidKeys = [];
        let message = "";
        // console.log(obj);
        if (isEmpty(objToValidate)) {
            isValid = false;
            message = "Required columns are empty. This may result to false validations.";

            return {
                isValid,
                invalidKeys,
                message,
            };
        }
        let schemaArr = [];
        layout.map((row) => {
            row.children.map((column) => {
                column.children.map((component) => {
                    let foundComponent = components[component.id];
                    let key = foundComponent.data.db_column;
                    // let value = foundComponent.data.value;
                    let regex = foundComponent.data.regex ? foundComponent.data.regex : "";
                    let required = foundComponent.data.required;
                    let obj = {};
                    if (key !== undefined) {
                        obj = {
                            ...obj,
                            [key]: { key: key, required, regex },
                        };
                        schemaArr.push(obj);
                    }
                });
            });
        });

        // console.log(schemaArr);

        for (let i = 0; i < schemaArr.length; i++) {
            let objFound = schemaArr[i];
            let keys = Object.keys(objFound);
            let validationSchema = objFound[keys[0]];

            // console.log(objToValidate);
            // console.log(validationSchema);
            if (objToValidate[validationSchema.db_column] !== undefined) {
                if (validationSchema.required === "YES") {
                    try {
                        if (validationSchema.regex.length > 0) {
                            const regexExp = new RegExp(validationSchema.regex);
                            let strToValidate = objToValidate[validationSchema.db_column];
                            let strIsValid = regexExp.test(strToValidate);

                            if (!strIsValid) {
                                invalidKeys.push(validationSchema.db_column);
                            }
                        } else {
                            let strToValidate = objToValidate[validationSchema.db_column];
                            let strIsValid = strToValidate.length > 0 ? true : false;

                            if (!strIsValid) {
                                invalidKeys.push(validationSchema.db_column);
                            }
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }
        if (invalidKeys.length === 0) {
            isValid = true;
            message = "Validations passed successfully.";
        }
        return {
            isValid,
            invalidKeys,
            message,
        };
    };

    const handleValidation = () => {
        let validations = checkValidation(stateObj, layout, components);
        if (validations.isValid) {
            // alert("All good");
            setInfoMsg(validations.message);
        } else {
            let msg = `Invalid fields : ${validations.invalidKeys.join()}. Either these fields are required or may not satisfy regex expression.`;
            if (validations.invalidKeys.length > 0) {
                setInfoMsg(msg);
            }

            // alert(validations.message);
            // setInfoMsg(validations.message);
            // setStateObj({});
        }
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function isArrayEmpty(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === "") return true;
        }
        return false;
    }

    function renderRow(row) {
        return <Row key={row.id} rowData={row} components={components} mode={mode} handleInputFields={handleInputFields}></Row>;
    }

    return (
        <div className="container-fluid s2a-page-layout">
            {infoMsg !== "" && (
                <div className="p-1 alert alert-info" role="alert">
                    {infoMsg}
                </div>
            )}

            {layout.map((row, index) => {
                return (
                    <div className="row" key={row.id}>
                        {renderRow(row)}
                    </div>
                );
            })}
            {mode !== "DESIGN_MODE" ? (
                <>
                    <button className="float-end btn btn-sm btn-warning" onClick={handleValidation}>
                        Test validations
                    </button>
                    <code>{JSON.stringify(stateObj)}</code>
                </>
            ) : null}
        </div>
    );
};

function Row({ rowData, components, mode, handleInputFields }) {
    function renderColumn(column) {
        return (
            <React.Fragment>
                <div className={`${column.classes} col-style p-0`}>
                    <Column key={column.id} columnData={column} components={components} mode={mode} handleInputFields={handleInputFields}></Column>
                </div>
            </React.Fragment>
        );
    }
    return (
        <React.Fragment>
            {rowData.children.map((column, index) => {
                return <React.Fragment key={column.id}>{renderColumn(column)}</React.Fragment>;
            })}
        </React.Fragment>
    );
}

function Column({ columnData, components, mode, handleInputFields }) {
    const renderComponent = (component) => {
        return (
            <React.Fragment>
                <div className="col-wrapper">
                    <Component
                        key={component.id}
                        componentData={component}
                        components={components}
                        mode={mode}
                        handleInputFields={handleInputFields}
                    />
                </div>
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            {columnData.children.map((component) => {
                return <React.Fragment key={component.id}>{renderComponent(component)}</React.Fragment>;
            })}
        </React.Fragment>
    );
}

function Component({ componentData, components, mode, handleInputFields }) {
    // console.log(`INSIDE PREVIEW COMPONENT`);
    // console.log(components);
    // useEffect(() => {
    //     let _nodes = querySelectorAll('[data-id="component"]');
    //     console.log("All nodes having [data-id=]");
    //     console.log(_nodes);
    // }, []);

    // const querySelectorAll = (selector) => {
    //     const elList = document.querySelectorAll(selector);

    //     if (!elList) throw new Error("Could not find elements");

    //     return elList;
    // };

    // old
    const context = useContext(AppContext);
    const [component, setComponent] = useState(null);

    useEffect(() => {
        setComponent(components[componentData.id]);
    }, [componentData]);

    // useEffect(() => {
    //     console.log(`Latest state of component`);
    //     console.log(component);
    // }, [component]);

    // console.log({ componentData });

    return (
        <React.Fragment>
            {/* <code>{JSON.stringify(component)}</code> */}
            {/* {JSON.stringify(context)} */}
            {component && CreateComponent(component, componentList, mode, handleInputFields)}
        </React.Fragment>
    );
}

function CreateComponent(component, componentList, mode, handleInputFields) {
    if (typeof componentList[component.type] !== "undefined") {
        return React.createElement(componentList[component.type], {
            key: component.id,
            component,
            mode: mode,
            handleInputFields,
        });
    }
    return React.createElement(
        () => (
            <div
                // style={{ minHeight: "90vh" }}
                className="d-flex align-items-center justify-content-center"
            >
                <div className="text-center">
                    <p className="">
                        The Component for <span className="text-danger">{component.type}</span> has not been created yet.
                    </p>
                </div>
            </div>
        ),
        { key: component.id }
    );
}

export { RenderPreview };
