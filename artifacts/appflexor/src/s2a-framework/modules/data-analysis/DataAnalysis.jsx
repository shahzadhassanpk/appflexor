import React, { lazy, Suspense, useContext, useEffect, useState } from "react";
import { AppContext } from "../../../AppContext";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import { getAuthorizedTabs } from "../../utils/utils";
const Reports = lazy(() => import("./ReportTemplates"));
const ReportsConfig = lazy(() => import("./ReportsConfig"));
const DataCubes = lazy(() =>
    import("./analytics/analytics-designer/AnalyticsDesigner"),
);
const Analytics = lazy(() => import("./analytics/analytics/Analytics"));
import { modeType } from "../data-management/form-builder/Forms/FormViewer";
import Loading from "../../components/Loading/loading";

const TABS = [
    {
        name: "Custom Reports",
        code: "JASPER_REPORT",
        active: "true",
    },
    {
        name: "Reports Configrations",
        code: "REPORTS_CONFIG",
        active: "false",
    },
    {
        name: "Analytic Cubes",
        code: "ANALYTIC_TABLE",
        active: "false",
    },
    {
        name: "Analytic Queries",
        code: "ANALYTICS",
        active: "false",
    },
];

const componentRegistry = {
    JASPER_REPORT: Reports,
    REPORTS_CONFIG: ReportsConfig,
    ANALYTIC_TABLE: DataCubes,
    ANALYTICS: Analytics,
};

function DataAnalysis() {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState("");

    const appContext = useContext(AppContext);
    const { featuresSubscription } = appContext;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const authorizedTabs = getAuthorizedTabs(TABS, featuresSubscription);

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
    }, [featuresSubscription, TABS]);

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
                id="data-analysis"
                className="data-analysis container-fluid static-module-bg s2a-data-analysis">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="module-title">
                            <span>Business Intelligence</span>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="container">
                        <ul
                            className="nav nav-tabs"
                            id="myTab"
                            role="tablist">
                            {tabs.length > 0 &&
                                tabs.map(tab => {
                                    return (
                                        <li
                                            className="nav-item"
                                            key={tab.code}>
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
                        <div className="tab-content">
                            {/* {tabs.length > 0 ? (
                            tabs.map((tab, index) => {
                                return (
                                    <CreateComponent
                                        key={index}
                                        component={tab}
                                        componentList={componentRegistry}
                                        activeTab={activeTab}
                                    />
                                );
                            })
                        ) : (
                            <NotAuthorized />
                        )} */}
                            {activeTab ? (
                                <Suspense
                                    fallback={
                                        <Loading
                                            message={`Loading ${activeTab}`}
                                        />
                                    }>
                                    <CreateComponent
                                        key={activeTab}
                                        component={tabs.find(
                                            tab => tab.code === activeTab,
                                        )}
                                        componentList={componentRegistry}
                                        activeTab={activeTab}
                                    />
                                </Suspense>
                            ) : (
                                <NotAuthorized />
                            )}
                        </div>
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
                    modeType,
                    mode: modeType.render,
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

export default DataAnalysis;
