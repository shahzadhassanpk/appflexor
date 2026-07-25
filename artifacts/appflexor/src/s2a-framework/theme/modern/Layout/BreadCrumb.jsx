import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../../../../AppContext";

const staticRoutes = [
    { path: "/user-profile", name: "User Profile" },
    { path: "/form-viewer", name: "Form Viewer" },
    { path: "/start-process", name: "Start Process" },
];

function Breadcrumb() {
    const appContext = useContext(AppContext);
    const { pathname } = useLocation();
    const [breadcrumbPath, setBreadcrumbPath] = useState([]);

    useEffect(() => {
        let { path, title } = getBreadcrumbPath(
            appContext.appModules,
            appContext.moduleFeatures,
            pathname,
        );
        setBreadcrumbPath(path);
        changeDocTitle(title);
    }, [appContext.appModules, appContext.moduleFeatures, pathname]);

    function getBreadcrumbPath(modules, features, pathname) {
        let path = [];
        let title = "";
        let { hasPath, staticPath } = getPathFromStaticRoutes(pathname);

        if (hasPath) {
            path = staticPath;
            let feature = path[path.length - 1];
            if (feature) title = feature;
            return { path, title };
        }

        features.some(feature => {
            if (feature.type === "INTERNAL_LINK") {
                let trimmedPath = pathname.replace(/[/]/g, "");
                if (feature.feature_key.includes(trimmedPath)) {
                    let parentModule = modules.find(m => m.id === feature.module) || {};
                    if (parentModule.type === "LINK" || parentModule.type === "HIDDEN") {
                        path.push(feature.name);
                    } else if (parentModule.type === "DROPDOWN") {
                        if (parentModule.path) path.push(parentModule.path);
                        path.push(parentModule.name);
                        path.push(feature.name);
                    }
                    return true;
                }
            }

            if (feature.type === "PAGE" || feature.type === "IFRAME") {
                let split = feature.slug ? "page/" : ":id=";
                let arr = pathname.split(split);
                let trimmedPath = arr[1];

                if (feature.id.includes(trimmedPath) || feature.slug === trimmedPath) {
                    let parentModule = modules.find(m => m.id === feature.module) || {};
                    if (parentModule.type === "LINK" || parentModule.type === "HIDDEN") {
                        path.push(feature.name);
                    } else if (parentModule.type === "DROPDOWN") {
                        if (parentModule.path) path.push(parentModule.path);
                        path.push(parentModule.name);
                        path.push(feature.name);
                    }
                    return true;
                }
            }
        });

        let feature = path[path.length - 1];
        if (feature) title = feature;

        return { path, title };
    }

    function getPathFromStaticRoutes(path) {
        let staticPath = [];
        let hasPath = false;
        staticRoutes.forEach(route => {
            if (path == route.path) {
                staticPath.push(route.name);
                hasPath = true;
            }
        });
        return { hasPath, staticPath };
    }

    function changeDocTitle(title) {
        if (title) {
            document.title = `${appContext?.channel?.brand_title} | ${title}`;
        } else {
            document.title = `${appContext?.channel?.brand_title}`;
        }
    }

    return (
        <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 py-4 px-6 overflow-x-auto whitespace-nowrap hide-scrollbar border-b border-gray-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
            <span className="font-medium text-gray-900 dark:text-white">
                {appContext?.channel?.brand_title}
            </span>
            {breadcrumbPath.map((name, i) => (
                <div key={i} className="flex items-center">
                    <i className="fa-solid fa-chevron-right text-[10px] mx-2 text-gray-400 dark:text-slate-500"></i>
                    <span className={breadcrumbPath.length - 1 === i ? "font-medium text-indigo-600 dark:text-indigo-400" : ""}>
                        {name}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default Breadcrumb;
