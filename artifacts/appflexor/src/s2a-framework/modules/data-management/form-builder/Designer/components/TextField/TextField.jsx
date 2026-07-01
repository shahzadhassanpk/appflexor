import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import TextPropsEditor from "../../props-editors/TextPropsEditor";
import {
    evaluateExpression,
    evaluateExpressionDefault,
} from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";

/**
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function TextField(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const [defaultValue, setDefaultValue] = useState("");
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const expressionProps = useGlobalData();
    var key = props.component.data.db_column;

    // useEffect(() => {
    //     if(props?.formData){
    //         console.log("*************** Text Field form data > "+JSON.stringify(props?.formData));
    //     }

    // }, [props?.formData]);

    useEffect(() => {
        if (key === "operator_id") {
            console.log("*************** defaultValue > " + defaultValue);
        }
        if (
            componentData.db_column &&
            props.handleInputFields &&
            defaultValue !== ""
        ) {
            let valid = validateValue(defaultValue);

            props.handleInputFields(
                componentData.db_column,
                defaultValue,
                valid,
            );
        }
    }, [defaultValue, props.dataKeys]);

    useEffect(() => {
        if (!data.id && !props.dataKeys) {
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
                // if(key==="operator_id"){
                //     debugger
                // }
                let stringToValidate = props.formData[key]
                    ? props.formData[key]
                    : "";
                if (
                    // props.isFormSaved ||
                    data.id &&
                    data.id !== "new"
                ) {
                    let defaultExp = props.component.data.value;
                    let isExp = props?.component?.data?.isExpression;
                    if (
                        defaultExp &&
                        defaultExp !== "" &&
                        isExp == "YES" &&
                        defaultExp !== defaultValue
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
                        defaultExp !== "" &&
                        defaultExp !== defaultValue
                        // &&  (!stringToValidate ||
                        //     stringToValidate === "" ||
                        //     stringToValidate === defaultExp)
                    ) {
                        if (isExp == "YES") {
                            let _d = evaluateExpressionDefault(
                                { expression: defaultExp },
                                data,
                                props.dataKeys,
                                ...expressionProps,
                            );

                            setDefaultValue(_d);
                        }else {
                            setDefaultValue(defaultExp);
                        }
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
        let stringToValidate = e.target.value;
        let isStringValid = true;
        let lengthOfString = stringToValidate.length;

        let _message = "";

        let minCharacters = parseInt(componentData.min_characters);
        let maxCharacters = parseInt(componentData.max_characters);

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

        if (isStringValid && componentData.required === "YES") {
            if (lengthOfString > 0) {
                isStringValid = true;
                _message = "";
            } else {
                isStringValid = false;
                _message = "Required field.";
            }
        }

        if (
            isStringValid &&
            componentData.regex &&
            componentData.regex.length > 0
        ) {
            const regexExp = new RegExp(componentData.regex);
            let validationPassed = regexExp.test(stringToValidate);

            if (!validationPassed) {
                let regexInfo = `Field must match regex pattern.`;
                if (componentData.regexinfo) {
                    regexInfo = componentData.regexinfo;
                }
                isStringValid = false;
                _message = regexInfo;
            } else {
                _message = "";
            }
        }

        setIsValidField(isStringValid);
        setMessage(_message);

        setObj(prev => ({
            ...prev,
            [key]: stringToValidate,
        }));

        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            props.handleInputFields(
                componentData.db_column,
                stringToValidate,
                isStringValid,
            );
        }
    }

    function handleOnBlur(event) {
        if (props.handleOnFieldBlur) {
            let value = event.target.value;
            props.handleOnFieldBlur(value);
        } else {
            handleChange(event);
        }
    }

    const Error = () => {
        return <div>Error occurred in Text Field.</div>;
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    // if (isEmpty(componentData))
    //     return (
    //         <div className="mb-3 p-3">
    //             <label className="form-label">Text Field</label>
    //             <input
    //                 type="text"
    //                 className="form-control form-control-sm"
    //                 disabled
    //             />
    //         </div>
    //     );

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <ErrorBoundary render={() => Error}>
            {/* {props.mode === props.modeType.render && (
                <pre>
                    <code>{JSON.stringify(componentData, null, 2)}</code>
                </pre>
            )} */}
            <div className={`form-group s2a-textfield ${userDefineClasses()}`}>
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
                            <label className="form-label">
                                {componentData.label
                                    ? componentData.label
                                    : "Text field"}
                                {componentData.required &&
                                    componentData.required === "YES" && (
                                        <span className="text-danger">
                                            &nbsp;*
                                        </span>
                                    )}
                            </label>
                        )}
                    </>
                )}
                {props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.design && (
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Text"
                            value={obj[componentData.db_column]}
                            disabled
                        />
                    )}
                {props.mode &&
                    props.modeType &&
                    props.mode === props.modeType.readonly && (
                        <input
                            type="text"
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
                                        type="text"
                                        className={`form-control  form-control-sm ${
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
                                        pattern={
                                            props &&
                                            props.component &&
                                            props.component.data &&
                                            props.component.data.regex
                                        }
                                        required
                                        // value={obj[obj.key] ? obj[obj.key] : ""}

                                        value={obj[componentData.db_column]}
                                        onChange={handleChange}
                                        onFocus={handleChange}
                                        onBlur={e => handleOnBlur(e)}
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
                                    {message && (
                                        <div className="fa-3xl">
                                            <i
                                                title={message}
                                                className="position-absolute top-50 end-0 translate-middle-y pe-2  fa-fade text-danger fa-regular fa-circle-question"></i>
                                        </div>
                                    )}

                                    {/* <p className="text-danger">
                                        {message && <span>{message}</span>}
                                    </p> */}
                                </div>
                            )}
                        </>
                    )}
            </div>
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
                        <span>Edit Textfield</span>
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
                    <TextPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}

export default TextField;
