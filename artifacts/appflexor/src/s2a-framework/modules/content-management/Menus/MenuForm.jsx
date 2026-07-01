import React from "react";

const MenuForm = props => {
    const {
        handleInputField,
        saveData,
        selectedItem,
        clearModule,
        moduleList,
        saveIsDisabled,
        closeModal,
    } = props;
    return (
        <div className="module-form">
            <div className="form col-sm-12">
                <div className="row pb-2">
                    <div className="col-sm-6">
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
                                onChange={handleInputField}
                            />
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Access&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <select
                                name="access"
                                className="form-select"
                                value={selectedItem?.access?selectedItem?.access:"PROTECTED"}
                                onChange={handleInputField}>
                                <option
                                    value=""
                                    disabled>
                                    Select Access
                                </option>
                                <option value="PROTECTED">
                                    Protected
                                </option>
                                <option value="PUBLIC">Public</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-sm-3">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Location&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <select
                                name="location"
                                className="form-select"
                                value={selectedItem.location}
                                onChange={handleInputField}>
                                <option
                                    value=""
                                    disabled>
                                    Select Location
                                </option>
                                <option value="FRONTOFFICE">
                                    Front office
                                </option>
                                <option value="BACKOFFICE">Back office</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-sm-3">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                {/* Module Type&nbsp; */}
                                Menu Type&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <select
                                name="type"
                                className="form-select"
                                value={selectedItem.type}
                                onChange={handleInputField}>
                                <option value="">Select Module Type</option>
                                {selectedItem.location &&
                                    moduleList.map(
                                        (item, index) =>
                                            item.location.includes(
                                                selectedItem.location,
                                            ) && (
                                                <option
                                                    key={index}
                                                    value={item.value}>
                                                    {item.label}
                                                </option>
                                            ),
                                    )}
                            </select>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Icon&nbsp;
                                <span className="text-danger"></span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="icon"
                                value={selectedItem.icon}
                                onChange={e => handleInputField(e)}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="my-2">
                {selectedItem.id === "" && (
                    <button
                        className="btn button-theme btn-sm pull-left me-2 ms-0"
                        onClick={() => saveData()}
                        disabled={saveIsDisabled}
                        data-bs-dismiss="modal">
                        <i className="fa-solid fa-floppy-disk pe-1"></i> Save
                    </button>
                )}
                {selectedItem.id !== "" && (
                    <button
                        className="btn button-theme btn-sm pull-left me-2 ms-0"
                        data-bs-dismiss="modal"
                        onClick={() => saveData()}
                        disabled={saveIsDisabled}>
                        <i
                            className="fa-solid fa-floppy-disk pe-1"
                            data-bs-dismiss="modal"></i>
                        Update
                    </button>
                )}
                {selectedItem.id === "" && (
                    <button
                        className="btn button-theme btn-sm pull-left me-2"
                        onClick={() => clearModule()}>
                        <i className="fa-solid fa-ban pe-1"></i>
                        Clear
                    </button>
                )}
                <button
                    type="button"
                    className="btn button-theme btn-sm"
                    aria-label="Close"
                    onClick={closeModal}>
                    <i className="fa-solid fa-xmark pe-1"></i>
                    Close
                </button>
            </div>
        </div>
    );
};

export default MenuForm;
