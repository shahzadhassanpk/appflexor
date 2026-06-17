import { handleSave } from "../components/CrudApiCall";

const leadServices = {
  patch: (formData) => {
    return handleSave({
      entity: "waap_lead",
      formData,
    });
  },
};

export { leadServices };
