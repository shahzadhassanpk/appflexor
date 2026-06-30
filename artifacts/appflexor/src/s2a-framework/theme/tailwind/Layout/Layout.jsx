import $ from "jquery";
import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { AppContext } from "../../../../AppContext";
import { tryToParse } from "../../../modules/data-management/form-builder/Forms/FormViewer/utils";
import SideNavbarDesktop from "./SideNavbarDesktop";
import SideNavbarMini from "./SideNavbarMini";
import SideNavbarMobile from "./SideNavbarMobile";
import TopNavbar from "./TopNavbar";
// import "../styles.css";
// import "../../../../../public/theme/tailwind/theme.css";
const MENU = {
    HOVER: "HOVER",
    FIXED: "FIXED",
};

function Layout() {
    const appContext = useContext(AppContext);
    const [mainItems, setMainItems] = useState([]);
    const [mainBackOfficeItems, setMainBackOfficeItems] = useState([]);
    const [toggleMiniNavbar, setToggleMiniNavbar] = useState(
        localStorage.getItem("SIDE_NAVBAR_STATE") || MENU.FIXED,
    );
    const location = useLocation();
    const site_preference = tryToParse(appContext.channel?.site_preference);
    const menu_position = site_preference ? site_preference?.menu_position : "";

    useEffect(() => {
        $(".loader-line").fadeOut();
    }, []);

    useEffect(() => {
        let brand = appContext.channel;
        let imageUrl = "/theme/images/default-logo.png";
        if (brand && !isEmpty(brand)) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.getElementsByTagName("head")[0].appendChild(link);
            }
            let url =
                brand.brand_logo && brand.brand_logo !== ""
                    ? "/file/service/app_site/" +
                      brand.id +
                      "/" +
                      brand.brand_logo
                    : imageUrl;
            link.href = url;
        }
    }, [appContext.channel]);

    useEffect(() => {
        if (appContext.isAuthorized) {
            classifyNavBarItems(
                appContext.appModules,
                appContext.moduleFeatures,
            );
        }
    }, [
        appContext.screenView,
        appContext.appModules,
        appContext.moduleFeatures,
        appContext.isAuthorized,
    ]);

    useEffect(() => {
        if (appContext.appModules && appContext.moduleFeatures) {
            openActiveAccordion(
                appContext.appModules,
                appContext.moduleFeatures,
                location.pathname,
            );
        }
    }, [appContext.appModules, appContext.moduleFeatures, location.pathname]);

    useEffect(() => {
        window.scroll(0, 0);
    }, [location.pathname]);

    useEffect(() => {
        const mainEle = document.getElementById("main");
        const sideBarEle = document.getElementById("side-navbar");
        const footerEle = document.getElementById("footer");

        function removeMargin(params) {
            try {
                if (
                    mainEle.classList.contains("add-margin") &&
                    footerEle.classList.contains("add-margin")
                ) {
                    mainEle.classList.remove("add-margin");
                    mainEle.classList.add("remove-margin");
                    footerEle.classList.remove("add-margin");
                    footerEle.classList.add("remove-margin");
                    sideBarEle.classList.remove("add-margin");
                    sideBarEle.classList.add("remove-margin");
                }
            } catch (error) {
                console.error(error);
            }

            // sideBarEle.classList.add("visually-hidden");
        }

        if (
            !appContext.isAuthorized ||
            appContext.screenView === "md" ||
            appContext.screenView === "sm"
        ) {
            removeMargin();
        }
    }, [appContext.isAuthorized, appContext.screenView]);

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function classifyNavBarItems(modules, features) {
        let frontOffice = [];
        let backoffice = [];

        modules.map(module => {
            if (module.location === "FRONTOFFICE" && module.type === "LINK") {
                features.map(feature => {
                    if (module.id === feature.module) {
                        frontOffice.push(feature);
                    }
                });
            } else if (
                module.location === "BACKOFFICE" &&
                module.type === "LINK"
            ) {
                features.map(feature => {
                    if (module.id === feature.module) {
                        backoffice.push(feature);
                    }
                });
            }
        });

        setMainItems(frontOffice);
        setMainBackOfficeItems(backoffice);
    }

    function openActiveAccordion(modules, features, route) {
        let moduleId = "";
        let accordionId = "";

        features.forEach(feature => {
            if (feature.feature_key === route) {
                moduleId = feature.module;
            }
        });

        modules.forEach(module => {
            if (module.id === moduleId) {
                accordionId = module.name.replace(/\s+/g, "-").toLowerCase();
            }
        });

        let activeAccordion = document.querySelector(
            `[data-bs-target="#${accordionId}"]`,
        );

        if (activeAccordion?.classList.contains("collapsed")) {
            // if (appContext.screenView === "lg")
            activeAccordion.click();
        }
    }

    return (
        <React.Fragment>
            <link
                href="/app/theme/tailwind/theme.css"
                rel="stylesheet"
                type="text/css"
            />
            
                {appContext.isAuthorized && (
                    <TopNavbar
                        isAuthorized={appContext.isAuthorized}
                        navLinks={appContext.frontOfficeItems}
                        handleLogout={appContext.handleLogout}
                        modules={appContext.appModules}
                        features={appContext.moduleFeatures}
                        mainItems={mainItems}
                        mainBackOfficeItems={mainBackOfficeItems}
                        screenView={appContext.screenView}
                        setToggleMiniNavbar={setToggleMiniNavbar}
                        toggleMiniNavbar={toggleMiniNavbar}
                        MENU={MENU}
                    />
                )}
                {appContext.isAuthorized &&
                    menu_position === "body-left" &&
                    appContext.screenView === "lg" && (
                        <React.Fragment>
                            {toggleMiniNavbar === MENU.FIXED ? (
                                <SideNavbarDesktop
                                    appModules={appContext.appModules}
                                    moduleFeatures={appContext.moduleFeatures}
                                    setToggleMiniNavbar={setToggleMiniNavbar}
                                    toggleMiniNavbar={toggleMiniNavbar}
                                    MENU={MENU}
                                />
                            ) : (
                                <SideNavbarMini
                                    isAuthorized={appContext.isAuthorized}
                                    appModules={appContext.appModules}
                                    moduleFeatures={appContext.moduleFeatures}
                                    setToggleMiniNavbar={setToggleMiniNavbar}
                                    toggleMiniNavbar={toggleMiniNavbar}
                                    MENU={MENU}
                                />
                            )}
                        </React.Fragment>
                    )}
                {(appContext.screenView === "sm" ||
                    appContext.screenView === "md") && (
                    <SideNavbarMobile
                        isAuthorized={appContext.isAuthorized}
                        navLinks={appContext.frontOfficeItems}
                        handleLogout={appContext.handleLogout}
                        appModules={appContext.appModules}
                        moduleFeatures={appContext.moduleFeatures}
                    />
                )}
        </React.Fragment>
    );
}

export { Layout, MENU };
