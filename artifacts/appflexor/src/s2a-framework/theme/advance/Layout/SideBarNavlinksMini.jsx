import { NavLink, useLocation } from "react-router-dom";

function getFeaturePath(feature) {
    if (feature.type === "IFRAME") return `/iframe:id=${feature.id}`;
    if (feature.type === "PAGE") {
        return feature.slug ? `/page/${feature.slug}` : `/page:id=${feature.id}`;
    }
    return feature.feature_key;
}

function SidebarNavlinksMini({ appModules, moduleFeatures, onExpand }) {
    const { pathname } = useLocation();
    return (
        <div className="d-flex justify-content-end my-1">
            <div className="d-flex flex-column">
                {appModules.map(module => {
                    if (module.location === "FRONTOFFICE") {
                        if (module.type === "LINK") {
                            return (
                                <ModuleDropdownIcon
                                    key={module.id}
                                    module={module}
                                    features={moduleFeatures}
                                    pathname={pathname}
                                    onExpand={onExpand}
                                    showChildren={false}
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
                                    onExpand={onExpand}
                                    showChildren
                                />
                            );
                        }
                    }
                    return null;
                })}
            </div>
        </div>
    );
}

function ModuleDropdownIcon({
    module,
    features,
    pathname,
    onExpand,
    showChildren,
}) {
    const moduleFeatures = features.filter(
        feature => feature.module === module.id,
    );

    function isLinkActive() {
        let filteredFeatures = moduleFeatures;

        if (pathname.includes(":id=")) {
            let trimmedPath = pathname.replace(/[/]/g, "");
            let arr = trimmedPath.split(":id=");
            let id = arr[1];

            let hasValue = filteredFeatures.some(feature => feature.id === id);

            if (hasValue) {
                return true;
            }
        } else {
            let hasValue = filteredFeatures.some(
                feature => feature.feature_key === pathname,
            );
            if (hasValue) {
                return true;
            }
        }
        return false;
    }

    const targetFeature =
        moduleFeatures.find(feature => {
            const targetPath = getFeaturePath(feature).split("?")[0];
            return pathname === targetPath;
        }) || moduleFeatures[0];

    const icon = module.icon || "fa-solid fa-angles-right";

    if (showChildren && moduleFeatures.length > 0) {
        return (
            <div className="mini-nav-section">
                <button
                    type="button"
                    onClick={onExpand}
                    title={module.name}
                    aria-label={`Open ${module.name}`}
                    className={`mini-nav-icon-wrapper mini-nav-section-icon ${
                        isLinkActive() ? "link-active" : ""
                    }`}>
                    <i className={`${icon} mini-nav-icon-size m-0`}></i>
                </button>
                <div className="mini-nav-section-links">
                    {moduleFeatures.map(feature => (
                        <NavLink
                            key={feature.id}
                            to={getFeaturePath(feature)}
                            end
                            title={feature.name}
                            aria-label={feature.name}
                            className={({ isActive }) =>
                                `mini-nav-icon-wrapper mini-nav-child-link ${
                                    isActive ? "link-active" : ""
                                }`
                            }>
                            <i
                                className={`${
                                    feature.icon || "fa-solid fa-angle-right"
                                } mini-nav-icon-size m-0`}></i>
                        </NavLink>
                    ))}
                </div>
            </div>
        );
    }

    if (!targetFeature) {
        return (
            <button
                type="button"
                onClick={onExpand}
                title={module.name}
                aria-label={`Open ${module.name}`}
                className="mini-nav-icon-wrapper">
                <i className={`${icon} mini-nav-icon-size m-0`}></i>
            </button>
        );
    }

    return (
        <NavLink
            to={getFeaturePath(targetFeature)}
            end
            title={module.name}
            aria-label={module.name}
            className={`mini-nav-icon-wrapper ${
                isLinkActive() ? "link-active" : ""
            }`}>
            <i className={`${icon} mini-nav-icon-size m-0`}></i>
        </NavLink>
    );
}

export default SidebarNavlinksMini;
