import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
// import { API_URL, BPM_API_URL } from "../../../Config";
import { componentList } from "../Designer/ComponentRegistry";

/*
 *   File Viewer takes form key for fetching form layout, formId or businessKey (primarily the same thing, these terms are
 *   interchangabel) for fetching form data,
 *   handleActions is called when form is saved or failed with an action type param handled by Parent Component
 *   Right now form is used in '2' modules only 'DataList' and 'Processes' for Processes there is flag 'processConfig' set to true in
 *   Process mode only
 *
 *
 */

export const actions = {
    update: "UPDATE",
    complete: "COMPLETE",
    failed: "FAILED",
    draft: "DRAFT",
};

export const modeType = {
    design: "DESIGN_MODE",
    preview: "PREVIEW_MODE",
    readonly: "READONLY_MODE",
    render: "RENDER_MODE",
};

const VariableForm = ({
    processVariables = {},
    handleActions,
    processConfig = {
        allowUpdate: false,
    },
    mode,
}) => {
    const [processkeys, setProcesskeys] = useState([]);
    const [inputFields, setinputFields] = useState({ ...processVariables });

    useEffect(() => {
        let keys = Object.keys(processVariables);

        if (keys) {
            setProcesskeys(keys);
        }
        setinputFields(processVariables);
    }, [processVariables]);

    function handleInputChange(event) {
        let key = event.target.name;
        let value = null;
        let type = event.target.type;

        if (type === "checkbox") {
            value = event.target.checked;
        } else {
            value = event.target.value;
        }

        let copy = {
            ...inputFields,
        };

        copy[key] = { ...copy[key], value };

        setinputFields(copy);
    }

    function handleUpdate() {
        handleActions(actions.update, inputFields);
    }

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return (
        <div>
            {isEmpty(processkeys) ? (
                <Delayed waitBeforeShow={200}>
                    <div className="no-task-border">
                        <div className="no-task-wrap">
                            <i className="fa-solid fa-info no-task-info-icon me-2"></i>
                            <span className="no-task-text">
                                No process variables found.
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="mx-2 btn button-theme btn-sm float-end"
                        onClick={() => handleActions(actions.complete)}
                        disabled={mode === modeType.readonly ? true : false}>
                        <span>Complete</span>
                    </button>
                </Delayed>
            ) : (
                <>
                    <div className="row mb-2">
                        {processkeys.map((key, i) => {
                            return (
                                <div
                                    key={i}
                                    className="col-sm-6">
                                    {processVariables[key]?.type ===
                                        "Boolean" && (
                                        <div className="field-padding">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={inputFields[key].value}
                                                name={key}
                                                onChange={e =>
                                                    handleInputChange(e)
                                                }
                                                disabled={
                                                    mode === modeType.readonly
                                                        ? true
                                                        : false
                                                }
                                            />
                                            <label className="ps-2 form-label">
                                                {key}
                                            </label>
                                        </div>
                                    )}
                                    {processVariables[key]?.type ===
                                        "String" && (
                                        <div className="field-padding">
                                            <label className="form-label">
                                                {key}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={inputFields[key].value}
                                                name={key}
                                                onChange={e =>
                                                    handleInputChange(e)
                                                }
                                                disabled={
                                                    mode === modeType.readonly
                                                        ? true
                                                        : false
                                                }
                                            />
                                        </div>
                                    )}
                                    {processVariables[key]?.type ===
                                        "Double" && (
                                        <div className="field-padding">
                                            <label className="form-label">
                                                {key}
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={inputFields[key].value}
                                                name={key}
                                                onChange={e =>
                                                    handleInputChange(e)
                                                }
                                                disabled={
                                                    mode === modeType.readonly
                                                        ? true
                                                        : false
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        className="mx-2 btn button-theme btn-sm float-end"
                        onClick={() => handleUpdate()}
                        disabled={!processConfig.allowUpdate ? true : false}>
                        <span>Update</span>
                    </button>
                </>
            )}
        </div>
    );
};

function Delayed({ children, waitBeforeShow = 500 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? children : null;
}

export default VariableForm;
