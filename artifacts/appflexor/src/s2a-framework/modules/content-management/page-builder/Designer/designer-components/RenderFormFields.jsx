import React, { useContext, useEffect, useState } from "react";
import TextEditor from "../../../../components/TextEditor/RichTextEditor";
import {
    disposeTooltip,
    enableTooltip,
    makeid,
} from "../../../../../utils/utils";

/**
 * @Current supported types
 * text
 * number
 * checkbox
 * options
 *
 * @param
 *
 * @returns
 */

export function RenderFormFields({
    fieldsArr,
    inputField,
    handleInputField,
    handleImageUpload,
    handleRadioOptions,
    handleCheckListOptions,
}) {
    const [options, setOptions] = useState([]);
    const [originMapping, setOriginMapping] = useState({});

    useEffect(() => {
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        parseOptions();
        setOriginMappingState(fieldsArr);
    }, [fieldsArr]);

    // useEffect(() => {
    //     console.log("Options latest state");
    //     console.log(options);

    //     if (!isArrayEmpty(options)) {
    //         const fieldType = "array";
    //         handleRadioOptions(options, fieldType);
    //     }
    // }, []);

    function setOriginMappingState(fieldsArr) {
        let mapping = {};

        // TODO: this one is one-to-many, add many-to-many
        fieldsArr.map(field => {
            if (field["origin"]) {
                let origin = field["origin"];
                let mapSrc = origin.split(".");

                mapping[field["id"]] = mapSrc[1];
            }
        });

        setOriginMapping(mapping);
    }

    function parseOptions() {
        let options = [];
        fieldsArr.map(item => {
            if (item.type === "array") {
                try {
                    options = tryParseJSONObject(item.options, []);
                } catch (error) {
                    console.log();
                }
            }
        });
        setOptions(options);
    }

    function handleOptionsChange(e, fieldId) {
        let id = e.target.getAttribute("data-id");
        let value = e.target.value;
        let name = e.target.name;

        let _updatedArr = [];

        options.map(opt => {
            if (opt.id === id) {
                let obj = opt;
                obj[name] = value;

                _updatedArr.push(obj);
            } else {
                _updatedArr.push(opt);
            }
        });
        setOptions(_updatedArr);
        let str = JSON.stringify(_updatedArr);
        handleRadioOptions(str, fieldId);
    }

    function handleRadioOptDelete(option, fieldId) {
        let _updatedArr = [];

        _updatedArr = options.filter(opt => opt.id !== option.id);

        setOptions(_updatedArr);
        let str = JSON.stringify(_updatedArr);
        handleRadioOptions(str, fieldId);
    }

    function addRadioOption() {
        let currentState = [...options];
        let newOption = {
            id: makeid(4),
            label: `Value ${currentState.length + 1}`,
            value: `value${currentState.length + 1}`,
        };
        currentState.push(newOption);

        setOptions(currentState);
        let fieldId = "array";

        let str = JSON.stringify(currentState);
        handleRadioOptions(str, fieldId);
    }

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    function isArrayEmpty(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === "") return true;
        }
        return false;
    }

    return (
        <div className="">
            {fieldsArr &&
                fieldsArr.map(field => {
                    return (
                        <React.Fragment key={field.id}>
                            {field.hidden ? null : (
                                <div className="mb-3">
                                    <label className="form-label">
                                        {field.label}
                                        {field.required &&
                                            field.required === "YES" && (
                                                <span className="text-danger">
                                                    &nbsp;*
                                                </span>
                                            )}
                                    </label>
                                    {field.type === "array" && (
                                        <span className="float-end">
                                            <span className="me-1 px-2 rounded-circle bg-dark text-light">
                                                {options.length}
                                            </span>
                                            <span
                                                className="float-end pointer"
                                                data-bs-toggle="tooltip"
                                                data-bs-title="Create new list item"
                                                onClick={addRadioOption}>
                                                <i className="fs-5 fa-solid fa-plus"></i>
                                            </span>
                                        </span>
                                    )}

                                    {field.type === "text" && (
                                        <div>
                                            <input
                                                type={field.type}
                                                name={field.id}
                                                className={`form-control form-control-sm ${
                                                    field.required &&
                                                    field.required === "YES"
                                                        ? inputField[field.id]
                                                            ? ""
                                                            : "form-control-danger"
                                                        : ""
                                                } `}
                                                onChange={e =>
                                                    handleInputField(e)
                                                }
                                                value={
                                                    inputField[field.id]
                                                        ? inputField[field.id]
                                                        : ""
                                                }
                                            />
                                            {field.required &&
                                                field.required === "YES" &&
                                                (inputField[field.id] ? (
                                                    ""
                                                ) : (
                                                    <span className="text-danger">
                                                        <small>{`${field.label} is required.`}</small>
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                    {field.type === "number" && (
                                        <input
                                            type={field.type}
                                            name={field.id}
                                            className="form-control form-control-sm"
                                            onChange={e => handleInputField(e)}
                                            value={
                                                inputField[field.id]
                                                    ? inputField[field.id]
                                                    : ""
                                            }
                                        />
                                    )}
                                    {field.type === "date" && (
                                        <div>
                                            <input
                                                type={field.type}
                                                name={field.id}
                                                className={`form-control form-control-sm ${
                                                    field.required &&
                                                    field.required === "YES"
                                                        ? inputField[field.id]
                                                            ? ""
                                                            : "form-control-danger"
                                                        : ""
                                                } `}
                                                onChange={e =>
                                                    handleInputField(e)
                                                }
                                                value={
                                                    inputField[field.id]
                                                        ? inputField[field.id]
                                                        : ""
                                                }
                                            />
                                            {field.required &&
                                                field.required === "YES" &&
                                                (inputField[field.id] ? (
                                                    ""
                                                ) : (
                                                    <span className="text-danger">
                                                        <small>{`${field.label} is required.`}</small>
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                    {field.type === "time" && (
                                        <div>
                                            <input
                                                type={field.type}
                                                name={field.id}
                                                className={`form-control form-control-sm ${
                                                    field.required &&
                                                    field.required === "YES"
                                                        ? inputField[field.id]
                                                            ? ""
                                                            : "form-control-danger"
                                                        : ""
                                                } `}
                                                onChange={e =>
                                                    handleInputField(e)
                                                }
                                                value={
                                                    inputField[field.id]
                                                        ? inputField[field.id]
                                                        : ""
                                                }
                                            />
                                            {field.required &&
                                                field.required === "YES" &&
                                                (inputField[field.id] ? (
                                                    ""
                                                ) : (
                                                    <span className="text-danger">
                                                        <small>{`${field.label} is required.`}</small>
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                    {field.type === "datetime-local" && (
                                        <div>
                                            <input
                                                type={field.type}
                                                name={field.id}
                                                className={`form-control form-control-sm ${
                                                    field.required &&
                                                    field.required === "YES"
                                                        ? inputField[field.id]
                                                            ? ""
                                                            : "form-control-danger"
                                                        : ""
                                                } `}
                                                onChange={e =>
                                                    handleInputField(e)
                                                }
                                                value={
                                                    inputField[field.id]
                                                        ? inputField[field.id]
                                                        : ""
                                                }
                                            />
                                            {field.required &&
                                                field.required === "YES" &&
                                                (inputField[field.id] ? (
                                                    ""
                                                ) : (
                                                    <span className="text-danger">
                                                        <small>{`${field.label} is required.`}</small>
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                    {field.type === "image" && (
                                        <div>
                                            <input
                                                type="file"
                                                name={field.id}
                                                className={`form-control form-control-sm ${
                                                    field.required &&
                                                    field.required === "YES"
                                                        ? inputField[field.id]
                                                            ? ""
                                                            : "form-control-danger"
                                                        : ""
                                                } `}
                                                onChange={e =>
                                                    handleImageUpload(e)
                                                }
                                            />
                                            {field.required &&
                                                field.required === "YES" &&
                                                (inputField[field.id] ? (
                                                    ""
                                                ) : (
                                                    <span className="text-danger">
                                                        <small>{`${field.label} is required.`}</small>
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                    {field.type === "checkbox" && (
                                        <input
                                            type={field.type}
                                            name={field.id}
                                            className="float-end form-check-input"
                                            onChange={e => handleInputField(e)}
                                            checked={
                                                inputField[field.id] === "YES"
                                                    ? true
                                                    : false
                                            }
                                        />
                                    )}
                                    {field.type === "options" && (
                                        <div>
                                            <select
                                                className="form-select form-select-sm"
                                                name={field.id}
                                                value={
                                                    inputField[field.id]
                                                        ? inputField[field.id]
                                                        : ""
                                                }
                                                onChange={e =>
                                                    handleInputField(e)
                                                }>
                                                <option value="">
                                                    Select {field.label}
                                                </option>
                                                {field.options.map(
                                                    (item, index) => (
                                                        <option
                                                            key={index}
                                                            value={item.value}>
                                                            {item.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                    )}
                                    {field.type === "richtext" && (
                                        <div>
                                            <TextEditor
                                                name={field.id}
                                                id="random-id"
                                                value={
                                                    inputField[field.id]
                                                        ? inputField[field.id]
                                                        : ""
                                                }
                                                height="220px"
                                                onChange={newValue => {
                                                    let name = field.id;
                                                    let value = newValue;
                                                    let e = {};
                                                    e.target = {
                                                        name,
                                                        value,
                                                    };
                                                    handleInputField(e);
                                                }}
                                            />

                                            {/* <textarea
                                                    type={field.type}
                                                    name={field.id}
                                                    className={`form-control form-control-sm ${
                                                        field.required &&
                                                        field.required === "YES"
                                                            ? inputField[
                                                                  field.id
                                                              ]
                                                                ? ""
                                                                : "form-control-danger"
                                                            : ""
                                                    } `}
                                                    onChange={(e) =>
                                                        handleInputField(e)
                                                    }
                                                    value={
                                                        inputField[field.id]
                                                            ? inputField[
                                                                  field.id
                                                              ]
                                                            : ""
                                                    }
                                                /> */}
                                            {field.required &&
                                                field.required === "YES" &&
                                                (inputField[field.id] ? (
                                                    ""
                                                ) : (
                                                    <span className="text-danger">
                                                        <small>{`${field.label} is required.`}</small>
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                    {field.type === "textarea" && (
                                        <div>
                                            <textarea
                                                type={field.type}
                                                name={field.id}
                                                className={`form-control form-control-sm ${
                                                    field.required &&
                                                    field.required === "YES"
                                                        ? inputField[field.id]
                                                            ? ""
                                                            : "form-control-danger"
                                                        : ""
                                                } `}
                                                onChange={e =>
                                                    handleInputField(e)
                                                }
                                                value={
                                                    inputField[field.id]
                                                        ? inputField[field.id]
                                                        : ""
                                                }
                                            />
                                            {field.required &&
                                                field.required === "YES" &&
                                                (inputField[field.id] ? (
                                                    ""
                                                ) : (
                                                    <span className="text-danger">
                                                        <small>{`${field.label} is required.`}</small>
                                                    </span>
                                                ))}
                                        </div>
                                    )}

                                    {field.type === "array" && (
                                        <div
                                            id={`${field.type}-selection`}
                                            className="accordion accordion-flush">
                                            {options.map((option, index) => {
                                                return (
                                                    <div key={option.id}>
                                                        <div className="accordion-item bg-light ">
                                                            <h2 className="accordion-header">
                                                                <button
                                                                    className="accordion-button bg-light p-2 collapsed"
                                                                    type="button"
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target={`#${option.value}`}>
                                                                    {
                                                                        option.label
                                                                    }
                                                                </button>
                                                            </h2>
                                                            <div
                                                                id={
                                                                    option.value
                                                                }
                                                                className="accordion-collapse collapse"
                                                                data-bs-parent={`#${field.type}-selection`}>
                                                                <div className="accordion-body py-1 px-2 d-flex">
                                                                    <div className="me-1">
                                                                        <label className="mb-0 form-label">
                                                                            Label
                                                                        </label>
                                                                        <input
                                                                            className="form-control form-control-sm "
                                                                            type="text"
                                                                            data-id={
                                                                                option.id
                                                                            }
                                                                            name="label"
                                                                            value={
                                                                                option.label
                                                                            }
                                                                            onChange={e =>
                                                                                handleOptionsChange(
                                                                                    e,
                                                                                    field.type,
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="">
                                                                        <label className="mb-0 form-label">
                                                                            Value
                                                                        </label>
                                                                        <input
                                                                            className="form-control form-control-sm"
                                                                            type="text"
                                                                            name="value"
                                                                            data-id={
                                                                                option.id
                                                                            }
                                                                            value={
                                                                                option.value
                                                                            }
                                                                            onChange={e =>
                                                                                handleOptionsChange(
                                                                                    e,
                                                                                    field.type,
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div
                                                                        onClick={() =>
                                                                            handleRadioOptDelete(
                                                                                option,
                                                                                field.type,
                                                                            )
                                                                        }
                                                                        className="d-flex justify-content-center align-items-center pointer">
                                                                        <i className=" fa-solid fa-trash text-danger ps-2"></i>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
        </div>
    );
}
