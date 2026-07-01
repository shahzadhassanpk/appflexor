import { useEffect } from "react";
import { mode } from "../../Config";

const useLogger = (item, message) => {
    useEffect(() => {
        if (mode === "DEV")
            console.log(item, message ? message : `************`);
    }, [item]);
};

export default useLogger;
