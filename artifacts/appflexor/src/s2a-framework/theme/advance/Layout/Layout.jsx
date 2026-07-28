import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { tryToParse } from "../../../modules/data-management/form-builder/Forms/FormViewer/utils";
import SideNavbarDesktop from "./SideNavbarDesktop";
import SideNavbarMini from "./SideNavbarMini";
import SideNavbarMobile from "./SideNavbarMobile";
import TopNavbar from "./TopNavbar";

const FALLBACK_LOGO_URL = `${import.meta.env.BASE_URL}theme/images/appflexor-logo.png`;

const MENU = {
  HOVER: "HOVER",
  FIXED: "FIXED",
};

function getStoredSidebarState() {
  const storedState = localStorage.getItem("SIDE_NAVBAR_STATE");
  return Object.values(MENU).includes(storedState) ? storedState : MENU.FIXED;
}

function Layout() {
  const appContext = useContext(AppContext);
  const [mainItems, setMainItems] = useState([]);
  const [mainBackOfficeItems, setMainBackOfficeItems] = useState([]);
  const [toggleMiniNavbar, setToggleMiniNavbar] = useState(getStoredSidebarState);

  const location = useLocation();
  const sitePreference = tryToParse(appContext.channel?.site_preference);
  const menuPosition = sitePreference ? sitePreference?.menu_position : "";

  useEffect(() => {
    localStorage.setItem("SIDE_NAVBAR_STATE", toggleMiniNavbar);
  }, [toggleMiniNavbar]);

  // Update favicon when brand changes
  useEffect(() => {
    const brand = appContext.channel;
    if (brand && !isEmpty(brand)) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href =
        brand.brand_logo && brand.brand_logo !== ""
          ? `/file/service/app_site/${brand.id}/${brand.brand_logo}`
          : FALLBACK_LOGO_URL;
    }
  }, [appContext.channel]);

  // Classify nav items
  useEffect(() => {
    if (appContext.isAuthorized) {
      classifyNavBarItems(appContext.appModules, appContext.moduleFeatures);
    }
  }, [
    appContext.screenView,
    appContext.appModules,
    appContext.moduleFeatures,
    appContext.isAuthorized,
  ]);

  // Open active accordion
  useEffect(() => {
    if (appContext.appModules && appContext.moduleFeatures) {
      openActiveAccordion(
        appContext.appModules,
        appContext.moduleFeatures,
        location.pathname
      );
    }
  }, [appContext.appModules, appContext.moduleFeatures, location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  function isEmpty(obj) {
    return !obj || Object.keys(obj).length === 0;
  }

  function classifyNavBarItems(modules, features) {
    const frontOffice = [];
    const backOffice = [];

    modules.forEach((module) => {
      if (module.location === "FRONTOFFICE" && module.type === "LINK") {
        features.forEach((feature) => {
          if (module.id === feature.module) {
            frontOffice.push(feature);
          }
        });
      } else if (module.location === "BACKOFFICE" && module.type === "LINK") {
        features.forEach((feature) => {
          if (module.id === feature.module) {
            backOffice.push(feature);
          }
        });
      }
    });

    setMainItems(frontOffice);
    setMainBackOfficeItems(backOffice);
  }

  function openActiveAccordion(modules, features, route) {
    let moduleId = "";
    let accordionId = "";

    features.forEach((feature) => {
      if (feature.feature_key === route) {
        moduleId = feature.module;
      }
    });

    modules.forEach((module) => {
      if (module.id === moduleId) {
        accordionId = module.name.replace(/\s+/g, "-").toLowerCase();
      }
    });

    const activeAccordion = document.querySelector(
      `[data-bs-target="#${accordionId}"]`
    );

    if (activeAccordion?.classList.contains("collapsed")) {
      activeAccordion.click();
    }
  }

  function renderNavbar() {
    if (!appContext.isAuthorized) return null;

    if (appContext.screenView === "lg" && menuPosition === "body-left") {
      return toggleMiniNavbar === MENU.FIXED ? (
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
      );
    }

    if (appContext.screenView === "sm" || appContext.screenView === "md") {
      return (
        <SideNavbarMobile
          isAuthorized={appContext.isAuthorized}
          navLinks={appContext.frontOfficeItems}
          handleLogout={appContext.handleLogout}
          appModules={appContext.appModules}
          moduleFeatures={appContext.moduleFeatures}
        />
      );
    }

    return null;
  }

  return (
    <React.Fragment>
      <div className="top-header advance-top-header">
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
      </div>
      {renderNavbar()}
    </React.Fragment>
  );
}

export { Layout, MENU };
