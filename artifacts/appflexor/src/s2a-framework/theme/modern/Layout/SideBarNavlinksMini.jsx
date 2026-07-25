import React from "react";
import { useLocation } from "react-router-dom";

function SideBarNavlinksMini({ appModules, moduleFeatures }) {
    const { pathname } = useLocation();
    
    return (
        <div className="flex flex-col items-center gap-3 w-full py-4">
            {appModules.map(module => {
                if (module.location === "FRONTOFFICE") {
                    if (module.type === "LINK") {
                        return (
                            <ModuleFeatureIcon
                                key={module.id}
                                module={module}
                                features={moduleFeatures}
                                pathname={pathname}
                            />
                        );
                    }

                    if (module.type === "DROPDOWN") {
                        return (
                            <ModuleDropdownIcon
                                key={module.id}
                                module={module}
                                features={moduleFeatures}
                                pathname={pathname}
                            />
                        );
                    }
                }
                return null;
            })}
        </div>
    );
}

function ModuleFeatureIcon({ module, features, pathname }) {
    function isLinkActive(feature) {
        if (feature.type === "INTERNAL_LINK" && feature.feature_key.includes(pathname)) return true;
        if (feature.type === "PAGE" || feature.type === "IFRAME") {
            if (feature.slug) {
                let trimmedPath = pathname.split("/page/")[1];
                if (feature.slug.includes(trimmedPath)) return true;
            } else {
                let trimmedPath = pathname.split(":id=")[1];
                if (feature.id.includes(trimmedPath)) return true;
            }
        }
        return false;
    }

    return (
        <React.Fragment>
            {features.map(feature => {
                if (feature.module === module.id) {
                    const active = isLinkActive(feature);
                    return (
                        <div
                            key={feature.id}
                            title={feature.name}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                                active 
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" 
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            }`}
                        >
                            <i className={`${feature.icon || "fa-solid fa-puzzle-piece"} text-xl`}></i>
                        </div>
                    );
                }
                return null;
            })}
        </React.Fragment>
    );
}

function ModuleDropdownIcon({ module, features, pathname }) {
    const isChildActive = features.some(feature => {
        if (feature.module !== module.id) return false;
        if (pathname.includes(":id=")) {
            const id = pathname.split(":id=")[1];
            return feature.id === id;
        }
        return feature.feature_key === pathname;
    });

    return (
        <div
            title={module.name}
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                isChildActive 
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" 
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
        >
            <i className={`${module.icon || "fa-solid fa-folder"} text-xl`}></i>
        </div>
    );
}

export default SideBarNavlinksMini;
