import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../AppContext";
import { API_URL } from "../../Config";

function Subscription() {
    const [AUTH_KEY, setAUTH_KEY] = useState({});
    const hostName = location.hostname;
    const appContext = useContext(AppContext);
    const email = appContext.profile.email;
    const client_reference_id = appContext.channel.subscription;
    const subscription_id = appContext.tenantSubscription.subscription_id;
    const [packageItems, setPackageItems] = useState([]);
    const [featureItems, setFeatureItems] = useState([]);
    const [serviceItems, setServiceItems] = useState([]);
    const [subscription, setSubscription] = useState({});

    function getAuthKey() {
        let AUTH_KEY = localStorage.getItem("AUTH_KEY");
        return setAUTH_KEY(AUTH_KEY);
    }
    useEffect(() => {
        getAuthKey();
        getData();
        getSubscription();
    }, [subscription_id]);

    function getSubscription() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: client_reference_id,
                    dataKey: "subscriptionList",
                    serviceKey: "tenant.subscription",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=master.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.subscriptionList) {
                            setSubscription(
                                response.data.C_DATA.subscriptionList[0],
                            );
                        }
                    } else {
                        console.log(
                            `Either instance does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "packageList",
                    serviceKey: "subscription.packages",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "featureList",
                    serviceKey: "subscription.package.features",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "serviceList",
                    serviceKey: "subscription.package.services",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=master.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.packageList) {
                            setPackageItems(response.data.C_DATA.packageList);
                        }
                        if (response.data.C_DATA.featureList) {
                            setFeatureItems(response.data.C_DATA.featureList);
                        }
                        if (response.data.C_DATA.serviceList) {
                            setServiceItems(response.data.C_DATA.serviceList);
                        }
                    } else {
                        console.log(
                            `Either instance does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    const handleSwitchSubscription = async (item, endpoint) => {
        try {
            const data = {
                hostName: hostName,
                priceId: item.price_id,
                subId: subscription.subscription_id,
                AUTH_KEY: AUTH_KEY,
                client_reference_id: client_reference_id,
            };
            const response = await axios.post(endpoint, data);
            if (response.status === 200) {
                window.location.reload();
            }
        } catch (error) {
            console.error("changeSubscription error:", error);
        }
    };
    const handleCancelSubscription = async endpoint => {
        try {
            const data = {
                hostName: hostName,
                subId: subscription.subscription_id,
                AUTH_KEY: AUTH_KEY,
                client_reference_id: client_reference_id,
            };
            const response = await axios.post(endpoint, data);
            if (response.status === 200) {
                window.location.reload();
            }
        } catch (error) {
            console.error("CancelSubscription error:", error);
        }
    };

    const myStyles = {
        textAlign: "center",
        marginTop: "10px",
    };

    return (
        <div id="subscription">
            <div className="row">
                <div className="col-sm-12">
                    {subscription?.status === "CANCELLED" && (
                        <div className="subscription-info">
                            Your Current Subscription is{" "}
                            <span className="bolder-info">Cancelled </span>
                        </div>
                    )}
                    {subscription?.status === "TRIAL" && (
                        <div className="subscription-info">
                            Your Current Subscription{" "}
                            <span className="bolder-info">
                                Trial ending on {subscription.lockout_date}{" "}
                            </span>
                        </div>
                    )}
                    {subscription?.price_id && (
                        <div className="subscription-info">
                            Your current Subscription is{" "}
                            <span className="bolder-info">
                                {subscription.product_name}
                            </span>{" "}
                            which renews on {subscription.lockout_date} using
                            MOP ending ....{subscription.last_four}
                        </div>
                    )}
                </div>
            </div>
            <div className="row packages">
                {packageItems.map((item, index) => (
                    <div
                        className={
                            subscription?.price_id &&
                            item.price_id === subscription.price_id
                                ? "col packagelist active"
                                : "col packagelist"
                        }>
                        <div
                            key={index}
                            className="package-heading">
                            <p className="package-name">{item.name}</p>
                            <p>Starting at</p>
                            <p className="package-pricing">
                                {" "}
                                ${item.price}/month
                            </p>

                            <div
                                key={index}
                                className="package-form">
                                <form
                                    action="/stripe/create-checkout-session"
                                    method="POST">
                                    <input
                                        type="hidden"
                                        id="priceId"
                                        name="priceId"
                                        value={item.price_id}
                                    />
                                    <input
                                        type="hidden"
                                        id="hostName"
                                        name="hostName"
                                        value={hostName}
                                    />
                                    <input
                                        type="hidden"
                                        id="AUTH_KEY"
                                        name="AUTH_KEY"
                                        value={AUTH_KEY}
                                    />
                                    <input
                                        type="hidden"
                                        id="email"
                                        name="email"
                                        value={email}
                                    />
                                    <input
                                        type="hidden"
                                        id="client_reference_id"
                                        name="client_reference_id"
                                        value={client_reference_id}
                                    />

                                    {!subscription?.price_id && (
                                        <button className="switch-to">
                                            Subscribe
                                        </button>
                                    )}
                                    <p>This Includes : </p>
                                    <ul className="package-features">
                                        <li key="user-limit">
                                            20 Active Users
                                        </li>
                                        <li key="storage-limit">
                                            10GB Storage
                                        </li>
                                        {featureItems.map((feature, index) => (
                                            <>
                                                {feature.package_id ==
                                                    item.id && (
                                                    <li key={index}>
                                                        {feature.name}
                                                    </li>
                                                )}
                                            </>
                                        ))}
                                    </ul>
                                </form>
                            </div>
                        </div>
                        <div className="btn-holder">
                            {subscription?.price_id &&
                                item.price_id !== subscription.price_id && (
                                    <button
                                        className="switch-to"
                                        onClick={() =>
                                            handleSwitchSubscription(
                                                item,
                                                "/stripe/update-subscription",
                                            )
                                        }>
                                        Switch To
                                    </button>
                                )}
                            {subscription?.price_id &&
                                item.price_id === subscription.price_id && (
                                    <button
                                        className="subscribe-disable"
                                        disabled={true}>
                                        Subscribed
                                    </button>
                                )}
                        </div>
                    </div>
                ))}
            </div>
            {subscription?.price_id && (
                <div style={myStyles}>
                    <form
                        action="/stripe/payment-method"
                        method="POST">
                        <input
                            type="hidden"
                            id="subId"
                            name="subId"
                            value={subscription.subscription_id}
                        />
                        <input
                            type="hidden"
                            id="hostName"
                            name="hostName"
                            value={hostName}
                        />
                        <input
                            type="hidden"
                            id="AUTH_KEY"
                            name="AUTH_KEY"
                            value={AUTH_KEY}
                        />
                        <input
                            type="hidden"
                            id="client_reference_id"
                            name="client_reference_id"
                            value={client_reference_id}
                        />
                        <button
                            className="change-mop"
                            type="submit">
                            Change Payment Method
                        </button>
                    </form>
                    <button
                        className="subscription-cancel"
                        onClick={() =>
                            handleCancelSubscription(
                                "/stripe/cancel-subscription",
                            )
                        }>
                        Cancel
                    </button>
                    {/* <form
                        action="/stripe/cancel-subscription"
                        method="POST">
                        <input
                            type="hidden"
                            id="subscription_id"
                            name="subscription_id"
                            value={subscription.subscription_id}
                        />
                        <input
                            type="hidden"
                            id="hostName"
                            name="hostName"
                            value={hostName}
                        />
                        <input
                            type="hidden"
                            id="AUTH_KEY"
                            name="AUTH_KEY"
                            value={AUTH_KEY}
                        />
                        <input
                            type="hidden"
                            id="email"
                            name="email"
                            value={email}
                        />
                        <input
                            type="hidden"
                            id="client_reference_id"
                            name="client_reference_id"
                            value={client_reference_id}
                        />
                        <button className="subscription-cancel">
                            Cancel Subscription
                        </button>
                    </form> */}
                </div>
            )}
        </div>
    );
}

export default Subscription;
