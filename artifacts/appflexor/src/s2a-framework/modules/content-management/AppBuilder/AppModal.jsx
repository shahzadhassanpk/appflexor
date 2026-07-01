import { useContext, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { forwardRef } from "react";
import { useImperativeHandle } from "react";
import AppBuilderContext from "./App/AppBuilderContext";
import { useEffect } from "react";

const AppModal = forwardRef((props, ref) => {
    const { children, header } = props;
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const { selectedItem, setSelectedItem } = useContext(AppBuilderContext);

    useImperativeHandle(
        ref,
        () => {
            return {
                openModal() {
                    setShow(true);
                },
                closeModal() {
                    setShow(false);
                },
                handleEdit(item) {
                    setSelectedItem({
                        ...selectedItem,
                        item: item,
                        update: true,
                    });
                    handleShow();
                },
            };
        },
        [],
    );

    // useEffect(() => {
    //     console.log(show, "rerender");
    // }, [show]);

    return (
        <>
            <Modal
                className="s2a-modal"
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{header}</span>
                        <i
                            className="fa-solid fa-xmark modal-close"
                            onClick={handleClose}></i>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>{children}</Modal.Body>
            </Modal>
        </>
    );
});

export default AppModal;
