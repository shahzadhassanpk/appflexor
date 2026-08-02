import React, { lazy, Suspense, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../Config";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import Loading from "../../components/Loading/loading";
import "./ai-services.css";

const AiProviders = lazy(() => import("./providers/AiProviders"));
const AiAgents    = lazy(() => import("./agents/AiAgents"));
const AiTasks     = lazy(() => import("./tasks/AiTasks"));

const TABS = [
    { name: "AI Providers", code: "AI_PROVIDERS", icon: "fa-solid fa-plug-circle-bolt" },
    { name: "AI Agents",    code: "AI_AGENTS",    icon: "fa-solid fa-robot"            },
    { name: "AI Tasks",     code: "AI_TASKS",     icon: "fa-solid fa-list-check"       },
];

function AiServices() {
    const [activeTab, setActiveTab]         = useState("AI_PROVIDERS");
    const [selectedAgent, setSelectedAgent] = useState(null);

    // Initialise DB tables for all three entities on first load
    useEffect(() => {
        window.scrollTo(0, 0);
        ["ai_provider", "ai_agent", "ai_task"].forEach(entity => {
            axios
                .post(API_URL + "?service.key=validate.schema", { formId: entity })
                .catch(err => console.log("validate.schema [" + entity + "]:", err));
        });
    }, []);

    function handleTabChange(code) {
        setActiveTab(code);
    }

    // Called from AiAgents when user clicks "Open Tasks"
    function handleOpenAgentTasks(agent) {
        setSelectedAgent(agent);
        setActiveTab("AI_TASKS");
    }

    function renderActive() {
        switch (activeTab) {
            case "AI_PROVIDERS":
                return <AiProviders />;
            case "AI_AGENTS":
                return <AiAgents onOpenTasks={handleOpenAgentTasks} />;
            case "AI_TASKS":
                return (
                    <AiTasks
                        selectedAgent={selectedAgent}
                        onChangeAgent={setSelectedAgent}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <ErrorBoundary>
            <div className="ai-services static-module-bg container-fluid">
                {/* Page header */}
                <div className="row">
                    <div className="col-sm-12 datalist-viewer">
                        <div className="s2a-datalist-header">
                            <div className="s2a-dl-title-wrapper">
                                <div className="s2a-dl-title">
                                    <i className="fa-solid fa-robot me-2" />
                                    <span>AI Services</span>
                                </div>
                                <span>
                                    Configure AI providers, agents, and task definitions consumed
                                    by N8N webhook integrations.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="row">
                    <ul className="nav nav-tabs ai-nav-tabs" role="tablist">
                        {TABS.map(tab => (
                            <li key={tab.code} className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === tab.code ? "active" : ""}`}
                                    onClick={() => handleTabChange(tab.code)}
                                    type="button">
                                    <i className={`${tab.icon} me-1`} />
                                    {tab.name}
                                    {tab.code === "AI_TASKS" && selectedAgent && (
                                        <span className="ai-agent-badge ms-2">
                                            {selectedAgent.agentKey}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="tab-content ai-tab-content">
                        <Suspense fallback={<Loading message={`Loading ${activeTab}…`} />}>
                            {renderActive()}
                        </Suspense>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default AiServices;
