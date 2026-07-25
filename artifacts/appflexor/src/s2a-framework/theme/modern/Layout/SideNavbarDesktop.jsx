import React from "react";
import SideBarNavlinks from "./SideBarNavlinks";

function SideNavbarDesktop({ appModules, moduleFeatures, toggleMiniNavbar, setToggleMiniNavbar, MENU }) {
    return (
        <div
            id="side-navbar"
            className="fixed left-0 top-14 bottom-0 w-[230px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-30 transition-colors"
        >
            {/* Scrollable nav */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 custom-scrollbar">
                <SideBarNavlinks
                    appModules={appModules}
                    moduleFeatures={moduleFeatures}
                />
            </div>

            {/* Collapse button */}
            <div className="px-2 py-2 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setToggleMiniNavbar(MENU.HOVER)}
                    className="flex items-center w-full gap-2.5 px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <i className="fa-solid fa-arrow-left-to-line text-sm"></i>
                    <span>Collapse</span>
                </button>
            </div>

            {/* Footer */}
            <div className="px-3 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
                    © {new Date().getFullYear()} AppFlexor. All rights reserved.
                </p>
                <div className="flex items-center justify-between mt-1 gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Version 1.8.0</span>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">All Systems Operational</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SideNavbarDesktop;
