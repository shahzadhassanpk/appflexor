import React, { useContext, useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";
import SideBarNavlinks from "./SideBarNavlinks";

function SideNavbarMobile({ isAuthorized, appModules, moduleFeatures }) {
    return (
        <React.Fragment>
            <div
                className="offcanvas offcanvas-start sidebar-width"
                tabIndex="-1"
                id="sideNavbarMobile">
                {/* <div className="offcanvas-header py-0 border-bottom">
                    <div className="d-inline">
                        <span className="navbar-brand">
                            <BrandLogo />
                        </span>
                    </div>
                    <button
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="offcanvas"
                        aria-label="Close"
                    ></button>
                </div> */}
                <div className="offcanvas-body">
                    {isAuthorized === true && (
                        <ul className="navbar-nav justify-content-end flex-grow-1">
                            {/* <NavLinks links={navLinks} /> */}
                            <SideBarNavlinks
                                appModules={appModules}
                                moduleFeatures={
                                    moduleFeatures
                                }></SideBarNavlinks>
                        </ul>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}

export default SideNavbarMobile;
