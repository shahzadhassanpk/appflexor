import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../../utils/utils";
import DashboardPropsEditor from "../../props-editor/DashbaordPropsEditor";
import DashboardViewer from "./DashboardViewer";

export default function Dashboard(props) {
    const [componentData, setComponentData] = useState({});
    const [dashboard, setDashboard] = useState({
        id: "",
        name: "",
    });
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }

        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
    }, [props.formData, props.component.data]);

    useEffect(() => {
        if (componentData && !isEmpty(componentData)) {
            let str = componentData.value;
            let _obj = tryParseJSONObject(str, {
                id: "",
                name: "",
            });

            setDashboard(_obj);
        }
    }, [componentData]);

    const Error = () => {
        return <div>Error occurred in Dashboard.</div>;
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return (
        <ErrorBoundary render={() => Error}>
            {/* <code>{JSON.stringify(componentData, null, 2)}</code>
            <hr />
            <code>{JSON.stringify(obj, null, 2)}</code>
            ...

            */}

            {/* <pre>
                <code>{JSON.stringify(props, null, 2)}</code>
            </pre> */}

            <div className="field-padding">
                {/* <div>
                    {props.mode &&
                        props.modeType &&
                        props.mode === props.modeType.design && (
                            <span
                                className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                onClick={() => setShow(true)}></span>
                        )}
                    <label className="form-label">
                        {componentData.label ? componentData.label : ""}
                        {componentData.required &&
                            componentData.required === "YES" && (
                                <span className="text-danger">&nbsp;*</span>
                            )}
                    </label>
                </div> */}

                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.design ||
                        props.mode === props.modeType.readonly) && (
                        <div
                            onClick={() => setShow(true)}
                            style={{ minHeight: "100px" }}
                            className="d-flex align-items-center justify-content-center">
                            <span className="text-muted cursor-pointer">
                                <span className="fa-solid fa-calendar icon-space"></span>
                                Dashboard
                                <span className="text-danger">
                                    &nbsp;{dashboard.name}&nbsp;
                                </span>
                                added successfully
                            </span>
                        </div>
                    )}

                {/* <pre>
                    <code>{JSON.stringify(props, null, 2)}</code>
                </pre> */}
                {/* {JSON.stringify(componentData.foreign_key_column)}
                {JSON.stringify(ids)}
                {JSON.stringify(props.formData.id)} */}

                {props.mode === props.modeType.preview ||
                    (props.mode === props.modeType.render && (
                        <div>
                            <DashboardViewer
                                dashboard={dashboard}
                                modeType={props.modeType}
                                mode={props.modeType.render}
                            />
                        </div>
                    ))}

                {/* {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.preview ||
                        props.mode === props.modeType.render) && (
                        <>
                            {visible && (
                                <>
                                    <input
                                        type="text"
                                        className={`form-control form-control-sm ${
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
                                        // value={obj[obj.key] ? obj[obj.key] : ""}

                                        value={obj[componentData.db_column]}
                                        onChange={handleChange}
                                        onBlur={handleChange}
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
                                    <p className="text-danger">
                                        {message && <span>{message}</span>}
                                    </p>
                                </>
                            )}
                        </>
                    )} */}
            </div>
            {/* <code>{JSON.stringify(obj)}</code> */}
            <Modal
                show={show}
                onHide={() => setShow(false)}
                // backdrop="static"
                keyboard={true}
                animation={true}
                size="lg">
                <Modal.Header>
                    <Modal.Title>Edit Dashboard</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <DashboardPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}
