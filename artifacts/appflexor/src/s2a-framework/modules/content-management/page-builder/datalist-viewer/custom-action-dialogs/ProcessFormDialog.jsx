import { Modal } from "react-bootstrap";

export default function ProcessFormModal({
    show,
    close,
    title = "Modal Title",
    children,
}) {
    return (
        <>
            <Modal
                dialogClassName="s2a-modal"
                show={show}
                size={"lg"}
                backdrop="static"
                keyboard={false}
                animation={true}
                onHide={() => close(false)}>
                <Modal.Header>
                    <Modal.Title className="s2a-modal s2a-form-title">
                        {title}
                        <i
                            className="fa-solid fa-xmark modal-close"
                            onClick={() => close(false)}></i>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>{children}</Modal.Body>
                <Modal.Footer></Modal.Footer>
            </Modal>
        </>
    );
}
