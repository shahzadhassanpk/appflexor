import axios from "axios";
import {
    getData,
    getSelectedItem,
} from "../../../../../../components/CrudApiCall";
import { API_URL, SOCKET_MSG_URL } from "../../../../../../Config";

function inquiresBySelectedTab(activeTab, profile) {
    const request = {
        keys: [],
        url: API_URL + "?service.key=multiKey.data",
    };

    switch (activeTab) {
        case "SENT": {
            request.keys.push({
                params: profile?.organizationid,
                dataKey: "inquires",
                serviceKey: "chat.list.inq.sent",
            });
            break;
        }
        case "RECEIVED": {
            request.keys.push({
                params: profile?.organizationid,
                dataKey: "inquires",
                serviceKey: "chat.list.inq.received",
            });
            break;
        }
    }

    return request;
}

const chatService = {
    getMessaages(id) {
        const keys = [
            {
                params: id,
                dataKey: "inquiryMessages",
                serviceKey: "chat.list.inq.msg",
            },
        ];

        return getData({
            keys,
            url: API_URL + "?service.key=multiKey.data",
        });
    },
    getInquiryCount(subId) {
        const url = SOCKET_MSG_URL + "?service.key=inq.sub";
        const formData = {
            subId,
        };

        return axios.post(url, formData);
    },
    getInquiriesAndCountPromises(activeTab, profile) {
        const request = inquiresBySelectedTab(activeTab, profile);

        const url = SOCKET_MSG_URL + "?service.key=inq.sub";
        const formData = {
            subId: profile?.username,
        };
        const p1 = getData(request);
        const p2 = axios.post(url, formData);
        return Promise.all([p1, p2]);
    },
    subscribeWebSocket(subId, org_id) {
        const url = SOCKET_MSG_URL + "?service.key=add.sub";
        const formData = {
            subId,
            org_id,
        };

        return axios.post(url, formData);
    },
    markMessagesAsRead(subId, inqId) {
        const url = SOCKET_MSG_URL + "?service.key=inq.markread";
        const formData = {
            subId,
            inqId,
        };
        return axios.post(url, formData);
    },
    getInquiresAndOrganizationsAndCountsPromises(activeTab, profile) {
        
        const promises = [];
        const request = inquiresBySelectedTab(activeTab, profile);
        request.keys.push({
            params: "",
            dataKey: "organizations",
            serviceKey: "chat.list.org",
        });
        const p1 = getData(request);
        promises.push(p1);        

        const url = SOCKET_MSG_URL + "?service.key=inq.sub";
        const formData = {
            subId: profile?.username,
        };

        const p2 = axios.post(url, formData);
        promises.push(p2);

        const getUserOrg = {
            keys: [],
            datasource: "",
            tenant_id: "",
        };
        getUserOrg.keys.push({
            params: profile.organizationid,
            dataKey: "userOrgaziation",
            serviceKey: "sys.dir.selected.organization",
        });
        const p3 = getData(getUserOrg);
        promises.push(p3);
        return Promise.all(promises);
    },
    getMessagesAndMarkreadAndGetcountPromises(id, sameInquiry, profile) {
        const promises = [];
        const keys = [
            {
                params: id,
                dataKey: "inquiryMessages",
                serviceKey: "chat.list.inq.msg",
            },
        ];
        if (sameInquiry) {
            const p1 = getData({
                keys,
                url: API_URL + "?service.key=multiKey.data",
            });
            promises.push(p1);
        }

        const markMessageUrl = SOCKET_MSG_URL + "?service.key=inq.markread";
        const markMessage = {
            subId: profile?.username,
            inqId: id,
        };

        const p2 = axios.post(markMessageUrl, markMessage);
        promises.push(p2);

        const countUrl = SOCKET_MSG_URL + "?service.key=inq.sub";
        const countRequest = {
            subId: profile?.username,
        };

        const p3 = axios.post(countUrl, countRequest);
        promises.push(p3);

        return Promise.all(promises);
    },
    getMessagesAndMarkreadPromises(inqId, username) {
        const promises = [];
        const keys = [
            {
                params: inqId,
                dataKey: "inquiryMessages",
                serviceKey: "chat.list.inq.msg",
            },
        ];
        const p1 = getData({
            keys,
            url: API_URL + "?service.key=multiKey.data",
        });
        promises.push(p1);

        const markMessageUrl = SOCKET_MSG_URL + "?service.key=inq.markread";
        const markMessage = {
            subId: username,
            inqId,
        };

        const p2 = axios.post(markMessageUrl, markMessage);
        promises.push(p2);

        return Promise.all(promises);
    },
    getInquiriesPromise(activeTab, profile) {
        const request = inquiresBySelectedTab(activeTab, profile);

        return getData(request);
    },
    markAllRead(ids, username) {
        const url = SOCKET_MSG_URL + "?service.key=inq.markread";
        const promises = [];
        for (let id of ids) {
            const formData = {
                subId: username,
                inqId: id,
            };
            const promise = axios.post(url, formData);
            promises.push(promise);
        }
        return Promise.all(promises);
    },
    inquiryByIdPromise(id) {
        return getSelectedItem({
            id,
            url: `${API_URL}?service.key=multiKey.data`,
            serviceKey: "chat.inq.by.id",
        });
    },
};

export { chatService };
