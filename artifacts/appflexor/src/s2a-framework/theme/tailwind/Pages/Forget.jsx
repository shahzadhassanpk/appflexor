import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SIGNUP_URL } from "../../../Config";
import BrandLogo from "../Layout/BrandLogo";
import { AppContext } from "../../../../AppContext";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import LoginBackground from "./LoginBackground";

function Forget() {
    let initialState = {
        username: "",
        code: "",
    };
    const appContext = useContext(AppContext);
    const { screenView } = appContext;
    const [userDetail, setUserDetail] = useState(initialState);
    const [errors, setErrors] = useState([]);
    const [usernameError, setUsernameError] = useState("");
    const [codeError, setCodeError] = useState("");
    const [forgetCode, setForgetCode] = useState(false);
    const [stage, setStage] = useState("forgetPassword");
    const [validCode, setValidCode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordId, setPasswordId] = useState("");
    const [disableInput, setDisableInput] = useState(false);
    const [fadeIn, setFadeIn] = useState("");
    const navigate = useNavigate();

    function handleChange(evt) {
        let name = evt.target.name;
        let value = evt.target.value;
        setUserDetail(prevState => ({
            ...prevState,
            [name]: value,
        }));
    }

    function handleShowPassword(event) {
        setShowPassword(event.target.checked);
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

    function cancel() {
        setTimeout(() => {
            navigate("/login");
        }, 500);
    }
    function forgetPassword(event, callback) {
        setDisableInput(true);
        event.preventDefault();
        const url = `${SIGNUP_URL}?service.key=forget.password`;
        const dataRequest = {
            username: userDetail.username,
        };
        return new Promise((resolve, reject) => {
            axios
                .post(url, dataRequest)
                .then(function (response) {
                    if (response.status === 200) {
                        const status = response.data.C_STATUS;
                        if (response.data.C_ID) {
                            setPasswordId(response.data.C_ID);
                            setForgetCode(true);
                            setStage("verifyCode");
                        }
                        if (callback) {
                            callback(status);
                        }
                        if (status === "FAIL") {
                            // handleUsernameError("Username not found.");
                            toastEmitter("Invalid Username", true, "error");
                            resolve(true);
                            setDisableInput(false);
                        } else if (status === "SUCCESS") {
                            toastEmitter("Username Verified", true, "success");
                            resolve(false);
                        }
                    }
                })
                .catch(err => {
                    console.error("***********:" + err);
                });
        });
    }

    function verifyCode(event, callback) {
        event.preventDefault();
        const url = `${SIGNUP_URL}?service.key=verify.code`;
        const dataRequest = {
            code: userDetail.code,
            id: passwordId,
        };
        return new Promise((resolve, reject) => {
            axios
                .post(url, dataRequest)
                .then(function (response) {
                    if (response.status === 200) {
                        const status = response.data.C_STATUS;
                        if (response.data.C_MESSAGE == "Code Verified") {
                            // const record_id = response.data.C_ID;
                            setValidCode(true);
                            setStage("setPassword");
                        }
                        if (callback) {
                            callback(status);
                        }
                        if (status === "FAIL") {
                            toastEmitter("Invalid Code", true, "error");
                            resolve(true);
                        } else if (status === "SUCCESS") {
                            toastEmitter("Code Verified", true, "success");
                            resolve(false);
                        }
                    }
                })
                .catch(err => {
                    console.error("***********:" + err);
                });
        });
    }

    function updatePassword(event, callback) {
        event.preventDefault();
        if (userDetail.password !== userDetail.passwordReenter) {
            toastEmitter("Both passwords does not match", true, "error");
            return;
        }
        const url = `${SIGNUP_URL}?service.key=update.password`;
        const dataRequest = {
            id: passwordId,
            password: userDetail.password,
        };
        return new Promise((resolve, reject) => {
            axios
                .post(url, dataRequest)
                .then(function (response) {
                    if (response.status === 200) {
                        const status = response.data.C_STATUS;
                        // if (response.data.C_MESSAGE == "Code Verified") {
                        //     // const record_id = response.data.C_ID;
                        //     setValidCode(true);
                        // }
                        toastEmitter(
                            "Your password has been updated!",
                            true,
                            "succes",
                        );
                        setForgetCode(true);
                        setTimeout(() => {
                            navigate("/login");
                        }, 1000);
                        if (callback) {
                            callback(status);
                        }
                        if (status === "FAIL") {
                            toastEmitter(
                                "Unable to update password",
                                true,
                                "info",
                            );
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
            <style>{appContext?.styles}</style>
            <div id="signup" className="s2a-signup min-h-[100svh]">
                <div className="grid min-h-[100svh] grid-cols-1 overflow-hidden lg:grid-cols-12">
                    {screenView === "lg" && (
                        <LoginBackground> </LoginBackground>
                    )}
                    <div className="login-content flex min-h-[100svh] items-center justify-center px-4 py-8 sm:px-8 lg:col-span-6 lg:px-12">
                        <div className="s2a-brand-container w-full max-w-[520px] space-y-6">
                            <BrandLogo></BrandLogo>
                            <div className="reset-pass-form w-full rounded-4 border p-6 shadow-lg sm:p-8">
                                <div className="space-y-2">
                                    <p className="mb-0 text-center text-3xl font-semibold tracking-tight login-text forget-text">
                                        Password Reset
                                    </p>
                                    <p className="mb-0 text-center text-sm">
                                        Follow the verification steps to reset
                                        your password.
                                    </p>
                                </div>
                                {stage === "forgetPassword" && (
                                    <form onSubmit={forgetPassword}>
                                        <div className="grid gap-4">
                                            <div>
                                                <label className="form-label label-forget text-sm font-medium">
                                                    Username
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control h-12 rounded-2xl border px-4 shadow-sm"
                                                    name="username"
                                                    onChange={handleChange}
                                                    value={userDetail.username}
                                                    // placeholder="Username"
                                                    disabled={disableInput}
                                                    tabIndex={4}
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    type="submit"
                                                    // onClick={event =>
                                                    //     forgetPassword(event)
                                                    // }
                                                    className="btn btn-sm button-theme login-button h-11 rounded-2xl px-4 font-medium">
                                                    Continue
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => cancel()}
                                                    className="btn btn-sm button-theme login-button h-11 rounded-2xl px-4 font-medium">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                                {stage === "verifyCode" && (
                                    <form onSubmit={verifyCode}>
                                        <div className="grid gap-4">
                                            <div>
                                                <label className="form-label label-forget text-sm font-medium">
                                                    Code
                                                </label>
                                                <input
                                                    type="text"
                                                    name="code"
                                                    onChange={handleChange}
                                                    value={userDetail.code}
                                                    className="form-control form-control-custom h-12 rounded-2xl border px-4 shadow-sm"
                                                    placeholder="Please enter 6 digit code send in email"
                                                    tabIndex={4}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <button
                                                    type="submit"
                                                    // onClick={event =>
                                                    //     verifyCode(event)
                                                    // }
                                                    className="btn btn-sm button-theme login-button h-11 rounded-2xl px-4 font-medium">
                                                    Verify Code
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                                {stage === "setPassword" && (
                                    <form onSubmit={updatePassword}>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="form-label label-forget text-sm font-medium">
                                                    New Password
                                                </label>
                                                <input
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    name="password"
                                                    onChange={handleChange}
                                                    value={userDetail.password}
                                                    className="form-control form-control-custom h-12 rounded-2xl border px-4 shadow-sm"
                                                    // placeholder="Password*"
                                                    tabIndex={4}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label label-forget text-sm font-medium">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    name="passwordReenter"
                                                    onChange={handleChange}
                                                    value={
                                                        userDetail.passwordReenter
                                                    }
                                                    className="form-control form-control-custom h-12 rounded-2xl border px-4 shadow-sm"
                                                    // placeholder="Re Enter Password*"
                                                    tabIndex={4}
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        type="submit"
                                                        // onClick={event =>
                                                        //     updatePassword(event)
                                                        // }
                                                        className="btn btn-sm button-theme login-button h-11 rounded-2xl px-4 font-medium">
                                                        Set Password
                                                    </button>
                                                    <Link
                                                        to="/login"
                                                        type="submit"
                                                        className="guest-btn pointer text-end">
                                                        Login
                                                    </Link>
                                                </div>
                                                <div className="form-check mt-1">
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
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Forget;
