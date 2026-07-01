import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import CheckboxPropsEditor from "../../props-editors/CheckboxPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
/**
 *
 *
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function CheckBox(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [isValidField, setIsValidField] = useState(true);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

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
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }

        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        let key = props.component.data.db_column;
        let value = props.formData[key];
        setObj(prev => ({
            ...prev,
            [key]: value,
        }));
        setData(props.formData);
    }, [props.formData, props.component.data]);

    function handleChange(e) {
        let key = e.target.id;
        let value = "";
        if (componentData.use_custom === "true") {
            value = e.target.checked
                ? componentData.checkedValue
                : componentData.uncheckValue;
        } else {
            value = e.target.checked ? "true" : "false";
        }

        let isValid = true;

        if (componentData.required === "YES" && value === "false") {
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
            if (props.handleOnFieldBlur && e.type === "change") {
                props.handleOnFieldBlur("CHECKBOX", value);
            }
        }
    }

    function handleOnBlur(event) {
        handleChange(event);
    }

    const Error = () => {
        return <div>Error occurred in checkbox.</div>;
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
            <div className="mb-3 p-3">
                <label className="form-label">Checkbox</label>
                <input
                    type="text"
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
        <div className={"s2a-checkbox-form " + userDefineClasses()}>
            <ErrorBoundary render={() => Error}>
                {visible && (
                    <div className="field-padding">
                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <span
                                    className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                    onClick={() => setShow(true)}></span>
                            )}
                        <div className="form-check">
                            {props.mode &&
                                props.modeType &&
                                (props.mode === props.modeType.design ||
                                    props.mode === props.modeType.readonly) && (
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={
                                            componentData.use_custom === "true"
                                                ? obj[
                                                      componentData.db_column
                                                  ] ===
                                                  componentData.checkedValue
                                                    ? true
                                                    : false
                                                : obj[
                                                      componentData.db_column
                                                  ] === "true"
                                                ? true
                                                : false
                                        }
                                        disabled
                                    />
                                )}

                            {props.mode &&
                                props.modeType &&
                                (props.mode === props.modeType.preview ||
                                    props.mode === props.modeType.render) && (
                                    <>
                                        {componentData.use_custom === "true" ? (
                                            <input
                                                type="checkbox"
                                                className={`form-check-input ${
                                                    componentData.required &&
                                                    componentData.required ===
                                                        "YES"
                                                        ? isValidField
                                                            ? ""
                                                            : "form-control-danger"
                                                        : ""
                                                } `}
                                                id={
                                                    componentData.db_column &&
                                                    componentData.db_column
                                                }
                                                // value={obj[obj.key] ? obj[obj.key] : ""}
                                                // value={obj[componentData.db_column]}

                                                checked={
                                                    componentData.use_custom ===
                                                    "true"
                                                        ? obj[
                                                              componentData
                                                                  .db_column
                                                          ] ===
                                                          componentData.checkedValue
                                                            ? true
                                                            : false
                                                        : obj[
                                                              componentData
                                                                  .db_column
                                                          ] === "true"
                                                        ? true
                                                        : false
                                                }
                                                onChange={handleChange}
                                                onBlur={handleOnBlur}
                                                disabled={
                                                    props.mode ===
                                                    props.modeType.design
                                                        ? true
                                                        : componentData.readonly ===
                                                          "YES"
                                                        ? true
                                                        : disable
                                                        ? true
                                                        : false
                                                }
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                className={`form-check-input ${
                                                    componentData.required &&
                                                    componentData.required ===
                                                        "YES"
                                                        ? isValidField
                                                            ? ""
                                                            : "form-control-danger"
                                                        : ""
                                                } `}
                                                id={
                                                    componentData.db_column &&
                                                    componentData.db_column
                                                }
                                                // value={obj[obj.key] ? obj[obj.key] : ""}
                                                // value={obj[componentData.db_column]}
                                                checked={
                                                    obj[
                                                        componentData.db_column
                                                    ] === "true"
                                                        ? true
                                                        : false
                                                }
                                                onChange={handleChange}
                                                onBlur={handleOnBlur}
                                                disabled={
                                                    props.mode ===
                                                    props.modeType.design
                                                        ? true
                                                        : componentData.readonly ===
                                                          "YES"
                                                        ? true
                                                        : disable
                                                        ? true
                                                        : false
                                                }
                                            />
                                        )}
                                    </>
                                )}
                            {!props.isInDatalistMode && (
                                <label className="form-check-label">
                                    {componentData.label
                                        ? componentData.label
                                        : "Checkbox"}
                                    {componentData.required &&
                                        componentData.required === "YES" && (
                                            <span className="text-danger">
                                                &nbsp;*
                                            </span>
                                        )}
                                </label>
                            )}
                            {props.mode &&
                                props.modeType &&
                                (props.mode === props.modeType.preview ||
                                    props.mode === props.modeType.render) && (
                                    <p className="text-danger">
                                        {message && <span>{message}</span>}
                                    </p>
                                )}

                            {/* <code>{JSON.stringify(obj)}</code> */}
                        </div>
                    </div>
                )}
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
                            <span>Edit Checkbox</span>
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
                        <CheckboxPropsEditor setShow={setShow} />
                    </Modal.Body>
                </Modal>
            </ErrorBoundary>
        </div>
    );
}

export default CheckBox;
