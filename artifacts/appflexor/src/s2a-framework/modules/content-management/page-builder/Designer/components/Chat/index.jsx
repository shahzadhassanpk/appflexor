import React, { useState, useEffect, useRef, useContext } from "react";
import { handleSave } from "../../../../../../components/CrudApiCall";
import { AppContext } from "../../../../../../../AppContext";
import { SOCKET_MSG_URL } from "../../../../../../Config";
import { Tabs } from "../../../../../../components/tabs";
import { chatService } from "./chatServices";
import MessagePanel from "./MessagePanel";
import ChatContext from "./ChatContext";
import InquireList from "./InquireList";

const ChatApp = () => {
    const { profile } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState("SENT");
    const [messages, setMessages] = useState([]);
    const [inquires, setInquires] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [selectedInquiryId, setSelectedInquiryId] = useState("");
    const [countUnreadMessages, setCountUnreadMessages] = useState({});
    const [organizationImagesMap, setOrganizationImagesMap] = useState({});
    const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

    const socket = useRef(null);
    const tabs = [
        {
            id: "SENT",
            label: "Sent",
        },
        {
            id: "RECEIVED",
            label: "Received",
        },
    ];

    // const selectedInquiry =
    //     Array.isArray(inquires) &&
    //     inquires?.find(user => user.id === selectedInquiryId);

    useEffect(() => {
        if (profile?.username && profile?.organizationid) {
            subscribeSocket(profile?.username, profile?.organizationid);
        }
    }, [profile?.username, profile?.organizationid]);

    // useEffect(() => {
    //     if (!profile?.organizationid || socket.current) return;
    //     // Your effect
    //     if (!socket.current) {
    //         socket.current = new WebSocket(
    //             `wss://ws.step2agility.com/wss/${profile?.organizationid}`,
    //         );
    //     }
    //     const ws = socket.current;

    //     ws.onopen = event => {
    //         console.log("Websocket connected **********");
    //         subscribeSocket(profile?.username, profile.organizationid, "app_event");
    //     };
    //     ws.onclose = event => {
    //         console.log("Websocket closed **********");
    //     };
    //     ws.onmessage = function (event) {
    //         // debugger
    //         const messageJson = JSON.parse(event.data);
    //         const msgeInq = messageJson?.object_id;
    //         const sameInquiry = selectedInquiryId === msgeInq;
    //         console.log(
    //             "Websocket new message **********" +
    //                 JSON.stringify(messageJson),
    //         );

    //         // console.log(messageJson);

    //         if (messageJson.event === "CREATE") {
    //             getInquiryById(messageJson?.object_id);
    //         } else {
    //             if (sameInquiry) {
    //                 getMessagesAndMarkreadAndGetCount(
    //                     sameInquiry,
    //                     messageJson?.object_id,
    //                 );
    //             } else {
    //                 getMessageCounts();
    //             }
    //         }
    //         // try {
    //         //     console.log(
    //         //         "Websocket Getting new message ******* " +
    //         //             JSON.stringify(json),
    //         //     );
    //         // } catch (err) {
    //         //     console.log(err);
    //         // }
    //     };

    //     return () => {
    //         // Cleanup
    //         if (socket.current) {
    //             socket.current.close();
    //         }
    //     };
    // }, [
    //     profile,
    //     // profile?.username,
    //     // profile?.organizationid,
    //     // selectedInquiryId,
    //     // inquires,
    //     // countUnreadMessages,
    //     // activeTab,
    // ]);

    useEffect(() => {
        if (activeTab) {
            getInquiriesAndOrganizationsAndCounts();
            // setSelectedInquiryId("");
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedInquiryId && profile?.username) {
            getMessagesAndMarkread(selectedInquiryId, profile?.username);
            // getMessagesAndMarkreadAndGetCount(true, selectedInquiryId);
        }
        console.log("selectedInquiryId ********* "+selectedInquiryId)
    }, [selectedInquiryId, profile?.username]);

    const handleTabChange = tab => {
        setActiveTab(tab.id);
    };

    async function getMessagesAndMarkread(inqId, username) {
        const response = await chatService.getMessagesAndMarkreadPromises(
            inqId,
            username,
        );
        const [messagesResponse] = response;
        setMessages(messagesResponse?.data?.C_DATA?.inquiryMessages);
    }

    function updateCounts(inquiryCounts = [], username = "") {
        const counts = {};
        inquiryCounts?.forEach(inquiryCount => {
            counts[`username:${username}|inquiryid:${inquiryCount?.INQ_ID}`] =
                inquiryCount?.MSG_COUNT;
        });
        setCountUnreadMessages(counts);
    }

    async function getInquiresAndCount() {
        const response = await chatService.getInquiriesAndCountPromises(
            activeTab,
            profile,
        );
        const [inquiresResponse, countResponse] = response;
        setInquires(inquiresResponse?.data?.C_DATA?.inquires);
        updateCounts(countResponse?.data?.C_DATA, profile?.username);
    }

    async function getMessageCounts() {
        const response = await chatService.getInquiryCount(profile?.username);
        const inquiryCounts = response?.data?.C_DATA;
        updateCounts(inquiryCounts, profile?.username);
    }

    async function getMessagesAndMarkreadAndGetCount(sameInquiry, id) {
        const response =
            await chatService.getMessagesAndMarkreadAndGetcountPromises(
                id,
                sameInquiry,
                profile,
            );

        if (response.length === 3) {
            const [
                messageResponse,
                markMessagesResponse,
                countMessagesResponse,
            ] = response;
            const inquiryCounts = countMessagesResponse?.data?.C_DATA;
            setMessages(messageResponse?.data?.C_DATA?.inquiryMessages);
            updateCounts(inquiryCounts, profile?.username);
        } else if (response.length === 2) {
            const [markMessagesResponse, countMessagesResponse] = response;
            const inquiryCounts = countMessagesResponse?.data?.C_DATA;
            updateCounts(inquiryCounts, profile?.username);
        }
        // for counts
    }

    const makeOrganizationImageMapping = organizations => {
        const mapping = {};

        organizations.forEach(organization => {
            mapping[organization?.id] = organization?.logo;
        });

        setOrganizationImagesMap(mapping);
    };

    async function getInquiriesAndOrganizationsAndCounts() {
        const [response, countResponse, userOrg] =
            await chatService.getInquiresAndOrganizationsAndCountsPromises(
                activeTab,
                profile,
            );

        const inquiryCounts = countResponse?.data?.C_DATA;
        setInquires(response?.data?.C_DATA?.inquires || []);
        setOrganizations(response?.data?.C_DATA?.organizations || []);
        updateCounts(inquiryCounts, profile?.username);
        makeOrganizationImageMapping(
            response?.data?.C_DATA?.organizations || [],
        );
    }

    async function subscribeSocket(subId, org_id) {
        await chatService.subscribeWebSocket(subId, org_id);
    }

    function sentMessage(formData, type) {
        let url = "";
        let data = {
            id: "new",
            recipient: formData?.createdby,
            message: {
                type: typeof formData?.message,
                msg: formData?.message,
            },
            // message: formData?.message,
            from_org: formData?.from_org,
            to_org: formData?.to_org,
            inquiry_id: formData?.inquiry_id,
            product: formData?.product || "",
        };
        if (type === "INITIAL-MESSAGE") {
            // debugger;
            const inqUrl = `${SOCKET_MSG_URL}?service.key=inq.create`;
            data.inquiry_id = formData?.id;

            const messageUrl = `${SOCKET_MSG_URL}?service.key=send.msg`;

            const promise1 = handleSave({
                url: messageUrl,
                formData: data,
                entity: "im_inquiry_message",
            });
            // const promise2 = handleSave({
            //     url: messageUrl,
            //     formData: data,
            //     entity: "im_inquiry_message",
            // });

            return Promise.all([promise1]);
            // return Promise.all([promise1, promise2]);
        } else {
            const url = `${SOCKET_MSG_URL}?service.key=send.msg`;
            data.inquiry_id = formData?.inquiry_id;

            const promise1 = handleSave({
                url,
                formData: data,
                entity: "im_inquiry_message",
            });

            return Promise.all([promise1]);
        }
        // data.inquiry_id = selectedInquiryId;
        // for initial message formData?.id or for existing inquiry selectedInquiryId
    }

    async function getInquiryById(id) {
        const inquiryResponse = await chatService.inquiryByIdPromise(id);
        const inquiry = inquiryResponse?.data?.C_DATA?.[id][0];
        setInquires(prev => [...prev, inquiry]);
    }

    const ids = [
        "d13a2c47-471d-4595-82ac-06ab4d1d0470",
        "e7788336-f319-4592-8442-a373f0cd705f",
        "757756df-c414-4d16-a638-937c4f4d71e2",
        "a26b7933-eaee-4bbd-94a7-2c780df34729",
        "cbf9cf7f-d920-411f-910b-a845b5731ee4",
        "937f1c44-ef3b-49e4-a6d7-ccfdf31b4bc7",
        "f0cb6c5e-b54d-466c-9efe-41650a92b0e3",
        "c2f56a15-35b8-4758-ac5a-f4d9faa102a5",
        "c063af17-f9b4-4eb9-9854-60e89fb0480a",
        "15b172f6-aed8-4565-93bf-0363442b7d1f",
        "38168e69-168e-4f81-9ff6-b7a7bfcdc6c9",
        "e67821ef-c6a3-4baf-a52d-4ff7e85efd0d",
        "72504661-4aee-487b-9457-5b9b5f86ef78",
        "d173d464-020d-4e85-9c15-8f4b389af773",
    ];

    return (
        <ChatContext.Provider
            value={{
                socket,
                messages,
                selectedInquiryId,
                setSelectedInquiryId,
                activeTab,
                inquires,
                organizations,
                selectedOrganizationId,
                setSelectedOrganizationId,
                sentMessage,
                countUnreadMessages,
                getInquiriesAndOrganizationsAndCounts,
                organizationImagesMap,
            }}>
                {selectedInquiryId}
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                handleTabChange={handleTabChange}
            />
            {/* <button
                onClick={async () =>
                    await chatService.markAllRead(ids, "faizan")
                }>
                mark all read
            </button> */}
            <div className="row chat">
                
                <div className="col-12 col-md-4 p-0 inquiries-parent">
                    <InquireList />
                </div>
                <div className="col-12 col-md-8 p-0 chat-panel-parent">
                    <MessagePanel />
                </div>
            </div>
        </ChatContext.Provider>
    );
};

export default ChatApp;
