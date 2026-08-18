import { useState } from "react";
import { NAVBAR_STATE } from "../../../contants";
import BrandLogoMini from "./BrandLogoMini";
import SideBarNavlinks from "./SideBarNavlinks";
import SidebarNavlinksMini from "./SideBarNavlinksMini";

function SideNavbarMini({
    isAuthorized,
    appModules,
    moduleFeatures,
    setToggleMiniNavbar,
    MENU,
}) {
    const [isHovered, setIsHovered] = useState(false);

    function expandSidebar() {
        setToggleMiniNavbar(MENU.FIXED);
        localStorage.setItem("SIDE_NAVBAR_STATE", MENU.FIXED);

        ["main", "footer"].forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            element.classList.remove("remove-margin");
            element.classList.remove("add-margin-60");
            element.classList.add("add-margin");
        });
    }

    return (
        <aside
            id="sideNavbarMini"
            className={`app-sidebar app-sidebar-mini ${
                isHovered ? "app-sidebar-hover-expanded" : ""
            }`}
            aria-label={isHovered ? "Expanded sidebar" : "Collapsed sidebar"}
            onPointerLeave={() => setIsHovered(false)}
            onPointerOver={event => {
                if (event.target.closest(".mini-nav-icon-wrapper")) {
                    setIsHovered(true);
                }
            }}
            onFocus={event => {
                if (event.target.closest(".mini-nav-icon-wrapper")) {
                    setIsHovered(true);
                }
            }}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsHovered(false);
                }
            }}>
            <div className="app-sidebar-mini-brand">
                <BrandLogoMini
                    toggleMiniState={
                        isHovered ? NAVBAR_STATE.EXP : NAVBAR_STATE.CON
                    }
                    STATE={NAVBAR_STATE}
                />
            </div>
            <nav className="app-sidebar-mini-navigation" aria-label="Main navigation">
                {isAuthorized === true && !isHovered && (
                    <SidebarNavlinksMini
                        appModules={appModules}
                        moduleFeatures={moduleFeatures}
                        onExpand={expandSidebar}
                    />
                )}
                {isAuthorized === true && isHovered && (
                    <SideBarNavlinks
                        appModules={appModules}
                        moduleFeatures={moduleFeatures}
                    />
                )}
            </nav>
            <div className={`app-sidebar-mini-actions ${isHovered ? "d-none" : ""}`}>
                <div
                    type="button"
                    className="app-sidebar-group-label"
                    onClick={expandSidebar}
                    aria-label="Expand sidebar"
                    title="Expand sidebar">
                    <i className="fa-solid fa-angles-right" aria-hidden="true"></i>
                </div>
            </div>
        </aside>
    );
}

export default SideNavbarMini;
