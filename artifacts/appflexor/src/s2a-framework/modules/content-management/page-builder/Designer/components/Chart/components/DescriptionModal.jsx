import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../../utils/ErrorBoundry";

export default function DescriptionModal({ show, close, title, children }) {
    return (
        <ErrorBoundary>
            <Modal
                centered
                show={show}
                onHide={() => close(false)} className="s2a-modal">
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{title}</span>
                        <i
                            className="fa-solid fa-xmark modal-close"
                            onClick={() => close(false)}></i>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>{children}</Modal.Body>
            </Modal>
        </ErrorBoundary>
    );
}
