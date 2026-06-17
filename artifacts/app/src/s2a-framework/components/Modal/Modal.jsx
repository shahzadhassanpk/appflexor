import Modal from "react-bootstrap/Modal";

function ModalBox(props) {
    const {
        state,
        message,
        operation,
        setState,
        header = "Delete Item",
        modalType = "deleteModal",
        editModalSize = "lg",
    } = props;
    function handleOperation() {
        if (modalType === "deleteModal") {
            operation(state.item, true, state.deleteItem, state.index, state.data);
        } else if (modalType === "editModal") {
            operation(state.item, true, state.message, state.required);
        } else if (modalType === "deleteAllModal") {
            operation(state.item.items, state.item.flag, true);
        } else if (modalType === "processMsg") {
            operation(state.item, state.currentObj, true);
        } else if (modalType === "showCustomActionMsgModal") {
            operation(state.item.url, state.item.target, state.item.id, true);
        } else if (modalType === "user") {
            operation(state.item, state.condition, true);
        } else if (modalType === "app_module" || modalType === "app_builder") {
            operation(state.item, true);
        } else {
            operation(state.item, true, state?.deleteItem);
        }
    }

    function handleClose() {
        setState(prev => ({
            ...prev,
            show: false,
        }));
    }

    return (
        <>
            <Modal
                className="s2a-modal"
                show={state.show}
                onHide={() => handleClose()}
                size={editModalSize ? editModalSize : "lg"}
                fullscreen={editModalSize ? editModalSize : "lg"}
                backdrop="static">
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{header}</span>
                        <i
                            className="fa-solid fa-xmark modal-close"
                            onClick={handleClose}></i>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {state.message ? state.message : message}
                </Modal.Body>
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
        </>
    );
}

export default ModalBox;
