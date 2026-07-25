import axios from "axios";
import MD5 from "crypto-js/md5";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { API_URL, AUTH_URL, SIGNUP_URL, IMAGE_BASE } from "../../../Config";
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
        const newWin = window.open(`/auth/${path}?clientID=${encodeURIComponent(clientID)}&clientSecret=${encodeURIComponent(clientSecret)}`, "_self");
        if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
            toastEmitter("Please allow popups.", true, "warning");
        }
    };

    const brand = appContext?.channel || {};
    const logoUrl = brand.brand_logo ? `/file/service/app_site/${brand.id}/${brand.brand_logo}` : "/theme/images/default-logo.png";
    const brandTitle = brand.brand_title || "Appflexor";

    return (
        <ErrorBoundary>
            {loading ? (
                <Delayed><GlobalLoader /></Delayed>
            ) : (
                <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-100 selection:text-indigo-900">
                    {/* Left Panel - Brand / Features */}
                    <div className="hidden lg:flex w-[60%] bg-slate-100 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex-col p-12 relative overflow-hidden">
                        {/* Decorative background blobs */}
                        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
                        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>

                        {brand.login_html ? (
                            <div className="relative z-10 prose dark:prose-invert max-w-none">
                                <Interweave content={brand.login_html} />
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col h-full justify-center max-w-3xl mx-auto">
                                <div className="flex items-center gap-3 mb-16">
                                    <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white"><Interweave content={brandTitle} /></span>
                                </div>

                                <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 tracking-tight">
                                    Automate Business Services with <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-slate-300 mb-12 max-w-2xl leading-relaxed">
                                    Capture business events. Orchestrate intelligent workflows. Integrate enterprise systems seamlessly.
                                </p>

                                <div className="grid grid-cols-3 gap-6 mb-16">
                                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                                            <i className="fa-solid fa-bolt text-xl"></i>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Capture</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">Ingest events from any channel instantly.</p>
                                    </div>
                                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                                            <i className="fa-solid fa-network-wired text-xl"></i>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Orchestrate</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">Route and process intelligently.</p>
                                    </div>
                                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                                            <i className="fa-solid fa-plug text-xl"></i>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Integrate</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">Connect with your core systems.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Supported Channels</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Email', 'WhatsApp', 'Portal', 'APIs', 'Odoo', 'QuickBooks', 'Xero', 'Kafka'].map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-xs font-medium text-gray-600 dark:text-slate-300 shadow-sm">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Panel - Login Card */}
                    <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white dark:bg-slate-950">
                        <div className="w-full max-w-md">
                            
                            {/* Mobile Logo */}
                            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                                <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
                                <span className="text-2xl font-bold text-gray-900 dark:text-white"><Interweave content={brandTitle} /></span>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-slate-800 p-8 sm:p-10">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Sign in to continue to your workspace.</p>
                                </div>

                                {message && (
                                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
                                        <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                                        <span>{message}</span>
                                    </div>
                                )}

                                {!usernameIsValid ? (
                                    <form onSubmit={checkUsername} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                Email Address / Username
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <i className="fa-regular fa-envelope text-gray-400 dark:text-slate-500"></i>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={userDetails.username}
                                                    onChange={handleInput}
                                                    disabled={isLoading}
                                                    required
                                                    autoFocus
                                                    placeholder="Enter your email address"
                                                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>

                                        {brand?.keep_me_login === "YES" && (
                                            <div className="flex items-center">
                                                <DynamicCheckBoxs
                                                    items={[{ code: "keep_me_login", label: "Keep me signed in" }]}
                                                    selectedItem={checkCookie()}
                                                    handleChange={keepLogin}
                                                />
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center h-12"
                                        >
                                            {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : "Continue"}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleLogin} className="space-y-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                                Password
                                            </label>
                                            <button 
                                                type="button" 
                                                onClick={() => setUsernameIsValid(false)}
                                                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                                            >
                                                Change user
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <i className="fa-solid fa-lock text-gray-400 dark:text-slate-500"></i>
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={userDetails.password}
                                                onChange={handleInput}
                                                ref={passwordRef}
                                                disabled={isLoading}
                                                required
                                                placeholder="Enter your password"
                                                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-12 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                            >
                                                <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                            </button>
                                        </div>

                                        <div className="flex justify-end">
                                            <Link to="/forget" className="text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                Forgot password?
                                            </Link>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center h-12"
                                        >
                                            {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : "Sign In"}
                                        </button>
                                    </form>
                                )}

                                {brand?.allow_signup === "YES" && (
                                    <>
                                        <div className="relative my-8">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-200 dark:border-slate-800"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-4 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 font-medium text-xs uppercase tracking-wider">Or</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => window.location.href = "/app/register"}
                                            className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors h-12"
                                        >
                                            Create an Account
                                        </button>
                                    </>
                                )}

                                {brand?.guest_login === "YES" && (
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={loginAsGuest}
                                            className="text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                                        >
                                            Continue as Guest
                                        </button>
                                    </div>
                                )}

                                {socialLogins?.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        {socialLogins.includes("google") && (
                                            <button
                                                onClick={() => handleGoogleLogin("google")}
                                                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors h-12"
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