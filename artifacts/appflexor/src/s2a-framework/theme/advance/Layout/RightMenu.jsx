import React, { useContext, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { staticAdminModuleFeatures, suid } from "../../../staticMenu";

function RightMenu(props) {
    const { isAuthorized, modules, features, screenView, mainItems, channel } =
        props;
    return (
        <div className="container right-menu-container">
            <div
                className="offcanvas offcanvas-end right-menu"
                tabIndex="-1"
                id="rightMenu"
                aria-labelledby="rightMenuLabel">
                <div className="offcanvas-header header">
                    <span
                        className="title"
                        id="rightMenuLabel">
                        <i className="me-2 fa fa-gear"></i>
                        Control Panel
                    </span>
                    <span
                        type="button"
                        className=""
                        data-bs-dismiss="offcanvas"
                        aria-label="Close">
                        <i className="fa-solid fa-xmark"></i>
                    </span>
                </div>
                <div className="offcanvas-body body">
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
        </div>
    );
}

function RightMenuModules(props) {
    const { modules, features, screenView } = props;
    const appContext = useContext(AppContext);
    let location = useLocation();
    const selectedFeature = location.pathname;
    let selectedModule = "";

    selectedModule = staticAdminModuleFeatures.filter(item =>
        [item.feature_key].includes(selectedFeature),
    );
    var selectedModuleId =
        JSON.stringify(selectedModule) !== `[]` &&
        (selectedModule[0].location === "BACKOFFICE" ||
            selectedModule[0].type === "INTERNAL_LINK")
            ? selectedModule[0].module
            : "";
    const [moduleId, setModuleId] = useState(suid);
    const [moduleName, setModuleName] = useState("");
    const [featureId, setFeatureId] = useState(selectedFeature);
    const moduleTypes = [
        { id: 1, label: "Drop Down", code: "DROPDOWN" },
        { id: 1, label: "Link", code: "LINK" },
        { id: 1, label: "Hidden", code: "HIDDEN" },
    ];
    const [_selectedModule, _setSelectedModule] = useState({});
    // const office = localStorage.getItem("office");
    const office = appContext?.office;
    const setOffice = appContext?.setOffice;

    const pageSubString = selectedFeature.substring(1, 5);
    if (features.length !== 0 && pageSubString === "page") {
        const _selectedFeature = selectedFeature.split("=");
        if (_selectedFeature) {
            let feature = features.find(item =>
                [item.id].includes(_selectedFeature[1]),
            );
            selectedModule = modules.find(item => item.id === feature?.module);
            if (
                (selectedModule && selectedModule.location === "BACKOFFICE") ||
                (selectedModule && selectedModule.type === "INTERNAL_LINK")
            ) {
                selectedModuleId = selectedModule.id;
            }
        }
    }

    useEffect(() => {
        // setModuleId(selectedModuleId);
        setFeatureId(selectedFeature);
    }, [selectedFeature]);

    useEffect(() => {
        if (office === "front") {
            setModuleId("");
            setFeatureId("");
        }
    }, [office]);

    return (
        <nav className="s2a-navbar-top navbar">
            <div className="container-fluid module-borderbottom">
                <div
                    id=""
                    className="">
                    <ul className="navbar-nav">
                        {appContext &&
                            appContext.profile &&
                            appContext.userGroups &&
                            appContext.userGroups.groupid &&
                            appContext.userGroups.groupid.includes("ADMIN") &&
                            // appContext.userGroups.groupid.indexOf("ADMIN") >
                            //     -1 &&
                            modules.map((module, index) => {
                                return (
                                    <React.Fragment key={index}>
                                        <RightMenuAdmin
                                            _key={module.id}
                                            screenView={screenView}
                                            features={features}
                                            module={module}
                                            setModuleId={setModuleId}
                                            setModuleName={setModuleName}
                                            moduleId={moduleId}
                                            _setSelectedModule={
                                                _setSelectedModule
                                            }
                                            setOffice={setOffice}
                                            profile={appContext.profile}
                                        />
                                    </React.Fragment>
                                );
                            })}
                        
                        {/*For self hosted <li className="nav-item-custom dropdown">
                            <a
                                title="Custom Back Office Menu"
                                className="mt-1 nav-link  nav-link-override nav-link-override dropdown-toggle"
                                data-bs-toggle="dropdown">
                                Custom
                            </a>
                            <ul className="dropdown-menu dropdown-menu-start  fade-down">
                                {appContext &&
                                    appContext.profile &&
                                    appContext.userGroups &&
                                    appContext.userGroups.groupid &&
                                    appContext.userGroups.groupid.includes(
                                        "ADMIN",
                                    ) &&
                                    // appContext.userGroups.groupid.indexOf("ADMIN") >
                                    //     -1 &&

                                    modules.map((module, index) => {
                                        return (
                                            <React.Fragment key={index}>
                                                <RightMenuApp
                                                    _key={module.id}
                                                    screenView={screenView}
                                                    features={features}
                                                    module={module}
                                                    setModuleId={setModuleId}
                                                    setModuleName={
                                                        setModuleName
                                                    }
                                                    moduleId={moduleId}
                                                    _setSelectedModule={
                                                        _setSelectedModule
                                                    }
                                                    setOffice={setOffice}
                                                    profile={appContext.profile}
                                                />
                                            </React.Fragment>
                                        );
                                    })}
                            </ul>
                        </li> */}
                    </ul>
                </div>
            </div>
            {moduleId && (
                <div className="links">
                    {/* <i className="me-2 fa-solid fa-link"></i> */}
                    {/* {`${moduleName} / Links`} */}
                </div>
            )}
            <div className="container-fluid features-container">
                {/* <span className="p-2 col-sm-12 module-borderbottom">{`${moduleName?moduleName:"Web"} Features`}</span> */}
                {features && features.length > 0 && office !== "front" && (
                    <FeatureListing
                        features={features}
                        screenView={screenView}
                        moduleId={moduleId}
                        featureId={featureId}
                        setFeatureId={setFeatureId}
                        office={office}
                    />
                )}
            </div>
        </nav>
    );
}

function RightMenuAdmin(props) {
    const { module, setModuleId, moduleId, setModuleName, setOffice, profile } =
        props;
    if (module.location === "ADMINOFFICE" && module.type === "DROPDOWN") {
        if ((module.role && module.role === profile.roleid) || !module.role) {
            return (
                <div
                    className="module-feature"
                    onClick={() => {
                        setModuleId(module.id);
                        setModuleName(module.name);
                        setOffice("back");
                    }}>
                    <li className=" cursor-pointer">
                        <span
                            className={
                                moduleId === module.id
                                    ? "module-name selected-module"
                                    : "module-name"
                            }>
                            {module && module.icon ? (
                                <i className={`me-2 ${module.icon}`}></i>
                            ) : null}
                            {module.name}
                        </span>
                    </li>
                </div>
            );
        } else return <></>;
    } else return <></>;
}
function RightMenuApp(props) {
    const { module, setModuleId, moduleId, setModuleName, setOffice, profile } =
        props;
    if (module.location === "BACKOFFICE" && module.type === "DROPDOWN") {
        if ((module.role && module.role === profile.roleid) || !module.role) {
            return (
                <div
                    className="module-feature"
                    onClick={() => {
                        setModuleId(module.id);
                        setModuleName(module.name);
                        setOffice("back");
                    }}>
                    <li className="cursor-pointer">
                        <span
                            className={`dropdown-item ${
                                moduleId === module.id
                                    ? "module-name selected-module"
                                    : "module-name"
                            }`}>
                            {module && module.icon ? (
                                <i className={`me-2 ${module.icon}`}></i>
                            ) : null}
                            {module.name}
                        </span>
                    </li>
                </div>
            );
        } else return <></>;
    } else return <></>;
}
function FeatureListing(props) {
    const { features, screenView, moduleId, featureId, setFeatureId, office } =
        props;

    function selectedOrChangeDoc(feature, e) {
        if (e.ctrlKey) {
        } else {
            if (feature.type !== "PAGE") {
                setFeatureId(feature.feature_key);
            } else if (feature.type === "PAGE") {
                let linkTo = "";
                if (feature.slug) {
                    linkTo = `page/${feature.slug}`;
                } else {
                    linkTo = `page:id=${feature.id}`;
                }

                setFeatureId(linkTo);
            }
        }
    }

    function liClass(feature) {
        let className = "";
        if (feature.type !== "PAGE") {
            if (feature.feature_key === featureId) {
                className = "d-flex align-items-center feature-li selected";
            } else {
                className = "d-flex align-items-center feature-li";
            }
        } else if (feature.type === "PAGE") {
            const id = featureId.split("=")[1];
            if (id === feature.id) {
                className = "d-flex align-items-center feature-li selected";
            } else {
                className = "d-flex align-items-center feature-li";
            }
        }
        return className;
    }

    function navClass(feature) {
        let className = "";
        if (feature.type !== "PAGE") {
            if (`/${feature.feature_key}` === featureId) {
                className = "item selected";
            } else {
                className = "item";
            }
        } else if (feature.type === "PAGE") {
            const id = featureId.split("=")[1];
            if (id === feature.id) {
                className = "item selected";
            } else {
                className = "item";
            }
        }
        return className;
    }

    function linkLocation(feature) {
        let linkTo = "";
        if (feature.type === "IFRAME") {
            linkTo = `/iframe:id=${feature.id}`;
        } else if (feature.type === "PAGE") {
            if (feature.slug) {
                linkTo = `/page/${feature.slug}`;
            } else {
                linkTo = `/page:id=${feature.id}`;
            }
        } else {
            linkTo = feature.feature_key;
        }
        return linkTo;
    }

    return (
        <>
            <ul className="my-2 fade-down list">
                {features.map((feature, i) => {
                    if (feature.module === moduleId) {
                        return (
                            <React.Fragment key={i}>
                                <NavLink
                                    className={navClass(feature)}
                                    onClick={e =>
                                        selectedOrChangeDoc(feature, e)
                                    }
                                    to={linkLocation(feature)}>
                                    <li className={liClass(feature)}>
                                        {feature.icon && (
                                            <i
                                                className={
                                                    feature.icon + " me-2"
                                                }></i>
                                        )}
                                        <div>{feature.name}</div>
                                    </li>
                                </NavLink>
                            </React.Fragment>
                        );
                    }
                })}
            </ul>
        </>
    );
}

export default RightMenu;
