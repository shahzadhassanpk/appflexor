import React, { useState, forwardRef } from "react";
import MessageRenderer from "./MessageRenderer";
import "./index.css";
import { useDeviceInfo } from "./hooks/useDeviceInfo";
import {
    formatDateForUserView,
    formatDateTimeForUserView,
} from "./utils/utils";
import FileUploader from "./components/FileUploader";
import VoiceMessageSender from "./components/VoiceMessageSender";

const ChatBox = forwardRef(
    ({
        messages = [],
        onSendMessage,
        selectedLead,
        handleBack,
        isMaximized,
        toggleMaximize,
        type,
    }) => {
        const [showDialog, setShowDialog] = useState(false);
        const [newMessage, setNewMessage] = useState("");
        const [mediaData, setMediaData] = useState({});
        const { width, device } = useDeviceInfo();

        const handleSend = () => {
            if (!newMessage.trim()) return;
            onSendMessage(newMessage, "text");
            setNewMessage("");
        };

        const handleSale = () => {
            setShowDialog(true);
        };

        const closeDialog = () => {
            setShowDialog(false);
        };

        const handleFileUpload = event => {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = () => {
                const base64String = reader.result.split(",")[1]; // Extract Base64 content
                // console.log("Base64 Encoded File:", base64String); // Logging for debugging
                setMediaData(prevMedia => ({
                    type: "media",
                    mediaData: base64String,
                    mimeType: file.type,
                    caption: "Optional caption for the media",
                }));
                console.log(
                    "mediaData******************************:",
                    mediaData,
                ); // Logging for debugging
            };

            reader.readAsDataURL(file);
        };

        return (
            <div className="d-flex flex-column w-100 message-box shadow-sm">
                {selectedLead ? (
                    <>
                        {/* Header */}
                        <div className="p-2 fw-semibold lead-title d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                {device === "mobile" && (
                                    <button
                                        className="btn back-button me-2"
                                        onClick={handleBack}>
                                        <i className="bi bi-arrow-left"></i>
                                    </button>
                                )}
                                <div>
                                    <div className="title">
                                        {selectedLead?.name == ""
                                            ? "Unknown"
                                            : selectedLead.name}{" "}
                                        ({selectedLead.phone})
                                    </div>
                                    <div className="timestamp">
                                        {formatDateTimeForUserView(
                                            selectedLead.datecreated,
                                        )}{" "}
                                        <span className={`p-1 STAGE-${selectedLead.stage}`}>[{selectedLead?.stage}] {selectedLead.product_name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <MessageRenderer messages={messages} />

                        {/* Message Input */}
                        {type && type === "chat" && (
                            <div className="lead-message-box">
                                <div className="col-sm-1">
                                    <FileUploader
                                        onSendMessage={
                                            onSendMessage
                                        }></FileUploader>
                                </div>
                                <div className="col-sm-11 d-flex align-items-center">
                                    <input
                                        type="text"
                                        className="form-control me-2"
                                        value={newMessage}
                                        onChange={e =>
                                            setNewMessage(e.target.value)
                                        }
                                        onKeyDown={e =>
                                            e.key === "Enter" && handleSend()
                                        }
                                        placeholder="Type a message"
                                    />
                                    <button
                                        className="btn btn-success"
                                        onClick={handleSend}
                                        disabled={!newMessage.trim()}>
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Modal with Iframe */}
                        {showDialog && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <button
                                        className="close-button"
                                        onClick={closeDialog}>
                                        ✕
                                    </button>
                                    <iframe
                                        src={`/app/page-form-viewer?formKey=waap_sale&businessKey=new&lead_id=${selectedLead.id}&external=true&embed=true`} // Replace with your actual sale form URL
                                        title="Create Sale"
                                        className="iframe-dialog"></iframe>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="d-flex justify-content-center align-items-center flex-grow-1">
                        Select a user to start chatting
                    </div>
                )}
            </div>
        );
    },
);

export default ChatBox;
