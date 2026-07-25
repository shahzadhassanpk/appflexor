import React from "react";
import SideBarNavlinks from "./SideBarNavlinks";

function SideNavbarDesktop({ appModules, moduleFeatures, toggleMiniNavbar, setToggleMiniNavbar, MENU }) {
    return (
        <div id="side-navbar" className="fixed left-0 top-14 bottom-0 w-60 bg-white border-r border-gray-200 dark:bg-slate-900 dark:border-slate-700 flex flex-col transition-transform z-30">
            <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                <SideBarNavlinks
                    appModules={appModules}
                    moduleFeatures={moduleFeatures}
                />
            </div>
            
            <div className="p-3 border-t border-gray-200 dark:border-slate-700">
                <button 
                    onClick={() => setToggleMiniNavbar(MENU.HOVER)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <i className="fa-solid fa-arrow-left-to-line"></i>
                    <span>Collapse</span>
                </button>
            </div>
        </div>
    );
}

export default SideNavbarDesktop;
