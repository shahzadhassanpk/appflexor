import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../../../../AppContext";

const staticRoutes = [
    {
        path: "/user-profile",
        name: "User Profile",
    },
    {
        path: "/form-viewer",
        name: "Form Viewer",
    },
    {
        path: "/start-process",
        name: "Start Process",
    },
];

function Breadcrumb(params) {
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

            if (feature) {
                title = feature;
            }

            return { path, title };
        }

        features.some(feature => {
            if (feature.type === "INTERNAL_LINK") {
                let trimmedPath = pathname.replace(/[/]/g, "");

                if (feature.feature_key.includes(trimmedPath)) {
                    let parentModule = {};

                    modules.map(module => {
                        if (module.id === feature.module) {
                            parentModule = module;
                        }
                    });

                    if (
                        parentModule.type === "LINK" ||
                        parentModule.type === "HIDDEN"
                    ) {
                        path.push(feature.name);
                    } else if (parentModule.type === "DROPDOWN") {
                        if (parentModule.path) {
                            path.push(parentModule.path);
                        }
                        path.push(parentModule.name);
                        path.push(feature.name);
                    }

                    return true;
                }
            }

            if (feature.type === "PAGE" || feature.type === "IFRAME") {
                let split = ":id=";
                // For feature type IFRAME slug will always be empty
                if (feature.slug) {
                    split = "page/";
                }

                let arr = pathname.split(split);
                let trimmedPath = arr[1];

                if (
                    feature.id.includes(trimmedPath) ||
                    feature.slug === trimmedPath
                ) {
                    let parentModule = {};

                    modules.map(module => {
                        if (module.id === feature.module) {
                            parentModule = module;
                        }
                    });

                    if (
                        parentModule.type === "LINK" ||
                        parentModule.type === "HIDDEN"
                    ) {
                        path.push(feature.name);
                    } else if (parentModule.type === "DROPDOWN") {
                        if (parentModule.path) {
                            path.push(parentModule.path);
                        }
                        path.push(parentModule.name);
                        path.push(feature.name);
                    }

                    return true;
                }
            }
        });

        let feature = path[path.length - 1];

        if (feature) {
            title = feature;
        }

        return { path, title };
    }

    function getPathFromStaticRoutes(path) {
        let staticPath = [];
        let hasPath = false;
        staticRoutes.map(route => {
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
        <div
            id="breadcrumb"
            className="breadcrumb-typo breadcrumb-gap d-flex align-items-center">
            <nav className="align-self-end">
                <ol className="breadcrumb m-0">
                    <li className={`breadcrumb-item`}>
                        {appContext?.channel?.brand_title}
                    </li>
                    {breadcrumbPath.map((name, i) => {
                        return (
                            <li
                                className={`breadcrumb-item`}
                                key={i}>
                                <span
                                    className={` ${
                                        breadcrumbPath.length - 1 === i
                                            ? "breadcrumb-item-active"
                                            : ""
                                    }`}>
                                    {name}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}

export default Breadcrumb;
