import { checIfSignupAllowed } from "../../../utils/utils";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../AppContext";

function SiteSSO({
    selectedItem,
    saveData,
    handleInputField,
    handleEditor,
    entityList,
    getData,
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

    const [isSignupAllowed, setIsSignupAllowed] = useState(false);

    useEffect(() => {
        setIsSignupAllowed(checIfSignupAllowed(featuresSubscription));
    }, [featuresSubscription]);
    return (
        <>
            {isSignupAllowed && (
                <>
                    <fieldset className="row mb-3 mt-3">
                        <legend className="col-form-label col-sm-5 pt-0 fw-bold">
                            Allow Signup
                        </legend>
                        <div className="col-sm-6">
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="allow_signup"
                                            value="YES"
                                            checked={
                                                selectedItem.allow_signup ===
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
                                            name="allow_signup"
                                            value="NO"
                                            checked={
                                                selectedItem.allow_signup ===
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
                    {selectedItem.allow_signup === "YES" && (
                        <fieldset className="row mb-3 mt-3">
                            <legend className="col-form-label col-sm-5 pt-0 fw-bold">
                                Social Login
                            </legend>
                            <div className="col-sm-5">
                                <div className="row">
                                    <div className="col">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="google"
                                                checked={
                                                    selectedItem.sso_login &&
                                                    selectedItem.sso_login.indexOf(
                                                        "google",
                                                    ) !== -1
                                                        ? true
                                                        : false
                                                }
                                                onChange={event =>
                                                    handleInputField(event)
                                                }
                                            />
                                            <label className="form-check-label">
                                                Google
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="facebook"
                                                checked={
                                                    selectedItem.sso_login &&
                                                    selectedItem.sso_login.indexOf(
                                                        "facebook",
                                                    ) !== -1
                                                        ? true
                                                        : false
                                                }
                                                onChange={event =>
                                                    handleInputField(event)
                                                }
                                            />
                                            <label className="form-check-label">
                                                Facebook
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="github"
                                                checked={
                                                    selectedItem.sso_login &&
                                                    selectedItem.sso_login.indexOf(
                                                        "github",
                                                    ) !== -1
                                                        ? true
                                                        : false
                                                }
                                                onChange={event =>
                                                    handleInputField(event)
                                                }
                                            />
                                            <label className="form-check-label">
                                                Github
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="twitter"
                                                checked={
                                                    selectedItem.sso_login &&
                                                    selectedItem.sso_login.indexOf(
                                                        "twitter",
                                                    ) !== -1
                                                        ? true
                                                        : false
                                                }
                                                onChange={event =>
                                                    handleInputField(event)
                                                }
                                            />
                                            <label className="form-check-label">
                                                Twitter
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    )}
                </>
            )}
            {/* {selectedItem.sso_login &&
                selectedItem.sso_login.includes("google") && (
                    <div className="row">
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                GOOGLE_CLIENT_ID&nbsp;
                                <span className="text-danger">*</span>
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="google_client_id"
                                value={selectedItem.google_client_id}
                                onChange={handleInputField}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                GOOGLE_CLIENT_SECRET&nbsp;
                                <span className="text-danger">*</span>
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="google_client_secret"
                                value={selectedItem.google_client_secret}
                                onChange={handleInputField}
                            />
                        </div>
                    </div>
                )}

            {selectedItem.sso_login &&
                selectedItem.sso_login.includes("github") && (
                    <div className="row">
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                GITHUB_CLIENT_ID&nbsp;
                                <span className="text-danger">*</span>
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="github_client_id"
                                value={selectedItem.github_client_id}
                                onChange={handleInputField}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                GITHUB_CLIENT_SECRET&nbsp;
                                <span className="text-danger">*</span>
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="github_client_secret"
                                value={selectedItem.github_client_secret}
                                onChange={handleInputField}
                            />
                        </div>
                    </div>
                )}
            {selectedItem.sso_login &&
                selectedItem.sso_login.includes("twitter") && (
                    <div className="row">
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                TWITTER_CONSUMER_KEY&nbsp;
                                <span className="text-danger">*</span>
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="twitter_consumer_key"
                                value={selectedItem.twitter_consumer_key}
                                onChange={handleInputField}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                TWITTER_CONSUMER_SECRET&nbsp;
                                <span className="text-danger">*</span>
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="twitter_consumer_secret"
                                value={selectedItem.twitter_consumer_secret}
                                onChange={handleInputField}
                            />
                        </div>
                    </div>
                )} */}
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
export default SiteSSO;
