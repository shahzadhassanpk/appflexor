import axios from "axios";
import MD5 from "crypto-js/md5";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { API_URL, AUTH_URL, SIGNUP_URL } from "../../../Config";
import GlobalLoader from "../../../components/GlobalLoader";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import {
    decryptData,
    deleteCookie,
    encryptData,
    getCookie,
    setCookie,
    tryParseJSONObject,
    checIfSignupAllowed,
    checkIfGuestLoginAllowed,
} from "../../../utils/utils";
import BrandLogo from "../Layout/BrandLogo";
import LoginBackground from "./LoginBackground";
import SocialLogin from "./SocialLogin";
import DynamicCheckBoxs from "../../../components/dynamic-checkbox/Checkbox";

function Login({
    isLoading,
    isLoaded,
    isAuthorized,
    initailRoute,
    setIsLoading,
    setIsAuthorized,
    errorMessage,
    setErrorMessage,
    handleLogout,
}) {
    let initialState = {
        username: "",
        password: "",
    };

    const appContext = useContext(AppContext);
    const navigate = useNavigate();
    const [userDetails, setUserDetails] = useState(initialState);
    const [socialLogins, setSocialLogins] = useState([]);
    const [message, setMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [usernameIsValid, setUsernameIsValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [disableInputField, setDisableInputField] = useState(false);
    const [loading, setLoading] = useState(true);
    const [keepMeLogin, setKeepMeLogin] = useState("");

    const showBanner = localStorage.getItem("SHOW_SESSION_TIMEOUT") || "NO";

    const passwordRef = useRef(null);
    const location = useLocation();
    const handleNavigateToRegister = () => {
        // Navigate to /register
        window.location.href = "/app/register"; // or use history.push('/register') if within a Router context
    };
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
    const { featuresSubscription } = appContext;

    const [isSignupAllowed, setIsSignupAllowed] = useState(false);
    const [isGuestAllowed, setIsGuestLoginAllowed] = useState(false);

    useEffect(() => {
        setIsSignupAllowed(checIfSignupAllowed(featuresSubscription));
        setIsGuestLoginAllowed(checkIfGuestLoginAllowed(featuresSubscription));
    }, [featuresSubscription]);

    useEffect(() => {
        setLoading(false);
    }, [location.pathname]);

    useEffect(() => {
        const details = getCookie("user");
        if (details) {
            const dec = decryptData(details);
            // setUserDetails(dec);
            login(dec);
        }
    }, []);

    useEffect(() => {
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

    useEffect(() => {
        if (usernameIsValid) {
            if (passwordRef.current) passwordRef.current.focus();
        }
    }, [usernameIsValid]);

    // useEffect(() => {
    //     let id;
    //     if (message) {
    //         id = setTimeout(() => {
    //             setMessage("");
    //         }, 3000);
    //     }
    //     return () => clearTimeout(id);
    // }, [message]);

    function handleInput(event) {
        let name = event.target.name;
        let value = event.target.value;
        setUserDetails(prevSatte => ({
            ...prevSatte,
            [name]: value,
        }));
    }

    function handleErrorMessage(message) {
        setErrorMessage(message);
        setMessage(message);

        setTimeout(() => {
            setErrorMessage(" ");
            setMessage("");
        }, 4000);
    }

    function handleSuccessMessage(message) {
        setSuccessMessage(message);

        setTimeout(() => {
            setSuccessMessage("");
        }, 4000);
    }

    function handleLogin(event) {
        event.preventDefault();
        login(userDetails);
    }

    async function loginAsGuest() {
        localStorage.removeItem("SHOW_SESSION_TIMEOUT");
        const response = await axios.post(
            AUTH_URL + "?service.key=guest.login",
        );
        try {
            if (response.data.C_STATUS === "FAIL") {
                handleErrorMessage(response.data.C_MESSAGE);
                toastEmitter(response.data.C_MESSAGE, true, "error");
            }

            if (response.data.C_STATUS === "SUCCESS") {
                let authKey = response.data.AUTH_KEY;
                axios.defaults.headers.common["AUTH_KEY"] = authKey;
                localStorage.setItem("AUTH_KEY", authKey);
                localStorage.removeItem("redirect_on_logout");
                setIsAuthorized(true);
                setLoading(false);
                handleErrorMessage("");
                setUsernameIsValid(false);
                setUserDetails(initialState);
            } else {
                handleErrorMessage("Unable to login. Please try again.");
            }
        } catch (error) {
            setIsLoading(false);

            handleLogout();
            console.log(error);
        }
    }

    function login(userDetails) {
        localStorage.removeItem("SHOW_SESSION_TIMEOUT");

        if (keepMeLogin === "YES" || checkCookie()) {
            const value = encryptData(userDetails);
            setCookie("user", value, 1);
        }

        let resMessage = "";
        setIsLoading(true);

        axios
            .post(AUTH_URL + "?service.key=login", userDetails)
            .then(response => {
                resMessage = response.data.C_MESSAGE;
                let status = response.data.C_STATUS;

                if (status === "FAIL") {
                    // handleErrorMessage("Invalid password");
                    toastEmitter("Invalid password", true, "error");
                    setIsLoading(false);

                    return;
                }

                if (status === "SUCCESS") {
                    if (response.data.C_DATA.AUTH_KEY) {
                        let authKey = response.data.C_DATA.AUTH_KEY;
                        axios.defaults.headers.common["AUTH_KEY"] = authKey;
                        localStorage.setItem("AUTH_KEY", authKey);
                        localStorage.removeItem("redirect_on_logout");
                        setLoading(true);
                        setIsAuthorized(true);
                        handleErrorMessage("");
                        setUsernameIsValid(false);
                        setUserDetails(initialState);
                        addRemoveSideMargin();
                    } else {
                        handleErrorMessage(
                            "Unable to get authorization key. Please try again",
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
                // userDetails.password = _userDetails.password;
                setIsLoading(false);
                handleLogout();
                handleErrorMessage(error.message);
                setMessage(resMessage);
            });
    }

    function checkUsername(event) {
        setDisableInputField(true);
        event.preventDefault();
        // var _userDetails = { ...userDetails };
        // userDetails.password = MD5(_userDetails.password).toString();
        var resposneMessage;
        setIsLoading(true);
        axios
            .post(AUTH_URL + "?service.key=verify.username", userDetails)
            .then(response => {
                let status = response.data.C_STATUS;
                resposneMessage = response.data.C_MESSAGE;

                if (status === "FAIL") {
                    setDisableInputField(false);
                    setUsernameIsValid(false);
                    setIsLoading(false);
                    toastEmitter("Invalid username", true, "error");
                    handleErrorMessage(resposneMessage);
                }

                if (status == "SUCCESS") {
                    setIsLoading(false);

                    setUsernameIsValid(true);
                    handleSuccessMessage(resposneMessage);
                }
            })
            .catch(error => {
                setDisableInputField(false);
                console.error(error);
                // userDetails.password = _userDetails.password;
                setIsLoading(false);
                handleLogout();
                handleErrorMessage(error.message);
                setMessage(resposneMessage);
            });
    }

    function addRemoveSideMargin(params) {
        const sideBarEle = document.getElementById("side-navbar");

        try {
            if (
                sideBarEle &&
                sideBarEle.classList.contains("visually-hidden")
            ) {
                sideBarEle.classList.remove("visually-hidden");
            }
        } catch (error) {
            console.log(error);
        }
    }

    const keepLogin = value => {
        if (value === "YES") {
            setUserDetails(initialState);
            deleteCookie("user");
            setKeepMeLogin(value);
            setCookie("keep_me_login", value, 1);
        } else {
            setKeepMeLogin(value);
            setCookie("keep_me_login", value, 1);
        }
    };

    const checkCookie = () => {
        if (keepMeLogin) {
            return keepMeLogin;
        } else {
            const value = getCookie("keep_me_login");
            return value;
        }
    };
    const orContainerStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };

    const orLabelStyle = {
        margin: "0 10px",
    };

    const lineStyle = {
        flex: 1,
        borderBottom: "1px solid rgb(26 26 60)",
        margin: "0 10px",
    };

    return (
        <ErrorBoundary>
            {loading ? (
                <Delayed waitBeforeShow={250}>
                    <GlobalLoader />
                </Delayed>
            ) : (
                <Delayed>
                    {/* <div className="s2a-login-bg"> */}
                    <div className="s2a-login">
                        <style>{appContext?.channel?.css_styles}</style>
                        <div className="row m-0">
                            <LoginBackground> </LoginBackground>
                            <div className="col-sm-6 login-brand-bg">
                                <div className="row login-content">
                                    <div className="row s2a-brand-container">
                                        <BrandLogo></BrandLogo>
                                        <div className="login-form rounded-4 border-shadow ">
                                            <div className="registerd">
                                                <p className="mb-3 h5 text-center login-text">
                                                    Login
                                                </p>
                                            </div>
                                            {!usernameIsValid && (
                                                <form
                                                    onSubmit={event =>
                                                        checkUsername(event)
                                                    }>
                                                    <div className="row">
                                                        <div className="col-sm-12 mb-3">
                                                            <div className="flex-between">
                                                                <label className="form-label label">
                                                                    Username
                                                                </label>
                                                            </div>
                                                            <input
                                                                autoComplete="off"
                                                                ref={ref =>
                                                                    ref &&
                                                                    ref.focus()
                                                                }
                                                                // ref={usernameRef}
                                                                autoFocus
                                                                type="text"
                                                                className="form-control"
                                                                name="username"
                                                                value={
                                                                    userDetails.username
                                                                }
                                                                onChange={event =>
                                                                    handleInput(
                                                                        event,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isLoading
                                                                }
                                                                required
                                                            />
                                                        </div>
                                                        {appContext.channel &&
                                                            appContext.channel
                                                                .keep_me_login ===
                                                                "YES" && (
                                                                <div className="col-sm-12 px-3">
                                                                    <DynamicCheckBoxs
                                                                        classes={{
                                                                            label: "align-middle",
                                                                        }}
                                                                        items={[
                                                                            {
                                                                                code: "keep_me_login",
                                                                                label: "Keep Me Login",
                                                                            },
                                                                        ]}
                                                                        selectedItem={checkCookie()}
                                                                        handleChange={value =>
                                                                            keepLogin(
                                                                                value,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                        <div className="col-sm-12 mb-1 mt-2">
                                                            <button
                                                                type="submit"
                                                                className="btn login-button">
                                                                {isLoading ? (
                                                                    <span
                                                                        className="spinner-border spinner-border-sm label"
                                                                        role="status"></span>
                                                                ) : (
                                                                    "Next"
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}

                                            {usernameIsValid && (
                                                <form
                                                    autoComplete="off"
                                                    onSubmit={event =>
                                                        handleLogin(event)
                                                    }>
                                                    <div className="row">
                                                        <div className="col-sm-12 mb-2 pass-input">
                                                            <div className="flex-between">
                                                                <label className="form-label label">
                                                                    Password
                                                                </label>
                                                                <i
                                                                    className="fa-solid fa-arrow-left"
                                                                    onClick={() =>
                                                                        setUsernameIsValid(
                                                                            false,
                                                                        )
                                                                    }></i>
                                                            </div>
                                                            <input
                                                                type={
                                                                    showPassword
                                                                        ? "text"
                                                                        : "password"
                                                                }
                                                                ref={
                                                                    passwordRef
                                                                }
                                                                className="form-control"
                                                                name="password"
                                                                id="input-password"
                                                                value={
                                                                    userDetails.password
                                                                }
                                                                onChange={event =>
                                                                    handleInput(
                                                                        event,
                                                                    )
                                                                }
                                                                autoComplete="off"
                                                                autoCorrect="false"
                                                                autoCapitalize="false"
                                                                required
                                                                disabled={
                                                                    isLoading
                                                                }
                                                            />
                                                            <div
                                                                className="show-pass"
                                                                onClick={() =>
                                                                    setShowPassword(
                                                                        !showPassword,
                                                                    )
                                                                }>
                                                                {showPassword ? (
                                                                    <i className="fa-regular fa-eye"></i>
                                                                ) : (
                                                                    <i className="fa-regular fa-eye-slash"></i>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-12 text-end px-3 mb-1">
                                                            {appContext.channel && (
                                                                <Link
                                                                    to="/forget"
                                                                    type="submit"
                                                                    className="label">
                                                                    Forgot your
                                                                    password?
                                                                </Link>
                                                            )}
                                                        </div>
                                                        <div className="col-sm-12 mt-1">
                                                            <button
                                                                type="submit"
                                                                className="btn button-theme login-button">
                                                                {isLoading ? (
                                                                    <span
                                                                        className="spinner-border spinner-border-sm"
                                                                        role="status"></span>
                                                                ) : (
                                                                    "Next"
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}

                                            <div className="row">
                                                <div className="col-sm-12 login-error">
                                                    {message}
                                                </div>
                                                {/* <div className="col-sm-12 login-success">
                                    {successMessage}
                                </div> */}
                                            </div>
                                            {/* <div className="flex-between mb-2"> */}
                                            {/* <div className="col-sm-6 signup-link">
                                                    {appContext.channel &&
                                                        appContext.channel.allow_signup ===
                                                            "YES" && (
                                                            <a
                                                                className="pointer"
                                                                to="/register">
                                                                <span>
                                                                    Sign Up
                                                                </span>
                                                            </a>
                                                        )}
                                                </div> */}
                                            {appContext.channel &&
                                                appContext.channel
                                                    .guest_login === "YES" && (
                                                    <div className="col-sm-12 guest-btn text-end">
                                                        <a
                                                            className="pointer"
                                                            onClick={() =>
                                                                loginAsGuest()
                                                            }>
                                                            <span>
                                                                {" "}
                                                                Continue as
                                                                Guest
                                                            </span>
                                                        </a>
                                                    </div>
                                                )}
                                            {/* </div> */}
                                            <div className="col-sm-12 text-center">
                                                {appContext.channel &&
                                                    appContext.channel
                                                        .allow_signup ===
                                                        "YES" && (
                                                        <button
                                                            type="button"
                                                            className="sso-buttons rounded pointer"
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            onClick={() =>
                                                                handleNavigateToRegister()
                                                            }>
                                                            <i className="fa-solid fa-right-to-bracket"></i>
                                                            &nbsp; Create an
                                                            Account
                                                        </button>
                                                    )}
                                            </div>
                                            <div className="col-sm-12 text-center">
                                                {appContext.channel &&
                                                    appContext.channel
                                                        .allow_signup ===
                                                        "YES" &&
                                                    socialLogins &&
                                                    socialLogins.length > 0 && (
                                                        <div
                                                            style={
                                                                orContainerStyle
                                                            }>
                                                            <span
                                                                style={
                                                                    lineStyle
                                                                }></span>
                                                            <span
                                                                style={
                                                                    orLabelStyle
                                                                }>
                                                                OR
                                                            </span>
                                                            <span
                                                                style={
                                                                    lineStyle
                                                                }></span>
                                                        </div>
                                                    )}
                                            </div>
                                            <div className="col-sm-12 text-center">
                                                {appContext.channel &&
                                                    appContext.channel
                                                        .allow_signup ===
                                                        "YES" &&
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
                                            {showBanner === "YES" && (
                                                <div
                                                    className="alert text-danger mt-2 p-2 text-center"
                                                    role="alert">
                                                    <i className="fa-fade  fa-solid fa-circle-info"></i>{" "}
                                                    Your session was expired,
                                                    please login again.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* </div> */}
                </Delayed>
            )}
        </ErrorBoundary>
    );
}

function Delayed({ children, waitBeforeShow = 400 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? children : <GlobalLoader />;
}

export default Login;
