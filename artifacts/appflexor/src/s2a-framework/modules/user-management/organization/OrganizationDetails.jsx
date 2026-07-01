import React from "react";
import PhoneInput from "react-phone-input-2";
import FileUploader from "../../../components/FileUploader/FileUploader";

function OrganizationDetails({
    selectedItem,
    setSelectedEntity,
    clearFields,
    handleInputChange,
    handleSaveEntity,
    handleDeleteEntity,
    saveIsDisabled,
    cancelIsDisabled,
    handleAddNewAction,
    getData,
}) {
    function getPlaces(place) {
        const _place = {
            location: "",
            city: "",
            country: "",
        };

        place.address_components.map(value => {
            if (value.types.indexOf("street_number") > -1) {
                _place.location = value.long_name;
            } else if (value.types.indexOf("route") > -1) {
                _place.location += " " + value.long_name;
            } else if (value.types.indexOf("neighborhood") > -1) {
                _place.location += " " + value.long_name;
            } else if (value.types.indexOf("sublocality_level_1") > -1) {
                _place.location += " " + value.long_name;
            } else if (
                value.types.indexOf("administrative_area_level_2") > -1
            ) {
                _place.city = value.long_name;
            } else if (value.types.indexOf("country") > -1) {
                _place.country = value.long_name;
            }
        });

        let _tempObj = {};

        _tempObj = {
            location: _place.location,
            city: _place.city,
            country: _place.country,
        };

        setSelectedEntity(prevState => ({
            ...prevState,
            ..._tempObj,
        }));
    }

    return (
        <div
            id="organization-details"
            className="col-sm-12 inventory-details-panel org-details">
            <div className="row mt-2">
                <div className="col-sm-4">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">
                            Name
                            <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={selectedItem.name}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="col-sm-4">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">Email</label>
                        <input
                            type="text"
                            name="email"
                            className="form-control"
                            value={selectedItem.email}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="col-sm-4">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">Phone</label>
                        <PhoneInput
                            country={"pk"}
                            placeholder={""}
                            value={selectedItem.phone}
                            onChange={(currentValue, details) => {
                                setSelectedEntity(prevState => ({
                                    ...prevState,
                                    phone: currentValue,
                                }));
                            }}
                            isValid={(value, country) => {
                                if (value.length > 5) {
                                    if (
                                        value.match(
                                            /(\+?( |-|\.)?\d{1,2}( |-|\.)?)?(\(?\d{3}\)?|\d{3})( |-|\.)?(\d{3}( |-|\.)?\d{4})/g,
                                        )
                                    ) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                } else {
                                    return true;
                                }
                            }}
                            autocompleteSearch={false}
                            jumpCursorToEnd={true}
                            enableSearch={true}
                            disableSearchIcon={false}
                            inputStyle={{
                                padding: "6px 13px 6px 60px",
                                width: "100%",
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="row mt-2">
                <div className="col-sm-6">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">Address</label>
                        <input
                            type="text"
                            name="address"
                            className="form-control"
                            value={selectedItem.address}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="col-sm-6">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">Location</label>
                        <input
                            type="text"
                            name="location"
                            className="form-control"
                            value={selectedItem.location}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>
            <div className="row mt-2">
                <div className="col-sm-6">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">City</label>
                        <input
                            type="text"
                            name="city"
                            className="form-control"
                            value={selectedItem.city}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="col-sm-6">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">Country</label>
                        <input
                            type="text"
                            name="country"
                            className="form-control"
                            value={selectedItem.country}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="col-sm-6">
                    <div className="form-group mt-2">
                        <label className="mb-1 fw-bold">Image</label>
                        <FileUploader
                            item={selectedItem}
                            entity="dir_organization"
                            record_id={selectedItem?.id}
                            field_id="logo"
                            getData={getData} // Pass `selectedItem` to `editItem` here
                            extensionsAllowed={["png", "jpg", "jpeg", "svg"]}
                            multiple={false}
                            // type="file"
                            // name="logo"
                            // className="form-control"
                            // value={selectedItem?.logo}
                            // onChange={handleUpload}
                        />
                    </div>
                </div>
            </div>
            <div className="row mt-2">
                <div className="col-sm-12 button-padding">
                    <button
                        className="btn button-theme btn-sm me-2 ms-0"
                        onClick={handleAddNewAction}>
                        <i className="fa-solid fa-plus pe-1"></i>
                        Add New
                    </button>
                    <button
                        className="btn button-theme btn-sm pull-left me-2"
                        onClick={handleSaveEntity}
                        disabled={saveIsDisabled}>
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Save
                    </button>
                    <button
                        className="btn button-theme btn-sm me-2"
                        onClick={clearFields}
                        disabled={cancelIsDisabled}>
                        <i className="fa-solid fa-xmark pe-1"></i>
                        Clear
                    </button>
                    {/* <button
            className="btn btn-danger btn-sm m-2"
            onClick={() => handleDeleteEntity(selectedItem)}
            disabled={selectedItem.id === "new" ? true : false}
          >
            <span className="fa fa-trash-alt"></span> Delete
          </button> */}
                    <button
                        type="button"
                        className="btn btn-danger del-btn-theme btn-sm pull-left me-2"
                        onClick={() => handleDeleteEntity(selectedItem)}
                        disabled={selectedItem.id === "new" ? true : false}>
                        <i className="fa-regular fa-trash-can pe-1"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export { OrganizationDetails };
