import { getData } from "../components/CrudApiCall";
import { API_URL } from "../Config";

const productServices = {
  getAll: () => {
    const url = `${API_URL}?service.key=multiKey.data`;
    const keys = [
      {
        serviceParams: "",
        dataKey: "products",
        serviceKey: "list.lead.products", // <-- Adjust to your actual service key
        mode: "formData",
      },
    ];

    return getData({
      url,
      keys,
    });
  },
};

export { productServices };
