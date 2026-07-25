import React from "react";
import SideBarNavlinks from "./SideBarNavlinks";
import BrandLogo from "./BrandLogo";

function SideNavbarMobile({ isAuthorized, appModules, moduleFeatures }) {
    return (
        <div
            className="offcanvas offcanvas-start w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700"
            tabIndex="-1"
            id="sideNavbarMobile"
        >
            <div className="offcanvas-header h-14 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4">
                <BrandLogo />
                <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close"
                >
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>
            <div className="offcanvas-body p-4 custom-scrollbar">
                {isAuthorized && (
                    <SideBarNavlinks
                        appModules={appModules}
                        moduleFeatures={moduleFeatures}
                    />
                )}
            </div>
        </div>
    );
}

export default SideNavbarMobile;
