import axios from "axios";
import { MD5 } from "crypto-js";
import React, { useContext, useEffect, useState } from "react";
import Autocomplete from "react-google-autocomplete";
import PhoneInput from "react-phone-input-2";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { AppContext } from "../../../../AppContext";
import {
    API_URL,
    DATE_FORMAT_FOR_DATE_PICKER_VIEW,
    IMAGE_BASE,
} from "../../../Config";
import FileUploader from "../../../components/FileUploader/FileUploader";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { Tabs } from "../../../components/tabs";
import DateRange from "../../../components/DateRange";
import ReactSelect from "../../../components/ReactSelect/ReactSelect";
import {
    getData as getGlobalData,
    handleSave,
} from "../../../components/CrudApiCall";
import moment from "moment";
import { formatDateForDataBase } from "../../../modules/data-management/form-builder/Forms/FormViewer/utils";
import DynamicCheckBoxs from "../../../components/dynamic-checkbox/Checkbox";

function UserProfile() {
    let initialState = {
        id: "",
        firstname: "",
        lastname: "",
        email: "",
        address: "",
        location: "",
        city: "",
        country: "",
        mfa_option: "",
        mfa_type: "",
        profile_img: "",
        provider: "",
    };

    const [profile, setProfile] = useState(initialState);
    const [profileCopy, setProfileCopy] = useState({});
    const [saveIsDisabled, setSaveIsDisabled] = useState(false);
    const [toggle, setToggle] = useState(true);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [userProfile, setUserProfile] = useState([]);
    const [imageUrl, setImgUrl] = useState("");
    const appContext = useContext(AppContext);
    const [oldPassword, setOldPassword] = useState("");
    const [show, setShow] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState([]);

    const tenantId = appContext?.tenantSubscription?.tenant_id;
    const [showPassword, setShowPassword] = useState(false);
    const [detectedCountry, setDetectedCountry] = useState("us");
    const [phoneValue, setPhoneValue] = useState(profile.phone || "");
    const tabs = [
        {
            id: "FORM",
            label: "User Details",
        },
        {
            id: "TASK-DELEGATION",
            label: "Task Delegation",
        },
    ];
    const [activeTab, setActiveTab] = useState("FORM");
    const [date, setDate] = useState({
        start: "",
        end: "",
    });
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const userIndex = users?.findIndex(user => user?.value === selectedUserId);
    const selectedUser = users?.[userIndex];
    const [selectedDelegationRecord, setSelectedDelegationRecord] = useState(
        {},
    );
    const [selectedEnableDelegation, setSelectedEnableDelegation] =
        useState("");

    useEffect(() => {
        const bootstrap = window.bootstrap;
        const tooltipTriggerList = document.querySelectorAll(
            '[data-bs-toggle="tooltip"]',
        );
        const tooltipList = [...tooltipTriggerList].map(
            tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl),
        );
        getData();
    }, [activeTab]);

    useEffect(() => {
        setPhoneValue(profile.phone || ""); // Update phoneValue with profile.phone when profile changes
    }, [profile.phone]);

    useEffect(() => {
        let url = "";
        if (profile.profile_img) {
            if (profile.provider !== "system") {
                url = profile.profile_img;
            } else {
                url = `${IMAGE_BASE}/dir_user/${profile.id}/${profile.profile_img}`;
            }
        } else {
            url = "./theme/images/default-user-profile-img.png";
        }
        setImgUrl(url);
        appContext.wrapperSetProfile(profile);
    }, [profile]);

    useEffect(() => {
        if (toggle) {
            setConfirmPassword("");
            setOldPassword("");
        }
    }, [toggle]);

    useEffect(() => {
        if (activeTab === "TASK-DELEGATION") {
            getUserList();
            getDelegationUser();
            // setSelectedEnableDelegation(selectedDelegationRecord?.delegation_active || "");
        } else if (activeTab === "FORM") {
            setDate({
                start: null,
                end: null,
            });
            setSelectedDelegationRecord({});
            setSelectedUserId("");
            setSelectedEnableDelegation("");
        }
    }, [activeTab]);

    async function getUserList() {
        try {
            const response = await getGlobalData({
                keys: [
                    {
                        dataKey: "data",
                        serviceKey: "sys.list.user.delegation",
                    },
                ],
            });
            setUsers(response?.data?.C_DATA?.data || []);
        } catch (error) {
            toastEmitter("Users Fetching Failed", true, "error");
        }
    }

    async function getDelegationUser() {
        try {
            const response = await getGlobalData({
                keys: [
                    {
                        params: profile?.username,
                        dataKey: "data",
                        serviceKey: "sys.user.delegation",
                    },
                ],
            });
            const data = response?.data?.C_DATA?.data?.[0];
            const startDate = data?.startdate ? moment(data?.startdate) : null;
            const endDate = data?.enddate ? moment(data?.enddate) : null;
            setDate({
                ...date,
                start: startDate,
                end: endDate,
            });
            setSelectedUserId(data?.replacementuser || "");
            setSelectedDelegationRecord(data || {});
            setSelectedEnableDelegation(data?.delegation_active || "");
        } catch (error) {
            toastEmitter("User Delegation not found", true, "info");
        }
    }

    function handleDateChange(selectedDate) {
        setDate({
            ...date,
            start: selectedDate?.startDate,
            end: selectedDate?.endDate,
        });
    }

    function handleUserChange(user) {
        setSelectedUserId(user?.value);
    }

    function handleTabChange(tab) {
        setActiveTab(tab?.id);
    }

    function handleNewProfileInput(e) {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value,
        });
    }

    // function handleMFAInput(e) {
    //     setProfile({
    //         ...profile,
    //         [e.target.name]: e.target.checked.toString(),
    //     });
    // }

    function handleCancelEdit() {
        setToggle(prevState => !prevState);
        if (show) {
            setShow(false);
        }
        setProfile(profileCopy);
    }

    // function getPlaces(place) {
    //     const _place = {
    //         location: "",
    //         city: "",
    //         country: "",
    //     };

    //     place.address_components.map(value => {
    //         if (value.types.indexOf("street_number") > -1) {
    //             _place.location = value.long_name;
    //         } else if (value.types.indexOf("route") > -1) {
    //             _place.location += " " + value.long_name;
    //         } else if (value.types.indexOf("neighborhood") > -1) {
    //             _place.location += " " + value.long_name;
    //         } else if (value.types.indexOf("sublocality_level_1") > -1) {
    //             _place.location += " " + value.long_name;
    //         } else if (
    //             value.types.indexOf("administrative_area_level_2") > -1
    //         ) {
    //             _place.city = value.long_name;
    //         } else if (value.types.indexOf("country") > -1) {
    //             _place.country = value.long_name;
    //         }
    //     });

    //     let _tempObj = profile;

    //     _tempObj = {
    //         location: _place.location,
    //         city: _place.city,
    //         country: _place.country,
    //     };
    //     console.log(_place.location);

    //     setProfile(prevState => ({
    //         ...prevState,
    //         ..._tempObj,
    //     }));
    // }

    function getData() {
        let userProfileServiceKey = "sys.user.profile";
        let _userProfile = {};
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "profile",
                    serviceKey: userProfileServiceKey,
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    if (response.data.C_DATA.profile[0]) {
                        _userProfile = response.data.C_DATA.profile[0];
                        setProfile(_userProfile);
                        setProfileCopy(_userProfile);
                        setUserProfile(_userProfile);
                        let phoneCuntry = "+" + _userProfile.phone;
                        const parsedPhoneNumber =
                            parsePhoneNumberFromString(phoneCuntry);
                        if (parsedPhoneNumber) {
                            setDetectedCountry(
                                parsedPhoneNumber.country.toLowerCase(),
                            );
                            setPhoneValue(parsedPhoneNumber.number);
                        }
                    } else {
                        console.error(
                            `Either service key for ${userProfileServiceKey} is missing or SQL query returns no record`,
                        );
                        setProfile(initialState);
                    }
                    setIsLoaded(true);
                } else {
                    setError("Unable to get data");
                }
            })
            .catch(error => {
                setError(error);
            });
    }

    async function handleSaveProfile(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (
            show === false &&
            confirmPassword.length === 0 &&
            oldPassword.length === 0
        ) {
            saveProfile();
        } else {
            const status = await CheckPassword();
            if (confirmPassword?.length > 0 && oldPassword && status) {
                if (confirmPassword?.length && passwordMatch()) {
                    saveProfile();
                } else {
                    toastEmitter(
                        "New password is not matching with Confirm new password",
                        true,
                        "error",
                    );
                }
            } else {
                toastEmitter(
                    status
                        ? `Please enter ${
                              oldPassword.length > 0
                                  ? ""
                                  : "current password and"
                          }  new password ${
                              confirmPassword.length > 0
                                  ? ""
                                  : "and new confirm password"
                          } `
                        : "Old password is not matching",
                    true,
                    "error",
                );
            }
        }
    }

    function saveProfile() {
        let fieldsData = profile;
        if (confirmPassword && confirmPassword.length > 0) {
            fieldsData.password = MD5(profile.password).toString();
        }

        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "dir_user";
        entityForm.entity = "dir_user";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }

        entityForm.formData = fieldsData;
        request.data.push(entityForm);

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    setToggle(prevState => !prevState);
                    getData();
                    setShow(false);
                    setOldPassword("");

                    if (fieldsData.id === "" || fieldsData.id === "new") {
                        fieldsData.id = response.data.C_NEW_RECORD_ID;
                    }

                    setIsLoaded(true);
                } else {
                    setError("Unable to save data.....");
                }
            })
            .catch(error => {
                setError(error);
            });
    }

    function passwordMatch() {
        let flag = false;
        let error = [];
        if (profile.password === confirmPassword) {
            flag = true;
        } else {
            error.push("password");
            setPasswordError(error);
        }
        return flag;
    }

    async function CheckPassword() {
        let status = "";
        try {
            status = await verifyPassword();
        } catch (error) {
            console.log(error);
        }
        return status;
    }
    function verifyPassword() {
        let obj = {
            username: profile.username,
            password: oldPassword,
        };
        return new Promise((resolve, reject) => {
            axios
                .post(API_URL + `?service.key=verify.password`, obj)
                .then(res => {
                    if (res.data.C_STATUS !== "FAIL") {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
        });
    }

    function setOldPassFunc(e) {
        const { value } = e.target;
        setOldPassword(value);
    }

    async function handleSaveDelegation() {
        if (!selectedUserId) {
            toastEmitter("Please the user", true, "info");
            return;
        } else if (!date.start || !date.end) {
            toastEmitter("Please select the date", true, "info");
            return;
        }

        try {
            const promise1 = handleSave({
                entity: "dir_user_replacement",
                formData: {
                    id: selectedDelegationRecord?.id || "new",
                    replacementuser: selectedUserId,
                    startdate: formatDateForDataBase(date.start),
                    enddate: formatDateForDataBase(date.end),
                    username: profile.username,
                    delegation_active: selectedEnableDelegation,
                },
            });
            // const promise2 = handleSave({
            //     entity: "dir_user",
            //     formData: {
            //         id: profile?.id,
            //         delegation_active: selectedEnableDelegation,
            //     },
            // });
            await Promise.all([promise1]);
            toastEmitter(
                `Task Delegate to ${selectedUser?.label} ${
                    selectedEnableDelegation ? "and active" : "and un-active"
                }`,
            );
        } catch (error) {
            toastEmitter("User Task Delegation Failed", true, "error");
        }
    }

    function handleEnableDelegation(item) {
        setSelectedEnableDelegation(item);
    }

    return (
        <div
            id="user-profile"
            className="container p-3">
            <div className="profile-set s2a-border">
                <div className="profile-head"></div>
                <div className="profile-top">
                    <div className="profile-content">
                        <div className="profile-contentimg">
                            <img
                                className="image-styling shadow"
                                src={imageUrl}
                                alt="image"
                            />
                        </div>
                        <div className="profile-contentname">
                            <h2 className="text-capitalize">
                                {profile.firstname} {profile.lastname}
                            </h2>
                            <h4>Update Your Photo and Personal Details.</h4>
                            {profile.provider === "system" && (
                                <div className="form-group m-2 mb-3 col-sm-4">
                                    <label className="mt-1 fw-bold">
                                        Profile Image&nbsp;{show}
                                        <span className="text-danger"></span>
                                    </label>
                                    {!toggle && (
                                        <FileUploader
                                            item={profile}
                                            multiple={false}
                                            entity="dir_user"
                                            record_id={profile.id}
                                            field_id="profile_img"
                                            getData={getData}
                                            extensionsAllowed={[
                                                "png",
                                                "jpg",
                                                "jpeg",
                                            ]}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="my-2">
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    handleTabChange={handleTabChange}
                />
            </div>
            {activeTab === "FORM" && (
                <form
                    onSubmit={event => handleSaveProfile(event)}
                    className="mt-2">
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group text-left  ">
                                <label className=" mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstname"
                                    className="form-control mb-2 tp "
                                    value={profile.firstname}
                                    onChange={handleNewProfileInput}
                                    disabled={toggle}
                                />
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="form-group text-left  ">
                                <label className=" mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastname"
                                    className="form-control mb-2"
                                    value={profile.lastname}
                                    onChange={handleNewProfileInput}
                                    disabled={toggle}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group text-left  ">
                                <label className=" mb-1">Email</label>
                                <input
                                    type="text"
                                    name="email"
                                    className="form-control mb-2"
                                    value={profile.email}
                                    onChange={handleNewProfileInput}
                                    disabled={toggle}
                                />
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="form-group text-left  ">
                                <label className=" mb-1">Phone</label>
                                {toggle && (
                                    <PhoneInput
                                        // country={detectedCountry}
                                        value={phoneValue}
                                        placeholder={""}
                                        disabled={true}
                                        inputStyle={{
                                            padding: "6px 13px 6px 60px",
                                            width: "100%",
                                            backgroundColor: "#e9ecef",
                                        }}
                                    />
                                )}
                                {!toggle && (
                                    <PhoneInput
                                        // country={detectedCountry}
                                        value={phoneValue}
                                        placeholder={""}
                                        onChange={currentValue => {
                                            setPhoneValue(currentValue); // Update local phone value
                                            setProfile(prevState => ({
                                                ...prevState,
                                                phone: currentValue, // Update profile phone
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
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-6">
                            <label className=" mb-1">Location</label>
                            <input
                                type="text"
                                name="location"
                                className="form-control"
                                value={profile.location}
                                onChange={handleNewProfileInput}
                                disabled={toggle}
                            />
                            {/* <Autocomplete
                            apiKey={GOOGLE_MAP_API_KEY}
                            name="location"
                            className="form-control"
                            language="en"
                            value={profile.location}
                            onChange={handleNewProfileInput}
                            onPlaceSelected={place => {
                                getPlaces(place);
                            }}
                            options={{
                                types: ["address"],
                                componentRestrictions: { country: "pk" },
                            }}
                            disabled={toggle}
                            //disabled={true}
                        /> */}
                        </div>
                        <div className="col-sm-6">
                            <div className="form-group text-left  ">
                                <label className=" mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="form-control mb-2"
                                    value={profile.address}
                                    onChange={handleNewProfileInput}
                                    disabled={toggle}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group text-left  ">
                                <label className=" mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    className="form-control mb-2"
                                    value={profile.city}
                                    onChange={handleNewProfileInput}
                                    disabled={toggle}
                                />
                            </div>
                        </div>

                        <div className="col-sm-6">
                            <div className="form-group text-left  ">
                                <label className=" mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    className="form-control mb-2"
                                    value={profile.country}
                                    onChange={handleNewProfileInput}
                                    disabled={toggle}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row mb-1">
                        {profile.provider == "system" && (
                            <div className="col-sm-2">
                                <span className="me-2">
                                    <input
                                        disabled={toggle}
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={show}
                                        onChange={() => setShow(!show)}
                                    />
                                </span>
                                <label>Change Password</label>
                            </div>
                        )}
                        {show && (
                            <div className="col-sm-2">
                                <span className="me-2">
                                    <input
                                        disabled={toggle}
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={showPassword}
                                        onChange={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    />
                                </span>
                                <label>
                                    <span className="me-2">Show Password</span>
                                    {/* <span>
                                    {showPassword ? (
                                        <i className="fa-regular fa-eye"></i>
                                    ) : (
                                        <i className="fa-regular fa-eye-slash"></i>
                                    )}
                                </span> */}
                                </label>
                            </div>
                        )}
                    </div>
                    {show && (
                        <>
                            <div className="row">
                                <div className="col-sm-4">
                                    <div className="form-group text-left">
                                        <label className="d-flex justify-content-between">
                                            Current Password&nbsp;
                                            <span className="text-danger"></span>
                                        </label>
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            className="form-control mb-2"
                                            onChange={setOldPassFunc}
                                            value={oldPassword}
                                            disabled={toggle}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="form-group text-left  ">
                                        <label className=" mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            className="form-control mb-2"
                                            value={profile.password}
                                            onChange={handleNewProfileInput}
                                            disabled={toggle}
                                        />
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="form-group text-left  ">
                                        <label className="d-flex justify-content-between mb-1">
                                            <span>Confirm New Password</span>
                                            <span
                                                className={
                                                    passwordError.indexOf(
                                                        "password",
                                                    ) > -1
                                                        ? "text-danger"
                                                        : ""
                                                }>
                                                {passwordError.indexOf(
                                                    "password",
                                                ) > -1
                                                    ? "Password does not match"
                                                    : ""}
                                            </span>
                                        </label>
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            className={
                                                passwordError.indexOf(
                                                    "password",
                                                ) > -1
                                                    ? "is-invalid form-control mb-2"
                                                    : "form-control mb-2"
                                            }
                                            onChange={e =>
                                                setConfirmPassword(
                                                    e.target.value,
                                                )
                                            }
                                            disabled={toggle}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {/* <div className="row">
                    <div className="col-sm-6">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="mfa_option"
                                name="mfa_option"
                                checked={
                                    profile.mfa_option === "true" ? true : false
                                }
                                onChange={e => handleMFAInput(e)}
                                disabled={toggle}
                            />
                            <label
                                data-bs-toggle="tooltip"
                                data-bs-title="Multi-Factor Authentication"
                                className="form-check-label"
                                htmlFor="flexCheckDefault">
                                Enable MFA
                            </label>
                        </div>
                    </div>
                    {(profile.mfa_option === "true" ||
                        profile.mfa_option === true) && (
                            <div className="col-sm-6">
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="mfa_type"
                                        id="mobile-mfa"
                                        onChange={e => handleNewProfileInput(e)}
                                        value="MOBILE"
                                        checked={profile.mfa_type === "MOBILE"}
                                        disabled={toggle}
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="mobile-mfa">
                                        Mobile
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="mfa_type"
                                        id="email-mfa"
                                        value="EMAIL"
                                        checked={profile.mfa_type === "EMAIL"}
                                        onChange={e => handleNewProfileInput(e)}
                                        disabled={toggle}
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="email-mfa">
                                        Email
                                    </label>
                                </div>
                            </div>
                        )}
                </div> */}
                    {!toggle && (
                        <div className="col-sm-12">
                            <div className="row">
                                <div className="col">
                                    <button
                                        type="submit"
                                        className="btn button-theme btn-sm pull-left m-2 ms-0"
                                        disabled={saveIsDisabled}>
                                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                                        Save
                                    </button>
                                    <button
                                        className="btn button-theme btn-sm pull-left m-2"
                                        onClick={handleCancelEdit}>
                                        <i className="fa-solid fa-xmark pe-1"></i>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {toggle && (
                        <button
                            type="button"
                            className="btn btn-sm button-theme pull-left m-2 ms-0 "
                            onClick={() => setToggle(prevState => !prevState)}>
                            <i className="fa-regular fa-edit pe-1"></i>
                            Edit
                        </button>
                    )}
                </form>
            )}
            {activeTab === "TASK-DELEGATION" && (
                <>
                    <div className="row gap-4">
                        <div className="col-sm-12 mt-2">
                            <DynamicCheckBoxs
                                items={[
                                    {
                                        code: "ACTIVE",
                                        label: "Active",
                                    },
                                ]}
                                handleChange={handleEnableDelegation}
                                selectedItem={selectedEnableDelegation}
                            />
                        </div>
                        <div className="col-sm-12">
                            <label>Delegate To</label>
                            <div className="mt-1">
                                <ReactSelect
                                    options={users}
                                    selectedOption={selectedUser}
                                    handleChange={handleUserChange}
                                    disabled={selectedEnableDelegation === ""}
                                />
                            </div>
                        </div>
                        <div className="col-sm-12">
                            <DateRange
                                label="Validity"
                                startDate={date.start}
                                endDate={date.end}
                                handleDateChange={handleDateChange}
                                disabled={selectedEnableDelegation === ""}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-6 mt-4">
                            <button
                                className="button-theme"
                                onClick={handleSaveDelegation}>
                                Save
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default UserProfile;
