import React from "react";
import { NavLink, useLocation } from "react-router-dom";

/* ─── Main nav tree ────────────────────────────────────────────────────────── */
function SideBarNavlinks({ appModules, moduleFeatures }) {
    const { pathname } = useLocation();

    return (
        <div className="flex flex-col w-full" id="side-navbar-parent">
            {appModules?.map(module => {
                if (module.location !== "FRONTOFFICE") return null;

                if (module.type === "DROPDOWN") {
                    return (
                        <ModuleSection
                            key={module.id}
                            module={module}
                            features={moduleFeatures}
                            pathname={pathname}
                        />
                    );
                }

                if (module.type === "LINK") {
                    return (
                        <DirectFeatures
                            key={module.id}
                            module={module}
                            features={moduleFeatures}
                            pathname={pathname}
                        />
                    );
                }

                return null;
            })}
        </div>
    );
}

/* ─── Section with header label + always-visible items ─────────────────────── */
function ModuleSection({ module, features, pathname }) {
    const items = features.filter(f => f.module === module.id);
    if (items.length === 0) return null;

    return (
        <div className="mt-5 first:mt-2">
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                {module.name}
            </p>
            <div className="flex flex-col gap-0.5">
                {items.map(feature => (
                    <NavItem key={feature.id} feature={feature} pathname={pathname} />
                ))}
            </div>
        </div>
    );
}

/* ─── Direct LINK-type module features (no section header) ─────────────────── */
function DirectFeatures({ module, features, pathname }) {
    const items = features.filter(f => f.module === module.id);
    return (
        <>
            {items.map(feature => (
                <NavItem key={feature.id} feature={feature} pathname={pathname} />
            ))}
        </>
    );
}

/* ─── Single nav item ───────────────────────────────────────────────────────── */
function NavItem({ feature, pathname }) {
    let path = "";
    if (feature.type === "IFRAME") {
        path = `/iframe:id=${feature.id}`;
    } else if (feature.type === "PAGE") {
        path = feature.slug ? `/page/${feature.slug}` : `/page:id=${feature.id}`;
    } else {
        path = feature.feature_key || "#";
    }

    const isActive =
        feature.type === "IFRAME"
            ? window.location.href.includes(`:id=${feature.id}`)
            : pathname === path || (path !== "/" && pathname.startsWith(path));

    return (
        <NavLink
            to={path}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors group ${
                isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-medium"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
        >
            <i
                className={`${feature.icon || "fa-solid fa-circle-dot"} text-sm w-4 text-center flex-shrink-0 ${
                    isActive
                        ? "text-indigo-500 dark:text-indigo-400"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400"
                }`}
            ></i>
            <span className="truncate">{feature.name}</span>
        </NavLink>
    );
}

export default SideBarNavlinks;
