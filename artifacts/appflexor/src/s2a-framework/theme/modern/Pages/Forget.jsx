import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SIGNUP_URL, IMAGE_BASE } from "../../../Config";
import BrandLogo from "../Layout/BrandLogo";
import { AppContext } from "../../../../AppContext";
import { toastEmitter } from "../../../components/Toastify/Toastify";

function Forget() {
    let initialState = { username: "", code: "" };
    const appContext = useContext(AppContext);
    const [userDetail, setUserDetail] = useState(initialState);
    const [stage, setStage] = useState("forgetPassword"); // forgetPassword | verifyCode | setPassword
    const [passwordId, setPasswordId] = useState("");
    const [disableInput, setDisableInput] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const brand = appContext?.channel || {};
    const brandTitle = brand.brand_title || "Appflexor";

    function handleChange(evt) {
        let name = evt.target.name;
        let value = evt.target.value;
        setUserDetail(prev => ({ ...prev, [name]: value }));
    }

    function cancel() {
        navigate("/login");
    }

    function forgetPassword(event) {
        event.preventDefault();
        setDisableInput(true);
        const url = `${SIGNUP_URL}?service.key=forget.password`;
        axios.post(url, { username: userDetail.username })
            .then(response => {
                const status = response.data.C_STATUS;
                if (status === "SUCCESS") {
                    if (response.data.C_ID) {
                        setPasswordId(response.data.C_ID);
                        setStage("verifyCode");
                        toastEmitter("Code sent to your email", true, "success");
                    }
                } else {
                    toastEmitter("Invalid Username", true, "error");
                }
            })
            .catch(err => console.error(err))
            .finally(() => setDisableInput(false));
    }

    function verifyCode(event) {
        event.preventDefault();
        const url = `${SIGNUP_URL}?service.key=verify.code`;
        axios.post(url, { code: userDetail.code, id: passwordId })
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setStage("setPassword");
                    toastEmitter("Code Verified", true, "success");
                } else {
                    toastEmitter("Invalid Code", true, "error");
                }
            })
            .catch(err => console.error(err));
    }

    function updatePassword(event) {
        event.preventDefault();
        if (userDetail.password !== userDetail.passwordReenter) {
            toastEmitter("Passwords do not match", true, "error");
            return;
        }
        const url = `${SIGNUP_URL}?service.key=update.password`;
        axios.post(url, { id: passwordId, password: userDetail.password })
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    toastEmitter("Password updated successfully!", true, "success");
                    setTimeout(() => navigate("/login"), 1000);
                } else {
                    toastEmitter("Unable to update password", true, "error");
                }
            })
            .catch(err => console.error(err));
    }

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
            <div className="hidden lg:flex w-[60%] bg-slate-100 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex-col p-12 relative overflow-hidden items-center justify-center">
                <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
                <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Reset your password</h1>
                    <p className="text-lg text-gray-500 dark:text-slate-400 max-w-md mx-auto">Follow the steps to regain access to your {brandTitle} workspace securely.</p>
                </div>
            </div>

            <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white dark:bg-slate-950">
                <div className="w-full max-w-md">
                    <div className="mb-10 flex justify-center">
                        <BrandLogo />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-slate-800 p-8 sm:p-10">
                        
                        <div className="flex gap-2 mb-8">
                            {['forgetPassword', 'verifyCode', 'setPassword'].map((s, i) => (
                                <div key={s} className={`h-1.5 flex-1 rounded-full ${
                                    stage === s ? 'bg-indigo-600' : 
                                    (['forgetPassword', 'verifyCode', 'setPassword'].indexOf(stage) > i ? 'bg-indigo-200 dark:bg-indigo-900' : 'bg-gray-100 dark:bg-slate-800')
                                }`}></div>
                            ))}
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {stage === "forgetPassword" && "Forgot Password"}
                                {stage === "verifyCode" && "Verify Code"}
                                {stage === "setPassword" && "New Password"}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {stage === "forgetPassword" && "Enter your email to receive a recovery code."}
                                {stage === "verifyCode" && "Enter the 6-digit code sent to your email."}
                                {stage === "setPassword" && "Choose a strong new password."}
                            </p>
                        </div>

                        {stage === "forgetPassword" && (
                            <form onSubmit={forgetPassword} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Email Address</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={userDetail.username}
                                        onChange={handleChange}
                                        disabled={disableInput}
                                        required
                                        className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={cancel} className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={disableInput} className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70">
                                        Send Code
                                    </button>
                                </div>
                            </form>
                        )}

                        {stage === "verifyCode" && (
                            <form onSubmit={verifyCode} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={userDetail.code}
                                        onChange={handleChange}
                                        required
                                        className="w-full text-center tracking-widest text-2xl font-mono bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-4 px-4 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <button type="submit" className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                                    Verify Code
                                </button>
                            </form>
                        )}

                        {stage === "setPassword" && (
                            <form onSubmit={updatePassword} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">New Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={userDetail.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Confirm Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="passwordReenter"
                                        value={userDetail.passwordReenter}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="showPassword"
                                        checked={showPassword}
                                        onChange={(e) => setShowPassword(e.target.checked)}
                                        className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <label htmlFor="showPassword" className="ml-2 text-sm text-gray-600 dark:text-slate-400 select-none">
                                        Show passwords
                                    </label>
                                </div>
                                <button type="submit" className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                                    Set Password
                                </button>
                            </form>
                        )}

                        <div className="mt-8 text-center">
                            <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-slate-400 transition-colors">
                                Back to login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Forget;
