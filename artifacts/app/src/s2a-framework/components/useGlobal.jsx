import { useContext } from "react";
import { AppContext } from "../../AppContext";

const useGlobalData = () => {
    const appContext = useContext(AppContext);

    const {
        channel,
        userGroups,
        profile,
        isAuthorized,
        tenantSubscription,
        userOrg,
    } = appContext;

    // Map userOrg → orgContext
    const orgContext = userOrg;

    const expressionProps = [
        channel,
        userGroups,
        orgContext,
        profile,
        isAuthorized,
        tenantSubscription,
    ];

    return expressionProps;
};

export default useGlobalData;
