import axios from "axios";
import { API_URL } from "../Config";

const handleSave = obj => {
    try {
        const {
            entity,
            formData,
            url = `${API_URL}?service.key=update.formData`,
            datasource,
        } = obj;
        var request = {};
        request.data = [];
        request = {
            datasource: datasource ? datasource : "",
            saveOrUpdate: "Yes",
            data: [
                {
                    formId: entity,
                    entity: entity,
                    action: "update",
                    formData: formData,
                    mode: "formData",
                    id: formData.id,
                },
            ],
        };
        return new Promise((resolve, reject) => {
            axios.post(url, request).then(response => {
                if (response.status === 200) {
                    resolve(response);
                } else {
                    resolve(response);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
};

const handleMultiSave = obj => {
    try {
        const {
            items,
            url = `${API_URL}?service.key=update.formData`,
            datasource = "",
            entity,
        } = obj;
        var request = {};
        request.data = [];
        request = {
            saveOrUpdate: "Yes",
            datasource: datasource,
            data: [],
        };
        items.forEach(item => {
            request.data.push({
                formId: item.entity ? item.entity : entity,
                entity: item.entity ? item.entity : entity,
                action: "update",
                formData: item,
                mode: "formData",
                id: item.id,
            });
        });
        return new Promise((resolve, reject) => {
            axios.post(url, request).then(response => {
                if (response.status === 200) {
                    resolve(response);
                } else {
                    resolve(response);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
};

const getData = obj => {
    const {
        keys = [],
        url = API_URL + "?service.key=masterKey.tenantData",
        datasource = "",
        tenant_id = "",
    } = obj;
    let request = {
        tenant_id: tenant_id,
        datasource: datasource,
    };
    request.dataKeys = [];
    keys.forEach((key, index) => {
        let obj = {
            serviceParams: key?.params ? key.params : "",
            dataKey: key.dataKey ? key.dataKey : index,
            serviceKey: key.serviceKey ? key.serviceKey : "",
            datasource: key.datasource ? key.datasource : "",
            mode: "formData",
        };
        request.dataKeys.push(obj);
    });
    return new Promise((resolve, reject) => {
        axios.post(url, request).then(response => {
            if (response.status === 200) {
                resolve(response);
            } else {
                resolve(response);
            }
        });
    });
};

const getSelectedItem = ({
    id = "",
    url = API_URL + "?service.key=masterKey.tenantData",
    serviceKey = "",
    datasource = "",
    tenant_id = "",
}) => {
    const keys = [
        {
            params: id,
            dataKey: id,
            serviceKey: serviceKey,
            mode: "formData",
        },
    ];
    return getData({ keys, url, datasource, tenant_id });
};

const handleDelete = obj => {
    try {
        const { entity, url, datasource, arr } = obj;
        var request = {
            datasource: datasource ? datasource : "",
        };
        request.data = [];
        arr.forEach(id => {
            let obj = {
                formId: entity,
                entity: entity,
                action: "delete",
                id: id,
            };
            request.data.push(obj);
        });

        return new Promise((resolve, reject) => {
            axios.post(url, request).then(response => {
                if (response.status === 200) {
                    resolve(response);
                } else {
                    resolve(response);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
};

export { handleSave, getData, handleDelete, getSelectedItem, handleMultiSave };
