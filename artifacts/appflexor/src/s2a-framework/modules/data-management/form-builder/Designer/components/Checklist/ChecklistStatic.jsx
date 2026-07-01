import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import CheckListPropsEditor from "../../props-editors/CheckListPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";

/**
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function CheckList(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [options, setOptions] = useState([]);
    const [updatedOptions, setUpdatedOptions] = useState([]);
    const [message, setMessage] = useState("");
    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (props.mode !== props.modeType.design) {
            try {
                let visibleExp = props.component.data.condition;
                let disableExp = props.component.data.disabled;
                if (disableExp && disableExp !== "") {
                    setDisable(
                        evaluateExpression(
                            { expression: disableExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
                if (visibleExp && visibleExp !== "") {
                    setVisible(
                        !evaluateExpression(
                            { expression: visibleExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [data]);

    useEffect(() => {
        if (props.component && props.component.data && props.component.props) {
            setComponentData(props.component.data);
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
            // if (key && value && props.handleInputFields) {
            //     props.handleInputFields(key, value);
            // }
        }
    }, [props]);

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
        setData(props.formData);
        setUpdatedOptions(_options);
    }, [props.formData, options]);

    function handleChange(e) {
        let id = e.target.getAttribute("data-id");
        let key = componentData.db_column;
        let checked = e.target.checked;
        let isValid = true;

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
        let idsStr = "";
        if (ids.length > 0) {
            idsStr = JSON.stringify(ids);
        }

        // TODO: check for isRequired & maxLength

        if (componentData.required === "YES") {
            if (ids.length > 0) {
                isValid = true;
            } else {
                isValid = false;
            }
        }
        setIsValidField(isValid);
        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            console.log(e);
            props.handleInputFields(componentData.db_column, idsStr, isValid);
            if (props.handleOnFieldBlur && e.type === "change") {
                props.handleOnFieldBlur("CHECKLIST", idsStr);
            }
        }
    }

    function handleOnBlur(event) {
        handleChange(event);
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

    const Error = () => {
        return <div>Error occurred in Checklist field.</div>;
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

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    if (isEmpty(componentData))
        return (
            <div className="p-3 mb-3">
                <label className="form-label">Checklist</label>
            </div>
        );

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <div className={"field-padding " + userDefineClasses()}>
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design && (
                            <span
                                className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                onClick={() => setShow(true)}></span>
                        )}
                    {!props.isInDatalistMode && (
                        <label className="form-label d-flex">
                            {componentData.label
                                ? componentData.label
                                : "Checklist"}
                            {componentData.required &&
                                componentData.required === "YES" && (
                                    <span className="text-danger">&nbsp;*</span>
                                )}
                        </label>
                    )}
                    <label>
                        {componentData.style ? componentData.style : ""}
                    </label>
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design &&
                        options &&
                        options.map(option => {
                            return (
                                <div
                                    className={`form-check ${
                                        componentData.inline === "YES"
                                            ? "form-check-inline"
                                            : ""
                                    }`}>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name={componentData.db_column}
                                        value={option.value}
                                        data-id={option.id}
                                        onChange={handleChange}
                                        disabled
                                    />
                                    <label className={`${componentData.style}`}>
                                        {option.label}
                                    </label>
                                </div>
                            );
                        })}

                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.readonly &&
                        updatedOptions &&
                        updatedOptions.map(option => {
                            return (
                                <div
                                    className={`form-check ${
                                        componentData.inline === "YES"
                                            ? "form-check-inline"
                                            : ""
                                    }`}>
                                    <input
                                        className={`form-check-input ${
                                            componentData.required &&
                                            componentData.required === "YES"
                                                ? isValidField
                                                    ? ""
                                                    : "form-control-danger"
                                                : ""
                                        } `}
                                        type="checkbox"
                                        name={componentData.db_column}
                                        value={option.value}
                                        checked={option.isChecked}
                                        data-id={option.id}
                                        onChange={handleChange}
                                        onBlur={handleChange}
                                        disabled={true}
                                    />
                                    <label className={`${componentData.style}`}>
                                        {option.label}
                                    </label>
                                </div>
                            );
                        })}

                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.preview &&
                        options &&
                        options.map(option => {
                            return (
                                <div
                                    className={`form-check ${
                                        componentData.inline === "YES"
                                            ? "form-check-inline"
                                            : ""
                                    }`}>
                                    <input
                                        className={`form-check-input ${
                                            componentData.required &&
                                            componentData.required === "YES"
                                                ? isValidField
                                                    ? ""
                                                    : "form-control-danger"
                                                : ""
                                        } `}
                                        type="checkbox"
                                        name={componentData.db_column}
                                        value={option.value}
                                        checked={option.isChecked}
                                        data-id={option.id}
                                        onBlur={handleChange}
                                        onChange={handleChange}
                                        disabled={
                                            props.mode === props.modeType.design
                                                ? true
                                                : componentData.readonly ===
                                                  "YES"
                                                ? true
                                                : disable
                                                ? true
                                                : false
                                        }
                                    />
                                    <label className={`${componentData.style}`}>
                                        {option.label}
                                    </label>
                                </div>
                            );
                        })}
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.render &&
                        updatedOptions &&
                        updatedOptions.map(option => {
                            return (
                                <div
                                    className={`form-check ${
                                        componentData.inline === "YES"
                                            ? "form-check-inline"
                                            : ""
                                    }`}>
                                    <input
                                        className={`form-check-input ${
                                            componentData.required &&
                                            componentData.required === "YES"
                                                ? isValidField
                                                    ? ""
                                                    : "form-control-danger"
                                                : ""
                                        } `}
                                        type="checkbox"
                                        name={componentData.db_column}
                                        value={option.value}
                                        checked={option.isChecked}
                                        data-id={option.id}
                                        onChange={handleChange}
                                        onBlur={handleOnBlur}
                                        disabled={
                                            props.mode === props.modeType.design
                                                ? true
                                                : componentData.readonly ===
                                                  "YES"
                                                ? true
                                                : disable
                                                ? true
                                                : false
                                        }
                                    />
                                    <label className={`${componentData.style}`}>
                                        {option.label}
                                    </label>
                                </div>
                            );
                        })}
                    {/* <code>
                    <pre>{JSON.stringify(options, null, 2)}</pre>
                </code> */}
                </div>
            )}
            <Modal
                show={show}
                onHide={() => setShow(false)}
                // backdrop="static"
                keyboard={true}
                animation={true}
                size="lg">
                <Modal.Header>
                    <Modal.Title>Edit CheckList</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CheckListPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export default CheckList;
