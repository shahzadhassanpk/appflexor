import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { SIGNUP_URL, IMAGE_BASE } from "../../../Config";
import { disposeTooltip, enableTooltip, tryParseJSONObject } from "../../../utils/utils";
import BrandLogo from "../Layout/BrandLogo";
import { Interweave } from "interweave";

function SignUp() {
    let initialState = {
        firstname: "",
        lastname: "",
        email: "",
        username: "",
        password: "",
    };
    const appContext = useContext(AppContext);
    const [userDetail, setUserDetail] = useState(initialState);
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState([]);
    const [errorMessages, setErrorMessages] = useState({});
    const [successMsg, setSuccessMsg] = useState("");
    const [socialLogins, setSocialLogins] = useState([]);
    const navigate = useNavigate();

    const brand = appContext?.channel || {};
    const brandTitle = brand.brand_title || "Appflexor";

    useEffect(() => {
        if (brand.sso_login) {
            let sso = tryParseJSONObject(brand.sso_login, []);
            if (sso && sso.length > 0) setSocialLogins(sso);
        }
    }, [brand]);

    function handleChange(evt) {
        setUserDetail(prev => ({ ...prev, [evt.target.name]: evt.target.value }));
    }

    function validation() {
        let errs = [];
        const emailRxg = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

        if (!userDetail.firstname) errs.push("firstname");
        if (!userDetail.lastname) errs.push("lastname");
        if (!userDetail.username) errs.push("username");
        if (!emailRxg.test(userDetail.email)) errs.push("email");
        if (!userDetail.password) errs.push("password");
        if (userDetail.password !== confirmPassword) errs.push("confirm_password");

        setErrors(errs);
        return errs.length === 0;
    }

    async function signUp() {
        setErrorMessages({});
        if (validation()) {
            try {
                // Check duplicates
                const [userExist, emailExist] = await Promise.all([
                    checkDuplicate("username", userDetail.username),
                    checkDuplicate("email", userDetail.email)
                ]);

                if (emailExist) return setErrorMessages(prev => ({ ...prev, email: "Email already exists." }));
                if (userExist) return setErrorMessages(prev => ({ ...prev, username: "Username already exists." }));

                const payload = { ...userDetail, channel_id: brand.id };
                const res = await axios.post(`${SIGNUP_URL}?service.key=register.user`, payload);
                
                if (res.data.C_STATUS === "SUCCESS") {
                    setSuccessMsg("Account created successfully! Redirecting...");
                    setTimeout(() => navigate("/login"), 2000);
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    function checkDuplicate(type, value) {
        return axios.post(`${SIGNUP_URL}?service.key=check.${type}`, { [type]: value })
            .then(res => res.data.C_STATUS === "FAIL") // FAIL means it exists
            .catch(() => false);
    }

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
            <div className="hidden lg:flex w-[50%] xl:w-[60%] bg-slate-100 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex-col p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
                <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-center max-w-2xl mx-auto">
                    <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
                        Join <span className="text-indigo-600 dark:text-indigo-400"><Interweave content={brandTitle}/></span> today.
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-slate-300 mb-12">
                        Get started with the most powerful automation platform and transform your business processes.
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-[50%] xl:w-[40%] flex items-center justify-center p-8 bg-white dark:bg-slate-950 overflow-y-auto">
                <div className="w-full max-w-md py-8">
                    <div className="mb-8 flex justify-center lg:hidden">
                        <BrandLogo />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-slate-800 p-8 sm:p-10">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Create an account</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-8">Enter your details to get started.</p>

                        {successMsg && (
                            <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 text-sm font-medium text-center">
                                {successMsg}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">First Name</label>
                                    <input
                                        type="text" name="firstname" value={userDetail.firstname} onChange={handleChange}
                                        className={`w-full bg-gray-50 dark:bg-slate-950 border ${errors.includes("firstname") ? "border-red-500" : "border-gray-200 dark:border-slate-800"} rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Last Name</label>
                                    <input
                                        type="text" name="lastname" value={userDetail.lastname} onChange={handleChange}
                                        className={`w-full bg-gray-50 dark:bg-slate-950 border ${errors.includes("lastname") ? "border-red-500" : "border-gray-200 dark:border-slate-800"} rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email Address</label>
                                <input
                                    type="email" name="email" value={userDetail.email} onChange={handleChange}
                                    className={`w-full bg-gray-50 dark:bg-slate-950 border ${errors.includes("email") || errorMessages.email ? "border-red-500" : "border-gray-200 dark:border-slate-800"} rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                                />
                                {errorMessages.email && <p className="mt-1 text-xs text-red-500">{errorMessages.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Username</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text" name="username" value={userDetail.username} onChange={handleChange}
                                        className={`flex-1 bg-gray-50 dark:bg-slate-950 border ${errors.includes("username") || errorMessages.username ? "border-red-500" : "border-gray-200 dark:border-slate-800"} rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => { if(userDetail.email) setUserDetail(p => ({...p, username: userDetail.email})) }}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-xl whitespace-nowrap transition-colors"
                                    >
                                        Use Email
                                    </button>
                                </div>
                                {errorMessages.username && <p className="mt-1 text-xs text-red-500">{errorMessages.username}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
                                <input
                                    type={showPassword ? "text" : "password"} name="password" value={userDetail.password} onChange={handleChange}
                                    className={`w-full bg-gray-50 dark:bg-slate-950 border ${errors.includes("password") ? "border-red-500" : "border-gray-200 dark:border-slate-800"} rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                                <input
                                    type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-gray-50 dark:bg-slate-950 border ${errors.includes("confirm_password") ? "border-red-500" : "border-gray-200 dark:border-slate-800"} rounded-xl py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none`}
                                />
                            </div>

                            <div className="flex items-center pb-2">
                                <input type="checkbox" id="showPass" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                <label htmlFor="showPass" className="ml-2 text-xs text-gray-600 dark:text-slate-400 select-none">Show passwords</label>
                            </div>

                            <button type="button" onClick={signUp} className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                                Create Account
                            </button>

                            <div className="text-center mt-6">
                                <span className="text-sm text-gray-500 dark:text-slate-400">Already have an account? </span>
                                <Link to="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Sign in</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
