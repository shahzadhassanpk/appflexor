import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

export default function EmailProfileModal(props) {
    console.log(props);
    const {
        selectedItem,
        handleInputField,
        saveIsDisabled,
        clearFields,
        saveData,
        handleClose,
        show,
    } = props;

    return (
        <div>
            <Modal
                show={show}
                onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Email Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form col-sm-12 form-background">
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Email&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="email"
                                        value={selectedItem.email}
                                        onChange={handleInputField}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Host&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="host"
                                        value={selectedItem.host}
                                        onChange={handleInputField}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        SSL Port&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="sslport"
                                        value={selectedItem.sslport}
                                        onChange={handleInputField}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Password&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="emailpassword"
                                        value={selectedItem.emailpassword}
                                        onChange={handleInputField}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    {selectedItem.id === "" && (
                        <button
                            className="btn button-theme btn-sm pull-left m-2 ms-0"
                            onClick={() => saveData()}
                            disabled={saveIsDisabled}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>{" "}
                            Save
                        </button>
                    )}
                    {selectedItem.id !== "" && (
                        <button
                            className="btn button-theme btn-sm pull-left m-2 ms-0"
                            onClick={() => saveData()}
                            disabled={saveIsDisabled}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            Update
                        </button>
                    )}
                    {selectedItem.id === "" && (
                        <button
                            className="btn button-theme btn-sm pull-left m-2 text-light"
                            onClick={clearFields}>
                            <i className="fa-solid fa-xmark pe-1"></i>
                            Cancel
                        </button>
                    )}
                    <button
                        className="btn button-theme btn-sm pull-left m-2 text-light"
                        onClick={handleClose}>
                        Close
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
