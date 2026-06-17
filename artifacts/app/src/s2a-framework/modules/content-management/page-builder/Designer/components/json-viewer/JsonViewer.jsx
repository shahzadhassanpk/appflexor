import { javascript } from "@codemirror/lang-javascript";
import ReactCodeMirror from "@uiw/react-codemirror";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import JsonPropsEditor from "../../../../../data-management/form-builder/Designer/props-editors/JsonPropsEditor";
import { isEmpty } from "../../../../../data-management/form-builder/Forms/FormViewer/utils";
import { evaluateExpression } from "../../../datalist-viewer/datalist-filter-helpers/DatalistFilters";
import GenericJsonViewer from "./GenericJsonViewer";

const JsonViewer = props => {
    const { mode, modeType } = props;
    const [show, setShow] = useState(false);
    const [visible, setVisible] = useState(true);
    const [componentData, setComponentData] = useState({});
    const [obj, setObj] = useState({});
    const [data, setData] = useState({});
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const jsonViewModes = {
        PREVIEW_MODE: <JsonEditor data={data[componentData?.db_column]} />,
        DESIGN_MODE: `Json viewer added successfully`,
        READONLY_MODE: `Json viewer added successfully`,
        RENDER_MODE: <JsonEditor data={data[componentData?.db_column]} />,
    };

    useEffect(() => {
        if (props.mode !== props.modeType.design) {
            try {
                let visibleExp = props.component.data.condition;
                let disableExp = props.component.data.disabled;

                if (disableExp && disableExp !== "") {
                    setDisable(
                        evaluateExpression({ expression: disableExp }, data),
                    );
                }
                if (visibleExp && visibleExp !== "") {
                    setVisible(
                        !evaluateExpression({ expression: visibleExp }, data),
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
        let value = props.formData[key];

        if (
            props.component.data.regex &&
            props.component.data.regex.length > 0
        ) {
            const regexExp = new RegExp(props.component.data.regex);

            let strToValidate = value;
            let strIsValid = regexExp.test(strToValidate);

            if (!strIsValid) {
                let regexInfo = `Field must match regex pattern.`;
                if (props.component.data.regexinfo) {
                    regexInfo = props.component.data.regexinfo;
                }
                setMessage(regexInfo);
            } else {
                setMessage("");
            }
        }
        setData(props.formData);
    }, [props.formData, props.component.data]);

    const onEditorChange = value => {
        console.log(value);
    };

    const checkMode = () => {
        let readOnly = false;
        if (mode === modeType.design) {
            readOnly = true;
        } else if (mode === modeType.preview) {
            readOnly = true;
        } else if (mode === modeType.readonly) {
            readOnly = true;
        } else if (mode === modeType.render) {
            readOnly = false;
        }
        return readOnly;
    };

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <div className={"s2a-jsonviewer " + userDefineClasses()}>
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
                        <span>Edit JSON Field</span>
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
                    <JsonPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
            {visible && (
                <div>
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
                                : "Json field"}
                            {componentData.required &&
                                componentData.required === "YES" && (
                                    <span className="text-danger">&nbsp;*</span>
                                )}
                        </label>
                    )}
                </div>
            )}
            {jsonViewModes[mode]}
        </div>
    );
};

function JsonEditor(props) {
    const { onEditorChange, data } = props;
    // console.log("JSON Data:", data);
    return (
        <>
        {data && <GenericJsonViewer
            label="Invoice Details"
            style={{ maxHeight: "400px", overflowY: "auto", color: "black !important" }}
            data={data}
            // fieldTypeMap={fieldTypeMap}
            onChange={updatedData => console.log("Updated JSON:", updatedData)}
        />
        }
        </>
        // <ReactCodeMirror
        //     readOnly={true}
        //     // readOnly={checkMode()}
        //     value={JSON.stringify(data, null, 2)}
        //     height="50vh"
        //     theme="dark"
        //     extensions={[javascript({ jsx: true })]}
        //     onChange={(value, viewUpdate) => {
        //         onEditorChange(value);
        //     }}
        // />
    );
}
export default JsonViewer;
