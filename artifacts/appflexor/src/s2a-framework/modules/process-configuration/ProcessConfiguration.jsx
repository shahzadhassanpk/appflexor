import React, { lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppContext } from "../../../AppContext";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import { getAuthorizedTabs } from "../../utils/utils";
import Loading from "../../components/Loading/loading";
import "./process-config.css";

const ProcessEngine  = lazy(() => import("./ProcessEngine"));
const ProcessCategory     = lazy(() => import("./process-category/ProcessCategory"));
const ProcessBusinessArea = lazy(() => import("./process-category/ProcessBusinessArea"));
const ProcessMap     = lazy(() => import("./process-map/ProcessMap"));
const ProcessMonitor = lazy(() => import("./process-monitor/ProcessMonitor"));
const Processes      = lazy(() => import("./processes/Processes"));

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
        active: "true",
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
        description: "Design and adjust process workflows and mappings",
    },
    {
        name: "Monitor Processes",
        code: "PROCESS_MONITOR",
        icon: "fa-solid fa-chart-line",
        active: "false",
        description: "Track performance, status, and analytics of running processes",
    },
];

const componentRegistry = {
    PROCESS_ENGINE:  ProcessEngine,
    PROCESS_CATEGORY: ProcessCategory,
    BUSINESS_AREA:   ProcessBusinessArea,
    PROCESS_MAP:     ProcessMap,
    PROCESSES:       Processes,
    PROCESS_MONITOR: ProcessMonitor,
};

/* Scroll helper — tries immediately, then retries up to ~1 s while tabs render */
function scrollToSection(code, retries = 8) {
    const el = document.getElementById(`section-${code}`);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (retries > 0) {
        setTimeout(() => scrollToSection(code, retries - 1), 120);
    }
}

function ProcessConfiguration() {
    const [tabs, setTabs] = useState([]);
    const [refreshKeys, setRefreshKeys] = useState({});
    const [activeSection, setActiveSection] = useState("");
    const [searchParams] = useSearchParams();
    const scrolledRef = useRef(false);
    const observerRef = useRef(null);

    const appContext  = useContext(AppContext);
    const { profile, featuresSubscription, tenantSubscription } = appContext;

    /* ── resolve authorized tabs ───────────────────────────────────────────── */
    useEffect(() => {
        const authorizedTabs = getAuthorizedTabs(TABS, featuresSubscription);
        if (authorizedTabs.length > 0) setTabs(authorizedTabs);
    }, [featuresSubscription]);

    /* ── deep-link scroll ──────────────────────────────────────────────────── */
    useEffect(() => {
        const section = searchParams.get("section");
        if (!section) {
            window.scrollTo(0, 0);
            return;
        }
        if (scrolledRef.current) return;
        scrolledRef.current = true;
        scrollToSection(section);
    }, [searchParams, tabs]);

    /* ── IntersectionObserver — track active section on scroll ────────────── */
    useEffect(() => {
        if (visible.length === 0) return;

        // Disconnect any previous observer before creating a new one
        if (observerRef.current) observerRef.current.disconnect();

        // rootMargin: push the top boundary down past the navbar (60px) + jumpnav (~44px)
        // and shrink the bottom so only the section near the top of the viewport fires
        observerRef.current = new IntersectionObserver(
            entries => {
                // Find the entry that is intersecting and closest to the top
                const intersecting = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (intersecting.length > 0) {
                    const id = intersecting[0].target.id; // "section-BUSINESS_AREA"
                    setActiveSection(id.replace("section-", ""));
                }
            },
            {
                rootMargin: "-108px 0px -70% 0px",
                threshold: 0,
            },
        );

        visible.forEach(tab => {
            const el = document.getElementById(`section-${tab.code}`);
            if (el) observerRef.current.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, [visible]);

    /* ── helpers ───────────────────────────────────────────────────────────── */
    function refreshTable(code) {
        setRefreshKeys(prev => ({ ...prev, [code]: (prev[code] || 0) + 1 }));
    }

    function showTab(tab) {
        if (tab.name !== "Process Deployments") return true;
        const isSelfManaged = tenantSubscription?.process_deployment === "SELF_MANAGED";
        const isS2ACloud =
            tenantSubscription?.process_deployment === "S2A_CLOUD" &&
            profile?.username === "padmin";
        return isSelfManaged || isS2ACloud;
    }

    // BUSINESS_AREA is always shown regardless of the subscription gate
    // (mirrors the original force-fallback: visible.find(...) || TABS.find(...))
    const visible = (() => {
        const authorized = tabs.filter(showTab);
        const hasBA = authorized.some(t => t.code === "BUSINESS_AREA");
        if (!hasBA) {
            const baTab = TABS.find(t => t.code === "BUSINESS_AREA");
            return baTab ? [baTab, ...authorized] : authorized;
        }
        return authorized;
    })();

    /* ── jump-nav click ────────────────────────────────────────────────────── */
    function handleJump(e, code) {
        e.preventDefault();
        scrollToSection(code, 0);
    }

    return (
        <ErrorBoundary>
            <div id="ProcessConfig" className="process-config mb-2 container-fluid static-module-bg">

                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="pc-page-header mb-3">
                    <div className="pc-page-header-icon">
                        <i className="fa-solid fa-gears" />
                    </div>
                    <div>
                        <h5 className="mb-0">Orchestrate Business Processes</h5>
                        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                            Define business areas, deploy, configure, and monitor your processes.
                        </p>
                    </div>
                </div>

                {/* ── Jump nav (sticky) ───────────────────────────────────── */}
                {visible.length > 1 && (
                    <nav className="pc-jumpnav" aria-label="Jump to section">
                        {visible.map(tab => (
                            <a
                                key={tab.code}
                                href={`#section-${tab.code}`}
                                className={`pc-jumplink${activeSection === tab.code ? " pc-jumplink--active" : ""}`}
                                onClick={e => handleJump(e, tab.code)}
                            >
                                <i className={tab.icon} aria-hidden="true" />
                                <span>{tab.name}</span>
                            </a>
                        ))}
                    </nav>
                )}

                {/* ── Sections ────────────────────────────────────────────── */}
                {visible.length > 0 ? (
                    <div className="row">
                        <div className="container">
                            {visible.map(tab => {
                                const Component = componentRegistry[tab.code];
                                if (!Component) return null;
                                return (
                                    <div
                                        id={`section-${tab.code}`}
                                        className="card mb-4 pc-section-card"
                                        key={tab.code}
                                    >
                                        <div className="card-header border-0 d-flex align-items-center justify-content-between gap-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="pc-section-icon">
                                                    <i className={tab.icon} aria-hidden="true" />
                                                </span>
                                                <div className="d-flex flex-column">
                                                    <strong>{tab.name}</strong>
                                                    {tab.description && (
                                                        <small className="text-muted lh-sm">
                                                            {tab.description}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 flex-shrink-0"
                                                onClick={() => refreshTable(tab.code)}
                                                aria-label={`Refresh ${tab.name}`}
                                                title="Refresh"
                                            >
                                                <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                                                <span className="d-none d-sm-inline">Refresh</span>
                                            </button>
                                        </div>
                                        <div className="card-body p-0 bg-transparent">
                                            <Suspense fallback={<Loading message={`Loading ${tab.name}…`} />}>
                                                {React.createElement(Component, {
                                                    key: `${tab.code}-${refreshKeys[tab.code] || 0}`,
                                                    activeTab: tab.code,
                                                })}
                                            </Suspense>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <NotAuthorized />
                )}
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
