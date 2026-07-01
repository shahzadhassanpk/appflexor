import { useImperativeHandle } from "react";
import { useState } from "react";
import { forwardRef } from "react";
import { Modal } from "react-bootstrap";
import FieldForm from "./FieldForm";

const FormFieldModal = forwardRef((props, ref) => {
    const [show, setShow] = useState(false);
    const [update, setUpdate] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useImperativeHandle(
        ref,
        () => {
            return {
                showModal() {
                    handleShow();
                    setUpdate(false);
                },
                closeModal() {
                    closeModal();
                },
                updateModal() {
                    handleShow();
                    setUpdate(true);
                },
            };
        },
        [],
    );

    return (
        <div className="s2a-formfield-modal">
            <Modal
                show={show}
                onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{update ? "Update" : "Add"} Field</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FieldForm
                        handleClose={handleClose}
                        setUpdate={setUpdate}
                        update={update}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
});

export default FormFieldModal;
