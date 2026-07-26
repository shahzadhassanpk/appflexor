import React from "react";
import BrandLogo from "./BrandLogo";
import SideBarNavlinks from "./SideBarNavlinks";

function SideNavbarDesktop({
    appModules,
    moduleFeatures,
    setToggleMiniNavbar,
    MENU,
}) {
    function collapseSidebar() {
        setToggleMiniNavbar(MENU.HOVER);
        localStorage.setItem("SIDE_NAVBAR_STATE", MENU.HOVER);

        ["main", "footer"].forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            element.classList.remove("remove-margin");
            element.classList.remove("add-margin");
            element.classList.add("add-margin-60");
        });
    }

    return (
        <div
            id="side-navbar"
            className="sidenav app-sidebar">
            <div className="app-sidebar-brand">
                <BrandLogo />
            </div>
            <div
                id="sidenav-links"
                className="sidenavbar app-sidebar-navigation">
                <SideBarNavlinks
                    appModules={appModules}
                    moduleFeatures={moduleFeatures}></SideBarNavlinks>
            </div>
            <button
                type="button"
                className="app-sidebar-collapse"
                onClick={collapseSidebar}
                aria-label="Collapse sidebar">
                <i className="fa-solid fa-angles-left" aria-hidden="true"></i>
                <span>Collapse</span>
            </button>
        </div>
    );
}

export default SideNavbarDesktop;
