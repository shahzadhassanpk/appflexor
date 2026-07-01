import { forwardRef, useImperativeHandle, useState } from "react";
import Modal from "react-bootstrap/Modal";

const ChildrenModal = forwardRef(function ChildrenModal(props, ref) {
    const {
        children,
        header,
        size, // 'sm' | 'lg' | 'xl'
        centered = false,
        modalClass = "s2a-modal-component",
        hideMaximizeButton = false,
        hideCloseButton = false,
        resetCallback,
    } = props;
    const [show, setShow] = useState(false);

    const handleClose = () => {
        setShow(false);

        if (typeof resetCallback === "function") {
            resetCallback();
        }
    };
    const handleShow = () => setShow(true);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    useImperativeHandle(ref, () => {
        return {
            show: handleShow,
            close: handleClose,
        };
    });

    return (
        <>
            <Modal
                className={`s2a-modal ${modalClass}`}
                size={size ? size : "lg"}
                show={show}
                centered={centered ? centered : false}
                onHide={handleClose}
                onEntered={element => element.removeAttribute("tabindex")}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title
                        className="modal-title"
                        title={header}>
                        <span className="header text-truncate">{header}</span>
                        <div className="d-flex">
                            {!hideMaximizeButton && (
                                <>
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
                                        data-bs-title="Maximize window"
                                        title="Maximize window">
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
                                </>
                            )}
                            {!hideCloseButton && (
                                <i
                                    className="fa-solid fa-xmark modal-close"
                                    title="Close"
                                    onClick={handleClose}></i>
                            )}
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>{children}</Modal.Body>
            </Modal>
        </>
    );
});

export default ChildrenModal;
