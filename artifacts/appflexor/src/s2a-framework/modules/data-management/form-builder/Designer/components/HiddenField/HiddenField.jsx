import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import HiddenPropsEditor from "../../props-editors/HiddenPropsEditor";
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

function HiddenField(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [defaultValue, setDefaultValue] = useState("");
    const [show, setShow] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (
            componentData.db_column &&
            props.handleInputFields &&
            defaultValue !== ""
        ) {
            let valid = validateValue(defaultValue);
            // console.log("********* "+componentData.db_column+" > "+defaultValue);
            props.handleInputFields(
                componentData.db_column,
                defaultValue,
                valid,
            );
        }
    }, [defaultValue, props.dataKeys]);

    useEffect(() => {
        if (!data?.id && !props.dataKeys) {
            return;
        }
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
                let key = props.component.data.db_column;
                let stringToValidate = props.formData[key]
                    ? props.formData[key]
                    : "";
                if (
                    // props.isFormSaved ||
                    // data.id &&
                    data?.id !== "new"
                ) {
                    let defaultExp = props.component.data.value;
                    let isExp = props?.component?.data?.isExpression;
                    if (
                        defaultExp &&
                        defaultExp !== ""
                        && isExp =="YES"
                        && defaultExp !== defaultValue
                        // && (!stringToValidate ||
                        //     stringToValidate === "" ||
                        //     stringToValidate === defaultExp)
                    ) {
                        let _d = evaluateExpressionDefault(
                            { expression: defaultExp },
                            data,
                            props.dataKeys,
                            ...expressionProps,
                        );

                        setDefaultValue(_d);
                    }
                } else if (data.id === "new") {
                    let defaultExp = props.component.data.value;
                    let isExp = props?.component?.data?.isExpression;
                    if (
                        defaultExp &&
                        defaultExp !== ""
                        && isExp =="YES"
                        // &&  (!stringToValidate ||
                        //     stringToValidate === "" ||
                        //     stringToValidate === defaultExp)
                    ) {
                        let _d = evaluateExpressionDefault(
                            { expression: defaultExp },
                            data,
                            props.dataKeys,
                            ...expressionProps,
                        );

                        setDefaultValue(_d);
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [data, props?.dataKeys]);

    useEffect(() => {
        try {
            if (props.component && props.component.data) {
                setComponentData(props.component.data);
            }

            if (!props.formData || isEmpty(props.formData)) {
                return;
            }
            let visibleExp = props.component.data.condition;
            let disableExp = props.component.data.disabled;
            let key = props.component.data.db_column;
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
        } catch (e) {
            console.log("***********" + e);
        }
    }, [
        props.formData,
        props.dataKeys,
        props.component.data,
        props.isFormSaved,
    ]);

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

    // useEffect(() => {
    //     if (props.component && props.component.data) {
    //         setComponentData(props.component.data);
    //     }

    //     if (!props.formData || isEmpty(props.formData)) {
    //         return;
    //     }

    //     let key = props.component.data.db_column;

    //     setObj(prev => ({
    //         ...prev,
    //         [key]: props.formData[key],
    //     }));
    //     let value = props.formData[key];
    //     setData(props.formData);
    // }, [props.formData, props.component.data]);

    function validateValue(stringToValidate) {
        let isStringValid = true;
        let lengthOfString = ("" + stringToValidate).length;

        let _message = "";

        let minCharacters = parseInt(props?.component?.data?.min_characters);
        let maxCharacters = parseInt(props?.component?.data?.max_characters);
        if (!minCharacters) minCharacters = -1; // backtrack compatibility
        if (!maxCharacters) maxCharacters = 255; // backtrack compatibility

        if (
            lengthOfString >= minCharacters &&
            lengthOfString <= maxCharacters
        ) {
            isStringValid = true;
            _message = "";
        } else {
            isStringValid = false;
            _message =
                minCharacters > 0
                    ? `Letter count should be ${minCharacters} to ${maxCharacters}`
                    : `Letter count cannot exceed ${maxCharacters}`;
        }

        if (isStringValid && props.component.data.required === "YES") {
            if (lengthOfString > 0) {
                isStringValid = true;
                _message = "";
            } else {
                isStringValid = false;
                _message = "Required field.";
            }
        }

        if (
            props.component.data.regex &&
            props.component.data.regex.length > 0
        ) {
            const regexExp = new RegExp(props.component.data.regex);

            let strToValidate = stringToValidate;
            let strIsValid = regexExp.test(strToValidate);

            if (!strIsValid) {
                let regexInfo = `Field must match regex pattern.`;
                if (props.component.data.regexinfo) {
                    regexInfo = props.component.data.regexinfo;
                }
                _message = regexInfo;
            } else {
                _message = "";
            }
        }
        setMessage(_message);
        return isStringValid;
    }

    function handleChange(e) {
        let key = e.target.id;
        let value = e.target.value;
        let isValid = true;
        // TODO: check for isRequired & maxLength

        if (
            componentData.required === "YES" &&
            value.trim().length === 0 &&
            isValid
        ) {
            isValid = false;
        }

        setIsValidField(isValid);

        // setObj((prev) => ({
        //     ...prev,
        //     [key]: value,
        // }));

        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            props.handleInputFields(componentData.db_column, value, isValid);
        }
    }

    function evalDefault(expression) {
        try {
            return evaluateExpression({ expression }, data);
        } catch (error) {
            return expression;
        }
    }

    const Error = () => {
        return <div>Error occurred in Hidden Field.</div>;
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
            <div className="mb-3 p-3 visually-hidden">
                <label className="form-label">Hidden Field</label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                />
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <div className="field-padding ">
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design && (
                            <>
                                {" "}
                                {props.mode &&
                                    props.modeType &&
                                    props.mode === props.modeType.design && (
                                        <span
                                            className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                            onClick={() =>
                                                setShow(true)
                                            }></span>
                                    )}
                                <label className="form-label">
                                    {componentData.label
                                        ? componentData.label
                                        : "Hidden field"}
                                    {componentData.required &&
                                        componentData.required === "YES" && (
                                            <span className="text-danger">
                                                &nbsp;*
                                            </span>
                                        )}
                                </label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={obj[componentData.db_column]}
                                    disabled
                                />
                            </>
                        )}
                    {props.mode &&
                        props.modeType &&
                        (props.mode === props.modeType.preview ||
                            props.mode === props.modeType.render ||
                            props.mode === props.modeType.readonly) && (
                            <>
                                <input
                                    type="text"
                                    className={`visually-hidden form-control form-control-sm ${
                                        componentData.required &&
                                        componentData.required === "YES"
                                            ? isValidField
                                                ? ""
                                                : "form-control-danger"
                                            : ""
                                    } `}
                                    id={
                                        componentData.db_column &&
                                        componentData.db_column
                                    }
                                    defaultValue={evalDefault(
                                        props.component.data.value,
                                    )}
                                    // value={obj[obj.key] ? obj[obj.key] : ""}
                                    value={obj[componentData.db_column]}
                                    onChange={handleChange}
                                    onBlur={handleChange}
                                    disabled={
                                        props.mode === props.modeType.design
                                            ? true
                                            : componentData.readonly === "YES"
                                            ? true
                                            : disable
                                            ? true
                                            : false
                                    }
                                />
                                <p className="text-danger">
                                    {message && <span>{message}</span>}
                                </p>
                            </>
                        )}
                    {/* <code>{JSON.stringify(obj)}</code> */}
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
                                <span>Edit Hiddenfield</span>
                                <div className="d-flex">
                                    <div
                                        className={`${
                                            toggleModalWindow === "maximize"
                                                ? "visually-hidden"
                                                : ""
                                        } `}
                                        onClick={() =>
                                            setToggleModalWindow("maximize")
                                        }
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
                                        onClick={() =>
                                            setToggleModalWindow("restore")
                                        }
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
                            <HiddenPropsEditor
                                setShow={setShow}></HiddenPropsEditor>
                        </Modal.Body>
                    </Modal>
                </div>
            )}
        </ErrorBoundary>
    );
}

export default HiddenField;
