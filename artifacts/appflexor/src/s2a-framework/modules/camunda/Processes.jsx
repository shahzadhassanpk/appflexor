import axios from "axios";
import React, { useEffect, useState, useContext, lazy } from "react";
import { API_URL } from "../../Config";
import { SOURCE } from "../process-configuration/ProcessEngine";
const Processes8 = lazy(() =>
    import("./cam8/Processes8"),
);
const Processes7 = lazy(() =>
    import("./cam7/Processes7"),
);
// import Processes8 from "./cam8/Processes8";
// import Processes7 from "./cam7/Processes7";
import { AppContext } from "../../../AppContext";

const processEngineInitState = {
    source_engine: SOURCE.CAMUNDA_EIGHT,
};

function Processes({ component, htmlCollection, modeType, images, mode }) {
    const [processEngine, setProcesEngine] = useState(processEngineInitState);
    const appContext = useContext(AppContext);
    useEffect(() => {
        // getData();

        setProcesEngine(appContext?.tenantSubscription?.process_engine);
    }, []);

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "engine",
                    serviceKey: "bpm.process.engine",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let data = response.data.C_DATA.engine;
                    if (data && data.length > 0) {
                        setProcesEngine(data[0]);
                    } else {
                        setProcesEngine(processEngineInitState);
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <div>
            {!processEngine && (
                // <p className="text-center h4">No process Engine selected</p>
                <div
                    style={{ minHeight: "100px" }}
                    className="d-flex align-items-center justify-content-center">
                    <span className="text-muted cursor-pointer">
                        <span className="fa-solid fa-database icon-space"></span>
                        No <span className="text-danger">process Engine</span>{" "}
                        selected.
                    </span>
                </div>
            )}
            {processEngine === SOURCE.CAMUNDA_EIGHT && (
                <>
                    <Processes8
                        component={component}
                        htmlCollection={htmlCollection}
                        modeType={modeType}
                        images={images}
                        mode={mode}
                    />
                </>
            )}
            {processEngine === SOURCE.CAMUNDA_SEVEN && (
                <>
                    <Processes7
                        component={component}
                        htmlCollection={htmlCollection}
                        modeType={modeType}
                        images={images}
                        mode={mode}
                    />
                </>
            )}
        </div>
    );
}

export default Processes;
