import React, { useState, useEffect } from "react";
import ChatBox from "./ChatBox";
import ChatHistoryPanel from "./ChatHistoryPanel";

const ChatTabs = ({
    chatBoxRef,
    messages,
    selectedLead,
    sendMessage,
    handleBack,
    isMaximized,
    toggleMaximize,
    leadHistory,
    formatDateTimeForUserView,
}) => {
    const [activeTab, setActiveTab] = useState("chat");

    useEffect(() => {
        if (selectedLead) {
            setActiveTab("chat");
        }
    }, [selectedLead]);

    return (
        <>
            {/* Tabs Header */}
            <ul className="nav nav-tabs mb-2">
                <li className="nav-item">
                    <button
                        className={`nav-link ${
                            activeTab === "chat" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("chat")}>
                        New Chat
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${
                            activeTab === "history" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("history")}
                        disabled={!selectedLead}>
                        Chat History
                    </button>
                </li>
            </ul>

            {/* Tabs Content */}
            {activeTab === "chat" && (
                <ChatBox
                    ref={chatBoxRef}
                    messages={messages}
                    selectedLead={selectedLead}
                    onSendMessage={(text, type) => sendMessage(text, type)}
                    handleBack={handleBack}
                    isMaximized={isMaximized}
                    toggleMaximize={toggleMaximize}
                    type={"chat"}
                />
            )}
            {activeTab === "history" && (
                <ChatHistoryPanel
                    _selectedLead={selectedLead}
                    leadHistory={leadHistory}
                    formatDateTimeForUserView={formatDateTimeForUserView}
                    handleBack={handleBack}
                    isMaximized={isMaximized}
                    toggleMaximize={toggleMaximize}
                />
            )}
        </>
    );
};

export default ChatTabs;
