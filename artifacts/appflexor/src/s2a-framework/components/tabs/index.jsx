import React from "react";

const Tabs = params => {
    const { tabs, activeTab, handleTabChange } = params;

    return (
        <ul className="nav nav-tabs">
            {tabs.map(tab => {
                return (
                    <li
                        key={tab.id}
                        className="nav-item"
                        role="presentation">
                        <button
                            className={`nav-link ${
                                activeTab === tab.id ? "active" : ""
                            }`}
                            onClick={event => handleTabChange(tab)}>
                            {tab.label}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export { Tabs };
