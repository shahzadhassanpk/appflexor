import { useEffect } from "react";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

function ModalBox(props) {
    const { state, message, operation, header, setState } = props;

    function handleOperation() {
        operation(state.item, state.condition, true);
    }

    function handleClose() {
        setState(prev => ({
            ...prev,
            show: false,
        }));
    }

    return (
        <div className="s2a-modal-user">
            <Modal
                show={state.show}
                onHide={() => handleClose()}>
                <Modal.Header closeButton>
                    <Modal.Title>{header}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{message}</Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-sm button-theme"
                        onClick={() => handleOperation()}>
                        Yes
                    </button>
                    <button
                        className="btn btn-sm button-theme"
                        onClick={() => handleClose()}>
                        No
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ModalBox;
