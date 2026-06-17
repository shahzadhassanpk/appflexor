import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { UserForm } from "../user/UserForm";

function UserModal(props) {
    const {
        error,
        selectedUser,
        handleInputField,
        confirmPassword,
        MultiSelect,
        generateUsername,
        group,
        filteredGroups,
        handleMultiSelectGroups,
        role,
        setConfirmPassword,
        setSelectedUser,
        show,
        setShow,
        handleClose,
        showModal,
        validateAndSave,
        validateAndUpdate,
        clearFields,
    } = props;

    return (
        <div className="s2a-editmodal-wrap">
            <Modal
                show={showModal}
                onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div
                        className="form col-sm-12 form-background pb-2 px-3 needs-validation"
                        noValidate>
                        <UserForm
                            error={error}
                            selectedUser={selectedUser}
                            handleInputField={handleInputField}
                            confirmPassword={confirmPassword}
                            MultiSelect={MultiSelect}
                            generateUsername={generateUsername}
                            group={group}
                            filteredGroups={filteredGroups}
                            handleMultiSelectGroups={handleMultiSelectGroups}
                            role={role}
                            setConfirmPassword={setConfirmPassword}
                            setSelectedUser={setSelectedUser}
                            show={show}
                            setShow={setShow}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="row">
                        <div className="col-sm-12 p-0">
                            {selectedUser.id === " " && (
                                <button
                                    className="btn button-theme btn-sm pull-left m-1 ms-0"
                                    onClick={() => validateAndSave()}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                            )}
                            {selectedUser.id !== " " && (
                                <button
                                    className="btn button-theme btn-sm pull-left m-1 ms-0"
                                    onClick={() => validateAndUpdate()}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Update
                                </button>
                            )}
                            {selectedUser.id !== "" && (
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

export default UserModal;
