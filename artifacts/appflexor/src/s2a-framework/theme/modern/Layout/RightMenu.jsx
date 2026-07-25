import React, { useContext, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { staticAdminModuleFeatures, suid } from "../../../staticMenu";

function RightMenu({ isAuthorized, modules, features, screenView, mainItems, channel }) {
    return (
        <div
            className="offcanvas offcanvas-end w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 shadow-xl"
            tabIndex="-1"
            id="rightMenu"
            aria-labelledby="rightMenuLabel"
        >
            <div className="offcanvas-header h-14 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4">
                <h5 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 m-0" id="rightMenuLabel">
                    <i className="fa-solid fa-gear text-indigo-600 dark:text-indigo-400"></i>
                    Control Panel
                </h5>
                <button
                    type="button"
                    className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close"
                >
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>
            <div className="offcanvas-body p-0 overflow-y-auto custom-scrollbar">
                <RightMenuModules
                    isAuthorized={isAuthorized}
                    modules={modules}
                    features={features}
                    screenView={screenView}
                    mainItems={mainItems}
                    channel={channel}
                />
            </div>
        </div>
    );
}

function RightMenuModules({ modules, features, screenView }) {
    const appContext = useContext(AppContext);
    const location = useLocation();
    const selectedFeature = location.pathname;
    
    const [moduleId, setModuleId] = useState("");
    const [moduleName, setModuleName] = useState("");
    const [featureId, setFeatureId] = useState(selectedFeature);
    const office = appContext?.office;
    const setOffice = appContext?.setOffice;

    useEffect(() => {
        setFeatureId(selectedFeature);
    }, [selectedFeature]);

    useEffect(() => {
        if (office === "front") {
            setModuleId("");
            setFeatureId("");
        }
    }, [office]);

    const isAdmin = appContext?.userGroups?.groupid?.includes("ADMIN");

    return (
        <div className="flex flex-col h-full">
            {/* Module Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                {isAdmin && modules.map((module) => (
                    module.location === "ADMINOFFICE" && module.type === "DROPDOWN" && (!module.role || module.role === appContext.profile.roleid) && (
                        <button
                            key={module.id}
                            onClick={() => {
                                setModuleId(module.id);
                                setModuleName(module.name);
                                setOffice("back");
                            }}
                            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
                                moduleId === module.id
                                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900"
                                    : "border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            {module.icon && <i className={module.icon}></i>}
                            {module.name}
                        </button>
                    )
                ))}
            </div>

            {/* Feature List */}
            <div className="p-4 flex-1">
                {moduleId && (
                    <div className="mb-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        {moduleName} Settings
                    </div>
                )}
                <div className="flex flex-col gap-1">
                    {features?.map((feature) => {
                        if (feature.module === moduleId && office !== "front") {
                            let linkTo = "";
                            if (feature.type === "IFRAME") linkTo = `/iframe:id=${feature.id}`;
                            else if (feature.type === "PAGE") linkTo = feature.slug ? `/page/${feature.slug}` : `/page:id=${feature.id}`;
                            else linkTo = feature.feature_key;

                            const isSelected = 
                                feature.type !== "PAGE" ? featureId === `/${feature.feature_key}` : featureId.split("=")[1] === feature.id;

                            return (
                                <NavLink
                                    key={feature.id}
                                    to={linkTo}
                                    onClick={() => {
                                        if (feature.type !== "PAGE") setFeatureId(feature.feature_key);
                                        else setFeatureId(feature.slug ? `page/${feature.slug}` : `page:id=${feature.id}`);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                        isSelected
                                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    {feature.icon && <i className={`${feature.icon} text-lg ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"}`}></i>}
                                    <span>{feature.name}</span>
                                </NavLink>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}

export default RightMenu;
