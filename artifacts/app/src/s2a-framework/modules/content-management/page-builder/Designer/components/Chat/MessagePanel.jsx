import React, { useContext, useEffect, useRef, useState } from "react";
import ChatContext from "./ChatContext";
import { FILE_URL, IMAGE_BASE } from "../../../../../../Config";
import { AppContext } from "../../../../../../../AppContext";
import { Interweave } from "interweave";
import { formatDateTimeForUserView } from "../../../../../../utils/utils";
import { toast } from "react-toastify";
import { tryToParse } from "../../../../../data-management/form-builder/Forms/FormViewer/utils";
// import userLogo from "/theme/images/default-user-profile-img.png";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";

const MessagePanel = () => {
    const { profile } = useContext(AppContext);
    const {
        messages,
        sentMessage,
        selectedInquiry,
        selectedInquiryId,
        organizationImagesMap,
        activeTab,
    } = useContext(ChatContext);
    const [message, setMessage] = useState("");
    const [show, setShow] = useState({
        uploadOptions: false,
    });

    if (selectedInquiry?.profile_img) {
        imageUrl = `${IMAGE_BASE}/dir_user/${selectedInquiryId}/${selectedInquiry?.profile_img}`;
    }

    const handleSubmit = () => {
        const formData = {
            id: "new",
            recipient: selectedInquiry?.createdby,
            message: message,
            from_org: selectedInquiry?.from_org,
            to_org: selectedInquiry?.to_org,
            inquiry_id: selectedInquiryId,
        };
        sentMessage(formData, "MESSAGE");
        setMessage("");
        toastEmitter("Message Sent");
    };

    const organizationImage =
        activeTab === "SENT"
            ? organizationImagesMap[selectedInquiry?.to_org]
            : organizationImagesMap[selectedInquiry?.from_org];

    const organizationId =
        activeTab === "SENT"
            ? selectedInquiry?.to_org
            : selectedInquiry?.from_org;

    const organizationImageUrl = `${FILE_URL}/dir_organization/${organizationId}/${organizationImage}`;

    return (
        <div
            // onClick={() => messageOptionModalRef.current.close()}
            className="h-100 position-relative d-flex flex-column chat-panel">
            {selectedInquiryId ? (
                <>
                    <div className="p-1 message-header">
                        {/* <span>{selectedInquiry?.name}</span> */}
                        {organizationImageUrl} {selectedInquiry?.to_org} {selectedInquiry?.from_org}
                        <div className="d-flex align-items-center gap-3 ms-3">
                            {organizationImageUrl && (
                                <img
                                    className="chat-organization-image"
                                    src={organizationImageUrl}
                                />
                            )}
                            {/* <img
                                src={userLogo}
                                className="chat-default-user"
                            /> */}
                            <div>
                                <div className="fw-bold pt-2">
                                    {selectedInquiry?.title}
                                </div>
                                <div className="pb-2">
                                    {selectedInquiry?.organization_name}
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-4 me-4 chat-header-actions">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                        </div>
                    </div>
                    <ul
                        className="list-group chat-messages scroll-chat"
                        id="messages">
                        {Array.isArray(messages) &&
                            messages.map((msg, index) => {
                                const userImage = msg.profile_img
                                    ? `${FILE_URL}/dir_user/${msg?.user_id}/${msg?.profile_img}`
                                    : "/theme/images/default-user-profile-img.png";
                                return (
                                    <li
                                        className={`list-item message-item ${
                                            msg.createdby === profile?.username
                                                ? "message-sender"
                                                : "message-receiver"
                                        }`}
                                        key={index}>
                                        <img
                                            src={userImage}
                                            className="chat-default-user size-small mt-1"
                                        />
                                        {/* <img
                                        src={userLogo}
                                        className="chat-default-user size-small mt-1"
                                    /> */}
                                        <div className="message">
                                            {/* <pre>
                                            <code>
                                                {JSON.stringify(msg, null, 2)}
                                            </code>
                                        </pre> */}
                                            
                                            <Message item={msg.message} />
                                            <div className="d-flex justify-content-end message-datecreated">
                                            {msg?.from_user} {formatDateTimeForUserView(
                                                    msg?.datecreated,
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                    </ul>
                    <div
                        id="form"
                        className="chat-form">
                        {show.uploadOptions && (
                            <div className="chat-upload-options">
                                <UploadOptions />
                            </div>
                        )}
                        <i
                            onClick={() =>
                                setShow({
                                    ...show,
                                    uploadOptions: !show.uploadOptions,
                                })
                            }
                            className="fa-solid fa-plus message-plus-btn"></i>
                        <input
                            id="input"
                            className="form-control p-2 chat-input"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Type a message"
                        />
                        {message ? (
                            <i
                                onClick={handleSubmit}
                                className="fa-solid fa-paper-plane message-send-btn"></i>
                        ) : (
                            <i className="fa-solid fa-microphone message-recording-btn"></i>
                        )}
                    </div>
                </>
            ) : (
                <Welcome />
            )}
        </div>
    );
};

export default MessagePanel;

const Welcome = () => {
    const { channel, profile } = useContext(AppContext);
    return (
        <div className="chat-welcome-page">
            {/* <span>
                <img
                    className="chat-brand-logo"
                    src={`/file/service/app_site/${channel?.id}/${channel?.brand_logo}`}
                    alt={channel?.brand_title}
                />
            </span> */}
            <div className="d-flex flex-column justify-content-center mt-3 gap-2">
                <div className="d-flex gap-2 align-items-center">
                    <h1 className="m-0 fw-bold text-capitalize">
                        Welcome {profile?.username}
                    </h1>
                    <i className="fa-solid fa-hand"></i>
                </div>
                <h2 className="m-0">
                    {/* <Interweave content={channel?.brand_title}></Interweave>{" "} */}
                    Please select or create new inquiry !
                </h2>
                {/* <p className="fs-4">
                    <Interweave content={channel?.brand_text}></Interweave>
                </p> */}
            </div>
        </div>
    );
};

const Message = props => {
    const { item } = props;
    const parseMessage = tryToParse(item);

    if (parseMessage?.type === "string")
        return <String item={parseMessage?.msg} />;
    else if (parseMessage?.type === "audio")
        return <Audio item={parseMessage?.msg} />;
    else if (parseMessage?.type === "video")
        return <Video item={parseMessage?.msg} />;
    else if (parseMessage?.type === "image")
        return <Image item={parseMessage?.msg} />;
};

const String = props => {
    const { item } = props;
    return <span>{item}</span>;
};

const Audio = () => {};
const Video = () => {};
const Image = () => {};

const UploadOptions = () => {
    const items = [
        { name: "Document", code: "DOCUMENT", icon: "fa-solid fa-file" },
        {
            name: "Photos & Videos",
            code: "PHOTOS&VIDEOS",
            icon: "fa-solid fa-photo-film",
        },
    ];

    const [selectedOption, setSelectedOption] = useState("");

    return (
        <List
            data={items}
            renderItem={({ item }) => {
                return (
                    <div
                        key={item.code}
                        className={`row ${
                            item.code === selectedOption
                                ? "active-upload-option"
                                : "upload-option"
                        }`}>
                        <input
                            type="file"
                            id="file-input"
                            // onChange={handleImageChange}
                            accept="image/*"
                            style={{ display: "none" }} // Hide the input
                        />
                        <label
                            onClick={() => {
                                setSelectedOption(item?.code);
                            }}
                            style={{
                                cursor: "pointer",
                            }}
                            htmlFor="file-input"
                            className={`${item.icon} col-2`}></label>
                        <label
                            onClick={() => {
                                setSelectedOption(item?.code);
                            }}
                            htmlFor="file-input"
                            style={{
                                cursor: "pointer",
                            }}
                            className="col">
                            {item.name}
                        </label>
                    </div>
                );
            }}
        />
    );
};

const List = ({ data, renderItem }) => {
    return data?.map(item => {
        return renderItem({ item });
    });
};
