import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

function SidebarNavlinksMini({ appModules, moduleFeatures }) {
    const { pathname } = useLocation();
    return (
        <div className="d-flex justify-content-end my-1">
            <div className="d-flex flex-column">
                {appModules.map(module => {
                    if (module.location === "FRONTOFFICE") {
                        if (module.type === "LINK") {
                            return (
                                <ModuleFeatureIcon
                                    key={module.id}
                                    module={module}
                                    features={moduleFeatures}
                                    pathname={pathname}
                                />
                            );
                        }

                        if (module.type === "DROPDOWN") {
                            return (
                                <ModuleDropdownIcon
                                    key={module.id}
                                    module={module}
                                    features={moduleFeatures}
                                    pathname={pathname}
                                />
                            );
                        }
                    }
                    return null;
                })}
            </div>
        </div>
    );
}

function ModuleFeatureIcon({ module, features, pathname }) {
    function isLinkActive(feature) {
        if (feature.type === "INTERNAL_LINK") {
            if (feature.feature_key.includes(pathname)) {
                return true;
            }
        }

        if (feature.type === "PAGE" || feature.type === "IFRAME") {
            if (feature.slug) {
                let arr = pathname.split("/page/");
                let trimmedPath = arr[1];
                if (feature.slug.includes(trimmedPath)) {
                    return true;
                }
            } else {
                let arr = pathname.split(":id=");
                let trimmedPath = arr[1];
                if (feature.id.includes(trimmedPath)) {
                    return true;
                }
            }
        }

        return false;
    }

    return (
        <React.Fragment>
            {features.map(feature => {
                return (
                    <React.Fragment>
                        {feature.module === module.id && (
                            <span
                                className={`mini-nav-icon-wrapper ${
                                    isLinkActive(feature) ? "link-active" : ""
                                } `}>
                                <i
                                    className={`${
                                        feature.icon
                                            ? feature.icon
                                            : "fa fa-paw"
                                    } mini-nav-icon-size m-0`}></i>
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    );
}

function ModuleDropdownIcon({ module, features, pathname }) {
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
        <React.Fragment>
            <span
                className={`mini-nav-icon-wrapper ${
                    isLinkActive() ? "link-active" : ""
                }`}>
                <i
                    className={`${
                        module.icon ? module.icon : "fa-solid fa-angles-right"
                    } mini-nav-icon-size m-0`}></i>
            </span>
        </React.Fragment>
    );
}

export default SidebarNavlinksMini;
