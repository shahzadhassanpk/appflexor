import React, { useEffect, useState, useRef, useContext } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./index.css";
import { API_URL } from "./Config";
import ChatBox from "./ChatBox";
import { AppContext } from "../../../../../../../AppContext";
import DropDown from "./components/DropDown/DropDown";
import iconMap from "./components/DropDown/icons";
import Modal from "./components/Modal";
import Agents from "./components/forms/Agent";
import { EditAgent } from "./components/forms/EditAgent";
import {
    formatDateTimeForUserView,
} from "./utils/utils";
import ChatTabs from "./ChatTabs";
import { AssignProducts } from "./components/forms/AssignProducts";
import { AssignStage } from "./components/forms/AssignStage";

const BASE_URL = "/chat";
const socket = io("wss://ws.step2agility.com", {
    path: "/chat/ws/socket.io/",
    transports: ["websocket"],
    reconnection: true, // default is true
    reconnectionAttempts: 5, // try 5 times
    reconnectionDelay: 2000, // wait 2 sec between attempts
    timeout: 10000, // connection timeout
});

function Waap() {
    const { userGroups, isAuthorized, setIsAuthorized } =
        useContext(AppContext);
    const [isMaximized, setIsMaximized] = useState(false);
    const [leads, setLeads] = useState([]);
    const [unReadList, setUnReadList] = useState([]);
    const [unreadMap, setUnreadMap] = useState({});
    const [selectedItemId, setSelectedItemId] = useState("");
    const [selectedLead, setSelectedLead] = useState(null);
    const [messages, setMessages] = useState([]);
    const [leadHistory, setLeadHistory] = useState([]);
    const [leadSearch, setLeadSearch] = useState("");

    const [receiveMessages, setReceiveMessages] = useState(false);
    const chatBoxRef = useRef(null);
    const lastSelectedLead = useRef(null);

    const [isMobile, setIsMobile] = useState(false);
    const agentsModalRef = useRef(null);
    const editLeadModalRef = useRef(null);
    const assignProductModalRef = useRef(null);
    const assignStageModalRef = useRef(null);

    const leadActions = [
        {
            label: "Assign Agent",
            code: "ASSIGNED",
            icon: iconMap["assigned"],
        },
        {
            label: "Assign Products",
            code: "ASSIGN_PRODUCTS",
            icon: iconMap["assign_products"],
        },
        {
            label: "Assign Stage",
            code: "ASSIGN_STAGE",
            icon: iconMap["assign_stage"],
        },
        {
            label: "Edit Contact",
            code: "EDIT",
            icon: iconMap["pencil"],
        },
        {
            label: "Close Lead",
            code: "CLOSE",
            icon: iconMap["close"],
        },
    ];

    useEffect(() => {
        const unreadCountMap = {};

        unReadList.forEach(item => {
            unreadCountMap[item.lead_id] = item.unread_count;
        });

        setUnreadMap(unreadCountMap);
    }, [unReadList]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const handleResize = e => {
            setIsMobile(e.matches);
        };

        handleResize(mediaQuery);
        mediaQuery.addListener(handleResize);

        return () => {
            mediaQuery.removeListener(handleResize);
        };
    }, []);

    const toggleMaximize = () => {
        setIsMaximized(prev => !prev);
    };

    function handleLogout() {
        localStorage.removeItem("AUTH_KEY");
        localStorage.removeItem("initial_route");

        delete axios.defaults.headers.common["AUTH_KEY"];
        setIsAuthorized(false);
    }

    useEffect(() => {
        console.log("selectedLead:", selectedLead);
    }, [selectedLead]);

    useEffect(() => {
        console.log("selectedLead:", selectedLead);
        reloadMessages();
    }, [receiveMessages]);

    useEffect(() => {
        // let authKey = localStorage.getItem("AUTH_KEY");
        // axios.defaults.headers.common["AUTH_KEY"] = authKey;

        // Message handlers
        socket.on("receiveMessage", () => {
            setReceiveMessages(prev => !prev);
            getUnreadMsg();
            getData();
        });
        // socket.on("sendMessage", reloadMessages);

        // Connection status handlers
        socket.on("connect", () => {
            console.log("✅ Connected:", socket.id);
        });

        socket.on("disconnect", reason => {
            console.warn("⚠️ Disconnected:", reason);
        });

        socket.on("reconnect_attempt", attempt => {
            console.log("🔄 Reconnect attempt:", attempt);
        });

        socket.on("reconnect", () => {
            console.log("✅ Reconnected");
            getUnreadMsg();
            getData(); // Optional: re-fetch state if needed
        });

        getData();
        getUnreadMsg();

        return () => {
            socket.off("receiveMessage");
            socket.off("sendMessage");
            socket.off("connect");
            socket.off("disconnect");
            socket.off("reconnect");
            socket.off("reconnect_attempt");
        };
    }, []);

    const handleBack = () => {
        setSelectedLead(null);
        setMessages([]);
    };

    const sendMessage = (newMessage, type) => {
        // debugger;
        const msg = {
            contact_id: selectedLead?.contact_id,
            message: newMessage,
            type,
        };
        axios
            .post(BASE_URL + `/api/send-message`, msg)
            .then(() => {
                console.log("Message sent successfully");
                getMessages(selectedLead);
            })
            .catch(error => console.error("Error sending message:", error));
    };

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "leadList",
                    serviceKey: "waap.list.leads",
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
                    let leadList = data.leadList;
                    setLeads(leadList);
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

    function getUnreadMsg() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "unReadMsg",
                    serviceKey: "unread.msg",
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
                    let _list = data.unReadMsg;
                    // debugger
                    setUnReadList(_list);
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

    function closeLead(lead) {
        if (!window.confirm("Are you sure you want to close this lead?")) {
            return; // Exit if user cancels
        }

        let fieldsData = lead;
        delete fieldsData.name;
        fieldsData.status = "0";

        let dataRequest = {};
        dataRequest.data = [];

        let entityForm = {
            formId: "waap_lead",
            entity: "waap_lead",
            action: "update",
            id: fieldsData.id && fieldsData.id !== "" ? fieldsData.id : lead.id,
            formData: fieldsData,
        };

        dataRequest.data.push(entityForm);

        axios
            .post(API_URL + "?service.key=update.formData", dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    getData();
                    setSelectedLead(null);
                } else {
                    console.log(
                        "Unable to get data. Please contact system admin.",
                    );
                }
            })
            .catch(error => {
                console.error("Error updating lead:", error);
            });
    }

    function markMessagesAsRead(selectedLead) {
        // debugger;
        const request = {
            method: "POST",
            path: "?service.key=update.formData",
            data: [
                {
                    action: "update",
                    formId: "waap_lead_msg",
                    entity: "waap_lead_msg",
                    id: selectedLead?.id,
                    executeUpdate: [
                        {
                            serviceKey: "mark.as.read",
                            serviceParams: selectedLead?.id,
                        },
                    ],
                },
            ],
        };
        // debugger;
        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    getUnreadMsg();
                }
            })
            .catch(error => {
                console.error(error);
            });
    }
    function reloadMessages() {
        if (!selectedLead) return; // No user selected, do nothing

        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: selectedLead?.id,
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
                    setMessages(_messages);
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

    function getMessages(lead) {
        setSelectedLead(lead);
        lastSelectedLead.current = lead; // ✅ Remember the selected user
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: lead?.id,
                    dataKey: "messages",
                    serviceKey: "waap.lead.messages",
                    mode: "formData",
                },
                {
                    serviceParams: lead?.contact_id,
                    dataKey: "leadHistory",
                    serviceKey: "list.history.leads",
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
                    let _leadHostory = data.leadHistory;
                    setMessages(_messages);
                    setLeadHistory(_leadHostory);
                    setUnReadList(prevList =>
                        prevList.filter(item => item.lead_id !== lead.id),
                    );
                    markMessagesAsRead(lead);
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

    const handleAction = (item, index) => {
        switch (item.code) {
            case "CLOSE": {
                closeLead(selectedLead);
                break;
            }
            case "ASSIGNED": {
                agentsModalRef?.current?.show();
                break;
            }
            case "EDIT": {
                editLeadModalRef?.current?.show();
                break;
            }
            case "ASSIGN_PRODUCTS": {
                assignProductModalRef?.current?.show();
                break;
            }
            case "ASSIGN_STAGE": {
                assignStageModalRef?.current?.show();
                break;
            }
        }
    };

    const showDropdown = id => {
        setSelectedItemId(id);
    };

    const hideDropdown = () => {
        setSelectedItemId("");
    };

    const getLeadInitials = lead => {
        const name = (lead?.name || "").trim();
        if (!name) return "?";
        return name
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() || "")
            .join("");
    };

    const totalUnread = Object.values(unreadMap).reduce(
        (sum, count) => sum + Number(count || 0),
        0,
    );

    const filteredLeads = (leads || []).filter(lead => {
        const query = leadSearch.trim().toLowerCase();
        if (!query) return true;
        const name = String(lead?.name || "").toLowerCase();
        const phone = String(lead?.phone || "").toLowerCase();
        const stage = String(lead?.stage || "").toLowerCase();
        return (
            name.includes(query) ||
            phone.includes(query) ||
            stage.includes(query)
        );
    });

    return (
        <div
            className={`container-fluid chat-main ${
                isMaximized ? "chat-maximized" : ""
            }`}>
            <Modal
                id="AGENTS"
                title="Assign Agent"
                modalRef={agentsModalRef}>
                <Agents
                    hideModal={() => agentsModalRef?.current?.hide()}
                    getData={() => getData()}
                    selectedLead={selectedLead}
                />
            </Modal>
            <Modal
                id="EDIT-LEAD"
                title="Edit Lead"
                modalRef={editLeadModalRef}>
                <EditAgent
                    id={selectedLead?.contact_id}
                    hideModal={() => editLeadModalRef?.current?.hide()}
                    getData={() => getData()}
                    handleBack={handleBack}
                />
            </Modal>

            <Modal
                id="ASSIGN-PRODUCT"
                title="Assign Product"
                modalRef={assignProductModalRef}>
                <AssignProducts
                    id={selectedLead?.id}
                    hideModal={() => assignProductModalRef?.current?.hide()}
                    getData={() => getData()}
                    handleBack={handleBack}
                    selectedLead={selectedLead}
                />
            </Modal>
            <Modal
                id="ASSIGN-STAGE"
                title="Assign Stage"
                modalRef={assignStageModalRef}>
                <AssignStage
                    id={selectedLead?.id}
                    hideModal={() => assignStageModalRef?.current?.hide()}
                    getData={() => getData()}
                    handleBack={handleBack}
                    selectedLead={selectedLead}
                />
            </Modal>

            <div className="row p-2 waap-shell">
                {/* Left Sidebar: Hidden on mobile if a user is selected */}
                <div className={`d-flex`}>
                    {(!isMobile || (isMobile && !selectedLead?.id)) && (
                        <div className="col-12 col-md-4 col-lg-3 lead-list">
                            <div className="p-2 fw-semibold lead-title mb-2 waap-list-header">
                                <div className="waap-list-top-row row">
                                    <div className="title d-flex align-items-center col-sm-12">
                                        <div
                                            className="me-2 add-pointer"
                                            onClick={toggleMaximize}>
                                            {isMaximized ? (
                                                <i
                                                    className="fa fa-compress"
                                                    title="Restore"></i>
                                            ) : (
                                                <i
                                                    className="fa fa-expand"
                                                    title="Maximize"></i>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center waap-chat-heading">
                                            Chats ({filteredLeads.length})
                                        </div>
                                        <span className="waap-unread-chip ms-2">
                                            {totalUnread}
                                        </span>
                                    </div>
                                        {/* <div className="waap-list-actions col-sm-6">
                                            <button
                                                type="button"
                                                className="btn waap-icon-btn"
                                                onClick={() => {
                                                    const input = document.getElementById(
                                                        "waapLeadSearch",
                                                    );
                                                    input?.focus();
                                                }}>
                                                <i className="bi bi-search"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn waap-icon-btn"
                                                title="Start New Chat">
                                                <i className="bi bi-plus-lg"></i>
                                            </button>
                                        </div> */}
                                </div>
                                {/* <div className="waap-list-search mt-2">
                                    <input
                                        id="waapLeadSearch"
                                        type="text"
                                        className="form-control"
                                        placeholder="Search or start new chat"
                                        value={leadSearch}
                                        onChange={e =>
                                            setLeadSearch(e.target.value)
                                        }
                                    />
                                </div> */}
                            </div>
                            <ul className="list-group list-group-flush flex-grow-1 overflow-auto enable-scroll">
                                {filteredLeads?.map(
                                    lead =>
                                        lead.id && (
                                            <li
                                                onMouseEnter={() =>
                                                    showDropdown(lead?.id)
                                                }
                                                onMouseLeave={hideDropdown}
                                                key={lead.id}
                                                className={`lead-item mb-2 ${
                                                    selectedLead?.id === lead.id
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    getMessages(lead)
                                                }
                                                style={{ cursor: "pointer" }}>
                                                <div className="col-sm-12 d-flex space-between lead-row">
                                                    <div className="lead-avatar">
                                                        {getLeadInitials(lead)}
                                                    </div>
                                                    <div className="col-sm-10 d-flex flex-column align-items-start">
                                                        <div className="col-sm-12 title d-flex w-100 justify-content-between align-items-start">
                                                            <div className="text-truncate pe-2">
                                                                {lead?.name == ""
                                                                    ? "Unknown"
                                                                    : lead.name}
                                                            </div>
                                                            <span className="lead-time text-nowrap">
                                                                {formatDateTimeForUserView(
                                                                    lead.datecreated,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="col-sm-12 d-flex align-items-center">
                                                            <span className="lead-phone text-truncate">
                                                                {lead.phone}
                                                            </span>
                                                            {unreadMap[lead.id] > 0 && (
                                                                <span className="badge bg-primary ms-2 waap-unread-badge">
                                                                    {unreadMap[lead.id]}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="col-sm-12 timestamp">
                                                            {" | CSO: "}
                                                            {lead.agent_assigned}
                                                        </div>

                                                        <div className="col-sm-12 timestamp d-flex align-items-center gap-1 mt-1">
                                                            <span className={`waap-stage-badge STAGE-${lead.stage}`}>
                                                                {lead?.stage}
                                                            </span>
                                                            <span className="waap-product-name text-truncate">
                                                                {lead.product_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {selectedItemId ===
                                                        lead.id && (
                                                        <div className="dropdown d-flex position-relative">
                                                            <span
                                                                className="btn"
                                                                type="button"
                                                                id="leadActionsDropdown"
                                                                data-bs-toggle="dropdown"
                                                                aria-expanded="false">
                                                                <i className="bi bi-three-dots-vertical"></i>
                                                            </span>

                                                            <ul
                                                                className="dropdown-menu"
                                                                aria-labelledby="leadActionsDropdown">
                                                                {leadActions.map(
                                                                    (
                                                                        action,
                                                                        index,
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                index
                                                                            }>
                                                                            <button
                                                                                className="dropdown-item d-flex align-items-center"
                                                                                onClick={() =>
                                                                                    handleAction(
                                                                                        action,
                                                                                    )
                                                                                }>
                                                                                {action.icon && (
                                                                                    <span className="me-2">
                                                                                        {
                                                                                            action.icon
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                                {
                                                                                    action.label
                                                                                }
                                                                            </button>
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </div>

                                                        // <DropDown
                                                        //     id="left-panel-dropdown"
                                                        //     icon="verticalDots"
                                                        //     items={leadActions}
                                                        //     handleAction={
                                                        //         handleAction
                                                        //     }
                                                        //     classes={{
                                                        //         parent: "d-flex position-relative",
                                                        //     }}
                                                        // />
                                                    )}
                                                </div>
                                            </li>
                                        ),
                                )}
                            </ul>
                            <div className="waap-list-footer">
                                <button type="button" className="btn waap-icon-btn">
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                                <span className="waap-page-pill">1</span>
                                <button type="button" className="btn waap-icon-btn">
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Right ChatBox */}
                    {(selectedLead?.id || !isMobile) && (
                        <>
                            <div
                                className={`chat-container col-18 col-md-8 col-lg-9 d-flex flex-column`}>
                                <ChatTabs
                                    chatBoxRef={chatBoxRef}
                                    messages={messages}
                                    selectedLead={selectedLead}
                                    sendMessage={sendMessage}
                                    handleBack={handleBack}
                                    isMaximized={isMaximized}
                                    toggleMaximize={toggleMaximize}
                                    leadHistory={leadHistory}
                                    formatDateTimeForUserView={
                                        formatDateTimeForUserView
                                    }
                                />
                            </div>

                            {/* <div
                                className={`col-18 col-md-8 col-lg-6 d-flex flex-column`}>
                                <ChatBox
                                    ref={chatBoxRef}
                                    messages={messages}
                                    selectedLead={selectedLead}
                                    onSendMessage={(text, type) => {
                                        sendMessage(text, type);
                                    }}
                                    handleBack={handleBack}
                                    isMaximized={isMaximized}
                                    toggleMaximize={toggleMaximize}
                                />
                            </div>
                            <div
                                className="chat-history-panel p-2 border-start"
                                style={{
                                    flex: 1,
                                    overflowY: "auto",
                                    maxHeight: "80vh",
                                }}>
                                <ChatHistoryPanel
                                    leadHistory={leadHistory}
                                    formatDateTimeForUserView={
                                        formatDateTimeForUserView
                                    }
                                />
                            </div> */}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export { Waap };
