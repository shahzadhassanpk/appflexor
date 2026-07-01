import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import DataListViewer from "../../../content-management/page-builder/datalist-viewer/viewer/DataListViewer";
import { modeType } from "../../form-builder/Designer/Designer";

export default function DataListModal({
    selectedItem,
    setShowModal,
    showModal,
}) {
    const [ids, setIds] = useState({
        id: "",
        form_id: "",
    });
    useEffect(() => {
        if (selectedItem && selectedItem.id !== "")
            setIds(prev => ({
                ...prev,
                id: selectedItem.id,
                form_id: selectedItem.form_id,
            }));
    }, [selectedItem]);

    const handleClose = () => setShowModal(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    return (
        <Modal
            show={showModal}
            size="xl"
            onHide={handleClose}
            backdrop={"static"}
            onEntered={element => element.removeAttribute("tabindex")}
            className="s2a-modal s2a-datalistmodal"
            keyboard={false}
            animation={true}
            fullscreen={toggleModalWindow === "maximize"}>
            <Modal.Header>
                <Modal.Title className="modal-title">
                    <span>{selectedItem["name"]}</span>
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
                            onClick={handleClose}></i>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {ids && ids.id !== "" && (
                    <DataListViewer
                        ids={ids}
                        modeType={modeType}
                        mode={modeType.render}
                    />
                )}
            </Modal.Body>
        </Modal>
    );
}
