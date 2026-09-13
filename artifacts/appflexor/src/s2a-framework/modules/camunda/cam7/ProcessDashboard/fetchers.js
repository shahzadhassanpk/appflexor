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
        {
            serviceParams: "",
            dataKey: "processBusinessAreas",
            serviceKey: "process.business.area",
            mode: "formData",
        },
        {
            serviceParams: "",
            dataKey: "processCategories",
            serviceKey: "process.category",
            mode: "formData",
        },
    ]);
    const rows = data?.processMap || [];
    const businessAreaMap = buildMasterDataLookupMap(data?.processBusinessAreas || []);
    const categoryMap = buildMasterDataLookupMap(data?.processCategories || []);
    const uniqueRows = [
        ...new Map(
            rows
                .filter(item => item?.process_key)
                .map(item => {
                    const processKey = String(item.process_key);
                    return [
                        processKey,
                        {
                            ...item,
                            business_area_label:
                                resolveMappedLabel(item?.business_area, businessAreaMap, "Uncategorized"),
                            category_label: resolveMappedLabel(item?.category, categoryMap, ""),
                        },
                    ];
                }),
        ).values(),
    ];
    uniqueRows.sort((left, right) =>
        String(left.title || left.process_key).localeCompare(
            String(right.title || right.process_key),
        ),
    );
    return uniqueRows;
}

function buildMasterDataLookupMap(rows) {
    return (Array.isArray(rows) ? rows : []).reduce((result, row) => {
        const lookupId = String(
            row?.id ||
            row?.key ||
            row?.value ||
            "",
        ).trim();

        const label = String(
            row?.label ||
            row?.title ||
            row?.name ||
            row?.business_area ||
            row?.businessArea ||
            row?.category ||
            row?.process_category ||
            row?.processCategory ||
            "",
        ).trim();

        if (lookupId && label) {
            result[lookupId] = label;
        }
        return result;
    }, {});
}

function resolveMappedLabel(value, lookupMap, fallback) {
    const lookupId = String(value || "").trim();
    if (!lookupId) {
        return fallback;
    }
    return lookupMap[lookupId] || lookupId || fallback;
}
