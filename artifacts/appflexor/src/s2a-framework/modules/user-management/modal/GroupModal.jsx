import React from "react";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

export default function GroupModal(props) {
    const {
        selectedItem,
        handleInputField,
        saveIsDisabled,
        clearFields,
        saveData,
        handleClose,
        formShow,
    } = props;

    return (
        <div className="s2a-group-modal">
            <Modal
                show={formShow}
                onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Group</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form col-sm-12 form-background pb-2 px-3">
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Name&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={selectedItem.name}
                                        onChange={e => handleInputField(e)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Description&nbsp;
                                        <span className="text-danger"></span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        type="text"
                                        className="form-control"
                                        name="description"
                                        value={selectedItem.description}
                                        onChange={e =>
                                            handleInputField(e)
                                        }></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="row">
                        <div className="col-sm-12 p-0">
                            {selectedItem.id === "" && (
                                <button
                                    className="btn button-theme btn-sm pull-left m-1 ms-0"
                                    onClick={() => saveData()}
                                    disabled={saveIsDisabled}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                            )}
                            {selectedItem.id !== "" && (
                                <button
                                    className="btn button-theme btn-sm pull-left m-1 ms-0"
                                    onClick={() => saveData()}
                                    disabled={saveIsDisabled}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Update
                                </button>
                            )}
                            {selectedItem.id === "" && (
                                <button
                                    className="btn button-theme btn-sm pull-left m-1 text-light"
                                    onClick={clearFields}>
                                    <i className="fa-solid fa-xmark pe-1"></i>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        className="btn button-theme btn-sm pull-left m-1 text-light"
                        variant="secondary"
                        onClick={handleClose}>
                        Close
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
