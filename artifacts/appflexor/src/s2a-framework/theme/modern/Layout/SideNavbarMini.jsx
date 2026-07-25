import React, { useState } from "react";
import { NAVBAR_STATE } from "../../../contants";
import SideBarNavlinks from "./SideBarNavlinks";
import SideBarNavlinksMini from "./SideBarNavlinksMini";

function SideNavbarMini({ isAuthorized, appModules, moduleFeatures, setToggleMiniNavbar, MENU }) {
    const [toggleMiniState, setToggleMiniState] = useState(NAVBAR_STATE.CON);

    return (
        <div
            className={`fixed left-0 top-14 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 z-30 flex flex-col ${
                toggleMiniState === NAVBAR_STATE.EXP ? "w-[230px] shadow-2xl" : "w-16"
            }`}
            onMouseEnter={() => setToggleMiniState(NAVBAR_STATE.EXP)}
            onMouseLeave={() => setToggleMiniState(NAVBAR_STATE.CON)}
        >
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {isAuthorized && (
                    <div className={toggleMiniState === NAVBAR_STATE.EXP ? "px-2 py-2 w-[230px]" : "w-16 py-2"}>
                        {toggleMiniState === NAVBAR_STATE.EXP ? (
                            <SideBarNavlinks
                                appModules={appModules}
                                moduleFeatures={moduleFeatures}
                            />
                        ) : (
                            <SideBarNavlinksMini
                                appModules={appModules}
                                moduleFeatures={moduleFeatures}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Expand button at bottom (mini mode only) */}
            {toggleMiniState === NAVBAR_STATE.CON && (
                <div className="p-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setToggleMiniNavbar(MENU.FIXED)}
                        className="w-full flex items-center justify-center p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Expand sidebar"
                    >
                        <i className="fa-solid fa-arrow-right-to-line text-sm"></i>
                    </button>
                </div>
            )}
        </div>
    );
}

export default SideNavbarMini;
