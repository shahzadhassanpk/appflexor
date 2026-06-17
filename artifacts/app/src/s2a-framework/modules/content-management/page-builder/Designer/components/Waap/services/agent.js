import { getData, getSelectedItem } from "../components/CrudApiCall";
import { API_URL } from "../Config";

const agentServices = {
  get: () => {
    const url = `${API_URL}?service.key=multiKey.data`;
    const keys = [
      {
        serviceParams: "",
        dataKey: "agents",
        serviceKey: "waap.list.agents",
        mode: "formData",
      },
    ];

    return getData({
      url,
      keys,
    });
  },
  getById: (id) => {
    const url = `${API_URL}?service.key=multiKey.data`;
    const serviceKey = "waap.lead.contact";

    return getSelectedItem({
      id,
      url,
      serviceKey,
    });
  },
};

export { agentServices };
