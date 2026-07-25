import React, { useState } from "react";
import { NAVBAR_STATE } from "../../../contants";
import BrandLogoMini from "./BrandLogoMini";
import SideBarNavlinks from "./SideBarNavlinks";
import SideBarNavlinksMini from "./SideBarNavlinksMini";

function SideNavbarMini({ isAuthorized, appModules, moduleFeatures }) {
    const [toggleMiniState, setToggleMiniState] = useState(NAVBAR_STATE.CON);

    return (
        <div
            className={`fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 dark:bg-slate-900 dark:border-slate-700 transition-all duration-300 z-50 flex flex-col ${
                toggleMiniState === NAVBAR_STATE.EXP ? "w-60 shadow-2xl" : "w-16"
            }`}
            onMouseEnter={() => setToggleMiniState(NAVBAR_STATE.EXP)}
            onMouseLeave={() => setToggleMiniState(NAVBAR_STATE.CON)}
        >
            <div className="h-14 flex items-center border-b border-gray-200 dark:border-slate-700 overflow-hidden shrink-0">
                <BrandLogoMini toggleMiniState={toggleMiniState} STATE={NAVBAR_STATE} />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                {isAuthorized && (
                    <div className={toggleMiniState === NAVBAR_STATE.EXP ? "px-3 py-4 w-60" : "w-16"}>
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
        </div>
    );
}

export default SideNavbarMini;
