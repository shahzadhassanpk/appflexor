import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import TextEditor from "../../../../../../components/TextEditor/RichTextEditor";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import DesignerContext from "../../../Context/DesignerContext";
import HTMLPropsEditor from "../../props-editors/HTMLPropsEditor";
import useGlobalData from "../../../../../../components/useGlobal";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function HTML(props) {
    // const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    const [show, setShow] = useState(false);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});

    const expressionProps = useGlobalData();

    useEffect(() => {
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
    }, [data]);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }
    }, [props.component.data]);

    const Error = () => {
        return (
            <div>
                <center className="text-danger">Error occurred in HTML</center>
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
                <label className="form-label">HTML</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <div
                    className={
                        "s2a-html " +
                        componentData?.classes +
                        " " +
                        componentData?.db_column
                    }>
                    <>
                        {props.mode &&
                            props.modeType &&
                            props.mode !== props.modeType.design && (
                                <RenderHTML
                                    componentData={componentData}
                                    htmlCollection={
                                        props.htmlCollection
                                    }></RenderHTML>
                            )}

                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <div className="">
                                    <div className="d-flex justify-content-center align-items-center pointer">
                                        <span
                                            className="m-2 fa-regular fa-pen-to-square mx-1"
                                            onClick={() =>
                                                setShow(true)
                                            }></span>{" "}
                                        Enter Text
                                    </div>
                                    <RenderHTML
                                    componentData={componentData}
                                    htmlCollection={
                                        props.htmlCollection
                                    }></RenderHTML>
                                </div>
                            )}
                    </>
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
                                <span>Edit HTML</span>
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
                            <HTMLPropsEditor setShow={setShow} />
                            {/* <UpdateRichText setShow={setShow} /> */}
                        </Modal.Body>
                    </Modal>
                </div>
            )}
        </ErrorBoundary>
    );
}

function RenderHTML({ componentData, htmlCollection }) {
    const htmlId = componentData?.html_id;
    const iconClass = componentData?.icon;
    const position = componentData?.position;
    const collapse = componentData?.collapse;
    const htmlContent = htmlId ? htmlCollection[htmlId] : "";
    const floating = {
        left: "s2a-html-button",
        right: "s2a-html-button-reverse",
        undefined: "s2a-html-button",
    };
    const collapseClass =
        collapse === "horizontal" ? "collapse collapse-horizontal" : "collapse";

    return collapse && collapse !== "none" ? (
        <div className="s2a-html">
            <div className={floating[position]}>
                <span
                    className={`mb-1`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${htmlId}`}
                    aria-expanded="false"
                    aria-controls="collapse">
                    <i
                        className={`${
                            iconClass ? iconClass : "fa-regular fa-file-lines"
                        }`}></i>
                    
                </span>
            </div>
            <div
                className={collapseClass}
                id={htmlId}>
                <div
                    style={{ width: "inherit" }}
                    className="content-body">
                    <Interweave content={htmlContent} />
                </div>
            </div>
        </div>
    ) : (
        <div className="s2a-html-content">
            <Interweave content={htmlContent} />
        </div>
    );
}

export default HTML;
