const createPostRequest = () => {
    return {
        datasource: "",
        data: [
            {
                formId: "",
                entity: "",
                action: "update",
                formData: { id: "new" },
                id: "new",
            },
        ],
    };
};

const triggerPostRequest = () => {
    return {
        datasource: "",
        data: [
            {
                action: "trigger",
                id: "NA",
                executeUpdate: [
                    {
                        serviceKey: "",
                        serviceParams: "",
                    },
                ],
            },
        ],
    };
};

const updatePostRequest = () => {
    return {
        datasource: "",
        data: [
            {
                formId: "",
                entity: "",
                action: "update",
                formData: { id: "" },
                id: "",
            },
        ],
    };
};

const deletePostRequest = () => {
    return {
        data: [
            {
                formId: "",
                entity: "",
                action: "delete",
                id: "",
            },
        ],
    };
};

export {
    createPostRequest,
    updatePostRequest,
    deletePostRequest,
    triggerPostRequest,
};
