// import { func } from "prop-types";
import axios from "axios";
import { forwardRef, useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { AppContext } from "../../../../AppContext";
import CodeMirror from "@uiw/react-codemirror";
import { css } from "@codemirror/lang-css";
import { API_URL } from "../../../Config";
import FileUploader from "../../../components/FileUploader/FileUploader";
import ReactSelect from "../../../components/ReactSelect/ReactSelect";
import TextEditor from "../../../components/TextEditor/RichTextEditor";
import {
    checIfSignupAllowed,
    checkIfGuestLoginAllowed,
} from "../../../utils/utils";
import { tryToParse } from "../../data-management/form-builder/Forms/FormViewer/utils";
import { COLOR_PALETTE } from "./Site";
import DynamicCheckBoxs from "../../../components/dynamic-checkbox/Checkbox";
// import FileUploader from "./FileUploader/FileUploader";

// saveBtnRef

function SiteDetails({
    domain,
    selectedItem,
    handleSaveData,
    handleInputField,
    handleEditor,
    entityList,
    contentList,
    getData,
    editItem,
    capitalizeFirstLetter,
    colorPalette,
    saveIsDisabled,
    clearFields,
    handleColorPalette,
    setSelectedItem,
    styles,
    showModal: siteModal,
    guestUserList,
    selectedGuestUser,
    setSelectedGuestUser,
}) {
    const [showModal, setShowModal] = useState(false);
    const [showCustomColor, setShowCustomColor] = useState(customColorExist());
    const appContext = useContext(AppContext);
    const { featuresSubscription } = appContext;

    const [isSignupAllowed, setIsSignupAllowed] = useState(false);
    const [isGuestAllowed, setIsGuestLoginAllowed] = useState(false);

    useEffect(() => {
        setIsSignupAllowed(checIfSignupAllowed(featuresSubscription));
        setIsGuestLoginAllowed(checkIfGuestLoginAllowed(featuresSubscription));
    }, [featuresSubscription]);

    // useEffect(() =>  {
    //     if (selectedItem.site_preference && siteModal) {
    //         let flag = false;
    //         const colors = ["primary", "secondary", "shadow", "font"];
    //         for (let key in colors) {
    //             if (selectedItem.site_preference[key] !== "") {
    //                 flag = true;
    //             }
    //         }
    //         if (flag) {
    //             let defaultColors = colorPalette.find(
    //                 item =>
    //                     item.id === selectedItem.site_preference.color_palette,
    //             );
    //             defaultColors ? defaultColors : colorPalette[0];
    //             setSelectedItem({
    //                 ...selectedItem,
    //                 site_preference: {
    //                     ...selectedItem.site_preference,
    //                     primary: defaultColors.primary,
    //                     secondary: defaultColors.secondary,
    //                     shadow: defaultColors.shadow,
    //                     font: defaultColors.font,
    //                 },
    //             });
    //         }
    //     }
    // }, [siteModal]);

    function customColorExist() {
        let flag = false;

        if (
            selectedItem.site_preference &&
            selectedItem.site_preference.color_palette !== ""
        ) {
            flag = true;
        }

        return flag;
    }

    const ChangeColor = e => {
        const { name, value } = e.target;
        setSelectedItem({
            ...selectedItem,
            site_preference: {
                ...selectedItem.site_preference,
                [name]: value,
            },
        });
    };

    const resetCustomColor = () => {
        const site_preference = tryToParse(selectedItem.site_preference);
        const _selectedItem = COLOR_PALETTE.find(
            item => item.id === site_preference.color_palette,
        );
        setSelectedItem({
            ...selectedItem,
            site_preference: {
                ..._selectedItem.site_preference,
                color_palette: _selectedItem.id,
                primary: _selectedItem.primary,
                secondary: _selectedItem.secondary,
                shadow: _selectedItem.shadow,
                font: _selectedItem.font,
            },
        });
    };

    const addTheme = () => {
        setShowCustomColor(true);
    };

    return (
        <div className="col-sm-12">
            <div className="row">
                <div className="col-sm-6 vertical-line pb-1">
                    <div className="row ps-1">
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                Title&nbsp;
                                <span className="text-danger">*</span>
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="brand_title"
                                value={selectedItem.brand_title}
                                onChange={handleInputField}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                Domain&nbsp;
                                <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    name="domain"
                                    disabled
                                    // value={`${selectedItem.domain}${domain}`}
                                    value={selectedItem.domain}
                                    placeholder="subdomain"
                                    readOnly
                                />
                            </div>
                            {/* Temporarily disabled & commented so user can't edit site*/}
                            {/* {selectedItem.domain === "" ? (
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="domain"
                                        value={`${
                                            selectedItem.domain
                                                ? `${selectedItem.domain}${domain}`
                                                : ""
                                        }`}
                                        placeholder="add your subdomian"
                                        readOnly
                                    />

                                    <span
                                        onClick={() => setShowModal(true)}
                                        className="input-group-text  d-flex justify-content-center align-items-center pointer">
                                        <span className="mx-1 fa-solid fa-plus"></span>{" "}
                                        <span>Add Domain</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="domain"
                                        disabled
                                        value={`${selectedItem.domain}${domain}`}
                                        placeholder="subdomain"
                                        readOnly
                                    />

                                    <span
                                        onClick={() => setShowModal(true)}
                                        disable
                                        className="input-group-text  d-flex justify-content-center align-items-center pointer">
                                        <span className="m-2 fa-regular fa-pen-to-square"></span>{" "}
                                        <span>Change Domain</span>
                                    </span>
                                </div>
                            )} */}
                        </div>

                        {/* <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                Entity Name
                                <span className="text-danger">*</span>
                            </label>
                            <select
                                className="form-select"
                                name="entity_id"
                                value={selectedItem.entity_id}
                                onChange={handleInputField}>
                                <option value="">Select Entity</option>
                                {entityList.map((item, index) => (
                                    <option
                                        key={index}
                                        value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div> */}
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                Slogan&nbsp;
                                <span className="text-danger"></span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="brand_text"
                                value={selectedItem.brand_text}
                                onChange={handleInputField}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                Brand Logo (png, jpg, jpeg)
                                <span className="text-danger"></span>
                            </label>
                            <FileUploader
                                item={selectedItem}
                                entity="app_site"
                                record_id={selectedItem.id}
                                field_id="brand_logo"
                                getData={() => editItem(selectedItem)} // Pass `selectedItem` to `editItem` here
                                extensionsAllowed={[
                                    "png",
                                    "jpg",
                                    "jpeg",
                                    "svg",
                                ]}
                                multiple={false}
                                serviceKey="update.site"
                            />
                        </div>
                        <fieldset className="row">
                            <legend className="col-form-label col-sm-5 pt-0 fw-bold">
                                Allow Keep Me Login
                            </legend>
                            <div className="col-sm-6">
                                <div className="row">
                                    <div className="col-sm-6">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="keep_me_login"
                                                value="YES"
                                                checked={
                                                    selectedItem?.keep_me_login ===
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
                                                name="keep_me_login"
                                                value="NO"
                                                checked={
                                                    !selectedItem?.keep_me_login ||
                                                    selectedItem?.keep_me_login ===
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
                        <fieldset className="row">
                            <legend className="col-form-label col-sm-5 pt-0 fw-bold">
                                Show Organization Context
                            </legend>
                            <div className="col-sm-6">
                                <div className="row">
                                    <div className="col-sm-6">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="show_org_context"
                                                value="YES"
                                                checked={
                                                    selectedItem?.show_org_context ===
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
                                                name="show_org_context"
                                                value="NO"
                                                checked={
                                                    !selectedItem?.show_org_context ||
                                                    selectedItem?.show_org_context ===
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
                        {isGuestAllowed && (
                            <>
                                <fieldset className="row">
                                    <legend className="col-form-label col-sm-5 pt-0 fw-bold">
                                        Allow Guest Login
                                    </legend>
                                    <div className="col-sm-6">
                                        <div className="row">
                                            <div className="col-sm-6">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="guest_login"
                                                        value="YES"
                                                        checked={
                                                            selectedItem.guest_login ===
                                                            "YES"
                                                        }
                                                        onChange={event =>
                                                            handleInputField(
                                                                event,
                                                            )
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
                                                        name="guest_login"
                                                        value="NO"
                                                        checked={
                                                            selectedItem.guest_login ===
                                                            "NO"
                                                        }
                                                        onChange={event =>
                                                            handleInputField(
                                                                event,
                                                            )
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
                                {/* {selectedItem.guest_login === "YES" && (
                                    <fieldset className="row">
                                        <legend className="col-form-label col-sm-5 pt-0 fw-bold">
                                            Select Guest Account{" "}
                                            <i class="fa fa-info-circle" title="List only Guest Group Members"></i>
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </legend>
                                        <div className="col-sm-6">
                                            <div className="row">
                                                <ReactSelect
                                                    options={guestUserList}
                                                    selectedOption={
                                                        selectedGuestUser
                                                    }
                                                    handleChange={
                                                        setSelectedGuestUser
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </fieldset>
                                )} */}
                            </>
                        )}
                        {isSignupAllowed && (
                            <>
                                <fieldset className="row mt-2">
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
                                                            handleInputField(
                                                                event,
                                                            )
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
                                                            handleInputField(
                                                                event,
                                                            )
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
                                {selectedItem?.allow_social === "YES" && (
                                    <fieldset className="row">
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
                                                                Array.isArray(
                                                                    selectedItem?.sso_login,
                                                                ) &&
                                                                selectedItem?.sso_login?.indexOf(
                                                                    "google",
                                                                ) !== -1
                                                                    ? true
                                                                    : false
                                                            }
                                                            onChange={event =>
                                                                handleInputField(
                                                                    event,
                                                                )
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
                                                                handleInputField(
                                                                    event,
                                                                )
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
                                                                Array.isArray(
                                                                    selectedItem?.sso_login,
                                                                ) &&
                                                                selectedItem?.sso_login?.indexOf(
                                                                    "github",
                                                                ) !== -1
                                                                    ? true
                                                                    : false
                                                            }
                                                            onChange={event =>
                                                                handleInputField(
                                                                    event,
                                                                )
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
                                                                Array.isArray(
                                                                    selectedItem?.sso_login,
                                                                ) &&
                                                                selectedItem?.sso_login?.indexOf(
                                                                    "twitter",
                                                                ) !== -1
                                                                    ? true
                                                                    : false
                                                            }
                                                            onChange={event =>
                                                                handleInputField(
                                                                    event,
                                                                )
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
                        {/* <div className="gorm-group mb-2">
                            <DynamicCheckBoxs
                                items={[
                                    { label: "Cache Data", code: "cached" },
                                ]}
                                selectedItem={selectedItem?.cached}
                                handleChange={value =>
                                    setSelectedItem(prev => ({
                                        ...prev,
                                        cached: value,
                                    }))
                                }
                            />
                        </div> */}
                    </div>
                </div>
                <div className="col-sm-6">
                    <fieldset className="p-0">
                        <div className="form-group mb-2">
                            <label className="mt-1 fw-bold">
                                App Home Page&nbsp;
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="home_page"
                                value={selectedItem.home_page}
                                onChange={handleInputField}
                            />
                        </div>
                        <div className="col-sm-12">
                            <label className="mt-1 fw-bold">
                                Public Landing Page
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="landing_page"
                                value={selectedItem.landing_page}
                                onChange={handleInputField}
                            />
                            {/* <select
                                className="form-select"
                                name="landing_page"
                                value={selectedItem.landing_page}
                                onChange={handleInputField}>
                                <option value="">Select Page</option>
                                {contentList.map((item, index) => (
                                    <option
                                        key={index}
                                        value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select> */}
                        </div>
                        <div className="col-sm-12">
                            <label className="mt-1 fw-bold">
                                App Custom Style
                            </label>
                            <select
                                className="form-select"
                                name="styles"
                                value={selectedItem.styles}
                                onChange={handleInputField}>
                                <option value="">Default Style</option>
                                {styles.map((item, index) => (
                                    <option
                                        key={index}
                                        value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-sm-12">
                            <label className="mt-1 fw-bold">
                                Public Custom Style
                            </label>
                            <select
                                className="form-select"
                                name="public_styles"
                                value={selectedItem.public_styles}
                                onChange={handleInputField}>
                                <option value="">Default Style</option>
                                {styles.map((item, index) => (
                                    <option
                                        key={index}
                                        value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-sm-12 mb-2">
                            <label className="col-sm-4 mt-3 mb-2 fw-bold">
                                Menu Position
                            </label>
                            <div className="row">
                                <div className="col-sm-4">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="menu_position"
                                            value="below-header"
                                            checked={
                                                selectedItem?.site_preference
                                                    ?.menu_position ===
                                                "below-header"
                                            }
                                            onChange={event =>
                                                handleInputField(event)
                                            }
                                        />
                                        <label className="form-check-label">
                                            Below Header
                                        </label>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="menu_position"
                                            value="inside-header"
                                            checked={
                                                selectedItem?.site_preference
                                                    ?.menu_position ===
                                                "inside-header"
                                            }
                                            onChange={event =>
                                                handleInputField(event)
                                            }
                                        />
                                        <label className="form-check-label">
                                            Inside Header
                                        </label>
                                    </div>
                                </div>
                                {/* <div className="col-sm-4">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="menu_position"
                                            value="body-left"
                                            checked={
                                                selectedItem?.site_preference
                                                    ?.menu_position ===
                                                "body-left"
                                            }
                                            onChange={event =>
                                                handleInputField(event)
                                            }
                                        />
                                        <label className="form-check-label">
                                            Body left
                                        </label>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </fieldset>
                    {/* <div className="col-sm-12">
                        <label className="my-1 fw-bold">Default Theme</label>
                        <div className="row">
                            {colorPalette.map(color => {
                                return (
                                    <div
                                        className="col-sm-3"
                                        onClick={() => addTheme()}>
                                        <ColorPalette
                                            color={color}
                                            selectedItem={selectedItem}
                                            // disable={toggle}
                                            handleColorPalette={
                                                handleColorPalette
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div> */}
                    {/* <div className="col-sm-12">
                        {showCustomColor && (
                            <>
                                <div
                                    title="reset colors"
                                    className="fw-bold mt-2 flex-between">
                                    <span>Customize Color Palette</span>
                                    <div>
                                        <i
                                            className="fa-solid fa-arrow-rotate-left"
                                            onClick={() =>
                                                resetCustomColor()
                                            }></i>
                                    </div>
                                </div>
                                <div className="row mt-2">
                                    <div className="col-sm-7 row">
                                        <div className="col-sm-6">
                                            <label
                                                htmlFor="primary"
                                                className="mt-1">
                                                Primary color
                                            </label>
                                            <input
                                                name="primary"
                                                value={
                                                    selectedItem
                                                        ?.site_preference
                                                        ?.primary
                                                }
                                                type="color"
                                                className="form-control"
                                                onChange={e => ChangeColor(e)}
                                            />
                                        </div>
                                        <div className="col-sm-6">
                                            <label
                                                htmlFor="secondary"
                                                className="mt-1">
                                                Secondary color
                                            </label>
                                            <input
                                                name="secondary"
                                                value={
                                                    selectedItem
                                                        ?.site_preference
                                                        ?.secondary
                                                }
                                                type="color"
                                                className="form-control"
                                                onChange={e => ChangeColor(e)}
                                            />
                                        </div>
                                        <div className="col-sm-6">
                                            <label
                                                htmlFor="shadow"
                                                className="mt-1">
                                                Border color
                                            </label>
                                            <input
                                                name="shadow"
                                                value={
                                                    selectedItem
                                                        ?.site_preference
                                                        ?.shadow
                                                }
                                                type="color"
                                                className="form-control"
                                                onChange={e => ChangeColor(e)}
                                            />
                                        </div>
                                        <div className="col-sm-6">
                                            <label
                                                htmlFor="font"
                                                className="mt-1">
                                                Font color
                                            </label>
                                            <input
                                                name="font"
                                                value={
                                                    selectedItem
                                                        ?.site_preference?.font
                                                }
                                                type="color"
                                                className="form-control"
                                                onChange={e => ChangeColor(e)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-sm-5 d-flex flex-column align-items-center">
                                        <div
                                            className="h-25 w-50 rounded-top"
                                            style={{
                                                backgroundColor:
                                                    selectedItem
                                                        ?.site_preference
                                                        ?.primary,
                                            }}></div>
                                        <div
                                            className="h-25 w-50"
                                            style={{
                                                backgroundColor:
                                                    selectedItem
                                                        ?.site_preference
                                                        ?.secondary,
                                            }}></div>
                                        <div
                                            className="h-25 w-50"
                                            style={{
                                                backgroundColor:
                                                    selectedItem
                                                        ?.site_preference
                                                        ?.shadow,
                                            }}></div>
                                        <div
                                            className="h-25 w-50 rounded-bottom"
                                            style={{
                                                backgroundColor:
                                                    selectedItem
                                                        ?.site_preference?.font,
                                            }}></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div> */}
                </div>
            </div>
            <div className="row">
                <div className="form-group mt-2">
                    <label className="fw-bold pe-2">
                        Login Html
                        <span className="text-danger"></span>
                    </label>
                    <TextEditor
                        id="login_html"
                        value={selectedItem.login_html}
                        onChange={handleEditor}
                        height="220px"
                    />
                </div>
            </div>
            <div className="row">
                <div className="form-group mt-2">
                    <label className="fw-bold pe-2">
                        Footer Html
                        <span className="text-danger"></span>
                    </label>
                    <TextEditor
                        id="footer_html"
                        value={selectedItem.footer_html}
                        onChange={handleEditor}
                        height="220px"
                    />
                </div>
            </div>
            <div className="row">
                <div className="form-group">
                    <label className="my-1 fw-bold">
                        Custom Login / Sign Up CSS&nbsp;
                        <span className="text-danger"></span>
                    </label>
                    <div className="mb-2">
                        <CodeMirror
                            className="code-mirror enable-scroll"
                            value={selectedItem.css_styles}
                            height="100%"
                            theme={"dark"}
                            extensions={[css()]}
                            onChange={(value, viewUpdate) => {
                                let e = {
                                    target: {
                                        value,
                                        id: "css_styles",
                                    },
                                };
                                handleEditor(e);
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="d-flex text-align-center justify-content-end py-3">
                <button
                    className="btn button-theme btn-sm me-2 pull-left"
                    onClick={() => {
                        clearFields();
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

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                backdrop="static"
                keyboard={false}
                animation={true}>
                <Modal.Header className="d-flex align-tems-center justify-content-center">
                    <Modal.Title>Change Sub Domain</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <SubDomainField
                        selectedItem={selectedItem}
                        domain={domain}
                        handleInputField={handleInputField}
                        setShowModal={setShowModal}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
}

function SubDomainField({
    selectedItem,
    domain,
    handleInputField,
    setShowModal,
}) {
    const [subdomain, setSubdomain] = useState(selectedItem.domain || "");
    const [subDomainIsValid, setSubDomainIsValid] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");

    const domainRef = useRef(null);

    const onlyAplhabetsRegExp = `^([a-z]){1,24}$`;
    const subDomainRegExp = new RegExp(onlyAplhabetsRegExp);

    useEffect(() => {
        if (domainRef.current) {
            domainRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (selectedItem.domain) {
            const isValid = subDomainRegExp.test(selectedItem.domain);
            if (isValid) {
                setSubDomainIsValid(true);
            } else {
                setSubDomainIsValid(false);
                handleInfoMessage(
                    "Subdomain can only contain alphabets (lower case) and limted to 24 characters only",
                );
            }
        }
    }, [selectedItem.domain]);

    function handleChange(event, id) {
        let value = "";

        value = event.target.value;

        const isValid = subDomainRegExp.test(value);
        if (isValid) {
            setSubDomainIsValid(true);
        } else {
            setSubDomainIsValid(false);
        }

        setSubdomain(value);
    }

    function handleInfoMessage(message) {
        setInfoMessage(message);

        setTimeout(() => {
            setInfoMessage("");
        }, 4000);
    }

    async function handleSubDomainSave(value) {
        const isValid = subDomainRegExp.test(value);
        if (isValid) {
            setSubDomainIsValid(true);

            const domainWithSubDomain = subdomain.concat(domain);

            var dataRequest = {
                dataKeys: [
                    {
                        serviceParams: domainWithSubDomain,
                        dataKey: "site",
                        serviceKey: "sys.site.subdomain",
                        mode: "formData",
                    },
                ],
            };
            const response = await axios.post(
                API_URL + "?service.key=master.data",
                dataRequest,
            );
            if (response.data.C_STATUS === "SUCCESS") {
                if (
                    response.data.C_DATA.site &&
                    response.data.C_DATA.site.length === 0
                ) {
                    let event = {
                        target: {
                            name: "domain",
                            value: subdomain,
                        },
                    };

                    handleInputField(event);
                    setShowModal(false);
                } else {
                    handleInfoMessage("Domain already exists.");
                }
            }
        } else {
            setSubDomainIsValid(false);
            handleInfoMessage(
                "Subdomain can only contain alphabets (lower case) and limted to 24 characters only",
            );
        }
    }

    async function checkIfDomainExixts() {
        if (!subDomainIsValid) {
            handleInfoMessage(
                "Subdomain can only contain alphabets (lower case) and limted to 24 characters only",
            );
        } else {
            const domainWithSubDomain = subdomain.concat(domain);

            var dataRequest = {
                dataKeys: [
                    {
                        serviceParams: domainWithSubDomain,
                        dataKey: "site",
                        serviceKey: "sys.site.subdomain",
                        mode: "formData",
                    },
                ],
            };
            const response = await axios.post(
                API_URL + "?service.key=master.data",
                dataRequest,
            );
            if (response.data.C_STATUS === "SUCCESS") {
                if (
                    response.data.C_DATA.site &&
                    response.data.C_DATA.site.length === 0
                ) {
                    handleInfoMessage("Domain is avaliable.");
                } else {
                    handleInfoMessage("Domain already exists.");
                }
            }
        }
    }

    return (
        <div>
            <div className="form-group mb-2">
                <label className="mt-1 fw-bold">
                    Domain&nbsp;
                    <span className="text-danger">*</span>
                </label>

                <div className="input-group">
                    <input
                        ref={domainRef}
                        type="text"
                        className="form-control"
                        name="subdomain"
                        value={subdomain}
                        onChange={handleChange}
                        placeholder="subdomain"
                    />
                    <span className="input-group-text">{domain}</span>
                    <button
                        disabled={subdomain === ""}
                        onClick={() => checkIfDomainExixts()}
                        className={`input-group-text  d-flex justify-content-center align-items-center    ${
                            subDomainIsValid ? "pointer" : "not-allowed"
                        } `}>
                        <span className="mx-1 fa-solid fa-spell-check"></span>{" "}
                        <span>Check Availabilty</span>
                    </button>
                </div>
                {/* <span className="subdomain-validation-text">{infoMessage}</span> */}
                <span className="">{infoMessage}</span>
            </div>

            <hr />
            <div className="d-flex justify-content-end">
                <button
                    className="btn button-theme btn-sm me-2 pull-left text-light"
                    onClick={() => setShowModal(false)}
                    data-bs-dismiss="modal">
                    <i className="fa-solid fa-xmark pe-1"></i>
                    Close
                </button>
                <button
                    className="btn button-theme btn-sm me-2 pull-left text-light"
                    onClick={() => {
                        handleSubDomainSave(subdomain);
                    }}
                    data-bs-dismiss="modal">
                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                    {selectedItem.id === "" ? "Save" : "Update"}
                </button>
            </div>
        </div>
    );
}

function ColorPalette({ color, disable, handleColorPalette, selectedItem }) {
    let disabledOpacity = ".90";
    const handleColors = color => {
        handleColorPalette(color);
    };

    return (
        <>
            <div
                onClick={() => {
                    handleColors(color);
                }}
                className={`container-fluid px-0 palette ${
                    color.id === selectedItem?.site_preference?.color_palette
                        ? " selected-palette "
                        : ""
                } ${disable ? " disable " : ""}`}>
                <div
                    className="place c3"
                    style={{
                        backgroundColor: color.font,
                        opacity: disable ? disabledOpacity : "1",
                        cursor: disable ? "default" : "pointer",
                    }}></div>
                <div
                    className="place c2"
                    style={{
                        backgroundColor: color.shadow,
                        opacity: disable ? disabledOpacity : "1",
                        cursor: disable ? "default" : "pointer",
                    }}></div>
                <div
                    className="place c1"
                    style={{
                        backgroundColor: color.secondary,
                        opacity: disable ? disabledOpacity : "1",
                        cursor: disable ? "default" : "pointer",
                    }}></div>
                <div
                    className="place c0"
                    style={{
                        backgroundColor: color.primary,
                        opacity: disable ? disabledOpacity : "1",
                        cursor: disable ? "default" : "pointer",
                    }}></div>
            </div>
            <center>
                <span
                    className={`${
                        color.id ===
                        selectedItem?.site_preference?.color_palette
                            ? "selected-palette"
                            : ""
                    } palette-text`}>
                    {color.label && color.label}
                </span>
            </center>
        </>
    );
}
export default SiteDetails;
