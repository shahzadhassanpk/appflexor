import React, { lazy, Suspense, useContext, useEffect, useState } from "react";
import { AppContext } from "../../../AppContext";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import { getAuthorizedTabs } from "../../utils/utils";
import Loading from "../../components/Loading/loading";
const ProcessEngine = lazy(() => import("./ProcessEngine"));
const ProcessCategory = lazy(() =>
    import("./process-category/ProcessCategory"),
);
const ProcessMap = lazy(() => import("./process-map/ProcessMap"));
const ProcessMonitor = lazy(() => import("./process-monitor/ProcessMonitor"));
const Processes = lazy(() => import("./processes/Processes"));

const TABS = [
    // {
    //     name: "Process Engine",
    //     code: "PROCESS_ENGINE",
    //     active: "true",
    // },
    {
        name: "Process Categories",
        code: "PROCESS_CATEGORY",
        active: "true",
    },
    {
        name: "Process Deployments",
        code: "PROCESSES",
        active: "false",
    },

    {
        name: "Process Config",
        code: "PROCESS_MAP",
        active: "false",
    },
    {
        name: "Process Monitor",
        code: "PROCESS_MONITOR",
        active: "false",
    },
];

const componentRegistry = {
    PROCESS_ENGINE: ProcessEngine,
    PROCESS_CATEGORY: ProcessCategory,
    PROCESS_MAP: ProcessMap,
    PROCESSES: Processes,
    PROCESS_MONITOR: ProcessMonitor,
};

function ProcessConfiguration() {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState("");

    const appContext = useContext(AppContext);
    const { profile, userGroups, featuresSubscription, tenantSubscription } =
        appContext;

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
                // return { ...tab, active: "true" };
            }
            // else return { ...tab, active: "false" };
        });

        setActiveTab(activetab);
        // setTabs(updatedTabs);
    }

    const showProcessDeploymentsTab = tab => {
        if (tab.name !== "Process Deployments") {
            return true; // Show all other tabs
        }

        // Conditions for showing the "Process Deployments" tab
        const isSelfManaged =
            tenantSubscription.process_deployment === "SELF_MANAGED";

        const isS2ACloud =
            tenantSubscription.process_deployment === "S2A_CLOUD" &&
            profile.username === "padmin";

        // Show the tab if either condition is met
        return isSelfManaged || isS2ACloud;
    };

    return (
        <ErrorBoundary>
            <div
                id="ProcessConfig"
                className="process-config mb-2 container-fluid static-module-bg">
                {/* <div className="row">
                    <div className="col-sm-3">
                        {`Process Engine: ` + tenantSubscription?.process_engine}
                    </div>
                    <div className="col-sm-3">
                        {`Process Engine URL: ` + tenantSubscription?.process_engine_url}
                    </div>
                </div> */}
                <div className="row">
                    <div className="col-sm-12">
                        <div className="module-title">
                            <span>Process Automation</span>
                            <span>
                                {" - Process Engine > "}
                                {appContext?.tenantSubscription
                                    ?.process_engine === "CAMUNDA_SEVEN"
                                    ? "Camunda 7"
                                    : appContext?.tenantSubscription
                                          ?.process_engine === "CAMUNDA_EIGHT"
                                    ? "Camunda 8"
                                    : ""}
                            </span>
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
                                    // Check visibility for the "Process Deployments" tab
                                    if (
                                        tab.name === "Process Deployments" &&
                                        !showProcessDeploymentsTab(tab)
                                    ) {
                                        return null; // Skip rendering this tab if conditions are not met
                                    }
                                    // if (
                                    //     appContext?.tenantSubscription
                                    //     ?.process_engine === "CAMUNDA_SEVEN" && tab.code === "PROCESS_MONITOR"
                                    // ) {
                                    //     return null; // Skip rendering this tab if conditions are not met
                                    // }
                                    return (
                                        <li
                                            className="nav-item"
                                            key={tab.code}>
                                            <button
                                                className={`nav-link ${
                                                    tab.active === "true"
                                                        ? "active"
                                                        : ""
                                                }`}
                                                data-bs-toggle="tab"
                                                data-bs-target={`#${tab.code}`}
                                                type="button"
                                                onClick={() => {
                                                    handleTabsChange(tab.code);
                                                }}>
                                                {tab.name}
                                            </button>
                                        </li>
                                    );
                                })}
                        </ul>

                        <div
                            className="tab-content"
                            id="myTabContent">
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

export default ProcessConfiguration;
