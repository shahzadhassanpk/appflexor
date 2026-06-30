import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { AUTH_URL } from "../../../Config";
import GlobalLoader from "../../../components/GlobalLoader";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { ErrorBoundary } from "../../../utils/ErrorBoundry";
import {
    decryptData,
    deleteCookie,
    encryptData,
    getCookie,
    setCookie,
} from "../../../utils/utils";
import LoginBackground, { AppflexorMark } from "./LoginBackground";

function Login({
    isLoading,
    setIsLoading,
    setIsAuthorized,
    setErrorMessage,
    handleLogout,
}) {
    let initialState = {
        username: "",
        password: "",
    };

    const appContext = useContext(AppContext);
    const [userDetails, setUserDetails] = useState(initialState);
    const [message, setMessage] = useState("");
    const [usernameIsValid, setUsernameIsValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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

    function handleLogin(event) {
        event.preventDefault();
        login(userDetails);
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
                    setUsernameIsValid(false);
                    setIsLoading(false);
                    toastEmitter("Invalid username", true, "error");
                    handleErrorMessage(resposneMessage);
                }

                if (status == "SUCCESS") {
                    setIsLoading(false);

                    setUsernameIsValid(true);
                    if (userDetails.password) {
                        login(userDetails);
                    }
                }
            })
            .catch(error => {
                console.error(error);
                // userDetails.password = _userDetails.password;
                setIsLoading(false);
                handleLogout();
                handleErrorMessage(error.message);
                setMessage(resposneMessage);
            });
    }

    function addRemoveSideMargin() {
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
    return (
        <ErrorBoundary>
            {loading ? (
                <Delayed waitBeforeShow={250}>
                    <GlobalLoader />
                </Delayed>
            ) : (
                <Delayed>
                    <div className="min-h-[100svh] bg-[#F8F7FF] px-0 py-0 text-[#111827] sm:px-5 sm:py-5 lg:px-6">
                        <div className="mx-auto grid min-h-[100svh] max-w-[1440px] grid-cols-1 overflow-hidden bg-white shadow-[0_24px_80px_rgba(67,56,120,0.14)] sm:min-h-[calc(100svh-2.5rem)] sm:rounded-[24px] sm:border sm:border-[#D9D6E8] lg:grid-cols-12">
                            <LoginBackground> </LoginBackground>
                            <div className="relative flex min-h-[100svh] items-center justify-center bg-white px-7 py-8 sm:min-h-[calc(100svh-2.5rem)] sm:px-8 lg:col-span-4 lg:px-10">
                                <div className="pointer-events-none absolute left-8 top-8 grid grid-cols-6 gap-1 opacity-25 lg:hidden">
                                    {Array.from({ length: 30 }).map(
                                        (_, index) => (
                                            <span
                                                key={index}
                                                className="h-1.5 w-1.5 rounded-full bg-indigo-300"
                                            />
                                        ),
                                    )}
                                </div>
                                <div className="w-full max-w-[360px]">
                                    <div className="w-full">
                                        <div className="w-full">
                                            <div className="mb-9 text-center">
                                                <div className="mb-8 flex items-center justify-center gap-3">
                                                    <AppflexorMark />
                                                    <span className="text-[29px] font-semibold tracking-[-0.01em] text-[#111827]">
                                                        appflexor
                                                    </span>
                                                </div>
                                                <p className="mb-2 text-[24px] font-bold tracking-[-0.01em] text-[#111827]">
                                                    Welcome back!
                                                </p>
                                                <p className="mb-0 text-[13px] text-[#4B5563]">
                                                    Sign in to continue to your
                                                    workspace.
                                                </p>
                                            </div>

                                            <form
                                                autoComplete="off"
                                                onSubmit={event =>
                                                    usernameIsValid
                                                        ? handleLogin(event)
                                                        : checkUsername(event)
                                                }>
                                                <div className="grid gap-4">
                                                    <div>
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <label className="text-[12px] font-semibold text-[#111827]">
                                                                Email
                                                            </label>
                                                        </div>
                                                        <div className="relative">
                                                            <i className="fa-regular fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#667085]"></i>
                                                            <input
                                                                autoComplete="off"
                                                                ref={ref =>
                                                                    ref &&
                                                                    !usernameIsValid &&
                                                                    ref.focus()
                                                                }
                                                                autoFocus
                                                                type="text"
                                                                className="h-[42px] w-full rounded-md border border-[#D8DCE7] bg-white px-11 text-[13px] text-[#111827] shadow-[0_3px_12px_rgba(17,24,39,0.03)] outline-none placeholder:text-[#8A93A5] focus:border-[#5B35E6] focus:ring-4 focus:ring-[#5B35E6]/10"
                                                                name="username"
                                                                placeholder="Enter your email"
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
                                                    </div>

                                                    <div className="relative">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <label className="text-[12px] font-semibold text-[#111827]">
                                                                Password
                                                            </label>
                                                            {usernameIsValid && (
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                                                                    aria-label="Back to email"
                                                                    onClick={() =>
                                                                        setUsernameIsValid(
                                                                            false,
                                                                        )
                                                                    }>
                                                                    <i className="fa-solid fa-arrow-left"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="relative">
                                                            <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#667085]"></i>
                                                            <input
                                                                type={
                                                                    showPassword
                                                                        ? "text"
                                                                        : "password"
                                                                }
                                                                ref={
                                                                    passwordRef
                                                                }
                                                                className="h-[42px] w-full rounded-md border border-[#D8DCE7] bg-white px-11 pr-12 text-[13px] text-[#111827] shadow-[0_3px_12px_rgba(17,24,39,0.03)] outline-none placeholder:text-[#8A93A5] focus:border-[#5B35E6] focus:ring-4 focus:ring-[#5B35E6]/10"
                                                                name="password"
                                                                id="input-password"
                                                                placeholder="Enter your password"
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
                                                            <button
                                                                type="button"
                                                                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#667085]"
                                                                aria-label={
                                                                    showPassword
                                                                        ? "Hide password"
                                                                        : "Show password"
                                                                }
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
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3 text-sm">
                                                        <label className="flex min-w-0 items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border border-[#B8BFCC] accent-[#5B35E6]"
                                                                checked={
                                                                    checkCookie() ===
                                                                    "YES"
                                                                }
                                                                onChange={event =>
                                                                    keepLogin(
                                                                        event
                                                                            .target
                                                                            .checked
                                                                            ? "YES"
                                                                            : "NO",
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-[12px] text-[#111827] ms-2">
                                                                Remember me
                                                            </span>
                                                        </label>
                                                        {appContext.channel && (
                                                            <Link
                                                                to="/forget"
                                                                className="shrink-0 text-[12px] font-semibold text-[#5B35E6] no-underline">
                                                                Forgot password?
                                                            </Link>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        className="h-[42px] w-full rounded-md border-0 bg-[#5B25E8] text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(91,37,232,0.22)] transition hover:bg-[#4E20CC]">
                                                        {isLoading ? (
                                                            <span
                                                                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                                                role="status"
                                                                aria-label="Signing in"></span>
                                                        ) : usernameIsValid ? (
                                                            "Sign in"
                                                        ) : (
                                                            "Sign in"
                                                        )}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-4 min-h-5 text-center text-[12px] font-medium text-[#DC2626]">
                                                {message}
                                            </div>

                                            <div className="my-2 flex items-center gap-4">
                                                <span className="h-px flex-1 bg-[#E4E7EF]"></span>
                                                <span className="text-[12px] text-[#111827]">
                                                    or
                                                </span>
                                                <span className="h-px flex-1 bg-[#E4E7EF]"></span>
                                            </div>

                                            {/* <button
                                                type="button"
                                                className="flex h-[42px] w-full items-center justify-center gap-3 rounded-md border border-[#D8DCE7] bg-white px-4 text-[13px] font-semibold text-[#111827] shadow-[0_3px_12px_rgba(17,24,39,0.03)]"
                                                onClick={() =>
                                                    handleGoogleLogin("google")
                                                }>
                                                <span className="grid h-4 w-4 grid-cols-2 gap-0.5">
                                                    <span className="bg-[#F25022]"></span>
                                                    <span className="bg-[#7FBA00]"></span>
                                                    <span className="bg-[#00A4EF]"></span>
                                                    <span className="bg-[#FFB900]"></span>
                                                </span>
                                                Sign in with Microsoft
                                            </button> */}

                                            {showBanner === "YES" && (
                                                <div
                                                    className="mt-4 rounded-md border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-center text-[12px] text-[#B91C1C]"
                                                    role="alert">
                                                    <i className="fa-fade fa-solid fa-circle-info"></i>{" "}
                                                    Your session was expired,
                                                    please login again.
                                                </div>
                                            )}

                                            <div className="mt-8 text-center text-[13px] text-[#111827]">
                                                <span>New to Appflexor?</span>
                                                <button
                                                    type="button"
                                                    className="ml-2 border-0 bg-transparent font-semibold text-[#5B35E6] ms-2"
                                                    onClick={() =>
                                                        handleNavigateToRegister()
                                                    }>
                                                    Request a demo
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
