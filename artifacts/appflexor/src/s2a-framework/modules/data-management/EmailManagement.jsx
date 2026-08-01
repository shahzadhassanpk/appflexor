import React, { Suspense, useEffect, useState, lazy } from "react";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import Loading from "../../components/Loading/loading";
const DataList = lazy(() =>
    import("./datalist-builder/datalist-designer/DataList"),
);
const EmailProfiles = lazy(() => import("./EmailProfiles"));
const EmailTemplates = lazy(() => import("./EmailTemplates"));
// import Reports from "./ReportTemplates";
// import ReportsConfig from "./ReportsConfig";

const TABS = [    
    {
        name: "Email Accounts",
        code: "EMAIL_PROFILE",
        active: "false",
    },
    {
        name: "Email Templates",
        code: "EMAIL_TEMPLATES",
        active: "false",
    },
];

const componentRegistry = {
    EMAIL_PROFILE: EmailProfiles,
    EMAIL_TEMPLATES: EmailTemplates,
};

export default function EmailManagement() {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const authorizedTabs = TABS;

        if (authorizedTabs.length > 0) {
            const initialTab = authorizedTabs[0];
            const withActiveInitialTab = authorizedTabs.map((tab, i) => {
                if (i === 0) {
                    return { ...tab, active: "true" };
                } else return tab;
            });

            setActiveTab(initialTab.code);
            setTabs(withActiveInitialTab);
        }
    }, [TABS]);

    function handleTabsChange(code) {
        let activetab = "";

        let updatedTabs = tabs.map(tab => {
            if (tab.code === code) {
                activetab = tab.code;
                return { ...tab, active: "true" };
            } else return { ...tab, active: "false" };
        });

        setActiveTab(activetab);
        setTabs(updatedTabs);
    }

    return (
        <ErrorBoundary>
            <div
                id="EmailManagement"
                className="email-management container-fluid static-module-bg">
                <div className="row">
                    <div className="col-sm-12 datalist-viewer">
                        <div className="s2a-datalist-header">
                            <div className="s2a-dl-title-wrapper">
                                <div className="s2a-dl-title">
                                    <span>Administrate Outbound Emails</span>
                                </div>
                                <span>Manage email accounts and templates for system‑generated messages.</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="container">
                        <ul className="nav nav-tabs">
                            {tabs.map(tab => {
                                return (
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${tab.active === "true"
                                                    ? "active"
                                                    : ""
                                                } `}
                                            data-bs-toggle="tab"
                                            data-bs-target={`#${tab.code}`}
                                            type="button"
                                            onClick={event =>
                                                handleTabsChange(tab.code)
                                            }>
                                            {tab.name}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        <Suspense
                            fallback={
                                <Loading message={`Loading ${activeTab}`} />
                            }>
                            <div className="tab-content">
                                {
                                    // tabs.length > 0 ? (
                                    //     tabs.map((tab, index) => {
                                    //         return (
                                    //             <CreateComponent
                                    //                 key={index}
                                    //                 component={tab}
                                    //                 componentList={componentRegistry}
                                    //                 activeTab={activeTab}
                                    //             />
                                    //         );
                                    //     })
                                    activeTab ? (
                                        <CreateComponent
                                            key={activeTab}
                                            component={tabs.find(
                                                tab => tab.code === activeTab,
                                            )}
                                            componentList={componentRegistry}
                                            activeTab={activeTab}
                                        />
                                    ) : (
                                        <NotAuthorized />
                                    )
                                }
                            </div>
                        </Suspense>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

function CreateComponent({ component, componentList, activeTab }) {
    if (typeof componentList[component.code] !== "undefined") {
        return (
            <div
                className={`tab-pane fade ${component.code === activeTab ? "active show" : ""
                    } `}
                id={component.code}>
                {React.createElement(componentList[component.code], {
                    key: component.code,
                    activeTab,
                })}
            </div>
        );
    }

    return <NotAuthorized />;
}

function NotAuthorized({ waitBeforeShow = 500 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? (
        <div
            style={{ minHeight: "50vh" }}
            className="d-flex align-items-center justify-content-center">
            <div className="text-center">
                <p className="">
                    You are not <span className="text-danger">authorized</span>{" "}
                    to access this feature.
                </p>
            </div>
        </div>
    ) : null;
}
