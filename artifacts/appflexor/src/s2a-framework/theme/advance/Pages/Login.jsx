import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { HiInboxArrowDown } from "react-icons/hi2";
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
import "./login.css";

const LOGIN_FALLBACK_LOGO = `${import.meta.env.BASE_URL}theme/images/appflexor-logo.png`;

function Delayed({ children, waitBeforeShow = 250 }) {
    const [isShown, setIsShown] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsShown(true), waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);
    return isShown ? children : null;
}

/* ─── Appflexor "A" SVG logo mark ─────────────────────────────────────────── */
function AppflexorMark({ size = 28 }) {
    return (
        <img
            src={LOGIN_FALLBACK_LOGO}
            alt="AppFlexor"
            width={size}
            height={size}
            className="object-contain"
        />
    );
}

/* ─── Dotted arrow between flow steps ─────────────────────────────────────── */
function DottedArrow() {
    return (
        <div className="flex items-center justify-between mx-2 w-full mb-4">
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-300 opacity-60"
                />
            ))}
            <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-indigo-400 opacity-70" />
        </div>
    );
}




/* ─── Main Login component ─────────────────────────────────────────────────── */
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
    const initialState = { username: "", password: "" };

    const appContext = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [userDetails, setUserDetails] = useState(initialState);
    const [socialLogins, setSocialLogins] = useState([]);
    const [message, setMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [usernameIsValid, setUsernameIsValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [disableInputField, setDisableInputField] = useState(false);
    const [loading, setLoading] = useState(true);
    const [keepMeLogin, setKeepMeLogin] = useState("");
    const [isSignupAllowed, setIsSignupAllowed] = useState(false);
    const [isGuestAllowed, setIsGuestLoginAllowed] = useState(false);

    const passwordRef = useRef(null);
    const { featuresSubscription } = appContext;

    useEffect(() => {
        document.body.classList.add("s2a-login-page");
        return () => document.body.classList.remove("s2a-login-page");
    }, []);

    useEffect(() => {
        setIsSignupAllowed(checIfSignupAllowed(featuresSubscription));
        setIsGuestLoginAllowed(checkIfGuestLoginAllowed(featuresSubscription));
    }, [featuresSubscription]);

    useEffect(() => { setLoading(false); }, [location.pathname]);

    useEffect(() => {
        const details = getCookie("user");
        if (details) { login(decryptData(details)); }
    }, []);

    useEffect(() => {
        if (appContext.channel?.sso_login) {
            const sso = tryParseJSONObject(appContext.channel.sso_login, []);
            if (sso?.length > 0) setSocialLogins(sso);
        }
    }, [appContext.channel]);

    useEffect(() => {
        if (usernameIsValid && passwordRef.current) passwordRef.current.focus();
    }, [usernameIsValid]);

    const handleInput = e => setUserDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));

    function handleErrorMessage(msg) {
        setErrorMessage(msg);
        setMessage(msg);
        setTimeout(() => { setErrorMessage(" "); setMessage(""); }, 4000);
    }

    function handleSuccessMessage(msg) {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 4000);
    }

    async function loginAsGuest() {
        localStorage.removeItem("SHOW_SESSION_TIMEOUT");
        try {
            const response = await axios.post(AUTH_URL + "?service.key=guest.login");
            if (response.data.C_STATUS === "FAIL") {
                handleErrorMessage(response.data.C_MESSAGE);
                toastEmitter(response.data.C_MESSAGE, true, "error");
            } else if (response.data.C_STATUS === "SUCCESS") {
                const authKey = response.data.AUTH_KEY;
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
        }
    }

    const isExternalUrl = (url) => {
        if (!url) return false;
        return /^https?:\/\//i.test(url);
    };



    function login(creds) {
        localStorage.removeItem("SHOW_SESSION_TIMEOUT");
        if (keepMeLogin === "YES" || checkCookie()) {
            setCookie("user", encryptData(creds), 1);
        }
        setIsLoading(true);
        axios.post(AUTH_URL + "?service.key=login", creds)
            .then(response => {
                const status = response.data.C_STATUS;
                if (status === "FAIL") {
                    toastEmitter("Invalid password", true, "error");
                    setIsLoading(false);
                } else if (status === "SUCCESS") {
                    const authKey = response.data.C_DATA?.AUTH_KEY;
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

    function checkUsername(e) {
        e.preventDefault();
        setDisableInputField(true);
        setIsLoading(true);
        axios.post(AUTH_URL + "?service.key=verify.username", userDetails)
            .then(response => {
                const status = response.data.C_STATUS;
                if (status === "FAIL") {
                    setDisableInputField(false);
                    setUsernameIsValid(false);
                    setIsLoading(false);
                    toastEmitter("Invalid username", true, "error");
                    handleErrorMessage(response.data.C_MESSAGE);
                } else if (status === "SUCCESS") {
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
        if (value === "YES") { setUserDetails(initialState); deleteCookie("user"); }
    };

    const checkCookie = () => keepMeLogin || getCookie("keep_me_login");

    const handleGoogleLogin = path => {
        const clientID = appContext.brandDetails?.google_client_id;
        const clientSecret = appContext.brandDetails?.google_client_secret;
        const win = window.open(`/auth/${path}?clientID=${encodeURIComponent(clientID)}&clientSecret=${encodeURIComponent(clientSecret)}`, "_self");
        if (!win || win.closed || typeof win.closed === "undefined") {
            toastEmitter("Please allow popups.", true, "warning");
        }
    };

    const brand = appContext?.channel || {};
    const logoUrl = brand.brand_logo
        ? `${IMAGE_BASE}/app_site/${brand.id}/${brand.brand_logo}`
        : null;
    const brandTitle = brand.brand_title || "appflexor";

    /* ── Feature cards data ─────────────────────────────────────── */
    const featureCards = [
        {
            icon: HiInboxArrowDown,
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
            title: "Business Events",
            titleColor: "text-indigo-600",
            desc: "Receive work from Email, WhatsApp, Forms, APIs and External Systems.",
        },
        {
            icon: "fa-arrows-spin",
            iconBg: "bg-violet-100",
            iconColor: "text-violet-600",
            title: "Business Services",
            titleColor: "text-violet-600",
            desc: "Automate and monitor business processes using AI-powered workflows.",
        },
        {
            icon: "fa-link",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            title: "Enterprise Systems",
            titleColor: "text-emerald-600",
            desc: "Connect ERP, CRM, Accounting, Ecommerce, and Enterprise Applications.",
        },
    ];

    /* ── Flow steps ─────────────────────────────────────────────── */
    const flowSteps = [
        { icon: HiInboxArrowDown, bg: "bg-indigo-600", label: "Capture" },
        { icon: "fa-arrows-spin", bg: "bg-violet-600", label: "Orchestrate" },
        { icon: "fa-link", bg: "bg-emerald-600", label: "Integrate" },
    ];

    /* ── Supported channels ─────────────────────────────────────── */
    const channels = [
        { icon: "fa-envelope", label: "Email" },
        { icon: "fa-whatsapp", label: "WhatsApp", fab: true },
        { icon: "fa-globe", label: "Forms" },
        { icon: "fa-code", label: "APIs" },
        { icon: "s2a-channel-logo s2a-channel-logo-odoo", label: "Odoo ERP" },
        { icon: "s2a-channel-logo s2a-channel-logo-quickbooks", label: "QuickBooks" },
        { icon: "s2a-channel-logo s2a-channel-logo-xero", label: "Xero" },
        { icon: "s2a-channel-logo s2a-channel-logo-kafka", label: "Connectors" },
    ];

    /* ── Business services ──────────────────────────────────────── */
    const services = [
        { icon: "fa-shield-halved", label: "Compliance Management" },
        { icon: "fa-coins", label: "Financial Reconciliation" },
        { icon: "fa-cart-shopping", label: "Order Fulfillment" },
        { icon: "fa-folder-open", label: "Document Management" },
        { icon: "fa-puzzle-piece", label: "And more..." },
    ];

    return (
        <ErrorBoundary>
            {loading ? (
                <Delayed><GlobalLoader /></Delayed>
            ) : (
                /* ── Full-page wrapper ──────────────────────────────────── */
                <div
                    className="s2a-modern-login min-h-screen flex flex-col"
                >
                    {/* ── Main content row ──────────────────────────────── */}
                    <div className="s2a-login-main flex flex-1 items-center lg:items-stretch">

                        {/* ══ LEFT PANEL ══════════════════════════════════ */}
                        <section className="s2a-login-presentation hidden lg:flex w-[58%] flex-col px-14 py-12 relative overflow-hidden">

                            {/* Subtle dot grid decoration */}
                            <div className="s2a-login-dot-grid absolute top-10 right-10 opacity-20 pointer-events-none select-none">
                                {[...Array(6)].map((_, r) => (
                                    <div key={r} className="flex gap-4 mb-4">
                                        {[...Array(8)].map((_, c) => (
                                            <div key={c} className="w-1 h-1 rounded-full bg-indigo-400" />
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Brand logo */}
                            <div className="s2a-login-brand flex items-center gap-2.5 mb-10">
                                {logoUrl
                                    ? <img
                                        src={logoUrl}
                                        alt={brandTitle}
                                        className="h-8 object-contain"
                                        onError={event => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src = LOGIN_FALLBACK_LOGO;
                                        }}
                                    />
                                    : <AppflexorMark size={30} />}
                                <span className="text-lg font-bold text-slate-800 tracking-tight">{brandTitle}</span>
                            </div>

                            {/* Headline */}
                            <h1 className="s2a-login-headline text-5xl font-extrabold text-slate-900 leading-[1.15] mb-4 tracking-tight">
                                Automate Business<br />
                                Services with{" "}
                                <span className="text-indigo-600">AI</span>
                            </h1>

                            {/* Subtitle */}
                            <p className="s2a-login-intro text-sm text-slate-600 mb-8 leading-6">
                                Capture business events.<br />
                                Orchestrate business services.<br />
                                Integrate enterprise systems.
                            </p>

                            {/* Flow diagram */}
                            <div className="s2a-login-flow flex items-center mb-8">
                                {flowSteps.map((step, i) => (
                                    <React.Fragment key={step.label}>
                                        <div className="flex flex-col items-center">
                                            <div className={`w-14 h-14 ${step.bg} rounded-full flex items-center justify-center shadow-md mb-2`}>
                                                {typeof step.icon === "string"
                                                    ? <i className={`fa-solid ${step.icon} text-white text-xl`}></i>
                                                    : <step.icon style={{ color: "#fff", fontSize: "1.25rem" }} />
                                                }
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700">{step.label}</span>
                                        </div>
                                        {i < flowSteps.length - 1 && <DottedArrow />}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Feature cards */}
                            <div className="s2a-login-feature-grid grid grid-cols-3 gap-3 mb-8">
                                {featureCards.map(f => (
                                    <div key={f.title} className="s2a-login-feature-card bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 ${f.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                {typeof f.icon === "string"
                                                    ? <i className={`fa-solid ${f.icon} ${f.iconColor} text-sm`}></i>
                                                    : <f.icon className={f.iconColor} style={{ fontSize: "1rem" }} />
                                                }
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${f.titleColor} mb-1`}>{f.title}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Supported channels */}
                            <div className="s2a-login-supported mb-4">
                                <p className="text-sm font-semibold text-slate-500 mb-2.5">
                                    Supported Channels
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {channels.map(ch => (
                                        <span
                                            key={ch.label}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 shadow-sm"
                                        >
                                            {ch.fab ? (
                                                <i className={`fa-brands ${ch.icon} text-base`}></i>
                                            ) : ch.icon ? (
                                                <i
                                                    className={
                                                        ch.icon.includes("s2a-channel-logo")
                                                            ? ch.icon
                                                            : `fa-solid ${ch.icon} text-base`
                                                    }
                                                    aria-hidden="true"
                                                ></i>
                                            ) : null}
                                            {ch.label}
                                        </span>
                                    ))}
                                </div>
                            </div>


                            {/* Business services */}
                            <div className="s2a-login-services mb-6">
                                <p className="text-sm font-semibold text-slate-500 mb-2.5">
                                    Business Services
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {services.map(svc => (
                                        <span
                                            key={svc.label}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 shadow-sm"
                                        >
                                            <i
                                                className={`fa-solid ${svc.icon} text-indigo-500 text-base`}
                                                aria-hidden="true"
                                            ></i>
                                            {svc.label}
                                        </span>
                                    ))}
                                </div>
                            </div>


                            {/* Trust badge */}
                            {/* <div className="flex items-start gap-3 bg-white/60 border border-slate-200 rounded-xl px-4 py-3 max-w-lg">
                                <i className="fa-solid fa-shield-halved text-indigo-500 mt-0.5 flex-shrink-0"></i>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Trusted for Customer Service, Employee Services, Finance,<br />
                                    Procurement and Compliance Automation.
                                </p>
                            </div> */}
                        </section>

                        {/* ══ RIGHT PANEL — floating card ════════════════ */}
                        <section className="s2a-login-auth-panel w-full lg:w-[42%] flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
                            <div className="s2a-login-card w-full max-w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-7 sm:px-8 sm:py-9">

                                {/* Card logo */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        {logoUrl
                                            ? <img
                                                src={logoUrl}
                                                alt={brandTitle}
                                                className="h-7 object-contain"
                                                onError={event => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src = LOGIN_FALLBACK_LOGO;
                                                }}
                                            />
                                            : <AppflexorMark size={26} />}
                                        <span className="text-base font-bold text-slate-800 tracking-tight">{brandTitle}</span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-center text-slate-900 mb-1">Welcome Back</h2>
                                <p className="text-sm text-center text-slate-500 mb-6">Sign in to continue.</p>

                                {/* Error */}
                                {message && (
                                    <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 flex items-start gap-2">
                                        <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0"></i>
                                        <span>{message}</span>
                                    </div>
                                )}

                                {/* ── Step 1: Email ──────────────────────── */}
                                {!usernameIsValid ? (
                                    <form onSubmit={checkUsername} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <i className="fa-regular fa-user text-slate-400 text-sm"></i>
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
                                                    className="w-full border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {isLoading
                                                ? <i className="fa-solid fa-spinner animate-spin"></i>
                                                : "Sign In"}
                                        </button>
                                    </form>

                                ) : (
                                    /* ── Step 2: Password ─────────────────── */
                                    <form onSubmit={e => { e.preventDefault(); login(userDetails); }} className="space-y-4">
                                        {/* Password */}
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
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
                                                    className="w-full border border-slate-200 rounded-lg py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(s => !s)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition"
                                                >
                                                    <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Remember Me + Forgot */}
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={keepMeLogin === "YES"}
                                                    onChange={e => keepLogin(e.target.checked ? "YES" : "NO")}
                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                                                />
                                                <span className="text-xs text-slate-600 ms-1">Remember Me</span>
                                            </label>
                                            <Link
                                                to="/forget"
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition"
                                            >
                                                Forgot Password?
                                            </Link>
                                        </div>

                                        {/* Sign In */}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {isLoading
                                                ? <i className="fa-solid fa-spinner animate-spin"></i>
                                                : "Sign In"}
                                        </button>

                                    </form>
                                )}

                                {/* OR divider */}
                                <div className="relative my-3">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-3 text-xs text-slate-400 font-medium uppercase tracking-widest">
                                            OR
                                        </span>
                                    </div>
                                </div>

                                {/* Sign Up button — always visible */}
                                <p className="mt-2 text-sm text-slate-600">
                                    Don’t have an account?{" "}
                                    {isExternalUrl(brand?.signup_page) ? <a href={brand.signup_page} className="text-indigo-600 font-semibold hover:underline">Sign Up</a> : <button
                                        type="button"
                                        onClick={() => navigate(brand?.signup_page ? brand.signup_page : "/register")}
                                        className="text-indigo-600 font-semibold hover:underline"
                                    >
                                        Sign Up
                                    </button>}
                                </p>

                                {/* Guest login */}
                                {brand?.guest_login === "YES" && (
                                    <div className="mt-4 text-center">
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
                                    <div className="mt-4 space-y-2">
                                        {socialLogins.includes("google") && (
                                            <button
                                                onClick={() => handleGoogleLogin("google")}
                                                className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition"
                                            >
                                                <i className="fa-brands fa-google text-red-500"></i>
                                                Sign in with Google
                                            </button>
                                        )}
                                    </div>
                                )}

                            </div>
                        </section>
                    </div>

                    {/* ── Full-width footer ──────────────────────────────── */}
                    <footer className="s2a-login-footer flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-14 py-4 text-xs text-slate-500 border-t border-slate-200/60">
                        <span>© {new Date().getFullYear()} <a href="https://step2agility.com" target="_blank" rel="noopener noreferrer">Step 2 Agility</a></span>
                        <div className="flex items-center gap-4 sm:gap-6">
                            <a href="#" className="hover:text-slate-700 transition">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-700 transition">Terms</a>
                            <span>Version 1.0.0</span>
                        </div>
                    </footer>
                </div>
            )}
        </ErrorBoundary>
    );
}

export default Login;
