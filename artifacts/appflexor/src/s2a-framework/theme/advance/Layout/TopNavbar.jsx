import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { tryToParse } from "../../../modules/data-management/form-builder/Forms/FormViewer/utils";
import Avatar from "./Avatar";
import BrandLogo from "./BrandLogo";
import RightMenu from "./RightMenu";
import "./styles.css";

function TopNavbar({
    isAuthorized,
    modules,
    features,
    screenView,
    mainItems,
    mainBackOfficeItems,
    brandDetails,
    setToggleMiniNavbar,
    toggleMiniNavbar,
    MENU,
}) {
    const appContext = useContext(AppContext);
    const { setOffice } = appContext;
    const { userOrgList, userOrg, setUserOrg } = appContext;

    const [toggleTopSubMenu, setToggleTopSubMenu] = useState(false);

    const [topNavbarHeight, setTopNavbarHeight] = useState(0);

    const [userProfile, setUserProfile] = useState(appContext.profile);
    const topNavbar = useRef(null);
    const subNavbar = useRef(null);
    const [width, setWidth] = useState("desktop");
    const site_preference = tryToParse(appContext.channel?.site_preference);
    const menu_position =
        site_preference && site_preference?.menu_position
            ? site_preference?.menu_position
            : "below-header";

    const [showOrgMenu, setShowOrgMenu] = useState(false);

    const orgMenuRef = useRef(null);
    const [menuAnimation, setMenuAnimation] = useState(false);

    const [isLight, setIsLight] = useState(
        localStorage.getItem("theme") === "light",
    );

    // Apply theme class to body whenever state changes
    useEffect(() => {
        const body = document.body;
        if (isLight) {
            body.classList.remove("dark");
            body.classList.add("light");
        } else {
            body.classList.remove("light");
            body.classList.add("dark");
        }
    }, [isLight]);

    const handleThemeToggle = () => {
        setIsLight(prev => {
            const newTheme = !prev;
            localStorage.setItem("theme", newTheme ? "light" : "dark");
            return newTheme;
        });
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                orgMenuRef.current &&
                !orgMenuRef.current.contains(event.target)
            ) {
                setShowOrgMenu(false);
            }
        }

        function handleEsc(event) {
            if (event.key === "Escape") setShowOrgMenu(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    // Trigger animation when opening
    useEffect(() => {
        if (showOrgMenu) {
            setMenuAnimation(true);
            setTimeout(() => setMenuAnimation(false), 200);
        }
    }, [showOrgMenu]);

    useEffect(() => {
        getCurrentWidthAndHeight();
    }, []);

    useEffect(() => {
        setTopMarginToNavigation();
    }, [screenView, toggleTopSubMenu, toggleMiniNavbar]);

    useEffect(() => {
        if (!topNavbarHeight) return;
        if (topNavbarHeight > 0) {
            setTimeout(() => {
                const el = document.getElementById("sideNavbarMobile");
                const el2 = document.getElementById("side-navbar");

                if (el) {
                    el.style.marginTop = `${topNavbarHeight}px`;
                }

                if (el2 && screenView === "lg") {
                    el2.style.marginTop = `${topNavbarHeight}px`;
                }
            }, 50);
        }
    }, [topNavbarHeight, screenView]);

    function getCurrentWidthAndHeight() {
        let navbarHeigth;

        function checkHeight() {
            try {
                if (window.scrollY > 50) {
                    let _mainNavbar = document.getElementById("navbar-main");
                    if (_mainNavbar) _mainNavbar.classList.add("fixed-top");
                    navbarHeigth =
                        document.querySelector("#navbar-main").offsetHeight;
                    document.body.style.paddingTop = navbarHeigth + "px";
                } else {
                    let _mainNavbar = document.getElementById("navbar-main");
                    if (_mainNavbar) _mainNavbar.classList.remove("fixed-top");
                    document.body.style.paddingTop = "0";
                }
            } catch (e) {}
        }

        const desktopQuery = window.matchMedia("(min-width: 992px)");

        function checkWidth(event = desktopQuery) {
            setWidth(event.matches ? "desktop" : "mobile");
        }

        checkWidth(desktopQuery);

        window.addEventListener("scroll", checkHeight);
        desktopQuery.addEventListener("change", checkWidth);

        return () => {
            desktopQuery.removeEventListener("change", checkWidth);
            window.removeEventListener("scroll", checkHeight);
        };
    }

    function handleToggleMiniNavbar() {
        let prevState = toggleMiniNavbar;
        let newState;

        if (MENU[prevState] === MENU.HOVER) {
            newState = MENU.FIXED;
        } else {
            newState = MENU.HOVER;
        }

        const mainEle = document.getElementById("main");
        const footerEle = document.getElementById("footer");

        mainEle.style.transition = "all 0.2s ease";
        mainEle.style.transitionProperty = "all";
        mainEle.style.transitionDuration = "0.2s";
        mainEle.style.transitionTimingFunction = "ease";
        mainEle.style.transitionDelay = "0s";

        if (newState === MENU.HOVER) {
            addMargin();
        } else {
            addExtraMargin();
        }

        function addMargin() {
            if (mainEle) mainEle.classList.remove("add-margin");
            if (mainEle) mainEle.classList.add("add-margin-60");

            if (footerEle) footerEle.classList.remove("add-margin");
            if (footerEle) footerEle.classList.add("add-margin-60");
        }

        function addExtraMargin() {
            if (mainEle) mainEle.classList.remove("add-margin-60");
            if (mainEle) mainEle.classList.add("add-margin");

            if (footerEle) footerEle.classList.remove("add-margin-60");
            if (footerEle) footerEle.classList.add("add-margin");
        }

        setToggleMiniNavbar(newState);
        localStorage.setItem("SIDE_NAVBAR_STATE", newState);
    }

    function setTopMarginToNavigation() {
        let topHeight = 0;
        let subHeight = 0;
        if (topNavbar && topNavbar !== null) {
            const { height } = topNavbar.current.getBoundingClientRect();
            topHeight = +height;
        }

        if (subNavbar && subNavbar !== null) {
            const subNavbarData = subNavbar?.current?.getBoundingClientRect();
            if (subNavbarData && subNavbarData.height) {
                subHeight = +subNavbarData.height;
            }
        }

        let totalHeight = Math.floor(topHeight + subHeight);
        setTopNavbarHeight(totalHeight);
    }

    function handleLogin() {
        localStorage.removeItem("user_groups");
        appContext.handleLogout("/login");
    }
    function handleSignup() {
        localStorage.removeItem("user_groups");
        localStorage.setItem("redirect_on_logout", "/register");
        appContext.handleLogout("/register");
    }
    return (
        <React.Fragment>
            <nav
                id="top-adv-navbar"
                ref={topNavbar}
                className={`adv-navbar-main navbar navbar-border py-0 ${menu_position} ${
                    (menu_position === "inside-header" ||
                        menu_position === "body-left") &&
                    screenView === "lg"
                        ? "sticky-top enable-sticky"
                        : "disable-sticky"
                }`}>
                <div className="w-100">
                    <div
                        className={`${
                            screenView === "lg" && menu_position === "header"
                                ? "container"
                                : "container-fluid ps-0"
                        }`}>
                        <div
                            className={` d-flex ${
                                appContext.isAuthorized
                                    ? "justify-content-between"
                                    : "justify-content-start"
                            } `}>
                            {appContext.isAuthorized && screenView !== "lg" && (
                                <div className=" d-flex justify-content-start align-items-center pointer">
                                    <div
                                        data-bs-toggle="offcanvas"
                                        data-bs-target="#sideNavbarMobile">
                                        <i className="m-2 fa-solid fa-bars-staggered pointer"></i>
                                    </div>
                                </div>
                            )}
                            {toggleMiniNavbar === MENU.FIXED ? (
                                <>
                                    <BrandLogo />
                                    {screenView === "lg" &&
                                        menu_position == "inside-header" && (
                                            <div className="navbar-inside-header s2a-scrollable sticky-top">
                                                <HorizontalNavigation
                                                    mainItems={mainItems}
                                                    modules={modules}
                                                    features={features}
                                                    screenView={screenView}
                                                    setOffice={setOffice}
                                                />
                                            </div>
                                        )}
                                </>
                            ) : (
                                <>
                                    {screenView === "lg" ? (
                                        <EmptySpace />
                                    ) : (
                                        <BrandLogo />
                                    )}
                                </>
                            )}
                            {screenView === "lg" &&
                                isAuthorized &&
                                menu_position === "body-left" && (
                                    <div className="w-100 d-flex justify-content-start align-items-center pointer">
                                        <div
                                            className="top-navbar-icon pointer"
                                            onClick={handleToggleMiniNavbar}>
                                            <i className="fa-solid fa-align-left m-0"></i>
                                        </div>
                                    </div>
                                )}
                            {appContext.isAuthorized &&
                                appContext.userGroups &&
                                appContext.userGroups.groupid && (
                                    <div className="d-flex justify-content-end align-items-center me-1">
                                        <React.Fragment>
                                            {/* {JSON.stringify(appContext?.channel?.show_org_context)} */}
                                            {/* Organization Dropdown */}
                                            {appContext?.channel
                                                ?.show_org_context === "YES" &&
                                                userOrgList &&
                                                userOrgList.length > 0 && (
                                                    <div
                                                        className="position-relative"
                                                        ref={orgMenuRef}>
                                                        <div
                                                            className="d-flex align-items-center"
                                                            style={{
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                                setShowOrgMenu(
                                                                    prev =>
                                                                        !prev,
                                                                )
                                                            }>
                                                            
                                                            <span className="org-name me-2" title="Orgainzation">
                                                                <i class="fa-solid fa-building"></i> {userOrg?.name ||
                                                                    "Select Organization"}
                                                            </span>

                                                            {/* <i
                                                                className="fa-solid fa-ellipsis-vertical"
                                                                style={{
                                                                    fontSize:
                                                                        "20px",
                                                                }}></i> */}
                                                        </div>

                                                        {showOrgMenu && (
                                                            <ul
                                                                className={`org-menu list-group position-fixed mt-2 ${
                                                                    menuAnimation
                                                                        ? "org-menu-enter org-menu-enter-active"
                                                                        : ""
                                                                }`}
                                                                style={{
                                                                    zIndex: 9999,
                                                                    width: "220px",
                                                                    maxHeight:
                                                                        "260px",
                                                                    overflowY:
                                                                        "auto",
                                                                }}>
                                                                {/* Default Option */}
                                                                <li
                                                                    className={`org-name list-group-item list-group-item-action ${
                                                                        !userOrg
                                                                            ? "active"
                                                                            : ""
                                                                    }`}
                                                                    style={{
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() => {
                                                                        setUserOrg(
                                                                            null,
                                                                        );
                                                                        localStorage.removeItem(
                                                                            "userOrg",
                                                                        );
                                                                        setShowOrgMenu(
                                                                            false,
                                                                        );
                                                                        window.location.reload();
                                                                    }}>
                                                                    Select
                                                                    Organization
                                                                </li>

                                                                {/* Actual Orgs */}
                                                                {userOrgList.map(
                                                                    org => (
                                                                        <li
                                                                            key={
                                                                                org.id
                                                                            }
                                                                            className={`list-group-item list-group-item-action ${
                                                                                userOrg?.id ===
                                                                                org.id
                                                                                    ? "active"
                                                                                    : ""
                                                                            }`}
                                                                            style={{
                                                                                cursor: "pointer",
                                                                            }}
                                                                            onClick={() => {
                                                                                setUserOrg(
                                                                                    org,
                                                                                );
                                                                                localStorage.setItem(
                                                                                    "userOrg",
                                                                                    JSON.stringify(
                                                                                        org,
                                                                                    ),
                                                                                );
                                                                                setShowOrgMenu(
                                                                                    false,
                                                                                );
                                                                                window.location.reload();
                                                                            }}>
                                                                            {
                                                                                org.name
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}

                                            <button
                                                id="themeToggle"
                                                className="btn btn-sm btn-outline-secondary"
                                                title="Toggle theme"
                                                onClick={handleThemeToggle}>
                                                <i
                                                    className={`bi ${isLight ? "bi-moon" : "bi-sun"}`}></i>
                                            </button>

                                            {appContext.userGroups &&
                                                appContext.userGroups.groupid &&
                                                appContext.userGroups.groupid.indexOf(
                                                    "ADMIN",
                                                ) > -1 && (
                                                    <div
                                                        title="Control Panel"
                                                        className="top-navbar-icon pointer"
                                                        data-bs-toggle="offcanvas"
                                                        data-bs-target="#rightMenu">
                                                        <i className="fa fa-gear m-0"></i>
                                                    </div>
                                                )}
                                            {appContext.userGroups &&
                                            appContext.userGroups.groupid &&
                                            appContext.userGroups.groupid.indexOf(
                                                "GUEST",
                                            ) > -1 ? (
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={handleLogin}
                                                        className="btn btn-link login-btn">
                                                        Login
                                                    </button>
                                                    {appContext?.channel
                                                        ?.allow_signup ===
                                                        "YES" && (
                                                        // <a
                                                        //     onClick={
                                                        //         handleSignup
                                                        //     }
                                                        //     className="guest-signup-btn">
                                                        //     Sign up
                                                        // </a>
                                                        <button
                                                            onClick={
                                                                handleSignup
                                                            }
                                                            type="button"
                                                            className="btn btn-link signup-btn">
                                                            Sign up
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <Avatar
                                                    screenView={screenView}
                                                />
                                            )}
                                        </React.Fragment>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* {appContext.isAuthorized && screenView !== "lg" && (
                        <div
                            className={`sub-navbar-border ${
                                toggleTopSubMenu ? "d-block" : "d-none"
                            }  w-100`}>
                            <div className="d-flex justify-content-end">
                                <div className="m-2 align-items-center">                                    
                                    <div>
                                        <Avatar screenView={screenView} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )} */}
                </div>
            </nav>

            {appContext.isAuthorized &&
                screenView === "lg" &&
                menu_position === "below-header" && (
                    <div className="sticky-top">
                        <nav
                            id="top-adv-sub-navbar"
                            ref={subNavbar}
                            className="adv-navbar-navigation navbar ">
                            <HorizontalNavigation
                                mainItems={mainItems}
                                modules={modules}
                                features={features}
                                screenView={screenView}
                                setOffice={setOffice}
                            />
                        </nav>
                        <div className="loader-line"></div>
                        <RightMenu
                            isAuthorized={isAuthorized}
                            modules={modules}
                            features={features}
                            screenView={screenView}
                            mainItems={mainItems}
                            brandDetails={brandDetails}
                        />
                    </div>
                )}
            {(menu_position === "inside-header" ||
                menu_position === "body-left") && (
                <>
                    <div className="loader-line"></div>

                    <RightMenu
                        isAuthorized={isAuthorized}
                        modules={modules}
                        features={features}
                        screenView={screenView}
                        mainItems={mainItems}
                        brandDetails={brandDetails}
                    />
                </>
            )}
        </React.Fragment>
    );
}

const HorizontalNavigation = ({
    mainItems,
    modules,
    features,
    screenView,
    setOffice,
}) => {
    return (
        <div className="d-flex justify-content-around align-items-center w-100">
            <ul className="container navbar-nav d-flex flex-row">
                {mainItems.map(item => {
                    if (
                        item.type === "IFRAME" ||
                        item.type === "INTERNAL_LINK" ||
                        item.type === "PAGE"
                    ) {
                        let path = "";

                        if (item.type === "IFRAME") {
                            path = `/iframe:id=${item.id}`;
                        } else if (item.type === "PAGE") {
                            if (item.slug) {
                                path = `/page/${item.slug}`;
                            } else {
                                path = `/page:id=${item.id}`;
                            }
                        } else {
                            path = `${item.feature_key}`;
                        }

                        return (
                            <li
                                key={item.id}
                                onClick={() => setOffice("front")}
                                className="nav-item-custom ">
                                <NavLink
                                    className="nav-link nav-link-override nav-link-main"
                                    to={path}>
                                    <div
                                        className={`d-inline-flex justify-content-center align-items-center`}>
                                        {item.icon && item.icon !== "" && (
                                            <i
                                                className={`${item.icon} horizontal-nav-icons`}></i>
                                        )}
                                        <span className="horizontal-nav-labels">
                                            {item.name}
                                        </span>
                                    </div>
                                </NavLink>
                            </li>
                        );
                    } else if (item.type === "EXTERNAL_LINK") {
                        return (
                            <li
                                key={item.id}
                                className="nav-item-custom ">
                                <a
                                    className="nav-link nav-link-override nav-link-main"
                                    href={item.feature_key}>
                                    <span className={``}>
                                        <i className={`${item.icon} me-1`}></i>
                                        {item.name}
                                    </span>
                                </a>
                            </li>
                        );
                    } else if (item.type === "HYPER_LINK") {
                        return (
                            <li
                                key={item.id}
                                className="nav-item-custom ">
                                <a
                                    className="nav-link nav-link-override nav-link-main"
                                    href={`#${item.target_id}`}>
                                    <span className={``}>
                                        <i className={`${item.icon} me-1`}></i>
                                        {item.name}
                                    </span>
                                </a>
                            </li>
                        );
                    }
                })}
                {modules &&
                    modules.map(module => {
                        return (
                            <SubMenuMain
                                key={module.id}
                                screenView={screenView}
                                features={features}
                                module={module}
                            />
                        );
                    })}
            </ul>
        </div>
    );
};

function SubMenuMain({ screenView, module, features }) {
    let subMenuRef = useRef(null);

    function openSubMenu() {
        let classes = subMenuRef.current.className;
        if (!classes.includes("show")) {
            subMenuRef.current.className = classes + " show";
            subMenuRef.current.setAttribute("data-bs-popper", "static");
        }
    }

    function closeSubMenu() {
        let classes = subMenuRef.current.className;

        if (classes.includes("show")) {
            let newClasses = classes.replaceAll("show", "");
            subMenuRef.current.className = newClasses.trim();
            subMenuRef.current.removeAttribute("data-bs-popper");
        }
    }

    if (module.location === "FRONTOFFICE" && module.type === "DROPDOWN") {
        return (
            <li
                onMouseEnter={() => openSubMenu()}
                onMouseLeave={() => closeSubMenu()}
                className="position-relative nav-item-custom  dropdown d-flex justify-content-center align-items-center">
                <a className="nav-link nav-link-override pointer dropdown-toggle">
                    <i
                        className={`${module.icon} horizontal-nav-icons me-1`}></i>
                    <span className="horizontal-nav-labels">{module.name}</span>
                </a>
                <ul
                    ref={subMenuRef}
                    className={`adv-dropdown-menu dropdown-menu fade-down  ${
                        screenView === "md" || screenView === "lg" ? "" : ""
                    } `}>
                    {features.map(feature => {
                        return (
                            <React.Fragment key={feature.id}>
                                {feature.module === module.id &&
                                    feature.type === "IFRAME" && (
                                        <li className="dropdown-list-item">
                                            <NavLink
                                                className="dropdown-item"
                                                to={`/iframe:id=${feature.id}`}>
                                                <span className="">
                                                    <i
                                                        className={`${feature.icon} me-1`}></i>
                                                    {feature.name}
                                                </span>
                                            </NavLink>
                                        </li>
                                    )}
                                {feature.module === module.id &&
                                    feature.type === "PAGE" && (
                                        <li className="dropdown-list-item">
                                            <NavLink
                                                className="dropdown-item"
                                                to={
                                                    feature.slug
                                                        ? `/page/${feature.slug}`
                                                        : `/page:id=${feature.id}`
                                                }>
                                                <span className="">
                                                    <i
                                                        className={`${feature.icon} me-1`}></i>
                                                    {feature.name}
                                                </span>
                                            </NavLink>
                                        </li>
                                    )}
                                {feature.module === module.id &&
                                    feature.type === "EXTERNAL_LINK" && (
                                        <li className="dropdown-list-item">
                                            <a
                                                className="dropdown-item"
                                                tabIndex="0"
                                                href={feature.feature_key}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                // onClick={(event) => collapseNavbar(event)}
                                            >
                                                {feature.name}
                                            </a>
                                        </li>
                                    )}
                                {feature.module === module.id &&
                                    feature.type === "INTERNAL_LINK" && (
                                        <li className="dropdown-list-item">
                                            {(screenView === "md" ||
                                                screenView === "lg") && (
                                                <NavLink
                                                    className="dropdown-item"
                                                    to={feature.feature_key}>
                                                    <span className="d-block">
                                                        <i
                                                            className={`${feature.icon} me-1`}></i>
                                                        {feature.name}
                                                    </span>
                                                </NavLink>
                                            )}
                                            {screenView === "sm" && (
                                                <NavLink
                                                    className="dropdown-item"
                                                    to={feature.feature_key}>
                                                    <span
                                                        className="d-block"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target="#top-navbar-content">
                                                        <i
                                                            className={`${feature.icon} me-1`}></i>
                                                        {feature.name}
                                                    </span>
                                                </NavLink>
                                            )}
                                        </li>
                                    )}
                            </React.Fragment>
                        );
                    })}
                </ul>
            </li>
        );
    } else return <React.Fragment></React.Fragment>;
}
function EmptySpace() {
    return (
        <div
            id="brand-logo"
            className={`navbar-brand brand-layout`}>
            <span>
                <img className="brand-logo" />
            </span>
        </div>
    );
}

export default TopNavbar;
