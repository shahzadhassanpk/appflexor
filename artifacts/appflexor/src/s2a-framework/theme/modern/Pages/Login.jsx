import axios from "axios";
import MD5 from "crypto-js/md5";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { AUTH_URL, IMAGE_BASE } from "../../../Config";
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
import DynamicCheckBoxs from "../../../components/dynamic-checkbox/Checkbox";

function Delayed({ children, waitBeforeShow = 250 }) {
    const [isShown, setIsShown] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsShown(true), waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);
    return isShown ? children : null;
}

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
    let initialState = { username: "", password: "" };

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

    const passwordRef = useRef(null);
    const location = useLocation();

    const clientID = appContext.brandDetails?.google_client_id;
    const clientSecret = appContext.brandDetails?.google_client_secret;
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
            login(dec);
        }
    }, []);

    useEffect(() => {
        if (appContext.channel?.sso_login) {
            let sso = tryParseJSONObject(appContext.channel.sso_login, []);
            if (sso && sso.length > 0) setSocialLogins(sso);
        }
    }, [appContext.channel]);

    useEffect(() => {
        if (usernameIsValid && passwordRef.current) passwordRef.current.focus();
    }, [usernameIsValid]);

    function handleInput(event) {
        let name = event.target.name;
        let value = event.target.value;
        setUserDetails(prev => ({ ...prev, [name]: value }));
    }

    function handleErrorMessage(msg) {
        setErrorMessage(msg);
        setMessage(msg);
        setTimeout(() => { setErrorMessage(" "); setMessage(""); }, 4000);
    }

    function handleSuccessMessage(msg) {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 4000);
    }

    function handleLogin(event) {
        event.preventDefault();
        login(userDetails);
    }

    async function loginAsGuest() {
        localStorage.removeItem("SHOW_SESSION_TIMEOUT");
        try {
            const response = await axios.post(AUTH_URL + "?service.key=guest.login");
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
            console.error(error);
        }
    }

    function login(creds) {
        localStorage.removeItem("SHOW_SESSION_TIMEOUT");
        if (keepMeLogin === "YES" || checkCookie()) {
            setCookie("user", encryptData(creds), 1);
        }
        setIsLoading(true);
        axios.post(AUTH_URL + "?service.key=login", creds)
            .then(response => {
                let status = response.data.C_STATUS;
                if (status === "FAIL") {
                    toastEmitter("Invalid password", true, "error");
                    setIsLoading(false);
                    return;
                }
                if (status === "SUCCESS") {
                    let authKey = response.data.C_DATA?.AUTH_KEY;
                    if (authKey) {
                        axios.defaults.headers.common["AUTH_KEY"] = authKey;
                        localStorage.setItem("AUTH_KEY", authKey);
                        localStorage.removeItem("redirect_on_logout");
                        setLoading(true);
                        setIsAuthorized(true);
                        handleErrorMessage("");
                        setUsernameIsValid(false);
                        setUserDetails(initialState);
                    } else {
                        handleErrorMessage("Unable to get authorization key.");
                    }
                }
            })
            .catch(error => {
                setIsLoading(false);
                handleLogout();
                handleErrorMessage(error.message);
            });
    }

    function checkUsername(event) {
        event.preventDefault();
        setDisableInputField(true);
        setIsLoading(true);
        axios.post(AUTH_URL + "?service.key=verify.username", userDetails)
            .then(response => {
                let status = response.data.C_STATUS;
                if (status === "FAIL") {
                    setDisableInputField(false);
                    setUsernameIsValid(false);
                    setIsLoading(false);
                    toastEmitter("Invalid username", true, "error");
                    handleErrorMessage(response.data.C_MESSAGE);
                }
                if (status == "SUCCESS") {
                    setIsLoading(false);
                    setUsernameIsValid(true);
                    handleSuccessMessage(response.data.C_MESSAGE);
                }
            })
            .catch(error => {
                setDisableInputField(false);
                setIsLoading(false);
                handleLogout();
                handleErrorMessage(error.message);
            });
    }

    const keepLogin = value => {
        setKeepMeLogin(value);
        setCookie("keep_me_login", value, 1);
        if (value === "YES") {
            setUserDetails(initialState);
            deleteCookie("user");
        }
    };

    const checkCookie = () => keepMeLogin || getCookie("keep_me_login");

    const handleGoogleLogin = path => {
        const newWin = window.open(
            `/auth/${path}?clientID=${encodeURIComponent(clientID)}&clientSecret=${encodeURIComponent(clientSecret)}`,
            "_self"
        );
        if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
            toastEmitter("Please allow popups.", true, "warning");
        }
    };

    const brand = appContext?.channel || {};
    const logoUrl = brand.brand_logo
        ? `${IMAGE_BASE}/app_site/${brand.id}/${brand.brand_logo}`
        : "/theme/images/default-logo.png";
    const brandTitle = brand.brand_title || "Appflexor";

    const features = [
        {
            icon: "fa-bolt",
            color: "text-blue-600",
            bg: "bg-blue-50",
            title: "Capture",
            desc: "Ingest events from any channel instantly.",
        },
        {
            icon: "fa-network-wired",
            color: "text-purple-600",
            bg: "bg-purple-50",
            title: "Orchestrate",
            desc: "Route and process workflows intelligently.",
        },
        {
            icon: "fa-plug",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            title: "Integrate",
            desc: "Connect seamlessly with enterprise systems.",
        },
    ];

    const channels = ["Email", "WhatsApp", "Portal", "APIs", "Odoo", "QuickBooks", "Xero", "Kafka"];

    return (
        <ErrorBoundary>
            {loading ? (
                <Delayed><GlobalLoader /></Delayed>
            ) : (
                <div className="s2a-modern-login min-h-screen flex font-sans">

                    {/* ── Left panel ─────────────────────────────────────────── */}
                    <div className="hidden lg:flex w-[58%] flex-col bg-slate-50 border-r border-slate-200">

                        {/* Top bar inside left panel */}
                        <div className="flex items-center gap-3 px-12 pt-10 pb-0">
                            <img src={logoUrl} alt={brandTitle} className="h-9 object-contain" />
                            <span className="text-lg font-bold text-slate-800">{brandTitle}</span>
                        </div>

                        {/* Main content centred vertically */}
                        <div className="flex-1 flex flex-col justify-center px-12 py-10">
                            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-3 tracking-tight">
                                Automate Business Services<br />
                                with <span className="text-indigo-600">AI</span>
                            </h1>
                            <p className="text-base text-slate-500 mb-10 max-w-lg leading-relaxed">
                                Capture business events. Orchestrate intelligent workflows.<br />
                                Integrate enterprise systems seamlessly.
                            </p>

                            {/* Feature cards */}
                            <div className="grid grid-cols-3 gap-4 mb-10">
                                {features.map(f => (
                                    <div key={f.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                        <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-3`}>
                                            <i className={`fa-solid ${f.icon} ${f.color} text-base`}></i>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 mb-1">{f.title}</p>
                                        <p className="text-xs text-slate-500 leading-snug">{f.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Supported channels */}
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                                    Supported Channels
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {channels.map(c => (
                                        <span
                                            key={c}
                                            className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm"
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right panel ────────────────────────────────────────── */}
                    <div className="w-full lg:w-[42%] flex items-center justify-center bg-white px-8 py-12">
                        <div className="w-full max-w-sm">

                            {/* Mobile logo */}
                            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                                <img src={logoUrl} alt={brandTitle} className="h-9 object-contain" />
                                <span className="text-lg font-bold text-slate-800">{brandTitle}</span>
                            </div>

                            {/* Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-10">

                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h2>
                                    <p className="text-sm text-slate-500">Sign in to continue to your workspace.</p>
                                </div>

                                {/* Error */}
                                {message && (
                                    <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-start gap-2">
                                        <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0"></i>
                                        <span>{message}</span>
                                    </div>
                                )}

                                {/* Step 1 – username */}
                                {!usernameIsValid ? (
                                    <form onSubmit={checkUsername} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Email Address / Username
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                    <i className="fa-regular fa-envelope text-slate-400 text-sm"></i>
                                                </span>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={userDetails.username}
                                                    onChange={handleInput}
                                                    disabled={isLoading || disableInputField}
                                                    required
                                                    autoFocus
                                                    placeholder="Enter your email address"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                />
                                            </div>
                                        </div>

                                        {brand?.keep_me_login === "YES" && (
                                            <DynamicCheckBoxs
                                                items={[{ code: "keep_me_login", label: "Keep me signed in" }]}
                                                selectedItem={checkCookie()}
                                                handleChange={keepLogin}
                                            />
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {isLoading
                                                ? <i className="fa-solid fa-spinner animate-spin"></i>
                                                : "Continue"}
                                        </button>
                                    </form>

                                ) : (
                                    /* Step 2 – password */
                                    <form onSubmit={handleLogin} className="space-y-5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                                                {userDetails.username}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setUsernameIsValid(false)}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 ml-3 flex-shrink-0"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                    <i className="fa-solid fa-lock text-slate-400 text-sm"></i>
                                                </span>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={userDetails.password}
                                                    onChange={handleInput}
                                                    ref={passwordRef}
                                                    disabled={isLoading}
                                                    required
                                                    placeholder="Enter your password"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(s => !s)}
                                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                                                >
                                                    <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Link
                                                to="/forget"
                                                className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
                                            >
                                                Forgot password?
                                            </Link>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {isLoading
                                                ? <i className="fa-solid fa-spinner animate-spin"></i>
                                                : "Sign In"}
                                        </button>
                                    </form>
                                )}

                                {/* Sign up */}
                                {brand?.allow_signup === "YES" && (
                                    <>
                                        <div className="relative my-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-3 bg-white text-xs text-slate-400 font-medium uppercase tracking-wider">
                                                    Or
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => window.location.href = "/app/register"}
                                            className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
                                        >
                                            Create an Account
                                        </button>
                                    </>
                                )}

                                {/* Guest login */}
                                {brand?.guest_login === "YES" && (
                                    <div className="mt-5 text-center">
                                        <button
                                            onClick={loginAsGuest}
                                            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
                                        >
                                            Continue as Guest
                                        </button>
                                    </div>
                                )}

                                {/* Social logins */}
                                {socialLogins?.length > 0 && (
                                    <div className="mt-5 space-y-3">
                                        {socialLogins.includes("google") && (
                                            <button
                                                onClick={() => handleGoogleLogin("google")}
                                                className="w-full flex items-center justify-center gap-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
                                            >
                                                <i className="fa-brands fa-google text-red-500"></i>
                                                Sign in with Google
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </ErrorBoundary>
    );
}

export default Login;
