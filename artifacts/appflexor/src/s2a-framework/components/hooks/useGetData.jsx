import { useEffect, useState } from "react";
import { getData } from "../CrudApiCall";

const useGetData = props => {
    const { keys, url, datasource, tenant_id } = props;
    const [data, setData] = useState({});
    useEffect(() => {
        get();
    }, []);

    async function get() {
        const res = await getData({ keys, url, datasource, tenant_id });
        if (res?.data?.C_STATUS === "SUCCESS") {
            setData(res?.data?.C_DATA);
        }
    }
    return data;
};

export default useGetData;
