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
        name: "SQL APIs",
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
];

const componentRegistry = {
    // JASPER_REPORT: Reports,
    // REPORTS_CONFIG: ReportsConfig,
    JDBC_DATA_SOURCES: JdbcDataSource,
    DATA_APIS: DataApi,
    FORM_BUILDER: Forms,
    DATALIST_BUILDER: DataList,
    SCHEMA_EXPLORER: SchemaManagement,
};

export default function DataManagement() {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState("");
    const [loadedTabs, setLoadedTabs] = useState(() => new Set());

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
            setLoadedTabs(new Set([initialTab.code]));
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
        setLoadedTabs(previous => {
            if (previous.has(activetab)) return previous;
            return new Set(previous).add(activetab);
        });
    }

    return (
        <ErrorBoundary>
            <div
                id="DataManagement"
                className="data-management container-fluid static-module-bg">
                <div className="row">
                    <div className="col-sm-12 datalist-viewer">
                        <div className="s2a-datalist-header">
                            <div className="s2a-dl-title-wrapper">
                                <div className="s2a-dl-title">
                                    <span>Administrate Data</span>
                                </div>
                                <span>Design forms, manage data lists, and configure SQL-based APIs</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="container">
                        <ul className="nav nav-tabs">
                            {tabs.map(tab => {
                                return (
                                    <li key={tab.code} className="nav-item">
                                        <button
                                            className={`nav-link ${tab.active === "true"
                                                    ? "active"
                                                    : ""
                                                } `}
                                            data-bs-toggle="tab"
                                            data-bs-target={`#${tab.code}`}
                                            type="button"
                                            onClick={() => handleTabsChange(tab.code)}>
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
                                {activeTab ? (
                                    tabs
                                        .filter(tab => loadedTabs.has(tab.code))
                                        .map(tab => (
                                            <CreateComponent
                                                key={tab.code}
                                                component={tab}
                                                componentList={componentRegistry}
                                                activeTab={activeTab}
                                            />
                                        ))
                                ) : <NotAuthorized />}
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
                    // Keep the child activation value stable after its first mount.
                    // Passing the parent active tab here would make tab-dependent
                    // effects fetch again every time the user switches back.
                    activeTab: component.code,
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
