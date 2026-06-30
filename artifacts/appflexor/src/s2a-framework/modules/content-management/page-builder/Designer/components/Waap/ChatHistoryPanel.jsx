import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { API_URL } from "./Config";
import ChatBox from "./ChatBox";

function ChatHistoryPanel({
    _selectedLead,
    leadHistory = [],
    formatDateTimeForUserView,
    handleBack,
    isMaximized,
    toggleMaximize,
}) {
    const [messageHistory, setMessageHistory] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const chatBoxRef = useRef(null);

    const handleItemClick = item => {
        setSelectedItem(item); // Update selected item state
        getMessages(item); // Call getMessages with the selected item
    };

    function getMessages(lead) {
        setSelectedLead(lead);
        // lastSelectedLead.current = lead; // ✅ Remember the selected user
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: lead?.id,
                    dataKey: "messages",
                    serviceKey: "waap.lead.messages",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=multiKey.data", dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    let data = response.data.C_DATA;
                    let _messages = data.messages;

                    setMessageHistory(_messages);
                } else {
                    console.log(
                        "Unable to get data. Please contact system admin.",
                    );
                }
            })
            .catch(error => {
                // setErrorMessage(error);
            });
    }
    return (
        <>
            <div className="chat-history d-flex flex-row justify-content-between">
                {/* Chat History Section */}
                <div className="chat-history-container d-flex flex-column col-sm-4">
                    {/* <div className="p-2 lead-title d-table">
                        <div className="title">
                            {_selectedLead?.name} ({_selectedLead?.phone})
                        </div>
                        <div className="timestamp">Last 30 days chats</div>
                    </div> */}

                    <ul className="p-2 lead-list-history list-group list-group-flush enable-scroll scroll-y">
                        {leadHistory.length ? (
                            leadHistory.map((item, i) => (
                                <li
                                    key={i}
                                    className={`lead-item mb-2 ${
                                        selectedItem?.id === item.id
                                            ? "active"
                                            : ""
                                    }`}
                                    style={{ cursor: "default" }}
                                    onClick={() => handleItemClick(item)} // Use handleItemClick
                                >
                                    <div className="col-sm-12 d-flex space-between">
                                        <div className="col-sm-12 d-flex flex-column align-items-start">
                                            <div className="col-sm-12 d-flex w-100">
                                                {"CSO: "}
                                                {item.agent_assigned}
                                            </div>
                                            <div className="col-sm-12 timestamp">
                                                {formatDateTimeForUserView(
                                                    item.datecreated,
                                                )}{" "}
                                                {" | CSO: "}
                                                {item.agent_assigned}
                                            </div>
                                            <div
                                                className={`col-sm-12 timestamp p-1 STAGE-${item.stage}`}>
                                                <span>
                                                    [{item?.stage}]{" "}
                                                    {item.product_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="list-group-item text-muted">
                                No history yet
                            </li>
                        )}
                    </ul>
                </div>

                {/* Chat Box Section */}
                <div className="d-flex flex-column col-sm-8">
                    <ChatBox
                        ref={chatBoxRef}
                        messages={messageHistory}
                        selectedLead={selectedLead}
                        onSendMessage={(text, type) => sendMessage(text, type)}
                        handleBack={handleBack}
                        isMaximized={isMaximized}
                        toggleMaximize={toggleMaximize}
                        type={"history"}
                    />
                </div>
            </div>
        </>
    );
}

export default ChatHistoryPanel;
