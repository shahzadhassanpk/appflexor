import axios from "axios";
import $ from "jquery";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../AppContext";
import AppRoutes from "./AppRoutes";
import { API_URL, AUTH_URL, MONITOR_API_URL, SOCKET_MSG_URL } from "./Config";
import { ContainerToast } from "./components/Toastify/Toastify";
import { setThemeColor } from "./modules/content-management/Sites/Site";
import { tryToParse } from "./modules/data-management/form-builder/Forms/FormViewer/utils";
import { staticAdminModuleFeatures, staticAdminModules } from "./staticMenu";
import Breadcrumb from "./theme/advance/Layout/BreadCrumb";
import Footer from "./theme/advance/Layout/Footer";
import { Layout, MENU } from "./theme/advance/Layout/Layout";
import { ErrorBoundary } from "./utils/ErrorBoundry";
import CookieConsent, { Cookies } from "react-cookie-consent";
import { checkIfComponentIsAuthorized } from "./utils/utils";

import {
    decryptData,
    deleteCookie,
    getAuthorizedFeatures,
    getCookie,
    loginUser,
    unescapeSlashes,
} from "./utils/utils";

function S2aApp() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentUrl = window.location.href;
    const searchParamsJS = new URLSearchParams(currentUrl);

    // app state
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authKey, setAuthKey] = useState(localStorage.getItem("AUTH_KEY"));
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [featuresLoaded, setFeaturesLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    // app configs
    const [isEmbeded, setIsEmbeded] = useState(false);
    const [redirectToRegister, setRedirectToRegister] = useState(false);
    const [initailRoute, setInitialRoute] = useState("/welcome");

    // layout states
    const [frontOfficeItems, setFrontOfficeItems] = useState([]);
    const [appModules, setAppModules] = useState([]);
    const [moduleFeatures, setModuleFeatures] = useState([]);
    const [brandDetails, setBrandDetials] = useState({});
    const [channel, setChannel] = useState({});
    const [tenantSubscription, setTenantSubscription] = useState({});
    const [profile, setProfile] = useState({});
    const [featuresSubscription, setFeaturesSubscription] = useState([]);
    const [office, setOffice] = useState("");
    const [isTabActive, setIsTabActive] = useState(false);
    const [orgCheck, setOrgCheck] = useState(false);
    // theme states
    const [screenView, setScreenView] = useState("lg");
    const [styles, setStyles] = useState(undefined);

    // common states
    const [pages, setPages] = useState([]);
    const [userGroups, setUserGroups] = useState({});
    const [userOrgList, setUserOrgList] = useState([]);
    const [userOrg, setUserOrgState] = useState(() => {
        const storedOrg = localStorage.getItem("userOrg");
        let org = storedOrg ? JSON.parse(storedOrg) : {};
        axios.defaults.headers.common["USER_ORG"] = org?.id;
        setOrgCheck(true);
        return org;
    });

    useEffect(() => {
        const orgListener = event => {
            if (event.key === "userOrg") {
                let org = JSON.parse(event.newValue);
                console.log("ORG changed in another tab:", event.newValue);
                if (org) {
                    axios.defaults.headers.common["USER_ORG"] = org.id;
                    // Reload the whole app
                    window.location.reload();
                }
            }
            if (event.key === "AUTH_KEY") {
                let AUTH_KEY = event.newValue;
                console.log("AUTH_KEY changed in another tab:", event.newValue);
                if (AUTH_KEY) {
                    axios.defaults.headers.common["AUTH_KEY"] = AUTH_KEY;
                    // Reload the whole app
                    window.location.reload();
                } else {
                    window.location.href = "/app/login";
                }
            }
        };
        window.addEventListener("storage", orgListener);
        return () => window.removeEventListener("storage", orgListener);
    }, []);

    const setUserOrg = org => {
        setUserOrgState(org);
        localStorage.setItem("userOrg", JSON.stringify(org));

        if (org) {
            axios.defaults.headers.common["USER_ORG"] = org.id;
            // Reload the whole app
            window.location.reload();
        }
    };

    useEffect(() => {
        getChannelData();
        getCurrentWidthAndHeight();
        // checkLoggedInStatus();
    }, []);

    useEffect(() => {
        if (!isEmpty(channel)) {
            checkLoggedInStatus(channel);
        }
    }, [channel]);

    useEffect(() => {
        // console.log("Current URL : " + location.pathname);
        if (
            moduleFeatures?.length > 0 &&
            (location.pathname || moduleFeatures.length > 0)
        ) {
            // if (location.pathname || moduleFeatures.length > 0 || isTabActive) { // commented to avoid window reload on tab switch
            checkLoggedInStatus(channel, featuresLoaded, moduleFeatures.length);
            // checkIfTabisActive();
        }
    }, [
        channel,
        location.pathname,
        moduleFeatures,
        featuresLoaded,
        // isTabActive,     // commented to avoid window reload on tab switch
    ]);

    useEffect(() => {
        if (isAuthorized && !isEmpty(channel)) {
            getTenantSubscription(channel.subscription);
        }
    }, [isAuthorized, channel]);

    useEffect(() => {
        if (!isEmpty(tenantSubscription) && isAuthorized === true && orgCheck) {
            axios.defaults.headers.common["USER_ORG"] = userOrg?.id;
            getData();
        }
    }, [isAuthorized, tenantSubscription, orgCheck]);

    useEffect(() => {
        addRemoveSideMargin();
    }, [screenView, isAuthorized, brandDetails]);

    useEffect(() => {
        if (featuresSubscription && featuresSubscription.length > 0) {
            let bpmAllowed = checkIfComponentIsAuthorized(
                "PROCESS_ENGINE",
                featuresSubscription,
            );
            if (bpmAllowed && channel.process_engine === "CAMUNDA_EIGHT") {
                ssoMonitor();
            }
        }
    }, [featuresSubscription, channel]);

    useEffect(() => {
        if (moduleFeatures && moduleFeatures.length > 0) {
            setIsLoading(false);
            // setInterval(() => {
            // }, 5000);
        }
    }, [moduleFeatures]);

    useEffect(() => {
        if (isLoaded) {
            // console.log(searchParamsJS.getAll());
            if (window.location.href.includes("embed=true")) {
                setIsEmbeded(true);
            }
            // console.log(searchParamsJS.getAll());
            // if (searchParamsJS.has("embed")) {
            //     setIsEmbeded(true);
            // }
        }
    }, [isLoaded]);

    useEffect(() => {
        if (typeof document !== "undefined" && styles) {
            const style = document.createElement("style");
            style.textContent = styles && unescapeSlashes(styles);
            document.head.appendChild(style);
        }
    }, [styles]);

    const wrapperSetIsAuthorized = val => {
        setIsAuthorized(val);
    };

    const wrapperSetErrorMessage = useCallback(
        val => setErrorMessage(val),
        [setErrorMessage],
    );
    function wrapperSetProfile(val) {
        setProfile(val);
    }

    const wrapperSetIsLoading = useCallback(
        val => setIsLoading(val),
        [setIsLoading],
    );

    function ssoMonitor() {
        let dataRequest = {};
        let authKey = localStorage.getItem("AUTH_KEY");
        axios
            .post(MONITOR_API_URL + "/sso/" + authKey, dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                }
            });
    }

    function applyAppTheme(themeClass) {
        const body = document.getElementsByTagName("body")[0];
        if (body) {
            if (themeClass === "dark") {
                if (body.classList.contains("light")) {
                    body.classList.remove("light");
                }
                body.classList.add("dark");
            } else if (themeClass === "light") {
                if (body.classList.contains("dark")) {
                    body.classList.remove("dark");
                }
                body.classList.add("light");
            }
        }
    }

    function getCurrentWidthAndHeight() {
        const largeQuery = window.matchMedia("(min-width: 992px)");
        const mediumQuery = window.matchMedia("(min-width: 576px)");

        function checkWidth() {
            if (largeQuery.matches) {
                setScreenView("lg");
            } else if (mediumQuery.matches) {
                setScreenView("md");
            } else {
                setScreenView("sm");
            }
        }

        checkWidth();

        largeQuery.addEventListener("change", checkWidth);
        mediumQuery.addEventListener("change", checkWidth);

        return () => {
            largeQuery.removeEventListener("change", checkWidth);
            mediumQuery.removeEventListener("change", checkWidth);
        };
    }

    function checkIfTabisActive() {
        function checkActiveTab() {
            if (document.visibilityState == "visible") {
                // console.log("Tab is active");
                setIsTabActive(true);
            } else {
                // console.log("Tab is inactive");
                setIsTabActive(false);
            }
        }
        checkActiveTab();
        window.addEventListener("visibilitychange", checkActiveTab);
        return () => {
            window.removeEventListener("visibilitychange", checkActiveTab);
        };
    }

    function addRemoveSideMargin() {
        try {
            const mainEle = document.getElementById("main");
            const sideBarEle = document.getElementById("side-navbar");
            const footerEle = document.getElementById("footer");
            const sideNavBarState = localStorage.getItem("SIDE_NAVBAR_STATE");

            function addMargin() {
                if (mainEle) mainEle.classList.remove("remove-margin");
                if (mainEle) mainEle.classList.add("add-margin");
                if (footerEle) footerEle.classList.remove("remove-margin");
                if (footerEle) footerEle.classList.add("add-margin");
            }

            function addMargin60() {
                if (mainEle) mainEle.classList.remove("remove-margin");
                if (mainEle) mainEle.classList.add("add-margin-60");
                if (footerEle) footerEle.classList.remove("remove-margin");
                if (footerEle) footerEle.classList.add("add-margin-60");
            }

            function removeMargin() {
                if (mainEle) mainEle.classList.remove("add-margin");
                if (mainEle) mainEle.classList.add("remove-margin");
                if (footerEle) footerEle.classList.remove("add-margin");
                if (footerEle) footerEle.classList.add("remove-margin");
            }

            if (isAuthorized) {
                if (screenView === "lg") {
                    const site_preference = tryToParse(
                        brandDetails?.site_preference,
                    );
                    const menu_position = site_preference
                        ? site_preference.menu_position
                        : "";
                    if (
                        typeof menu_position === "string"
                            ? menu_position.includes("header")
                            : menu_position === "header"
                    ) {
                        removeMargin();
                    }

                    if (
                        typeof menu_position === "string"
                            ? menu_position.includes("body-left")
                            : menu_position === "body-left"
                    ) {
                        if (sideNavBarState && sideNavBarState === MENU.HOVER) {
                            addMargin60();
                        } else {
                            addMargin();
                        }
                    }

                    if (
                        mainEle &&
                        mainEle.classList.contains("remove-margin")
                    ) {
                        if (sideBarEle) {
                            sideBarEle.classList.add("visually-hidden");
                        }
                        footerEle?.classList.add("remove-margin");
                    }
                }

                if (mainEle && mainEle.classList.contains("add-margin")) {
                    if (
                        sideBarEle &&
                        sideBarEle.classList.contains("visually-hidden")
                    )
                        sideBarEle.classList.remove("visually-hidden");
                }

                if (screenView === "sm" || screenView === "md") {
                    removeMargin();
                }
            } else {
                if (
                    sideBarEle &&
                    !sideBarEle.classList.contains("visually-hidden")
                ) {
                    sideBarEle.classList.add("visually-hidden");
                }
                removeMargin();
            }
        } catch (error) {
            console.log(error);
        }
    }

    // `features = null` this func runs on every route and before/after data fetch
    // app route is preserved before/after data fetch but if features length is zero
    // preserved route is discarded and app is redirected to /welcome
    function checkLoggedInStatus(
        channel,
        isLoaded = false,
        featuresLength = null,
    ) {
        const { pathname, search } = location;

        const authKeyLocalStorage = localStorage.getItem("AUTH_KEY");
        const authKeyURL = searchParams.get("AUTH_KEY");

        const redirectTo = localStorage.getItem("redirect_on_logout"); //
        const initialRouteLS = localStorage.getItem("initial_route");

        const authKey = authKeyLocalStorage
            ? authKeyLocalStorage
            : authKeyURL
              ? authKeyURL
              : null;

        // if authKey exists
        if (authKey !== undefined && authKey !== null && authKey !== "") {
            setIsAuthorized(true);
            if (
                pathname !== "/" &&
                pathname !== "/login" &&
                pathname !== "/subscription" &&
                pathname !== "/register" &&
                pathname !== "/forget" &&
                !pathname.includes("/sociallogin")
            ) {
                if (isLoaded && featuresLength === 0) {
                    navigate(initialRouteLS);
                } else {
                    let pathWithParams = `${pathname}${search}`;
                    navigate(pathWithParams);
                }
            } else {
                if (initialRouteLS) {
                    navigate(initialRouteLS);
                } else {
                    navigate(
                        channel?.home_page && channel.home_page !== ""
                            ? channel.home_page
                            : "/welcome",
                    );
                }
            }
            axios.defaults.headers.common["AUTH_KEY"] = authKey;
            localStorage.setItem("AUTH_KEY", authKey);
            // if (!isAuthorized) setIsAuthorized(true);
        } else {
            // if authKey null
            if (pathname.includes("/register")) {
                localStorage.removeItem("SHOW_SESSION_TIMEOUT");
                navigate(pathname);
                setRedirectToRegister(false);
            } else if (pathname.includes("/forget")) {
                localStorage.removeItem("SHOW_SESSION_TIMEOUT");
                navigate(pathname);
                setRedirectToRegister(false);
            } else if (pathname.includes("/subscription")) {
                localStorage.removeItem("SHOW_SESSION_TIMEOUT");
                navigate(pathname);
                setRedirectToRegister(false);
            } else if (pathname.includes("/login")) {
                if (redirectToRegister && redirectTo) {
                    navigate(redirectTo);
                } else {
                    setRedirectToRegister(false);
                    navigate("/login");
                }
            } else {
                if (!isEmpty(channel)) {
                    const details = getCookie("user");
                    if (
                        details &&
                        !isArray(appModules) &&
                        !isArray(moduleFeatures)
                    ) {
                        const dec = decryptData(details);
                        loginUser(dec, setProfile);
                        getTenantSubscription(channel.subscription);
                    } else if (channel.guest_login === "YES") {
                        loginAsGuest();
                    } else {
                        setRedirectToRegister(false);
                        navigate("/login");
                    }
                } else {
                    setRedirectToRegister(false);
                    navigate("/login");
                }
            }

            setIsAuthorized(false);
        }
    }
    function isArray(arr) {
        const bool = Array.isArray(arr);
        const boolean = bool ? arr.length > 0 : false;
        return boolean;
    }

    function handleLogout(path = "login") {
        const showBanner = localStorage.getItem("SHOW_SESSION_TIMEOUT") || "NO";

        if (showBanner == "NO") {
            deleteCookie("user");
            deleteCookie("keep_me_login");
        }
        if (path == "/register") {
            setRedirectToRegister(true);
        } else {
            setRedirectToRegister(false);
        }
        setAppModules([]);
        setModuleFeatures([]);
        setProfile({});
        const mainEle = document.getElementById("main");
        const sideBarEle = document.getElementById("side-navbar");
        const footerEle = document.getElementById("footer");

        function removeMargin(params) {
            try {
                if (mainEle && mainEle.classList.contains("add-margin")) {
                    mainEle.classList.remove("add-margin");
                    mainEle.classList.add("remove-margin");
                }

                if (footerEle && footerEle.classList.contains("add-margin")) {
                    footerEle.classList.remove("add-margin");
                    footerEle.classList.add("remove-margin");
                }

                if (sideBarEle) {
                    sideBarEle.classList.add("visually-hidden");
                }
            } catch (error) {
                console.error(error);
            }
        }
        removeMargin();
        logout(path);
        // checkLoggedInStatus();
    }

    function logout(path) {
        getChannelData(); // fetching channel details to updated login content
        SSOLogout();
        localStorage.removeItem("AUTH_KEY");
        localStorage.removeItem("page.component");
        localStorage.removeItem("page.column");
        localStorage.removeItem("page.row");
        localStorage.removeItem("form.component");
        localStorage.removeItem("form.column");
        localStorage.removeItem("form.row");
        localStorage.removeItem("initial_route");
        localStorage.removeItem("selectedChannelId");
        setInitialRoute("/welcome");

        delete axios.defaults.headers.common["AUTH_KEY"];
        delete axios.defaults.headers.common["USER_ORG"];
        setIsAuthorized(false);
        setIsLoading(false);
        setIsLoaded(false);
        navigate(path);
    }

    function getInitialRoute(features) {
        let route =
            channel?.home_page && channel.home_page !== ""
                ? channel.home_page
                : "/welcome";
        features.every(element => {
            if (element.type === "PAGE") {
                if (element.slug) {
                    route = `/page/${element.slug}`;
                } else {
                    route = `/page:id=${element.id}`;
                }
                return false;
            } else if (element.type === "INTERNAL_LINK") {
                route = `${element.feature_key}`;
                return false;
            } else {
                return true;
            }
        });
        return route;
    }

    // API calls

    // axios abort requests in qeue
    // function newAbortSignal() {
    //     const abortController = new AbortController();
    //     abortController.abort();
    //     return abortController.signal;
    // }

    const handleGetAuthorizedFeatures = (userGroups, userProfile) => {
        let authorizedFeatures = getAuthorizedFeatures(
            staticAdminModuleFeatures,
            featuresSubscription,
            userGroups,
            userProfile,
        );

        return authorizedFeatures;
    };

    axios.interceptors.request.use(
        function (config) {
            // console.log(config);
            $(".loader-line").fadeIn();

            return config;
        },
        function (error) {
            $(".loader-line").fadeOut();
            return Promise.reject(error);
        },
    );

    axios.interceptors.response.use(
        function (response) {
            $(".loader-line").fadeOut();
            if (!response) {
                console.log(response, "undefined request");
                return;
            }
            if (response.status >= 500 && response.status <= 599) {
                localStorage.removeItem("AUTH_KEY");
                localStorage.setItem("SHOW_SESSION_TIMEOUT", "YES");

                handleLogout("/login");
                return Promise.reject("Server is offline.");
            } else if (response.data.C_STATUS === "UNAUTHORIZED") {
                console.log(
                    `UNAUTHORIZED removing previous AUTH_KEY from Local Storage`,
                );
                const details = getCookie("user");
                const userGroups = localStorage.getItem("user_groups") || "";
                const guestLogin = localStorage.getItem("guest_login") || "";
                if (userGroups.includes("GUEST") && guestLogin === "YES") {
                    localStorage.removeItem("AUTH_KEY");
                    loginAsGuest();
                } else if (channel.keep_me_login === "YES" && details) {
                    const dec = decryptData(details);
                    login(dec);
                } else {
                    localStorage.removeItem("AUTH_KEY");
                    localStorage.setItem("SHOW_SESSION_TIMEOUT", "YES");

                    handleLogout("/login");
                    return Promise.reject(
                        "You have been logged out, please login again.",
                    );
                }
            } else {
                return response;
            }
        },
        function (error) {
            $(".loader-line").fadeOut();

            console.log(error);
            return Promise.reject(error);
        },
    );

    function login(userDetails) {
        localStorage.removeItem("SHOW_SESSION_TIMEOUT");

        if (keepMeLogin === "YES" || checkCookie()) {
            const value = encryptData(userDetails);
            setCookie("user", value, 1);
        }

        let resMessage = "";
        setIsLoading(true);

        axios
            .post(AUTH_URL + "?service.key=login", userDetails)
            .then(response => {
                resMessage = response.data.C_MESSAGE;
                let status = response.data.C_STATUS;

                if (status === "FAIL") {
                    // handleErrorMessage("Invalid password");
                    toastEmitter("Invalid password", true, "error");
                    setIsLoading(false);

                    return;
                }

                if (status === "SUCCESS") {
                    if (response.data.C_DATA.AUTH_KEY) {
                        let authKey = response.data.C_DATA.AUTH_KEY;
                        axios.defaults.headers.common["AUTH_KEY"] = authKey;
                        localStorage.setItem("AUTH_KEY", authKey);
                        localStorage.removeItem("redirect_on_logout");
                        setLoading(true);
                        setIsAuthorized(true);
                        handleErrorMessage("");
                        setUsernameIsValid(false);
                        setUserDetails(initialState);
                        addRemoveSideMargin();
                    } else {
                        handleErrorMessage(
                            "Unable to get authorization key. Please try again",
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
                // userDetails.password = _userDetails.password;
                setIsLoading(false);
                handleLogout();
                // handleErrorMessage(error.message);
                // setMessage(resMessage);
            });
    }

    function SSOLogout() {
        let authKey = localStorage.getItem("AUTH_KEY");
        if (authKey) {
            axios
                .post(API_URL + "?service.key=logout")
                .then(response => {})
                .catch(error => {
                    console.error(error);
                });
        }
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: channel.id,
                    dataKey: "appModule",
                    serviceKey: "sys.menu",
                    mode: "formData",
                },
                {
                    serviceParams: channel.id,
                    dataKey: "moduleFeature",
                    serviceKey: "sys.link",
                    mode: "formData",
                },

                {
                    serviceParams: "",
                    dataKey: "profile",
                    serviceKey: "sys.user.profile",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "userGroups",
                    serviceKey: "sys.user.groups",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "userOrgList",
                    serviceKey: "sys.user.org.list",
                    mode: "formData",
                },
                {
                    serviceParams: channel.id,
                    dataKey: "pages",
                    serviceKey: "sys.pages",
                    mode: "formData",
                },
            ],
        };
        if (channel.styles) {
            dataRequest.dataKeys.push({
                serviceParams: channel.styles,
                dataKey: "cssStyles",
                serviceKey: "sys.get.styles",
                mode: "formData",
            });
        }
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    let data = response.data.C_DATA;
                    let loginUserGroup = data.userGroups[0].groupid;
                    let loginUserProfile = data.profile[0];
                    let userOrgList = data.userOrgList || [];
                    setUserOrgList(userOrgList);

                    let mergedModules = [
                        ...data.appModule,
                        ...staticAdminModules,
                    ];

                    const authorizedAdminModuleFeatures =
                        handleGetAuthorizedFeatures(
                            loginUserGroup,
                            loginUserProfile,
                        );

                    let mergedFeatures = [
                        ...data.moduleFeature,
                        ...authorizedAdminModuleFeatures,
                    ];

                    setAppModules(
                        loginUserGroup.includes("ADMIN")
                            ? mergedModules
                            : data.appModule,
                    );
                    setModuleFeatures(
                        loginUserGroup.includes("ADMIN")
                            ? mergedFeatures
                            : data.moduleFeature,
                    );
                    setFeaturesLoaded(true);
                    let initailRoute = "";

                    if (data.moduleFeature.length === 0) {
                        initailRoute = "/welcome";
                    } else {
                        initailRoute =
                            channel?.home_page && channel.home_page !== ""
                                ? channel.home_page
                                : getInitialRoute(mergedFeatures);
                    }

                    setInitialRoute(initailRoute);
                    let userGroupsStr = JSON.stringify(data.userGroups[0]);
                    localStorage.setItem("initial_route", initailRoute);
                    if (loginUserGroup.includes("GUEST")) {
                        localStorage.setItem("user_groups", loginUserGroup);
                    } else {
                        localStorage.removeItem("user_groups");
                    }

                    setProfile(data.profile[0]);
                    setUserGroups(data.userGroups[0]);

                    setPages(response.data.C_DATA.pages);
                    try {
                        if (response.data.C_DATA?.cssStyles.length > 0) {
                            setStyles(
                                response.data.C_DATA.cssStyles[0]?.css_styles,
                            );
                        } else {
                            setStyles(undefined);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                    // setBrandDetials(data.channel[0]);
                    // setThemeColor(data.channel[0]);
                    setFrontOfficeItems(
                        classifyNavBarItems(mergedModules, mergedFeatures),
                    );
                    setTimeout(() => {}, 200);
                    setIsLoaded(true);

                    // setIsAuthorized(true);
                } else {
                    setErrorMessage(
                        "Unable to get data. Please contact system admin.",
                    );
                }
            })
            .catch(error => {
                setErrorMessage(error);
            });
    }

    function getTenantSubscription(subscription) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: subscription,
                    dataKey: "tenantSubscription",
                    serviceKey: "sys.tenant.subscription",
                    mode: "formData",
                },
                {
                    serviceParams: subscription,
                    dataKey: "featuresSubscription",
                    serviceKey: "tenant.subscription.features",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=master.data", dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    let data = response.data.C_DATA;
                    if (data.tenantSubscription) {
                        setTenantSubscription(data.tenantSubscription[0]);
                    } else {
                        console.log("Unable to fetch Tenant Subscription");
                    }
                    if (data.featuresSubscription) {
                        let featuresSubscription = data.featuresSubscription;
                        let featuresSubscriptionCodes =
                            featuresSubscription.map(ps => ps.code);
                        setFeaturesSubscription(featuresSubscriptionCodes);
                    } else {
                        setFeaturesSubscription([]);
                        console.log("Unable to fetch Features Subscription");
                    }
                    setIsLoaded(true);
                } else {
                    setErrorMessage(
                        "Unable to get data. Please contact system admin.",
                    );
                }
            })
            .catch(error => {
                setErrorMessage(error);
            });
    }

    async function getChannelData() {
        localStorage.removeItem("SHOW_SESSION_TIMEOUT");
        const response = await axios.post(
            `${API_URL}?service.key=sys.subscription.site`,
        );
        try {
            if (response.data.C_STATUS == "SUCCESS") {
                if (response.data.C_DATA) {
                    let channel = {};
                    let themeClass = "light";

                    channel = response.data.C_DATA[0];

                    if (channel.site_preference) {
                        try {
                            channel.site_preference = JSON.parse(
                                channel.site_preference,
                            );
                        } catch (e) {}
                        // based on COLOR_PALLETE id
                        if (channel.site_preference.color_palette === "1") {
                            themeClass = "dark";
                        } else {
                            themeClass = "light";
                        }
                    }

                    if (
                        channel.menu_position === undefined ||
                        channel.menu_position === "header"
                    ) {
                        localStorage.removeItem("SIDE_NAVBAR_STATE");
                    }

                    setChannel(channel);
                    if (channel.guest_login === "YES") {
                        localStorage.setItem(
                            "guest_login",
                            channel.guest_login,
                        );
                    } else {
                        localStorage.removeItem("guest_login");
                    }
                    setBrandDetials(channel);
                    setThemeColor(channel);
                    applyAppTheme(themeClass);

                    // TODO : refactor this checkGuestLoginStatus() only works for login screen
                    // checkGuestLoginStatus(channel);
                    // checkLoggedInStatus(channel, false, null);
                }
            }
        } catch (error) {
            console.log("Failed to fetch Channel Details");
            console.log(error);
        }
    }

    async function loginAsGuest() {
        try {
            const response = await axios.post(
                AUTH_URL + "?service.key=guest.login",
            );

            if (response.data.C_STATUS === "FAIL") {
                console.log(response.data.C_MESSAGE);
                setIsLoading(false);
                handleLogout("/login");
            }

            if (response.data.C_STATUS === "SUCCESS") {
                let authKey = response.data.AUTH_KEY;
                axios.defaults.headers.common["AUTH_KEY"] = authKey;
                localStorage.setItem("AUTH_KEY", authKey);
                localStorage.removeItem("redirect_on_logout");
                addRemoveSideMargin();
                setIsAuthorized(true);
                setErrorMessage("");
                getChannelData();
            } else {
                setIsLoading(false);
                return;
            }
        } catch (error) {
            setIsLoading(false);
            handleLogout("/login");
            setErrorMessage(error.message);
            console.log(error);
        }
    }

    // utils

    function classifyNavBarItems(modules, features) {
        let frontOffice = [];
        modules.map(module => {
            if (module.location === "FRONTOFFICE") {
                features.map(feature => {
                    if (module.id === feature.module) {
                        frontOffice.push(feature);
                    }
                });
            }
        });
        return frontOffice;
    }

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return (
        <ErrorBoundary>
            <div className={`s2a-layout ${isEmbeded ? "embeded" : ""}`}>
                <ContainerToast />
                <main className="s2a-main s2a-shell-main">
                    {(tenantSubscription?.id || !isAuthorized) && (
                        <AppContext.Provider
                            value={{
                                profile,
                                userGroups,
                                userOrgList,
                                userOrg,
                                setUserOrg,
                                frontOfficeItems,
                                brandDetails,
                                isAuthorized,
                                screenView,
                                channel,
                                tenantSubscription,
                                handleLogout,
                                wrapperSetProfile,
                                appModules,
                                moduleFeatures,
                                pages,
                                featuresSubscription,
                                office,
                                setOffice,
                                styles,
                                authKey,
                            }}>
                            {isEmbeded ? (
                                <AppRoutes
                                    wrapperSetIsAuthorized={
                                        wrapperSetIsAuthorized
                                    }
                                    isLoaded={isLoaded}
                                    initailRoute={initailRoute}
                                    isLoading={isLoading}
                                    wrapperSetIsLoading={wrapperSetIsLoading}
                                    errorMessage={errorMessage}
                                    wrapperSetErrorMessage={
                                        wrapperSetErrorMessage
                                    }
                                    isEmbeded={isEmbeded}
                                    channel={channel}
                                />
                            ) : (
                                <>
                                    <Layout />
                                    <div
                                        id="page"
                                        className={`s2a-page`}>
                                        <main
                                            id="main"
                                            className="s2a-main">
                                            {isAuthorized && <Breadcrumb />}
                                            <AppRoutes
                                                wrapperSetIsAuthorized={
                                                    wrapperSetIsAuthorized
                                                }
                                                isLoaded={isLoaded}
                                                initailRoute={initailRoute}
                                                isLoading={isLoading}
                                                wrapperSetIsLoading={
                                                    wrapperSetIsLoading
                                                }
                                                errorMessage={errorMessage}
                                                wrapperSetErrorMessage={
                                                    wrapperSetErrorMessage
                                                }
                                                channel={channel}
                                            />
                                        </main>
                                        {isAuthorized && (
                                            <footer
                                                id="footer"
                                                className="s2a-footer">
                                                <Footer />
                                            </footer>
                                        )}
                                    </div>
                                    {/* <CookieConsent
                                    location="bottom"
                                    buttonText="I understand"
                                    cookieName="myAwesomeCookieName2"
                                    style={{ background: "#2B373B" }}
                                    buttonStyle={{
                                        color: "#4e503b",
                                        fontSize: "13px",
                                    }}
                                    expires={150}>
                                    This website uses cookies to enhance the
                                    user experience.{" "}
                                </CookieConsent> */}
                                </>
                            )}
                        </AppContext.Provider>
                    )}
                </main>
            </div>
        </ErrorBoundary>
    );
}

export default S2aApp;
