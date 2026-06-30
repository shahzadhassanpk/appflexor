import axios from "axios";

const handleSave = obj => {
    try {
        const { entity, formData, url, datasource } = obj;
        var request = {};
        request.data = [];
        request = {
            datasource: datasource ? datasource : "",

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

const getData = obj => {
    const { keys, url, datasource, tenant_id } = obj;
    let request = {
        tenant_id: tenant_id,
        datasource: datasource ? datasource : "",
    };
    request.dataKeys = [];
    keys.forEach(key => {
        let obj = {
            serviceParams: key?.params ? key.params : "",
            dataKey: key.dataKey,
            serviceKey: key.serviceKey,
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

export { handleSave, getData, handleDelete };
