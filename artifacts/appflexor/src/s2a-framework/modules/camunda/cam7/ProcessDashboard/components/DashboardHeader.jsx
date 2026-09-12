/* eslint-disable react/prop-types */
import { DASHBOARD_TABS } from "../constants";
import TabButton from "./TabButton";

export default function DashboardHeader({
    showHeader,
    activeTab,
    setActiveTab,
    title,
    scopeLabel,
    lastUpdated,
    loading,
    onRefresh,
}) {
    const tabs = (
        <div className="process-dashboard__tab-row flex flex-wrap gap-1.5">
            <TabButton
                active={activeTab === DASHBOARD_TABS.LIVE}
                icon="fa-solid fa-satellite-dish"
                label="Live Monitoring"
                onClick={() => setActiveTab(DASHBOARD_TABS.LIVE)}
            />
            <TabButton
                active={activeTab === DASHBOARD_TABS.HISTORY}
                icon="fa-solid fa-timeline"
                label="History"
                onClick={() => setActiveTab(DASHBOARD_TABS.HISTORY)}
            />
        </div>
    );

    if (!showHeader) {
        return tabs;
    }

    return (
        <div className="process-dashboard__header rounded-2xl border px-3 py-2.5">
            <div className="process-dashboard__header-row flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                <div className="process-dashboard__header-copy min-w-0">
                    <div className="process-dashboard__header-title-row flex flex-wrap items-center gap-2">
                        <div className="process-dashboard__chip inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                            <i
                                className={`fa-solid ${
                                    activeTab === DASHBOARD_TABS.LIVE
                                        ? "fa-wave-square"
                                        : "fa-clock-rotate-left"
                                }`}
                                aria-hidden="true"
                            />
                            {activeTab === DASHBOARD_TABS.LIVE ? "Live" : "History"}
                        </div>
                        <h2 className="process-dashboard__title mb-0 text-base font-bold">{title}</h2>
                    </div>
                    <p className="process-dashboard__scope mb-0 mt-1 text-xs">{scopeLabel}</p>
                </div>
                <div className="process-dashboard__header-actions flex flex-wrap items-center gap-2">
                    {tabs}
                    <div className="process-dashboard__meta flex flex-wrap items-center gap-1.5 text-xs">
                        <span>Updated {lastUpdated}</span>
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={loading}
                            className="process-dashboard__refresh btn button-theme btn-sm rounded-pill px-2.5 py-1">
                            <i
                                className={`fa-solid fa-rotate me-2 ${loading ? "fa-spin" : ""}`}
                            />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
