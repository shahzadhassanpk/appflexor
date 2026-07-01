import moment from "moment";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { DATE_FORMAT_FOR_USER_VIEW } from "../../../../../../Config";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import TextPropsEditor from "../../props-editors/TextPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
import { formatDateForUserView, localToUTCDateTime, formatDateTimeToISO, formatDateForDataBase, formatDateTimeForDataBase } from "../../../../../../utils/utils";

/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function Date(props) {
    const [obj, setObj] = useState({});
    const [data, setData] = useState({});
    const [componentData, setComponentData] = useState({});

    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            // if (
            //     props.component.data.regex &&
            //     props.component.data.regex.length > 0
            // ) {
            //     const regexExp = new RegExp(props.component.data.regex);
            //     let strToValidate = value;
            //     let strIsValid = regexExp.test(strToValidate);

            //     if (!strIsValid || value) {
            //         setMessage(`Field must match regex pattern.`);
            //     } else {
            //         setMessage("");
            //     }
            // }

            setObj({
                [key]: value,
            });

            // this will set default value and overwrite parents default value

            // if (key && value && props.handleInputFields) {
            //     props.handleInputFields(key, value);
            // }
        }
    }, [props.component.data]);

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
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }

        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        let key = props.component.data.db_column;

        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));
        setData(props.formData);
    }, [props.formData, props.component.data]);

    function handleChange(e) {
        let key = e.target.id;
        let value = e.target.value;        
        setValue(key, value);
        // if (componentData.regex && componentData.regex.length > 0) {
        //     const regexExp = new RegExp(componentData.regex);
        //     let strToValidate = value;
        //     let strIsValid = regexExp.test(strToValidate);

        //     if (!strIsValid) {
        //         setMessage(`Field must match regex pattern.`);
        //     } else {
        //         setMessage("");
        //     }
        // }
        
    }

    function setValue(key, value){
        let isValid = true;
        if (
            componentData.required === "YES" &&
            value.trim().length === 0 &&
            isValid
        ) {
            isValid = false;
        }
        // Changes set locale date to input and utc to db
        console.log("************ value:"+value);
        let local = formatDateTimeToISO(value);
        console.log("************ local:"+local);
        let utc = localToUTCDateTime(local);
        console.log("************ utc:"+utc);
        let dbFormat = formatDateTimeForDataBase(utc);
        setIsValidField(isValid);
        // setObj(prev => ({
        //     ...prev,
        //     [key]: utc,
        // }));
        if (props.handleInputFields) {
            props.handleInputFields(componentData.db_column, value, isValid);
        }
    }

    const Error = () => {
        return <div>Error occurred in Date.</div>;
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
            props.handleOnFieldBlur("DATE", event.target.value);
        }
        handleChange(event);
    }

    if (isEmpty(componentData))
        return (
            <div className="mb-3 p-3">
                <label className="form-label">Date</label>
                <input
                    type="date"
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
            <div className={`form-group s2a-date ${userDefineClasses()}`}>
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
                            <label className="form-label" title={componentData?.date_format}>
                                {componentData.label
                                    ? componentData.label
                                    : "Date"}
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

                {props.mode === props.modeType.design && (
                    <input
                        type="date"
                        title={componentData?.date_format}
                        className="form-control  form-control-sm"
                        value={obj[componentData.db_column]}
                        disabled
                    />
                )}

                {(props.mode === props.modeType.preview ||
                    props.mode === props.modeType.render ||
                    props.mode === props.modeType.readonly) && (
                    <>
                        {visible && (
                            <>
                            {/* {JSON.stringify(componentData)} */}
                                <input
                                    type="date"
                                    title={componentData?.date_format}
                                    data={formatDateForUserView(
                                        obj[componentData.db_column], componentData?.date_format
                                    )}
                                    className={`form-control date-time-picker form-control-sm ${
                                        componentData.required &&
                                        componentData.required === "YES"
                                            ? !isValidField
                                                ? "form-control-danger"
                                                : ""
                                            : ""
                                    } `}
                                    id={
                                        componentData.db_column &&
                                        componentData.db_column
                                    }
                                    value={obj[componentData.db_column]}
                                    onChange={(e)=>handleChange(e)}
                                    // onFocus={(e)=>handleChange(e)}
                                    disabled={
                                        props.mode === props.modeType.design ||
                                        props.mode ===
                                            props.modeType.readonly ||
                                        props.mode === props.modeType.preview
                                            ? true
                                            : componentData.readonly ===
                                                  "YES" || disable
                                            ? true
                                            : false
                                    }
                                />                               
                            </>
                        )}
                    </>
                )}
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
                        <span>Edit Date</span>
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

export default Date;
