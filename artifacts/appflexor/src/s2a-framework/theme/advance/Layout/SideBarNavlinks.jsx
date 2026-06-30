import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

function SidebarNavlinks({ appModules, moduleFeatures }) {
    return (
        <div
            className="accordion-main mb-4"
            id="side-navbar-parent">
            {appModules &&
                appModules?.map(module => {
                    if (module.location === "FRONTOFFICE") {
                        if (module.type === "DROPDOWN") {
                            return (
                                <AccordionItem
                                    key={module.id}
                                    id={module.name
                                        .replace(/\s+/g, "-")
                                        .toLowerCase()}
                                    title={module.name}
                                    module={module}
                                    features={moduleFeatures}
                                />
                            );
                        }

                        if (module.type === "LINK") {
                            return (
                                <ModuleFeatureItem
                                    key={module.id}
                                    module={module}
                                    features={moduleFeatures}
                                />
                            );
                        }
                    }
                })}
        </div>
    );
}

function ModuleFeatureItem({ module, features }) {
    return (
        <React.Fragment>
            {features.map(feature => {
                return (
                    <React.Fragment>
                        {feature.module === module.id &&
                            (feature.type === "IFRAME" ? (
                                <IframeName
                                    key={feature.id}
                                    feature={feature}
                                    features={features}
                                />
                            ) : (
                                <FeatureName
                                    key={feature.id}
                                    feature={feature}
                                />
                            ))}
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    );
}

function IframeName({ feature }) {
    let currentUrl = window.location.href;
    let activeStyle = {
        color: "var(--link-active-color)",
    };

    function getActiveFeature(id) {
        let bool = false;
        if (currentUrl.includes(":id=")) {
            let arr = currentUrl.split(":id=");
            let urlId = arr[1];
            if (id === urlId) bool = true;
        }
        return bool;
    }

    function collapseAllAccordian() {
        let accordianButtons =
            document.getElementsByClassName("accordion-button");
        let accordianCollapses =
            document.getElementsByClassName("accordion-collapse");

        for (let i = 0; i < accordianButtons.length; i++) {
            accordianButtons[i].className += " collapsed";
        }

        for (let i = 0; i < accordianCollapses.length; i++) {
            accordianCollapses[i].classList.remove("show");
        }
    }

    return (
        <NavLink
            to={`/iframe:id=${feature.id}`}
            className={`text-decoration-none ${
                getActiveFeature(feature.id) ? "nav-link active" : "nav-link"
            } rounded`}>
            {/* style={({ isActive }) => (isActive ? activeStyle : undefined)}> */}
            <div
                onClick={() => {
                    collapseAllAccordian();
                }}
                className={`${
                    getActiveFeature(feature.id)
                        ? " sidebar-frontoffice navlink-color-light"
                        : " navlink-active-dark"
                } feature-link my-1 ps-3 rounded`}
                id="text-color-hover">
                <span
                    className={`navlink-hover rounded ms-1`}
                    id="color-over-ride">
                    <i
                        className={`${
                            feature.icon
                                ? feature.icon
                                : "fa fa-paw"
                        } me-2`}></i>
                    {feature.name}
                </span>
            </div>
        </NavLink>
    );
}

function FeatureName({ feature }) {
    let { pathname } = useLocation();

    let activeStyle = {
        color: "var(--link-active-color)",
    };

    function getRouteFromKey(route) {
        let bool = false;
        if (!route.includes("?")) {
            if (!route.includes("/")) route = "/" + route;
            bool = pathname === route;
        } else {
            let _route = route.split("?")[0];
            if (pathname === _route) bool = true;
        }
        return bool;
    }

    function collapseAllAccordian() {
        let accordianButtons =
            document.getElementsByClassName("accordion-button");
        let accordianCollapses =
            document.getElementsByClassName("accordion-collapse");

        for (let i = 0; i < accordianButtons.length; i++) {
            accordianButtons[i].className += " collapsed";
        }

        for (let i = 0; i < accordianCollapses.length; i++) {
            accordianCollapses[i].classList.remove("show");
        }
    }

    let path = "";

    if (feature.type === "IFRAME") {
        path = `/iframe:id=${feature.id}`;
    } else if (feature.type === "PAGE") {
        if (feature.slug) {
            path = `/page/${feature.slug}`;
        } else {
            path = `/page:id=${feature.id}`;
        }
    } else {
        path = `${feature.feature_key}`;
    }

    return (
        <NavLink
            to={path}
            className={`text-decoration-none ${
                getRouteFromKey(feature.feature_key)
                    ? "nav-link active"
                    : "nav-link"
            } rounded`}>
            <div
                onClick={() => {
                    collapseAllAccordian();
                }}
                className={`${
                    getRouteFromKey(feature.feature_key)
                        ? " sidebar-frontoffice navlink-color-light"
                        : " navlink-active-dark"
                } feature-link my-1 ps-3 rounded`}
                id="text-color-hover">
                <span className={`navlink-hover rounded ms-1`}>
                    <i
                        className={`${
                            feature.icon
                                ? feature.icon
                                : "fa fa-paw"
                        } me-2`}></i>
                    {feature.name}
                </span>
            </div>
        </NavLink>
    );
}

function AccordionItem({ id, title = "...", module, features }) {
    const { pathname } = useLocation();

    function isLinkActive() {
        let filteredFeatures = features.filter(
            feature => feature.module === module.id,
        );

        if (pathname.includes(":id=")) {
            let trimmedPath = pathname.replace(/[/]/g, "");
            let arr = trimmedPath.split(":id=");
            let id = arr[1];

            let hasValue = filteredFeatures.some(feature => feature.id === id);

            if (hasValue) {
                return true;
            }
        } else {
            let hasValue = filteredFeatures.some(
                feature => feature.feature_key === pathname,
            );
            if (hasValue) {
                return true;
            }
        }
        return false;
    }

    return (
        <div
            id="nav-accordion"
            className="accordion menu-accordion">
            <div className="accordion-item border-0">
                <div className="accordion-header">
                    <span
                        className={` ${
                            isLinkActive() ? "" : "collapsed"
                        } accordion-button rounded pointer`}
                        data-bs-toggle="collapse"
                        data-bs-target={`#${id}`}
                        aria-controls="modify-search">
                        <div className="">
                            <i
                                className={`${
                                    module.icon
                                        ? module.icon
                                        : "fa-solid fa-angles-right"
                                } m-1 me-2`}></i>
                            {title}
                        </div>
                    </span>
                </div>
                <div
                    id={id}
                    className={`accordion-collapse collapse  ${
                        isLinkActive() ? "show" : ""
                    } `}
                    data-bs-parent="#side-navbar-parent"
                    aria-labelledby="">
                    <div className="accordion-body p-0">
                        <AccordionNavItems
                            module={module}
                            features={features}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function AccordionNavItems({ module, features }) {
    let activeStyle = {
        // display: "block",
        // width: "100%",
        // backgroundColor: "var(--secondary-color)",
        // color: "var(--primary-color)",
        color: "var(--link-active-color)",
    };

    function closeSideBar() {
        var closeBtn = document.getElementById("sidebar-toggle");
        if (closeBtn) closeBtn.click();
    }

    return (
        <nav>
            <ul className="nav-items-ul p-1 pt-0 ps-3 mb-0">
                {features.map(feature => {
                    let path = "";

                    if (feature.type === "IFRAME") {
                        path = `/iframe:id=${feature.id}`;
                    } else if (feature.type === "PAGE") {
                        if (feature.slug) {
                            path = `/page/${feature.slug}`;
                        } else {
                            path = `/page:id=${feature.id}`;
                        }
                    } else {
                        path = `${feature.feature_key}`;
                    }

                    return (
                        feature.module === module.id && (
                            <li
                                key={feature.id}
                                onClick={() => {
                                    closeSideBar();
                                }}>
                                <NavLink
                                    to={path}
                                    className="nav-items-link py-2 rounded"
                                    style={({ isActive }) =>
                                        isActive ? activeStyle : undefined
                                    }>
                                    <ModuleName
                                        icon={
                                            feature.icon
                                                ? feature.icon
                                                : "fa-solid fa-angle-right"
                                        }
                                        name={feature.name}
                                        route={feature.feature_key}
                                    />
                                </NavLink>
                            </li>
                        )
                    );
                })}
            </ul>
        </nav>
    );
}

function ModuleName({ icon, name, route }) {
    let { pathname } = useLocation();

    return (
        <span>
            {route === pathname ? (
                <i className={`${icon} me-2`}></i>
            ) : (
                <i className={`${icon} me-2`}></i>
            )}
            {name}
        </span>
    );
}

export default SidebarNavlinks;
