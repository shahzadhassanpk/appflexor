import React, { useContext, useEffect, useRef, useState } from "react";
import { NAVBAR_STATE } from "../../../contants";
import BrandLogoMini from "./BrandLogoMini";
import SideBarNavlinks from "./SideBarNavlinks";
import SidebarNavlinksMini from "./SideBarNavlinksMini";

function SideNavbarMini({ isAuthorized, appModules, moduleFeatures }) {
    const [toggleMiniState, setToggleMiniState] = useState(NAVBAR_STATE.CON);
    const navbarRef = useRef();

    function expandMiniNavbar() {
        if (navbarRef) {
            if (
                !navbarRef.current.classList.contains("show") &&
                !navbarRef.current.classList.contains("remove-left-margin")
            ) {
                navbarRef.current.classList.add("show");
                navbarRef.current.classList.add("remove-left-margin");
                setToggleMiniState(NAVBAR_STATE.EXP);
            }
        }
    }

    function contractMiniNavbar() {
        if (navbarRef) {
            if (navbarRef.current.classList.contains("show")) {
                navbarRef.current.classList.remove("show");
                setToggleMiniState(NAVBAR_STATE.CON);
            }

            if (navbarRef.current.classList.contains("remove-left-margin")) {
                navbarRef.current.classList.remove("remove-left-margin");
            }
        }
    }

    return (
        <div
            ref={navbarRef}
            id="sideNavbarMini"
            className="side-navbar-mini offcanvas offcanvas-start sidebar-width"
            tabIndex="-1"
            onMouseEnter={() => expandMiniNavbar()}
            onMouseLeave={() => contractMiniNavbar()}>
            <BrandLogoMini
                toggleMiniState={toggleMiniState}
                STATE={NAVBAR_STATE}
            />
            <div
                className={`offcanvas-body ${
                    toggleMiniState === NAVBAR_STATE.CON
                        ? " navbar-contracted overflow-y-hidden"
                        : ""
                }`}>
                {isAuthorized === true && (
                    <React.Fragment>
                        {toggleMiniState === NAVBAR_STATE.EXP && (
                            <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                                <SideBarNavlinks
                                    appModules={appModules}
                                    moduleFeatures={
                                        moduleFeatures
                                    }></SideBarNavlinks>
                            </ul>
                        )}
                        {toggleMiniState === NAVBAR_STATE.CON && (
                            <SidebarNavlinksMini
                                appModules={appModules}
                                moduleFeatures={
                                    moduleFeatures
                                }></SidebarNavlinksMini>
                        )}
                    </React.Fragment>
                )}
            </div>
        </div>
    );
}

export default SideNavbarMini;
