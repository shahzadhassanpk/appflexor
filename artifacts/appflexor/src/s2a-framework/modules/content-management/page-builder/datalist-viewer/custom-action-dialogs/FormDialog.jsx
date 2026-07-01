import React from "react";
import Modal from "react-bootstrap/Modal";
import DataListFormViewer from "../../../../data-management/form-builder/Forms/FormViewer/DataListFormViewer";
import FormViewer from "../../../../data-management/form-builder/Forms/FormViewer/FormViewer";
import { modeType } from "../../Designer/Designer";
import DatalistUrlViewer from "../datalist-view-with-url/DatalistUrlViewer";
import ProcessFormViewer from "../../../../data-management/form-builder/Forms/FormViewer/ProcessFormViewer";
import StartStepProcessor from "../../../../camunda/cam8/StartStepProcessor8";

export default function FormDialog(props) {
    const {
        item,
        record,
        handleActions,
        show,
        setShow,
        parentFormData,
        params,
    } = props;
    const handleClose = () => setShow(false);
    let obj = {};
    try {
        item?.hyper_parameters.forEach(item => {
            obj[item.parameter_name] = record[item.column_name];
        });
    } catch (error) {
        console.log(error);
    }
    const renderTitle = item => {
        return item.title;
    };
    return (
        <>
            <Modal
                className="s2a-modal"
                show={show}
                size={item.modal_size ? item.modal_size : "lg"}
                fullscreen={item.modal_size ? item.modal_size : "lg"}
                onHide={handleClose}
                animation={false}
                onEntered={element => element.removeAttribute("tabindex")}
                backdrop="static">
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{renderTitle(item)}</span>
                        <i
                            className="fa-solid fa-xmark modal-close"
                            onClick={handleClose}></i>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <>
                        {item.link_type === "URL" && (
                            <div className="iframe-main">
                                <iframe
                                    id={item.id}
                                    title={item.id}
                                    // onLoad={resizeIframe}
                                    src={
                                        item.hyper_link
                                            ? item.hyper_link + params
                                            : ""
                                    }
                                    className="hide-header-footer iframe-body"
                                    frameBorder="0"
                                    scrolling="yes"
                                />
                            </div>
                        )}

                        {item.link_type === "FORM" && show && (
                            <DataListFormViewer
                                formKey={item.form}
                                businessKey="new"
                                handleActions={(props) => {
                                    setShow(false);
                                    handleActions(props);                                    
                                }}
                                mode={modeType.render}
                                formVars={obj}
                                external={{ show: show, setShow: setShow }}
                                parentFormData={parentFormData}
                            />
                        )}

                        {show && item.link_type === "DATALIST" && (
                            <DatalistUrlViewer
                                id={item.datalist_id}
                                fkColumn={obj ? Object.keys(obj)[0] : ""}
                                fkValue={obj ? Object.values(obj)[0] : ""}
                                record={record}
                            />
                        )}

                        {show && item.link_type === "PROCESS" && (
                            <StartStepProcessor
                                id={item.process_id}
                                handleProcessActions={handleClose}
                                camundaVars={{}}
                                action={item}
                            />
                        )}
                    </>
                </Modal.Body>
            </Modal>
        </>
    );
}
