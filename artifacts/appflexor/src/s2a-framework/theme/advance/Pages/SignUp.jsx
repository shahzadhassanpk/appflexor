import axios from "axios";
import $ from "jquery";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useContext } from "react";
import { AppContext } from "../../../../AppContext";
import { SIGNUP_URL } from "../../../Config";
import {
    disposeTooltip,
    enableTooltip,
    tryParseJSONObject,
} from "../../../utils/utils";
import BrandLogo from "../Layout/BrandLogo";
import SocialLogin from "./SocialLogin";
import LoginBackground from "./LoginBackground";

function SignUp() {
    let initialState = {
        firstname: "",
        lastname: "",
        email: "",
        username: "",
        password: "",
    };
    const appContext = useContext(AppContext);
    const { screenView } = appContext;
    const [userDetail, setUserDetail] = useState(initialState);
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState([]);
    const [usernameError, setUsernameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [fadeIn, setFadeIn] = useState("");
    const [socialLogins, setSocialLogins] = useState([]);
    const navigate = useNavigate();

    const clientID = appContext.brandDetails.google_client_id;
    const clientSecret = appContext.brandDetails.google_client_secret;
    const handleGoogleLogin = path => {
        const newWin = window.open(
            `/auth/${path}?clientID=${encodeURIComponent(
                clientID,
            )}&clientSecret=${encodeURIComponent(clientSecret)}`,
            "_self",
        );

        if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
            toastEmitter("Please allow popups.", true, "warning");
        }
    };

    useEffect(() => {
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    useEffect(() => {
        let brand = appContext.channel;
        if (brand && !isEmpty(brand)) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.getElementsByTagName("head")[0].appendChild(link);
            }
            let url =
                brand.brand_logo && brand.brand_logo !== ""
                    ? "/file/service/app_site/" +
                      brand.id +
                      "/" +
                      brand.brand_logo
                    : "/them/advance/images/default-logo.png";
            link.href = url;
        }
        if (appContext.channel.sso_login) {
            let socialLogins = tryParseJSONObject(
                appContext.channel.sso_login,
                [],
            );
            if (socialLogins && socialLogins.length > 0) {
                setSocialLogins(socialLogins);
            }
        }
    }, [appContext.channel]);

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function handleChange(evt) {
        let name = evt.target.name;
        let value = evt.target.value;
        setUserDetail(prevState => ({
            ...prevState,
            [name]: value,
        }));
    }

    function handleConfirmPasswordChange(evt) {
        let value = evt.target.value;
        setConfirmPassword(value);
    }

    function handleUsernameError(message) {
        setUsernameError(message);
        setTimeout(() => {
            setFadeIn("fade");
        }, 3500);
        setTimeout(() => {
            setUsernameError(" ");
            setFadeIn(" ");
        }, 4000);
    }

    function handleEmailError(message) {
        setEmailError(message);
        setTimeout(() => {
            setFadeIn("fade");
        }, 3500);
        setTimeout(() => {
            setEmailError(" ");
            setFadeIn(" ");
        }, 4000);
    }

    function handleSuccessSignup(message) {
        setSuccessMsg(message);
        setTimeout(() => {
            setFadeIn("fade");
        }, 2000);
        setTimeout(() => {
            setSuccessMsg(" ");
            setFadeIn(" ");
        }, 2500);
        setTimeout(() => {
            navigate("/login");
        }, 3000);
    }

    function handleShowPassword(event) {
        setShowPassword(event.target.checked);
    }

    function validation() {
        let errorsFound = [];

        const emailRxg =
            /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

        for (var key in userDetail) {
            if (key === "email") {
                if (!emailRxg.test(userDetail[key])) {
                    errorsFound.push(key);
                }
            } else if (key === "password") {
                if (confirmPassword.length < 1 || userDetail[key].length < 1) {
                    errorsFound.push(key);
                }
                if (
                    confirmPassword.length > 0 &&
                    userDetail[key].length > 0 &&
                    confirmPassword !== userDetail[key]
                ) {
                    errorsFound.push("confirm_password");
                }
            } else if (userDetail[key] === "") {
                errorsFound.push(key);
            }
        }

        setErrors(errorsFound);

        if (errorsFound.length > 0) {
            return false;
        } else {
            return true;
        }
    }

    function generateUsername() {
        var first_name = userDetail.firstname;
        var last_name = userDetail.lastname;

        var username =
            first_name + last_name + Math.floor(Math.random() * (99 - 0) + 0);
        username = username.replaceAll(" ", "").toLowerCase();

        setUserDetail(prevState => ({
            ...prevState,
            username: username,
        }));

        const callback = status => {
            if (status === "FAIL") {
                generateUsername();
            }
        };

        checkDuplicateUsername(username, callback);
    }

    async function signUp() {
        if (validation()) {
            try {
                const userExist = await checkDuplicateUsername(
                    userDetail.username,
                );

                const emailExist = await checkDuplicateEmail(userDetail.email);

                if (emailExist) {
                    return handleEmailError("Email already exists.");
                }

                if (userExist) {
                    return handleUsernameError("Username already exists.");
                }

                const updatedUserDetail = {
                    ...userDetail,
                    channel_id: appContext.channel.id,
                };

                const signUpUrl = `${SIGNUP_URL}?service.key=register.user`;
                axios.post(signUpUrl, updatedUserDetail).then(response => {
                    if (response.data.C_STATUS == "SUCCESS") {
                        setUserDetail(initialState);
                        setConfirmPassword("");
                        handleSuccessSignup(
                            "Signup was successfull, redirecting to login page",
                        );
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }
    }

    function checkDuplicateUsername(username, callback) {
        const url = `${SIGNUP_URL}?service.key=check.username`;
        const dataRequest = {
            username,
        };
        return new Promise((resolve, reject) => {
            axios
                .post(url, dataRequest)
                .then(function (response) {
                    if (response.status === 200) {
                        const status = response.data.C_STATUS;
                        if (callback) {
                            callback(status);
                        }

                        if (status === "FAIL") {
                            resolve(true);
                        } else if (status === "SUCCESS") {
                            resolve(false);
                        }
                    }
                })
                .catch(err => {
                    console.error("***********:" + err);
                });
        });
    }

    function checkDuplicateEmail(email) {
        const url = `${SIGNUP_URL}?service.key=check.email`;
        const dataRequest = {
            email,
        };
        return new Promise((resolve, reject) => {
            axios
                .post(url, dataRequest)
                .then(function (response) {
                    if (response.status === 200) {
                        const status = response.data.C_STATUS;

                        if (status === "FAIL") {
                            resolve(true);
                        } else if (status === "SUCCESS") {
                            resolve(false);
                        }
                    }
                })
                .catch(err => {
                    console.error("***********:" + err);
                });
        });
    }

    return (
        <React.Fragment>
            <div
                id="signup"
                className="s2a-signup">
                <style>{appContext?.channel?.css_styles}</style>
                <div className="row m-0">
                    {screenView === "lg" && (
                        <LoginBackground> </LoginBackground>
                    )}
                    <div className="col-sm-6 login-brand-bg">
                        <div className="login-content">
                            <div className="s2a-brand-container">
                                <BrandLogo></BrandLogo>
                                <div className="signup-form rounded-4 border-shadow">
                                    <div className="row mb-2">
                                        <div className="col registerd">
                                            <p className="h5 text-center login-text">
                                                Get Registered
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="row">
                                            <div className="col-sm-6 mb-3">
                                                <input
                                                    type="text"
                                                    name="firstname"
                                                    value={userDetail.firstname}
                                                    onChange={handleChange}
                                                    className="form-control form-control-custom"
                                                    placeholder="First Name*"
                                                    tabIndex={1}
                                                    required
                                                />

                                                <span
                                                    className={`invalid-feedback ${
                                                        errors.indexOf(
                                                            "firstname",
                                                        ) > -1 && "d-block"
                                                    }`}>
                                                    First Name is Required.
                                                </span>
                                            </div>
                                            <div className="col-sm-6 mb-3">
                                                <input
                                                    type="text"
                                                    name="lastname"
                                                    value={userDetail.lastname}
                                                    onChange={handleChange}
                                                    className="form-control form-control-custom"
                                                    placeholder="Last Name*"
                                                    tabIndex={2}
                                                    required
                                                />
                                                <span
                                                    className={`invalid-feedback ${
                                                        errors.indexOf(
                                                            "lastname",
                                                        ) > -1 && "d-block"
                                                    }`}>
                                                    Last Name is Required.
                                                </span>
                                            </div>
                                        </div>
                                        <div className="row mb-3">
                                            <div className="col">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={userDetail.email}
                                                    onChange={handleChange}
                                                    className="form-control form-control-custom email"
                                                    placeholder="Email*"
                                                    tabIndex={3}
                                                    required
                                                />
                                                <span
                                                    className={`invalid-feedback ${
                                                        errors.indexOf(
                                                            "email",
                                                        ) > -1 && "d-block"
                                                    }`}>
                                                    Invalid email.
                                                </span>
                                                <div
                                                    className={`invalid-feedback d-block ${fadeIn}`}>
                                                    {emailError}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row mb-3">
                                            <div className="col">
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        onChange={handleChange}
                                                        value={userDetail.username.replaceAll(
                                                            /['";,()<>%!#$^&*?=+:[{}`~/|\\\]]/g,
                                                            "",
                                                        )}
                                                        className="form-control form-control-custom"
                                                        placeholder="Username*"
                                                        tabIndex={4}
                                                        required
                                                    />
                                                    {/* <span
                                                className="input-group-text suggest-btn p-0"
                                                id="basic-addon2">
                                                <button
                                                    className={`btn username-btn ${userDetail.firstname ==
                                                            "" ||
                                                            userDetail.lastname ==
                                                            ""
                                                            ? "  text-danger "
                                                            : "  text-success"
                                                        } `}
                                                    type="button"
                                                    style={{
                                                        cursor:
                                                            userDetail.firstname ==
                                                                "" ||
                                                                userDetail.lastname ==
                                                                ""
                                                                ? "not-allowed"
                                                                : "",
                                                    }}
                                                    onClick={() => {
                                                        if (
                                                            userDetail.firstname !=
                                                            "" &&
                                                            userDetail.lastname !=
                                                            ""
                                                        ) {
                                                            generateUsername();
                                                        }
                                                    }}
                                                    data-bs-toggle="tooltip"
                                                    data-bs-title="Requires first name, last name"
                                                    tabIndex={5}>
                                                    Suggest
                                                </button>
                                            </span> */}
                                                    <span
                                                        className="input-group-text suggest-btn p-0"
                                                        id="basic-addon2">
                                                        <button
                                                            className={`username-btn btn ${
                                                                userDetail.email ==
                                                                ""
                                                                    ? " text-danger "
                                                                    : " text-success"
                                                            } `}
                                                            type="button"
                                                            style={{
                                                                cursor:
                                                                    userDetail.email ==
                                                                    ""
                                                                        ? "not-allowed"
                                                                        : "",
                                                            }}
                                                            onClick={() => {
                                                                if (
                                                                    userDetail.email !==
                                                                    ""
                                                                ) {
                                                                    const sanitizedEmail =
                                                                        userDetail.email.replaceAll(
                                                                            /['";,()<>%!#$^&*?=+:[{}`~/|\\\]]/g,
                                                                            "",
                                                                        );

                                                                    setUserDetail(
                                                                        prev => ({
                                                                            ...prev,
                                                                            username:
                                                                                sanitizedEmail,
                                                                        }),
                                                                    );
                                                                }
                                                            }}
                                                            data-bs-toggle="tooltip"
                                                            data-bs-title="Requires email"
                                                            tabIndex={6}>
                                                            Email as a username
                                                        </button>
                                                    </span>
                                                </div>

                                                <div
                                                    className={`invalid-feedback ${
                                                        errors.indexOf(
                                                            "username",
                                                        ) > -1 && "d-block"
                                                    }`}>
                                                    Username is Required.
                                                </div>
                                                <div
                                                    className={`invalid-feedback d-block ${fadeIn}`}>
                                                    {usernameError}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-sm-12 mb-3">
                                                <input
                                                    name="password"
                                                    className="form-control form-control-custom password"
                                                    placeholder="Password*"
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    value={userDetail.password}
                                                    onChange={handleChange}
                                                    tabIndex={7}
                                                    required
                                                />
                                                <span
                                                    className={`invalid-feedback ${
                                                        errors.indexOf(
                                                            "password",
                                                        ) > -1 && "d-block"
                                                    }`}>
                                                    Password is Required
                                                </span>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-sm-12 mb-3">
                                                <input
                                                    name="password"
                                                    className="form-control form-control-custom password"
                                                    placeholder="Confirm Password*"
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    value={confirmPassword}
                                                    onChange={e =>
                                                        handleConfirmPasswordChange(
                                                            e,
                                                        )
                                                    }
                                                    tabIndex={8}
                                                    required
                                                />
                                                <span
                                                    className={`invalid-feedback ${
                                                        errors.indexOf(
                                                            "confirm_password",
                                                        ) > -1 && "d-block"
                                                    }`}>
                                                    Password didn't match
                                                </span>
                                            </div>
                                        </div>

                                        <div className="action-row mb-2">
                                            <div className="col-sm-6">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm button-theme"
                                                    onClick={() => signUp()}
                                                    tabIndex={9}>
                                                    Sign up
                                                </button>
                                            </div>
                                            <div className="form-check my-2 ms-2 ps-3">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    value=""
                                                    id="password-show"
                                                    onChange={event => {
                                                        handleShowPassword(
                                                            event,
                                                        );
                                                    }}
                                                    tabIndex={10}
                                                />
                                                <label className="form-check-label show-password">
                                                    Show password
                                                </label>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <Link
                                                to="/login"
                                                className="btn btn-link"
                                                tabIndex={11}>
                                                Already have an account
                                            </Link>
                                            <center>
                                                <span className="text-success">
                                                    {successMsg}
                                                </span>
                                            </center>
                                        </div>
                                        <div className="col-sm-12 text-center">
                                            {/* {appContext.channel &&
                                                appContext.channel
                                                    .allow_signup === "YES" &&
                                                socialLogins &&
                                                socialLogins.length > 0 && (
                                                    <SocialLogin
                                                        socialLogins={
                                                            socialLogins
                                                        }
                                                    />
                                                )} */}
                                            {appContext.channel &&
                                                appContext.channel
                                                    .allow_signup === "YES" &&
                                                socialLogins &&
                                                socialLogins.length > 0 && (
                                                    <button
                                                        type="button"
                                                        style={{
                                                            width: "100%",
                                                        }}
                                                        className="sso-buttons rounded pointer"
                                                        onClick={() =>
                                                            handleGoogleLogin(
                                                                "google",
                                                            )
                                                        }>
                                                        <i className="fa-brands fa-google"></i>
                                                        &nbsp; Continue with
                                                        Google
                                                    </button>
                                                )}
                                        </div>
                                        {/* {socialLogins &&
                                        socialLogins.length > 0 && (
                                            <div className="row">
                                                <center className="mb-2 fw-2 login-text">
                                                    Or
                                                </center>
                                                <div className="col p-0 mt-2">
                                                    <SocialLogin
                                                        socialLogins={
                                                            socialLogins
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default SignUp;
