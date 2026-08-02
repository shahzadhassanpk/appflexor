import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../AppContext";
import { API_URL } from "../../Config";
import { formatDateForUserView } from "../../components/DatePicker/DatePicker";
import "./payment.css";

/* ── Status banner — defined outside component so type is stable ────────────── */
function StatusBanner({ subscription, defaultPackage }) {
    if (subscription?.status === "CANCELLED") return (
        <div className="sub-status-banner is-cancelled">
            <i className="fa-solid fa-circle-xmark" />
            Your subscription has been <strong>cancelled</strong>.
        </div>
    );
    if (subscription?.status === "TRIAL") return (
        <div className="sub-status-banner is-trial">
            <i className="fa-solid fa-hourglass-half" />
            You are on a <strong>{defaultPackage}</strong> trial — ends on{" "}
            <strong>{formatDateForUserView(subscription.lockout_date)}</strong>.
        </div>
    );
    if (subscription?.price_id) return (
        <div className="sub-status-banner is-active">
            <i className="fa-solid fa-circle-check" />
            <span>
                Active plan: <strong>{subscription.product_name}</strong> — renews{" "}
                <strong>{formatDateForUserView(subscription.lockout_date)}</strong>
                {subscription.last_four && <>, card ending <strong>····{subscription.last_four}</strong></>}.
            </span>
        </div>
    );
    return null;
}

const USER_SEAT_OPTIONS = [
    { value: 2,  label: "Up to 2 Users" },
    { value: 3,  label: "Up to 3 Users" },
    { value: 4,  label: "Up to 4 Users" },
    { value: 5,  label: "Up to 5 Users" },
    { value: 6,  label: "Up to 6 Users" },
    { value: 7,  label: "Up to 7 Users" },
    { value: 8,  label: "Up to 8 Users" },
    { value: 9,  label: "Up to 9 Users" },
    { value: 10, label: "Up to 10 Users" },
];

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
    const [activeUsers, setActiveUsers] = useState({});
    const [subscription, setSubscription] = useState({});
    const [selectedUserLimits, setSelectedUserLimits] = useState({});
    const [showUpdateButton, setShowUpdateButton] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [defaultPackage, setDefaultPackage] = useState("");

    function getAuthKey() {
        setAUTH_KEY(localStorage.getItem("AUTH_KEY") || "");
    }

    useEffect(() => {
        getAuthKey();
        getActiveUsers();
        getData();
        getSubscription();
    }, [subscription_id]);

    useEffect(() => {
        if (subscription?.package_id && packageItems?.length > 0) {
            const matched = packageItems.find(i => i.id === subscription.package_id);
            if (matched) setDefaultPackage(matched.name);
        }
    }, [subscription, packageItems]);

    useEffect(() => {
        const initialLimits = packageItems.reduce(
            (acc, pkg) => ({ ...acc, [pkg.price_id]: pkg.base_users }),
            {},
        );
        if (subscription.user_limit) {
            packageItems.forEach(pkg => {
                initialLimits[pkg.price_id] = subscription.user_limit;
            });
        }
        setSelectedUserLimits(initialLimits);
    }, [subscription, packageItems]);

    const handleSelectChange = (priceId, event) => {
        const value = parseInt(event.target.value, 10);
        setSelectedUserLimits(prev => ({ ...prev, [priceId]: value }));
        setShowUpdateButton(
            subscription?.user_limit !== value.toString() &&
            priceId == subscription.price_id,
        );
    };

    function calculatePrice(basePrice, margin, baseUsers, selectedUsers) {
        const base  = parseFloat(basePrice) || 0;
        const mar   = parseFloat(margin)    || 0;
        const extra = Math.max(0, (parseInt(selectedUsers) || 0) - (parseInt(baseUsers) || 0));
        return (base + extra * mar).toFixed(2);
    }

    function getSubscription() {
        axios
            .post(`${API_URL}?service.key=master.data`, {
                dataKeys: [{
                    serviceParams: client_reference_id,
                    dataKey: "subscriptionList",
                    serviceKey: "tenant.subscription",
                    mode: "formData",
                }],
            })
            .then(res => {
                if (res.data.C_STATUS === "SUCCESS" && res.data.C_DATA.subscriptionList)
                    setSubscription(res.data.C_DATA.subscriptionList[0]);
            })
            .catch(console.error);
    }

    function getActiveUsers() {
        axios
            .post(`${API_URL}?service.key=masterKey.tenantData`, {
                dataKeys: [{
                    serviceParams: "",
                    dataKey: "activeUserList",
                    serviceKey: "sys.active.users",
                    mode: "formData",
                }],
            })
            .then(res => {
                if (res.data.C_STATUS === "SUCCESS" && res.data.C_DATA.activeUserList)
                    setActiveUsers(res.data.C_DATA.activeUserList[0]);
            })
            .catch(console.error);
    }

    function getData() {
        axios
            .post(`${API_URL}?service.key=master.data`, {
                dataKeys: [
                    { serviceParams: "", dataKey: "packageList", serviceKey: "subscription.packages",         mode: "formData" },
                    { serviceParams: "", dataKey: "featureList", serviceKey: "subscription.package.features", mode: "formData" },
                    { serviceParams: "", dataKey: "serviceList", serviceKey: "subscription.package.services", mode: "formData" },
                ],
            })
            .then(res => {
                if (res.data.C_STATUS === "SUCCESS") {
                    if (res.data.C_DATA.packageList) setPackageItems(res.data.C_DATA.packageList);
                    if (res.data.C_DATA.featureList) setFeatureItems(res.data.C_DATA.featureList);
                    if (res.data.C_DATA.serviceList) setServiceItems(res.data.C_DATA.serviceList);
                }
            })
            .catch(console.error);
    }

    const handleSwitchSubscription = async (users, item, endpoint) => {
        try {
            setIsLoading(true);
            const res = await axios.post(endpoint, {
                hostName, priceId: item.price_id,
                users: users.toString(),
                subId: subscription.subscription_id,
                AUTH_KEY, client_reference_id,
            });
            if (res.status === 200) setTimeout(() => { window.location.reload(); setIsLoading(false); }, 3000);
        } catch (e) {
            console.error("changeSubscription error:", e);
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = async endpoint => {
        try {
            setIsLoading(true);
            const res = await axios.post(endpoint, {
                hostName, subId: subscription.subscription_id,
                AUTH_KEY, client_reference_id,
            });
            if (res.status === 200) setTimeout(() => { window.location.reload(); setIsLoading(false); }, 3000);
        } catch (e) {
            console.error("CancelSubscription error:", e);
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading…</span>
            </div>
        </div>
    );

    return (
        <div id="subscription">

            {/* ── Status banner ───────────────────────────────────────────── */}
            <StatusBanner subscription={subscription} defaultPackage={defaultPackage} />

            {/* ── Package cards ───────────────────────────────────────────── */}
            <div className="sub-packages-grid">
                {packageItems.map(item => {
                    const isCurrent = Boolean(subscription?.price_id && item.price_id === subscription.price_id);
                    const selectedUserLimit = selectedUserLimits[item.price_id] || item.base_users;
                    const calculatedPrice = calculatePrice(
                        item.price, item.margin, item.base_users, selectedUserLimit,
                    );
                    const pkgFeatures = featureItems.filter(f => f.package_id == item.id);

                    return (
                        <div key={item.price_id} className={`sub-pkg-card${isCurrent ? " is-current" : ""}`}>

                            {/* Header */}
                            <div className="sub-pkg-header">
                                {isCurrent && (
                                    <span className="sub-pkg-badge">
                                        <i className="fa-solid fa-check" />
                                        Current Plan
                                    </span>
                                )}
                                <p className="sub-pkg-name">{item.name}</p>
                                <p className="sub-pkg-starting">Starting at</p>
                                <div className="sub-pkg-price">
                                    <span className="sub-pkg-amount">${calculatedPrice}</span>
                                    <span className="sub-pkg-period">/ month</span>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="sub-pkg-body">

                                {/* User limit picker */}
                                <div className="sub-user-picker">
                                    <label htmlFor={`userLimit-${item.price_id}`}>User seats</label>
                                    <select
                                        className="form-select form-select-sm"
                                        id={`userLimit-${item.price_id}`}
                                        value={selectedUserLimit}
                                        onChange={e => handleSelectChange(item.price_id, e)}>
                                        {USER_SEAT_OPTIONS
                                            .filter(o => o.value >= (activeUsers.active_users || 0))
                                            .map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                    </select>
                                    {activeUsers.active_users && (
                                        <p className="sub-user-hint mt-1">
                                            <i className="fa-solid fa-circle-info" />
                                            {activeUsers.active_users} currently active — minimum seat count
                                        </p>
                                    )}
                                </div>

                                {/* CTA */}
                                <form action="/stripe/create-checkout-session" method="POST">
                                    <input type="hidden" name="priceId"             value={item.price_id} />
                                    <input type="hidden" name="hostName"            value={hostName} />
                                    <input type="hidden" name="AUTH_KEY"            value={AUTH_KEY} />
                                    <input type="hidden" name="email"               value={email} />
                                    <input type="hidden" name="client_reference_id" value={client_reference_id} />
                                    <input type="hidden" name="users"               value={selectedUserLimit} />

                                    {!subscription?.price_id && (
                                        <button type="submit" className="sub-pkg-cta is-primary">
                                            Subscribe
                                        </button>
                                    )}
                                    {subscription?.price_id && !isCurrent && (
                                        <button
                                            type="button"
                                            className="sub-pkg-cta is-secondary"
                                            onClick={() => handleSwitchSubscription(
                                                selectedUserLimit, item, "/stripe/update-subscription",
                                            )}>
                                            Switch to this plan
                                        </button>
                                    )}
                                    {isCurrent && !showUpdateButton && (
                                        <button type="button" className="sub-pkg-cta is-current" disabled>
                                            <i className="fa-solid fa-check me-1" />
                                            Subscribed
                                        </button>
                                    )}
                                    {isCurrent && showUpdateButton && (
                                        <button
                                            type="button"
                                            className="sub-pkg-cta is-primary"
                                            onClick={() => handleSwitchSubscription(
                                                selectedUserLimit, item, "/stripe/update-subscription",
                                            )}>
                                            Update seats
                                        </button>
                                    )}
                                </form>

                                {/* Feature list */}
                                {pkgFeatures.length > 0 && (
                                    <div>
                                        <p className="sub-features-label">What's included</p>
                                        <ul className="sub-features-list">
                                            {pkgFeatures.map((f, i) => (
                                                <li key={`${item.price_id}-feat-${i}`}>
                                                    <i className="fa-solid fa-check-circle" />
                                                    {f.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Billing actions ──────────────────────────────────────────── */}
            {subscription?.price_id && (
                <div className="sub-billing-footer">
                    <form action="/stripe/payment-method" method="POST">
                        <input type="hidden" name="subId"               value={subscription.subscription_id} />
                        <input type="hidden" name="hostName"            value={hostName} />
                        <input type="hidden" name="AUTH_KEY"            value={AUTH_KEY} />
                        <input type="hidden" name="client_reference_id" value={client_reference_id} />
                        <button type="submit" className="sub-change-mop">
                            <i className="fa-solid fa-credit-card" />
                            Change Payment Method
                        </button>
                    </form>
                    <button
                        type="button"
                        className="sub-cancel-btn"
                        onClick={() => handleCancelSubscription("/stripe/cancel-subscription")}>
                        <i className="fa-solid fa-circle-xmark" />
                        Cancel subscription
                    </button>
                </div>
            )}
        </div>
    );
}

export default StripeSubscription;
