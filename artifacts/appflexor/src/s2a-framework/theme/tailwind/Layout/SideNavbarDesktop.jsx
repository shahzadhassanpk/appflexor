import React from "react";

import SideBarNavlinks from "./SideBarNavlinks";

function SideNavbarDesktop({ appModules, moduleFeatures }) {
    return (
        <div
            id="side-navbar"
            className="sidenav">
            <div
                id="sidenav-links"
                className="sidenavbar px-2 my-2">
                <SideBarNavlinks
                    appModules={appModules}
                    moduleFeatures={moduleFeatures}></SideBarNavlinks>
            </div>
        </div>
    );
}

export default SideNavbarDesktop;
