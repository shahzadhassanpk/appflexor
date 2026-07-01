import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import NumberPropsEditor from "../../props-editors/NumberPropsEditor";
import {
    evaluateExpression,
    evaluateExpressionDefault,
} from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";

/**
 *
 *
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

const TEN = 10;

function Number(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [defaultValue, setDefaultValue] = useState("");
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const expressionProps = useGlobalData();

    // useEffect(() => {
    //     if (componentData.db_column && props.handleInputFields) {
    //         let value = obj[componentData.db_column];
    //         let valid = validateValue(value);
    //         props.handleInputFields(
    //             componentData.db_column,
    //             defaultValue,
    //             valid,
    //         );
    //     }
    // }, [obj, props.dataKeys]);

    useEffect(() => {
        if (data && !isEmpty(data) && props.mode !== props.modeType.design) {
            try {
                setLoading(true);
                let visibleExp = props.component.data.condition;
                let disableExp = props.component.data.disabled;
                let defaultExp = props.component.data.value;
                if (parseFloat(defaultExp)) {
                    defaultExp = "";
                }
                if (disableExp && disableExp !== "") {
                    let disabled = evaluateExpression(
                        { expression: disableExp },
                        props.formData,
                        ...expressionProps,
                    );
                    setDisable(disabled);
                }
                if (visibleExp && visibleExp !== "") {
                    setVisible(
                        !evaluateExpression(
                            { expression: visibleExp },
                            props.formData,
                            ...expressionProps,
                        ),
                    );
                }
                if (defaultExp && defaultExp !== "") {
                    let _d = evaluateExpressionDefault(
                        { expression: defaultExp },
                        props.formData,
                        props.dataKeys,
                        ...expressionProps,
                    );

                    setDefaultValue(_d);
                }
                setLoading(true);
            } catch (error) {
                console.log(error);
            }
        }
    }, [data, props?.dataKeys]);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }

        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        setLoading(true);
        let visibleExp = props.component.data.condition;
        let disableExp = props.component.data.disabled;
        let defaultExp = props.component.data.value;
        let key = props.component.data.db_column;
        if (parseFloat(defaultExp)) {
            defaultExp = "";
        }
        if (disableExp && disableExp !== "") {
            let disabled = evaluateExpression(
                { expression: disableExp },
                props.formData,
                ...expressionProps,
            );
            setDisable(disabled);
        }
        if (visibleExp && visibleExp !== "") {
            setVisible(
                !evaluateExpression(
                    { expression: visibleExp },
                    props.formData,
                    ...expressionProps,
                ),
            );
        }

        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));
        if (
            props.isFormSaved ||
            (props.formData.id && props.formData.id !== "new")
        ) {
            let value = props.formData[key];
            let valid = validateValue(value);
        }

        setData(props.formData);
        setLoading(false);
    }, [props.formData, props.component.data, props.isFormSaved]);

    function handleChange(e) {
        let key = e.target.id;
        let valueToCheck = e.target.value;
        let valid = validateValue(valueToCheck);
        setObj(prev => ({
            ...prev,
            [key]: valueToCheck,
        }));
        setIsValidField(valid);
        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            props.handleInputFields(
                componentData.db_column,
                valueToCheck,
                valid,
            );
        }
    }

    function validateValue(valueToCheck) {
        let isValueValid = true;
        let _message = "";
        setMessage("");
        if (
            componentData?.required !== "YES" &&
            (!valueToCheck || valueToCheck === "")
        ) {
            return true;
        }

        if (
            props.component.data?.min_decimals=="" ||
            props.component.data?.max_decimals==""
        ) {
            return true;
        }

        let lengthOfString = valueToCheck?.length;
        let parsedValue = parseFloat(valueToCheck);

        let minDecimals = parseFloat(props.component.data.min_decimals ?? 0);
        let maxDecimals = parseFloat(props.component.data.max_decimals ?? 0);

        let minNumber = minDecimals;
        let maxNumber = maxDecimals;

        if (parsedValue >= minNumber && parsedValue <= maxNumber) {
            isValueValid = true;
            _message = "";
        } else {
            isValueValid = false;
            let msg = `${
                componentData.label ? componentData.label : "Number"
            } must stay between ${minNumber} and ${maxNumber}`;

            _message = msg;
        }

        if (isValueValid && componentData.required === "YES") {
            if (lengthOfString > 0) {
                isValueValid = true;
                _message = "";
            } else {
                isValueValid = false;
                _message = "Required field.";
            }
        }

        if (_message) {
            setMessage(_message);
        }

        setIsValidField(isValueValid);
        return isValueValid;
    }

    function evalDefault(expression) {
        try {
            let defaultValue = evaluateExpressionDefault({ expression }, data);
            return defaultValue;
        } catch (error) {
            return expression;
        }
    }

    const Error = () => {
        return <div>Error occurred in Number.</div>;
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function handleOnBlur(event) {
        if (props.handleOnFieldBlur) {
            let value = event.target.value;
            props.handleOnFieldBlur(value);
        } else {
            handleChange(event);
        }
    }

    if (isEmpty(componentData))
        return (
            <div className="mb-3 p-3">
                <label className="form-label">Number</label>
                <input
                    type="number"
                    className="form-control form-control-sm"
                    disabled
                />
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
            <div className={`form-group s2a-number ${userDefineClasses()}`}>
                {visible && (
                    <>
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <span
                                    className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                    onClick={() => setShow(true)}></span>
                            )}
                        {!props.isInDatalistMode && (
                            <>
                                <label className="form-label">
                                    {componentData.label
                                        ? componentData.label
                                        : "Number"}
                                    {componentData.required &&
                                        componentData.required === "YES" && (
                                            <span className="text-danger">
                                                &nbsp;*
                                            </span>
                                        )}
                                </label>
                            </>
                        )}
                    </>
                )}
                {visible &&
                    props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.design ||
                        props.mode === props.modeType.readonly) && (
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            value={obj[componentData.db_column]}
                            disabled
                        />
                    )}
                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.preview ||
                        props.mode === props.modeType.render) && (
                        <>
                            {visible && (
                                <div className="position-relative">
                                    <input
                                        type="number"
                                        className={`form-control form-control-sm ${
                                            message == ""
                                                ? ""
                                                : "form-control-danger"
                                        } `}
                                        id={
                                            componentData.db_column &&
                                            componentData.db_column
                                        }
                                        title={message}
                                        defaultValue={defaultValue}
                                        // value={obj[obj.key] ? obj[obj.key] : ""}
                                        value={obj[componentData.db_column]}
                                        onChange={handleChange}
                                        // onBlur={handleOnBlur}
                                        // onFocus={handleChange}
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
                                </div>
                            )}
                        </>
                    )}
                {/* <code>{JSON.stringify(obj)}</code> */}
            </div>
            <Modal
                className="s2a-modal"
                show={show}
                size="lg"
                onHide={() => setShow(false)}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Edit Number</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={() => setShow(false)}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <NumberPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export default Number;
