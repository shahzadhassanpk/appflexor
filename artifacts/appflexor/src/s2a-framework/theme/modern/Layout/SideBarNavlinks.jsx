import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

function SideBarNavlinks({ appModules, moduleFeatures }) {
    const [openModules, setOpenModules] = useState([]);

    const toggleModule = (id) => {
        setOpenModules(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col gap-1 w-full" id="side-navbar-parent">
            {appModules?.map(module => {
                if (module.location === "FRONTOFFICE") {
                    if (module.type === "DROPDOWN") {
                        return (
                            <AccordionItem
                                key={module.id}
                                module={module}
                                features={moduleFeatures}
                                isOpen={openModules.includes(module.id)}
                                onToggle={() => toggleModule(module.id)}
                            />
                        );
                    }

                    if (module.type === "LINK") {
                        return (
                            <ModuleFeatureItem
                                key={module.id}
                                module={module}
                                features={moduleFeatures}
                            />
                        );
                    }
                }
                return null;
            })}
        </div>
    );
}

function ModuleFeatureItem({ module, features }) {
    return (
        <React.Fragment>
            {features.map(feature => {
                if (feature.module === module.id) {
                    return feature.type === "IFRAME" ? (
                        <IframeName key={feature.id} feature={feature} />
                    ) : (
                        <FeatureName key={feature.id} feature={feature} />
                    );
                }
                return null;
            })}
        </React.Fragment>
    );
}

function IframeName({ feature }) {
    const currentUrl = window.location.href;
    const isActive = currentUrl.includes(`:id=${feature.id}`);

    return (
        <NavLink
            to={`/iframe:id=${feature.id}`}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                isActive 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
        >
            <i className={`${feature.icon || "fa-solid fa-puzzle-piece"} w-5 text-center text-lg ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300"}`}></i>
            <span className="truncate">{feature.name}</span>
        </NavLink>
    );
}

function FeatureName({ feature }) {
    const { pathname } = useLocation();

    let path = "";
    if (feature.type === "IFRAME") {
        path = `/iframe:id=${feature.id}`;
    } else if (feature.type === "PAGE") {
        path = feature.slug ? `/page/${feature.slug}` : `/page:id=${feature.id}`;
    } else {
        path = `${feature.feature_key}`;
    }

    const isActive = pathname === path || (pathname.startsWith(path) && path !== '/');

    return (
        <NavLink
            to={path}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                isActive 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
        >
            <i className={`${feature.icon || "fa-solid fa-puzzle-piece"} w-5 text-center text-lg ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300"}`}></i>
            <span className="truncate">{feature.name}</span>
        </NavLink>
    );
}

function AccordionItem({ module, features, isOpen, onToggle }) {
    const { pathname } = useLocation();

    // Check if any child is active
    const isChildActive = features.some(feature => {
        if (feature.module !== module.id) return false;
        if (pathname.includes(":id=")) {
            const id = pathname.split(":id=")[1];
            return feature.id === id;
        }
        return feature.feature_key === pathname;
    });

    const isExpanded = isOpen || isChildActive;

    return (
        <div className="mb-1">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300 transition-colors mt-4 mb-1"
            >
                <div className="flex items-center gap-2">
                    <span className="truncate">{module.name}</span>
                </div>
                <i className={`fa-solid fa-chevron-right text-[10px] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}></i>
            </button>
            
            {isExpanded && (
                <div className="flex flex-col gap-1">
                    <AccordionNavItems module={module} features={features} />
                </div>
            )}
        </div>
    );
}

function AccordionNavItems({ module, features }) {
    const { pathname } = useLocation();

    return (
        <>
            {features.map(feature => {
                if (feature.module !== module.id) return null;

                let path = "";
                if (feature.type === "IFRAME") {
                    path = `/iframe:id=${feature.id}`;
                } else if (feature.type === "PAGE") {
                    path = feature.slug ? `/page/${feature.slug}` : `/page:id=${feature.id}`;
                } else {
                    path = `${feature.feature_key}`;
                }

                const isActive = pathname === path || (pathname.startsWith(path) && path !== '/');

                return (
                    <NavLink
                        key={feature.id}
                        to={path}
                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                            isActive 
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" 
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        <i className={`${feature.icon || "fa-solid fa-angle-right"} w-5 text-center text-lg ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300"}`}></i>
                        <span className="truncate">{feature.name}</span>
                    </NavLink>
                );
            })}
        </>
    );
}

export default SideBarNavlinks;
