import axios from "axios";
import { API_URL } from "../Config";

export default function getChannels(subscription, setItems, callback) {
    var dataRequest = {
        dataKeys: [
            {
                serviceParams: subscription,
                dataKey: "appChannel",
                serviceKey: "sys.site",
                mode: "formData",
            },
        ],
    };
    axios
        .post(API_URL + "?service.key=master.data", dataRequest)
        .then(response => {
            if (response.status === 200) {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.appChannel) {
                        let items = response.data.C_DATA.appChannel;
                        setItems(items);
                        callback && callback(items);
                    } else {
                        setItems([]);
                        callback && callback([]);
                    }
                }
            }
        })
        .catch(error => {
            console.error(error);
        });
}
