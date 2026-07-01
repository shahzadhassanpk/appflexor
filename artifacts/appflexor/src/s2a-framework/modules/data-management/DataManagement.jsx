import React, { Suspense, useEffect, useState, lazy } from "react";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import Loading from "../../components/Loading/loading";
const DataList = lazy(() =>
    import("../data-management/datalist-builder/datalist-designer/DataList"),
);
const JdbcDataSource = lazy(() => import("./JdbcDataSource"));
const Forms = lazy(() => import("./form-builder/Forms/Forms"));
const DataApi = lazy(() => import("./rest-console/DataApi"));
const EmailProfiles = lazy(() => import("./EmailProfiles"));
const EmailTemplates = lazy(() => import("./EmailTemplates"));
const SchemaManagement = lazy(() =>
    import("./schema-management/schema-management"),
);
// import Reports from "./ReportTemplates";
// import ReportsConfig from "./ReportsConfig";

const TABS = [
    {
        name: "Form Builder",
        code: "FORM_BUILDER",
        active: "true",
    },
    {
        name: "Datalist Builder",
        code: "DATALIST_BUILDER",
        active: "false",
    },
    {
        name: "APIs",
        code: "DATA_APIS",
        active: "false",
    },
    {
        name: "DB Explorer",
        code: "SCHEMA_EXPLORER",
        active: "false",
    },
    {
        name: "Data Sources",
        code: "JDBC_DATA_SOURCES",
        active: "false",
    },
    {
        name: "Email Profile",
        code: "EMAIL_PROFILE",
        active: "false",
    },
    {
        name: "Email Templates",
        code: "EMAIL_TEMPLATES",
        active: "false",
    },
    // {
    //     name: "Custom Reports",
    //     code: "JASPER_REPORT",
    //     active: "false",
    // },
    // {
    //     name: "Reports Config",
    //     code: "REPORTS_CONFIG",
    //     active: "false",
    // },
];

const componentRegistry = {
    // JASPER_REPORT: Reports,
    // REPORTS_CONFIG: ReportsConfig,
    JDBC_DATA_SOURCES: JdbcDataSource,
    DATA_APIS: DataApi,
    FORM_BUILDER: Forms,
    DATALIST_BUILDER: DataList,
    EMAIL_PROFILE: EmailProfiles,
    EMAIL_TEMPLATES: EmailTemplates,
    SCHEMA_EXPLORER: SchemaManagement,
};

export default function DataManagement() {
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
                id="DataManagement"
                className="data-management container-fluid static-module-bg">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="module-title">
                            <span>Data Management</span>
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
                                            className={`nav-link ${
                                                tab.active === "true"
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
                className={`tab-pane fade ${
                    component.code === activeTab ? "active show" : ""
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
