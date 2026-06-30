import axios from "axios";
import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { AUTH_URL, BPM_API_URL, SIGNUP_URL } from "../../../Config";
import { disposeTooltip, enableTooltip } from "../../../utils/utils";
import BrandLogo from "../Layout/BrandLogo";
import LoginBackground from "./LoginBackground";

export const guestCredentails = {
    username: "guest",
    password: "guest",
};

function SignUpSubscription() {
    let initialState = {
        site_name: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        company: "",
        country: "",
    };

    const [subscriptionDetail, setSubscriptionDetail] = useState(initialState);
    const [processStarted, setProcessStarted] = useState(false);
    const [errors, setErrors] = useState([]);
    const [usernameError, setUsernameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [fadeIn, setFadeIn] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        enableTooltip();

        return () => disposeTooltip();
    }, []);

    function handleChange(evt) {
        let name = evt.target.name;
        let value = evt.target.value;
        setSubscriptionDetail(prevState => ({
            ...prevState,
            [name]: value,
        }));
    }

    function validation() {
        let errorsFound = [];

        const emailRxg =
            /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

        for (var key in subscriptionDetail) {
            if (key === "email") {
                if (!emailRxg.test(subscriptionDetail[key])) {
                    errorsFound.push(key);
                }
            } else if (subscriptionDetail[key] === "") {
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

    async function signUp() {
        if (validation()) {
            setIsLoading(true);
            try {
                let authKey = "";
                const authResponse = await axios.post(
                    AUTH_URL + "?service.key=login",
                    guestCredentails,
                );

                let status = authResponse.data.C_STATUS;

                if (status === "SUCCESS") {
                    if (authResponse.data.C_DATA.AUTH_KEY) {
                        authKey = authResponse.data.C_DATA.AUTH_KEY;
                    }
                }

                if (authKey) {
                    let variables = { ...subscriptionDetail };
                    const dataRequest = {
                        businessKey: uuid(),
                        processDefKey: "tenant_subscription",
                        processVar: {
                            ...variables,
                        },
                    };

                    let url = BPM_API_URL + "?service.key=start.process";

                    let headers = {
                        headers: {
                            AUTH_KEY: authKey,
                        },
                    };

                    const response = await axios.post(
                        url,
                        dataRequest,
                        headers,
                    );

                    if (response) {
                        setTimeout(() => {
                            setProcessStarted(true);
                        }, 1000);
                    }
                    setIsLoading(false);

                    console.log(response);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
    }

    return (
        <React.Fragment>
            <div
                id="signup"
                className="s2a-signup">
                <div className="row m-0">
                    <LoginBackground />
                    <div className="col-sm-6 login-content">
                        <div className="row s2a-brand-container">
                            <BrandLogo></BrandLogo>
                            <div className="signup-form rounded-4 border-shadow">
                                {processStarted ? (
                                    <div>
                                        Thank you for subscribing to our
                                        service. We will get back to you shortly
                                        via email provided by you.
                                    </div>
                                ) : (
                                    <>
                                        {" "}
                                        <div className="row mb-2">
                                            <div className="col registerd">
                                                <p className="h5 text-center login-text">
                                                    Get Subscription
                                                </p>
                                            </div>
                                            <div>
                                                <div className="row mb-3">
                                                    <div className="col ps-0">
                                                        <input
                                                            type="text"
                                                            name="site_name"
                                                            value={
                                                                subscriptionDetail.site_name
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            className="form-control form-control-custom site_name"
                                                            placeholder="Site Name*"
                                                            required
                                                        />
                                                        <span
                                                            className={`invalid-feedback ${
                                                                errors.indexOf(
                                                                    "site_name",
                                                                ) > -1 &&
                                                                "d-block"
                                                            }`}>
                                                            Invalid Sitename.
                                                        </span>
                                                        {/* <div
                                                className={`invalid-feedback d-block ${fadeIn}`}>
                                                {emailError}
                                            </div> */}
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-sm-6 mb-3 ps-0">
                                                        <input
                                                            type="text"
                                                            name="first_name"
                                                            value={
                                                                subscriptionDetail.first_name
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            className="form-control form-control-custom"
                                                            placeholder="First Name*"
                                                            required
                                                        />

                                                        <span
                                                            className={`invalid-feedback ${
                                                                errors.indexOf(
                                                                    "first_name",
                                                                ) > -1 &&
                                                                "d-block"
                                                            }`}>
                                                            First Name is
                                                            Required.
                                                        </span>
                                                    </div>
                                                    <div className="col-sm-6 mb-3 ps-0">
                                                        <input
                                                            type="text"
                                                            name="last_name"
                                                            value={
                                                                subscriptionDetail.last_name
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            className="form-control form-control-custom"
                                                            placeholder="Last Name*"
                                                            required
                                                        />
                                                        <span
                                                            className={`invalid-feedback ${
                                                                errors.indexOf(
                                                                    "last_name",
                                                                ) > -1 &&
                                                                "d-block"
                                                            }`}>
                                                            Last Name is
                                                            Required.
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <div className="col ps-0">
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={
                                                                subscriptionDetail.email
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            className="form-control form-control-custom email"
                                                            placeholder="Email*"
                                                            required
                                                        />
                                                        <span
                                                            className={`invalid-feedback ${
                                                                errors.indexOf(
                                                                    "email",
                                                                ) > -1 &&
                                                                "d-block"
                                                            }`}>
                                                            Invalid email.
                                                        </span>
                                                        <div
                                                            className={`invalid-feedback d-block ${fadeIn}`}>
                                                            {emailError}
                                                        </div>
                                                    </div>
                                                    <div className="col ps-0">
                                                        <div className="input-group">
                                                            <input
                                                                type="text"
                                                                name="phone"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                value={
                                                                    subscriptionDetail.phone
                                                                }
                                                                className="form-control form-control-custom"
                                                                placeholder="Phone*"
                                                                required
                                                            />
                                                        </div>

                                                        <div
                                                            className={`invalid-feedback ${
                                                                errors.indexOf(
                                                                    "phone",
                                                                ) > -1 &&
                                                                "d-block"
                                                            }`}>
                                                            Phone is Required.
                                                        </div>
                                                        <div
                                                            className={`invalid-feedback d-block ${fadeIn}`}>
                                                            {usernameError}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-sm-6 mb-3 ps-0">
                                                        <input
                                                            name="company"
                                                            className="form-control form-control-custom company"
                                                            placeholder="Company/Business*"
                                                            type="text"
                                                            value={
                                                                subscriptionDetail.company
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            required
                                                        />
                                                        <span
                                                            className={`invalid-feedback ${
                                                                errors.indexOf(
                                                                    "company",
                                                                ) > -1 &&
                                                                "d-block"
                                                            }`}>
                                                            Company is Required
                                                        </span>
                                                    </div>
                                                    <div className="col-sm-6 mb-3 ps-0">
                                                        <input
                                                            name="country"
                                                            className="form-control form-control-custom password"
                                                            placeholder="Country*"
                                                            type="text"
                                                            value={
                                                                subscriptionDetail.country
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            required
                                                        />
                                                        <span
                                                            className={`invalid-feedback ${
                                                                errors.indexOf(
                                                                    "country",
                                                                ) > -1 &&
                                                                "d-block"
                                                            }`}>
                                                            Country is required
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="action-row row mb-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm button-theme"
                                                        onClick={() =>
                                                            signUp()
                                                        }>
                                                        {isLoading ? (
                                                            <span
                                                                className="spinner-border spinner-border-sm label"
                                                                role="status"></span>
                                                        ) : (
                                                            "Sign up"
                                                        )}
                                                    </button>
                                                </div>
                                                {/* <div className="row">
                                        <Link
                                            to="/login"
                                            className="btn btn-link">
                                            Already have an account
                                        </Link>
                                        <center>
                                            <span className="text-success">
                                                {successMsg}
                                            </span>
                                        </center>
                                    </div> */}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default SignUpSubscription;
