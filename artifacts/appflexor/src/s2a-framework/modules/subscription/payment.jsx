import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../AppContext";
import { API_URL } from "../../Config";
import { formatDateForUserView } from "../../components/DatePicker/DatePicker";

function StripeSubscription() {
    const [AUTH_KEY, setAUTH_KEY] = useState("");
    const hostName = window.location.hostname;
    const appContext = useContext(AppContext);
    const email = appContext.profile.email;
    const client_reference_id = appContext.channel.subscription;
    const subscription_id = appContext.tenantSubscription.subscription_id;
    const [packageItems, setPackageItems] = useState([]);
    const [featureItems, setFeatureItems] = useState([]);
    const [serviceItems, setServiceItems] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [subscription, setSubscription] = useState({});
    const [selectedUserLimits, setSelectedUserLimits] = useState({});
    const [showUpdateButton, setShowUpdateButton] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [defaultPackage, setDefaultPackage] = useState("");

    // Fetch AUTH_KEY from localStorage
    function getAuthKey() {
        const storedAuthKey = localStorage.getItem("AUTH_KEY");
        setAUTH_KEY(storedAuthKey || "");
    }

    useEffect(() => {
        getAuthKey();
        getActiveUsers();
        getData();
        getSubscription();
    }, [subscription_id]);

    useEffect(() => {
        if (subscription?.package_id && packageItems?.length > 0) {
            const matchedPackage = packageItems.find(
                item => item.id === subscription.package_id,
            );
            if (matchedPackage) {
                setDefaultPackage(matchedPackage.name);
            }
        }
    }, [subscription, packageItems, setDefaultPackage]);

    const users = [
        { value: 2, label: "Up to 2 Users" },
        { value: 3, label: "Up to 3 Users" },
        { value: 4, label: "Up to 4 Users" },
        { value: 5, label: "Up to 5 Users" },
        { value: 6, label: "Up to 6 Users" },
        { value: 7, label: "Up to 7 Users" },
        { value: 8, label: "Up to 8 Users" },
        { value: 9, label: "Up to 9 Users" },
        { value: 10, label: "Up to 10 Users" },
    ];
    useEffect(() => {
        const initialLimits = packageItems.reduce(
            (acc, pkg) => ({
                ...acc,
                [pkg.price_id]: pkg.base_users,
            }),
            {},
        );
        if (subscription.user_limit) {
            packageItems.forEach(pkg => {
                initialLimits[pkg.price_id] = subscription.user_limit;
            });
        }
        // else if (!subscription?.price_id) {
        //     packageItems.forEach(pkg => {
        //         initialLimits[pkg.price_id] = activeUsers.active_users;
        //     });
        // }else if (subscription?.price_id) {
        //     packageItems.forEach(pkg => {
        //         initialLimits[pkg.price_id] = subscription.user_limit;
        //     });
        // }

        setSelectedUserLimits(initialLimits);
    }, [subscription, packageItems]);

    // Handle select change for a specific package
    const handleSelectChange = (priceId, event) => {
        const value = parseInt(event.target.value, 10);
        setSelectedUserLimits(prevState => ({
            ...prevState,
            [priceId]: value,
        }));

        // Update showUpdateButton state based on the selected user limit
        if (
            subscription?.user_limit !== value.toString() &&
            priceId == subscription.price_id
        ) {
            setShowUpdateButton(true);
        } else {
            setShowUpdateButton(false);
        }
    };

    // Function to calculate the price based on user selection
    function calculatePrice(basePrice, margin, baseUsers, selectedUsers) {
        // Ensure basePrice and margin are numbers
        const basePriceNum = parseFloat(basePrice) || 0;
        const marginNum = parseFloat(margin) || 0;
        const baseUsersNum = parseInt(baseUsers) || 0;
        const selectedUsersNum = parseInt(selectedUsers) || 0;

        const additionalUsers = selectedUsersNum - baseUsersNum;

        const totalPrice =
            basePriceNum +
            (additionalUsers > 0 ? additionalUsers * marginNum : 0);

        return totalPrice.toFixed(2);
    }

    // Fetch subscription details
    function getSubscription() {
        const dataRequest = {
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
            .post(`${API_URL}?service.key=master.data`, dataRequest)
            .then(response => {
                if (response.status === 200) {
                    const { C_STATUS, C_DATA } = response.data;
                    if (C_STATUS === "UNAUTHORIZED") {
                        console.log("UNAUTHORIZED, please login.");
                    } else if (
                        C_STATUS === "SUCCESS" &&
                        C_DATA.subscriptionList
                    ) {
                        setSubscription(C_DATA.subscriptionList[0]);
                    } else {
                        console.log(
                            "Either instance does not exist or SQL query returns no result.",
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getActiveUsers() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "activeUserList",
                    serviceKey: "sys.active.users",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        if (response.data.C_DATA.activeUserList) {
                            setActiveUsers(
                                response.data.C_DATA.activeUserList[0],
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

    // Handle subscription switch
    const handleSwitchSubscription = async (users, item, endpoint) => {
        try {
            setIsLoading(true); // Show loader when the process starts

            const data = {
                hostName: hostName,
                priceId: item.price_id,
                users: users.toString(),
                subId: subscription.subscription_id,
                AUTH_KEY: AUTH_KEY,
                client_reference_id: client_reference_id,
            };

            const response = await axios.post(endpoint, data);

            if (response.status === 200) {
                setTimeout(() => {
                    window.location.reload();
                    setIsLoading(false);
                }, 3000);
            }
        } catch (error) {
            console.error("changeSubscription error:", error);
            setIsLoading(false); // Hide loader if there is an error
        }
    };

    // Handle subscription cancellation
    const handleCancelSubscription = async endpoint => {
        try {
            setIsLoading(true);
            const data = {
                hostName: hostName,
                subId: subscription.subscription_id,
                AUTH_KEY: AUTH_KEY,
                client_reference_id: client_reference_id,
            };
            const response = await axios.post(endpoint, data);
            if (response.status === 200) {
                setTimeout(() => {
                    window.location.reload();
                    setIsLoading(false);
                }, 3000);
            }
        } catch (error) {
            console.error("CancelSubscription error:", error);
            setIsLoading(false);
        }
    };

    const myStyles = {
        textAlign: "center",
        marginTop: "10px",
    };

    function LoadingSpinner() {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "80vh" }}>
                <div
                    className="spinner-border text-primary"
                    role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div id="subscription">
            <div className="row">
                <div className="col-sm-12">
                    {subscription?.status === "CANCELLED" && (
                        <div className="subscription-info">
                            Your Current Subscription is{" "}
                            <span className="bolder-info">Cancelled</span>
                        </div>
                    )}
                    {subscription?.status === "TRIAL" && (
                        <div className="subscription-info">
                            Your Current Subscription is{" "}
                            <span className="bolder-info">
                                {defaultPackage}, and the trial ends on{" "}
                                {formatDateForUserView(
                                    subscription.lockout_date,
                                )}
                            </span>
                        </div>
                    )}
                    {subscription?.price_id && (
                        <div className="subscription-info">
                            Your Current Subscription is{" "}
                            <span className="bolder-info">
                                {subscription.product_name}
                            </span>{" "}
                            which renews on{" "}
                            <span className="bolder-info">
                                {formatDateForUserView(
                                    subscription.lockout_date,
                                )}
                            </span>{" "}
                            using MOP ending ....{subscription.last_four}
                        </div>
                    )}
                </div>
            </div>
            {isLoading && <LoadingSpinner />}
            {!isLoading && (
                <div className="row packages">
                    {packageItems.map(item => {
                        const selectedUserLimit =
                            selectedUserLimits[item.price_id] ||
                            item.base_users;
                        const calculatedPrice = calculatePrice(
                            item.price,
                            item.margin,
                            item.base_users,
                            selectedUserLimit,
                        );
                        return (
                            <div
                                key={item.price_id}
                                className={`col packagelist ${
                                    subscription?.price_id &&
                                    item.price_id === subscription.price_id
                                        ? "active"
                                        : ""
                                }`}>
                                <div className="package-heading">
                                    <div>
                                        <p className="package-name">
                                            {item.name}
                                        </p>
                                        <p>Starting at</p>
                                        <p>
                                            <span className="package-pricing">
                                                ${calculatedPrice}
                                            </span>{" "}
                                            per month
                                        </p>
                                        {/* <p className="mb-2">
                                            For {subscription.user_limit} Users
                                            ({activeUsers.active_users} Active)
                                        </p>                                        */}
                                    </div>
                                    <div className="form-group mt-2">
                                        <select
                                            className="form-select"
                                            id={`userLimit-${item.price_id}`}
                                            name={`userLimit-${item.price_id}`}
                                            value={selectedUserLimit}
                                            onChange={e =>
                                                handleSelectChange(
                                                    item.price_id,
                                                    e,
                                                )
                                            }>
                                            {users
                                                .filter(
                                                    option =>
                                                        option.value >=
                                                        activeUsers.active_users,
                                                )
                                                .map(option => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        {activeUsers.active_users && (
                                            <p className="mt-2">
                                                <span>
                                                    You have{" "}
                                                    {activeUsers.active_users}{" "}
                                                    active users. The user count
                                                    cannot be less than the
                                                    current active user count.
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                    <div
                                        key={item.price_id}
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
                                            <input
                                                type="hidden"
                                                id="users"
                                                name="users"
                                                value={selectedUserLimit}
                                            />

                                            {!subscription?.price_id && (
                                                <button className="switch-to">
                                                    Subscribe
                                                </button>
                                            )}
                                            <div className="btn-holder">
                                                {subscription?.price_id &&
                                                    item.price_id !==
                                                        subscription.price_id && (
                                                        <button
                                                            className="switch-to"
                                                            onClick={() =>
                                                                handleSwitchSubscription(
                                                                    selectedUserLimit,
                                                                    item,
                                                                    "/stripe/update-subscription",
                                                                )
                                                            }>
                                                            Switch To
                                                        </button>
                                                    )}
                                                {subscription?.price_id &&
                                                    item.price_id ===
                                                        subscription.price_id &&
                                                    !showUpdateButton && (
                                                        <button
                                                            className="subscribe-disable"
                                                            disabled={true}>
                                                            Subscribed
                                                        </button>
                                                    )}
                                                {showUpdateButton &&
                                                    subscription.price_id ==
                                                        item.price_id && (
                                                        <button
                                                            className="switch-to"
                                                            onClick={() =>
                                                                handleSwitchSubscription(
                                                                    selectedUserLimit,
                                                                    item,
                                                                    "/stripe/update-subscription",
                                                                )
                                                            }>
                                                            Update Subscription
                                                        </button>
                                                    )}
                                            </div>
                                            <div className="mt-4 features-list">
                                                <p>Package Includes : </p>
                                                <ul className="package-features">
                                                    {featureItems.map(
                                                        (feature, index) => (
                                                            <>
                                                                {feature.package_id ==
                                                                    item.id && (
                                                                    <li
                                                                        key={
                                                                            index
                                                                        }>
                                                                        {
                                                                            feature.name
                                                                        }
                                                                    </li>
                                                                )}
                                                            </>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {!isLoading && subscription?.price_id && (
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
                </div>
            )}
        </div>
    );
}

export default StripeSubscription;
