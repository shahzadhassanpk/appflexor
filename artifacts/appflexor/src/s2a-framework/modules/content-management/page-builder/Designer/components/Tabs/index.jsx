import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import DesignerContext from "../../../Context/DesignerContext";
import { TabsViewer, componentList } from "./TabsViewer";
import { makeid } from "../../../../../../utils/utils";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function Tabs(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [options, setOptions] = useState([]);
    const [updatedOptions, setUpdatedOptions] = useState([]);
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (props.component && props.component.data) {
            let temObj = props.component.data;
            temObj.id = makeid(5);
            setComponentData(temObj);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            let _options = [];

            props.component.props.map(props => {
                if (props.type === "array") {
                    try {
                        _options = tryParseJSONObject(props.options, []);
                    } catch (error) {
                        console.log();
                    }
                }
            });

            _options.map(option => {
                option.isChecked = false;
            });

            setOptions(_options);

            setObj({
                [key]: value,
            });

            if (key && value && props.handleInputFields) {
                props.handleInputFields(key, value);
            }
        }
    }, [props.component.data]);

    useEffect(() => {
        if (!props.formData || isEmpty(props.formData) || isEmpty(options)) {
            return;
        }

        let key = props.component.data.db_column;
        let idsString = props.formData[key] || "";

        setObj(prev => ({
            ...prev,
            [key]: idsString,
        }));

        let _options = [];

        options.map(opt => {
            if (idsString.includes(opt.value)) {
                opt.isChecked = true;
                _options.push(opt);
            } else {
                _options.push(opt);
            }
        });

        setUpdatedOptions(_options);
    }, [props.formData, options]);

    function handleChange(e) {
        let id = e.target.getAttribute("data-id");
        let key = componentData.db_column;
        let checked = e.target.checked;
        let isValid = true;

        // TODO: check for isRequired & maxLength

        // if (
        //     componentData.required === "YES" &&
        //     value.trim().length === 0 &&
        //     isValid
        // ) {
        //     isValid = false;
        // }

        let _options = [];

        if (props.mode === props.modeType.preview) {
            _options = [...options];

            _options.map(opt => {
                if (opt.id === id) {
                    opt.isChecked = checked;
                }
            });

            setOptions(_options);
        }

        if (props.mode === props.modeType.render) {
            _options = [...updatedOptions];

            _options.map(opt => {
                if (opt.id === id) {
                    opt.isChecked = checked;
                }
            });

            setUpdatedOptions(_options);
        }

        let ids = getCheckedIds(_options);
        let idsStr = JSON.stringify(ids);

        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            props.handleInputFields(componentData.db_column, idsStr, isValid);
        }
    }

    function getCheckedIds(options) {
        let arr = [];

        options.map(opt => {
            if (opt.isChecked) {
                arr.push(opt.value);
            }
        });

        return arr;
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
    const Error = () => {
        return (
            <div>
                <center className="text-danger">Error occurred in Tabs.</center>
            </div>
        );
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    if (isEmpty(componentData))
        return (
            <div className="p-3 ">
                <label className="form-label">Tabs</label>
                <small className="text-danger"> (no data provided.)</small>
            </div>
        );

    function resizeIframe() {
        let obj = document.getElementById(componentData.id);
        let height = obj.contentWindow.document.documentElement.scrollHeight;
        obj.style.height = height + "px";
        // console.log("************* height:" + height);
        //obj.contentWindow.top = obj;
    }

    return (
        <ErrorBoundary render={() => Error}>
            {props.mode &&
                props.modeType &&
                (props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render) && (
                    <>
                        {/* {componentData.url ? (
                        <div className="iframe-main">
                            <iframe
                                id={componentData.id}
                                onLoad={resizeIframe}
                                src={componentData.url ? componentData.url : ""}
                                className="iframe-body"
                                frameBorder="0"
                                scrolling="no"
                            />
                        </div>
                    ) : (
                        <div style={{ minHeight: "100px" }} className="d-flex align-items-center justify-content-center">
                            <span className="text-muted">
                                No <span className="text-danger">Tabs Data</span> provided.
                            </span>
                        </div>
                    )} */}
                    </>
                )}
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.readonly && (
                    <>
                        {/* {componentData.url ? (
                        <div style={{ minHeight: "100px" }} className="d-flex align-items-center justify-content-center">
                            <span className="text-muted">
                                Points to this URL <span className="text-danger">{componentData.url}</span>
                            </span>
                        </div>
                    ) : (
                        <div style={{ minHeight: "100px" }} className="d-flex align-items-center justify-content-center">
                            <span className="text-muted">
                                No <span className="text-danger">Tabs Data</span> provided.
                            </span>
                        </div>
                    )} */}
                    </>
                )}

            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.design && (
                    <div className={` p-3 position-relative `}>
                        <TabsViewer
                            componentData={componentData}
                            props={props}
                        />
                        {/* {componentData.url ? (
                        <div style={{ minHeight: "100px" }} className="d-flex align-items-center justify-content-center">
                            <span className="text-muted">
                                Points to this URL <span className="text-danger">{componentData.url}</span>
                            </span>
                        </div>
                    ) : (
                        <div style={{ minHeight: "100px" }} className="d-flex align-items-center justify-content-center">
                            <span className="text-muted">
                                No <span className="text-danger">Tabs Data</span> provided.
                            </span>
                        </div>
                    )} */}

                        <div className="">
                            <div
                                className="position-absolute top-0 start-0 pointer"
                                onClick={() => setShow(true)}>
                                <i className="m-2 fa-regular fa-pen-to-square d-block"></i>{" "}
                            </div>
                        </div>
                    </div>
                )}

            <Modal
                show={show}
                onHide={() => setShow(false)}
                // backdrop="static"
                keyboard={true}
                animation={true}>
                <Modal.Header>
                    <Modal.Title>Edit URL</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Settings setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

function Settings({ setShow }) {
    const context = useContext(DesignerContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [inputField, setInputField] = useState({});

    useEffect(() => {
        if (
            context &&
            context.selectedComponent &&
            !isEmpty(context.selectedComponent)
        ) {
            setCurrentComponent(context.selectedComponent);
            setPropsFromComponent(context.selectedComponent.props);
            setInputField(context.selectedComponent.data);
        } else {
            setInputField({});
            setPropsFromComponent([]);
            setCurrentComponent({});
        }
    }, [context]);

    const handleInputField = event => {
        let name = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

        // old
        // setInputField((prev) => ({
        //     ...prev,
        //     [name]: value,
        // }));

        // new
        let _inputField = { ...inputField, [name]: value };
        setInputField(_inputField);

        // let _components = { ...context.components };

        // let tempData = _components[currentComponent.id].data;
        // tempData = { ...tempData, ..._inputField };
        // _components[currentComponent.id].data = tempData;
        // context.setComponents(_components);
    };

    function handleRadioOptions(radioList, fieldId) {
        // let _radioList = [];
        // let arr = [...radioList];

        // arr.map((opt) => {
        //     delete opt.id;
        //     _radioList.push(opt);
        // });

        let _components = { ...context.components };

        let componentProps = _components[currentComponent.id].props;
        let newProps = [];

        componentProps.map(props => {
            if (props.type === fieldId) {
                let temp = props;
                temp.options = radioList;
                newProps.push(temp);
            } else {
                newProps.push(props);
            }
        });

        _components[currentComponent.id].props = newProps;
        context.setComponents(_components);
    }

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };

        let tempData = _components[currentComponent.id].data;
        tempData = { ...tempData, ...inputField };
        _components[currentComponent.id].data = tempData;
        context.setComponents(_components);
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }
    return (
        <ErrorBoundary>
            <div className="p-2">
                <div className="mb-3">
                    <RenderFormFields
                        fieldsArr={propsFromComponent}
                        inputField={inputField}
                        handleInputField={handleInputField}
                        handleRadioOptions={handleRadioOptions}
                    />
                </div>
                <div className="d-flex flex-row justify-content-end">
                    <div className="d-flex flex-row">
                        <button
                            className="btn btn-sm button-theme  mx-1"
                            onClick={() => {
                                handleUpdateComponentData();
                                setShow(false);
                            }}>
                            OK
                        </button>
                        <button
                            className="btn btn-sm btn-light mx-1"
                            onClick={() => {
                                setShow(false);
                            }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export function RenderFormFields({
    fieldsArr,
    inputField,
    handleInputField,
    handleRadioOptions,
}) {
    const [options, setOptions] = useState([]);

    useEffect(() => {
        parseOptions();
    }, [fieldsArr]);

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

    function handleOptionDelete(option, fieldId) {
        let _updatedArr = [];

        _updatedArr = options.filter(opt => opt.id !== option.id);

        setOptions(_updatedArr);
        let str = JSON.stringify(_updatedArr);
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
                                                                        {/* <input
                                                                            className="form-control form-control-sm"
                                                                            type="text"
                                                                            name="value"
                                                                            data-id={option.id}
                                                                            value={option.value}
                                                                            onChange={(e) => handleOptionsChange(e, field.type)}
                                                                        /> */}

                                                                        <select
                                                                            className="form-select form-select-sm"
                                                                            data-id={
                                                                                option.id
                                                                            }
                                                                            name="value"
                                                                            value={
                                                                                option.value
                                                                            }
                                                                            onChange={e =>
                                                                                handleOptionsChange(
                                                                                    e,
                                                                                    field.type,
                                                                                )
                                                                            }>
                                                                            <option value="">
                                                                                Select{" "}
                                                                                {
                                                                                    field.label
                                                                                }
                                                                            </option>

                                                                            {Object.keys(
                                                                                componentList,
                                                                            ).map(
                                                                                (
                                                                                    key,
                                                                                    index,
                                                                                ) => {
                                                                                    return (
                                                                                        <option
                                                                                            value={
                                                                                                key
                                                                                            }>
                                                                                            {
                                                                                                key
                                                                                            }
                                                                                        </option>
                                                                                    );
                                                                                },
                                                                            )}
                                                                        </select>
                                                                    </div>
                                                                    <div
                                                                        onClick={() =>
                                                                            handleOptionDelete(
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

export default Tabs;
