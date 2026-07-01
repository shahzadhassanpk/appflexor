import { checIfSignupAllowed } from "../../../utils/utils";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../AppContext";

function SiteIntegrations({
    selectedItem,
    saveData,
    handleInputField,
    handleEditor,
    entityList,
    getData,
    tabs,
    styles,
    capitalizeFirstLetter,
    colorPalette,
    saveIsDisabled,
    clearFields,
    handleColorPalette,
    showModal,
    setShowSiteModal,
    handleSaveData,
}) {
    const appContext = useContext(AppContext);
    const { featuresSubscription } = appContext;


    return (
        <>
                <>
                
                    <fieldset className="row mb-3 mt-3">
                        <legend className="col-form-label col-sm-5 pt-0 fw-bold">
                            Allow Google Analytics
                        </legend>
                        <div className="col-sm-6">
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="allow_google_analytics"
                                            value="YES"
                                            checked={
                                                selectedItem.allow_google_analytics ===
                                                "YES"
                                            }
                                            onChange={event =>
                                                handleInputField(event)
                                            }
                                        />
                                        <label className="form-check-label">
                                            Yes
                                        </label>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="allow_google_analytics"
                                            value="NO"
                                            checked={
                                                selectedItem.allow_google_analytics ===
                                                "NO"
                                            }
                                            onChange={event =>
                                                handleInputField(event)
                                            }
                                        />
                                        <label className="form-check-label">
                                            No
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                    {selectedItem.allow_google_analytics === "YES" && (
                        <div className="form-group mb-2">
                        <label className="mt-1 fw-bold">
                            Google MID&nbsp;
                            <span className="text-danger">*</span>
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            name="google_mid"
                            value={selectedItem.google_mid}
                            onChange={handleInputField}
                        />
                    </div>
                    )}
                </>
            <div className="d-flex text-align-center justify-content-end py-3">
                <button
                    className="btn button-theme btn-sm me-2 pull-left"
                    onClick={() => {
                        clearFields();
                        setShowSiteModal(false);
                    }}>
                    <i className="fa-solid fa-xmark pe-1"></i>
                    Close
                </button>
                <button
                    className={` ${
                        saveIsDisabled ? "pointer" : "not-allowed"
                    } btn button-theme btn-sm pull-left  ms-0`}
                    onClick={() => handleSaveData(true)}
                    disabled={saveIsDisabled}
                    data-bs-dismiss="modal">
                    <i className="fa-solid fa-floppy-disk pe-1"></i>

                    {selectedItem.id === "" ? "Save" : "Update"}
                </button>
            </div>
        </>
    );
}
export default SiteIntegrations;
