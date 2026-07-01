import { useState } from "react";
import Modal from "react-bootstrap/Modal";

function ModuleFormViewer(props) {
    const {
        handleClose,
        showModal,
        children,
        modalTitle,
        size,
        isStatic = false,
    } = props;
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    return (
        <>
            <Modal
                className="s2a-modal"
                size={size}
                show={showModal}
                onHide={handleClose}
                backdrop={"static"}
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{modalTitle}</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
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
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window"
                                title="Restore window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                title="Close"
                                onClick={handleClose}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>{children}</Modal.Body>
            </Modal>
        </>
    );
}

export default ModuleFormViewer;
