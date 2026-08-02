import React, { lazy, Suspense, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppContext } from "../../../AppContext";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import { getAuthorizedTabs } from "../../utils/utils";
import Loading from "../../components/Loading/loading";
import "./process-config.css";

const ProcessEngine      = lazy(() => import("./ProcessEngine"));
const ProcessCategory    = lazy(() => import("./process-category/ProcessCategory"));
const ProcessBusinessArea = lazy(() => import("./process-category/ProcessBusinessArea"));
const ProcessMap         = lazy(() => import("./process-map/ProcessMap"));
const ProcessMonitor     = lazy(() => import("./process-monitor/ProcessMonitor"));
const Processes          = lazy(() => import("./processes/Processes"));

const TABS = [
    {
        name: "Business Areas",
        code: "BUSINESS_AREA",
        icon: "fa-solid fa-layer-group",
        active: "true",
        description: "Set up organisational domains to group related processes",
    },
    {
        name: "Process Categories",
        code: "PROCESS_CATEGORY",
        icon: "fa-solid fa-folder-tree",
        active: "false",
        description: "Organise processes into structured categories for clarity",
    },
    {
        name: "Deploy Processes",
        code: "PROCESSES",
        icon: "fa-solid fa-rocket",
        active: "false",
        description: "Launch new or updated processes into production",
    },
    {
        name: "Configure Processes",
        code: "PROCESS_MAP",
        icon: "fa-solid fa-diagram-project",
        active: "false",
        description: "Configure process category, business area, start form and access control settings for each process",
    },
    {
        name: "Monitor Processes",
        code: "PROCESS_MONITOR",
        icon: "fa-solid fa-chart-line",
        active: "false",
        description: "Track and troubleshoot process execution, monitor status, and analytics of running processes",
    },
];

const componentRegistry = {
    PROCESS_ENGINE:   ProcessEngine,
    PROCESS_CATEGORY: ProcessCategory,
    BUSINESS_AREA:    ProcessBusinessArea,
    PROCESS_MAP:      ProcessMap,
    PROCESSES:        Processes,
    PROCESS_MONITOR:  ProcessMonitor,
};

function ProcessConfiguration() {
    const [tabs, setTabs]           = useState([]);
    const [activeTab, setActiveTab] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchParams]            = useSearchParams();

    const appContext = useContext(AppContext);
    const { profile, featuresSubscription, tenantSubscription } = appContext;

    /* ── build visible tab list ─────────────────────────────────────────────── */
    function showTab(tab) {
        if (tab.name !== "Process Deployments") return true;
        const isSelfManaged = tenantSubscription?.process_deployment === "SELF_MANAGED";
        const isS2ACloud =
            tenantSubscription?.process_deployment === "S2A_CLOUD" &&
            profile?.username === "padmin";
        return isSelfManaged || isS2ACloud;
    }

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const authorized = getAuthorizedTabs(TABS, featuresSubscription).filter(showTab);

        // BUSINESS_AREA is always shown regardless of subscription gate
        const hasBA = authorized.some(t => t.code === "BUSINESS_AREA");
        const visible = hasBA
            ? authorized
            : [TABS.find(t => t.code === "BUSINESS_AREA"), ...authorized].filter(Boolean);

        if (visible.length === 0) return;

        // Honour ?section=CODE deep-link, else default to first tab
        const requestedSection = searchParams.get("section");
        const initialCode =
            requestedSection && visible.some(t => t.code === requestedSection)
                ? requestedSection
                : visible[0].code;

        setTabs(visible);
        setActiveTab(initialCode);
    }, [featuresSubscription]);

    /* ── tab switch ─────────────────────────────────────────────────────────── */
    function handleTabChange(code) {
        setActiveTab(code);
        setRefreshKey(0);  // reset refresh counter on tab switch
        window.scrollTo(0, 0);
    }

    const activeTabMeta = tabs.find(t => t.code === activeTab);

    return (
        <ErrorBoundary>
            <div
                id="ProcessConfig"
                className="process-config container-fluid static-module-bg">

                {/* ── Page header ───────────────────────────────────────────── */}
                <div className="row">
                    <div className="col-sm-12 datalist-viewer">
                        <div className="s2a-datalist-header">
                            <div className="s2a-dl-title-wrapper">
                                <div className="s2a-dl-title">
                                    <span>Orchestrate</span>
                                </div>
                                <span>
                                    Define business areas, deploy, configure, and monitor your processes.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tab bar ───────────────────────────────────────────────── */}
                <div className="row">
                    <ul className="nav nav-tabs" role="tablist">
                        {tabs.map(tab => (
                            <li key={tab.code} className="nav-item">
                                <button
                                    type="button"
                                    role="tab"
                                    className={`nav-link pc-tab-btn${activeTab === tab.code ? " active" : ""}`}
                                    aria-selected={activeTab === tab.code}
                                    onClick={() => handleTabChange(tab.code)}
                                >
                                    <i className={`${tab.icon} pc-tab-icon`} aria-hidden="true" />
                                    <span>{tab.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* ── Tab content ───────────────────────────────────────── */}
                    <div className="tab-content">
                        {activeTab ? (
                            <>
                                {/* Sub-header: description + refresh */}
                                {activeTabMeta && (
                                    <div className="pc-content-header">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="pc-section-icon">
                                                <i className={activeTabMeta.icon} aria-hidden="true" />
                                            </span>
                                            <small className="text-muted">
                                                {activeTabMeta.description}
                                            </small>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 flex-shrink-0"
                                            onClick={() => setRefreshKey(k => k + 1)}
                                            title="Refresh"
                                        >
                                            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                                            <span className="d-none d-sm-inline">Refresh</span>
                                        </button>
                                    </div>
                                )}

                                <div className="tab-pane fade active show">
                                    <Suspense fallback={<Loading message={`Loading ${activeTabMeta?.name ?? activeTab}…`} />}>
                                        {React.createElement(
                                            componentRegistry[activeTab],
                                            { key: `${activeTab}-${refreshKey}`, activeTab },
                                        )}
                                    </Suspense>
                                </div>
                            </>
                        ) : (
                            <NotAuthorized />
                        )}
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

/* ── Not-authorised placeholder ─────────────────────────────────────────────── */
function NotAuthorized({ waitBeforeShow = 500 }) {
    const [isShown, setIsShown] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setIsShown(true), waitBeforeShow);
        return () => clearTimeout(t);
    }, [waitBeforeShow]);
    return isShown ? (
        <div
            style={{ minHeight: "50vh" }}
            className="d-flex align-items-center justify-content-center">
            <div className="text-center">
                <p>
                    You are not <span className="text-danger">authorized</span> to access
                    this feature.
                </p>
            </div>
        </div>
    ) : null;
}

export default ProcessConfiguration;
