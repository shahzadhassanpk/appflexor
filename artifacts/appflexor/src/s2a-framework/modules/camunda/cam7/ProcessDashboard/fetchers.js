import axios from "axios";
import { API_URL } from "../../../../Config";

export async function fetchTenantData(dataKeys) {
    const response = await axios.post(
        API_URL + "?service.key=masterKey.tenantData",
        { dataKeys },
    );
    if (response?.data?.C_STATUS !== "SUCCESS") {
        throw new Error(
            response?.data?.C_MESSAGE ||
            response?.data?.message ||
            "Unable to load dashboard data.",
        );
    }
    return response?.data?.C_DATA || {};
}

export async function fetchProcessCatalog() {
    const data = await fetchTenantData([
        {
            serviceParams: "",
            dataKey: "processMap",
            serviceKey: "process.map",
            mode: "formData",
        },
    ]);
    const rows = data?.processMap || [];
    const uniqueRows = [
        ...new Map(
            rows
                .filter(item => item?.process_key)
                .map(item => [String(item.process_key), item]),
        ).values(),
    ];
    uniqueRows.sort((left, right) =>
        String(left.title || left.process_key).localeCompare(
            String(right.title || right.process_key),
        ),
    );
    return uniqueRows;
}
