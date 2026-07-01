import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import TextEditor from "../../../components/TextEditor/RichTextEditor";
import { Email } from "../../../components/SendEmail/SendEmail";

export default function EmailTemplateModal(props) {
    const {
        show,
        handleClose,
        selectedItem,
        saveData,
        saveIsDisabled,
        emailProfiles,
        handleInput,
        handleInputField,
        clearFields,
    } = props;
    return (
        <div>
            <Modal
                size="xl"
                show={show}
                onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Email Template</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form col-sm-12 form-background">
                        <div className="row mt-1">
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Title&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="title"
                                        value={selectedItem.title}
                                        onChange={handleInputField}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Email Key&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="emailkey"
                                        value={selectedItem.emailkey}
                                        onChange={handleInputField}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Email Profile&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        name="profile"
                                        className="form-select"
                                        value={selectedItem.profile}
                                        onChange={e => handleInputField(e)}>
                                        <option value="">Select Profile</option>
                                        {emailProfiles &&
                                            emailProfiles.map((item, index) => (
                                                <option
                                                    key={index}
                                                    value={item.id}>
                                                    {item.host}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="row my-1">
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        SQL&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        type="text"
                                        className="form-control"
                                        name="sql"
                                        value={selectedItem.sql}
                                        onChange={handleInputField}
                                        rows="6"
                                        // style={{ height: "38px" }}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Template&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                </div>
                                <TextEditor
                                    id="template"
                                    value={selectedItem.template}
                                    height="160px"
                                    onChange={handleInput}
                                />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="row my-1">
                        <div className="col-sm-12 d-inline-flex p-0">
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
                            {selectedItem.id !== "" && (
                                <div className="">
                                    <Email emailkey={selectedItem.emailkey} />
                                </div>
                            )}
                        </div>
                    </div>
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
