import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../../Config";
import { SOURCE } from "../process-configuration/ProcessEngine";
import StartStepProcessor8 from "./cam8/StartStepProcessor8";

const processEngineInitState = {
    source_engine: SOURCE.CAMUNDA_EIGHT,
};

function StartStepProcessor({
    id,
    handleProcessActions,
    camundaVars,
    formVars = {},
}) {
    const [processEngine, setProcesEngine] = useState(processEngineInitState);

    useEffect(() => {
        getData();
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
            {!processEngine.source_engine && (
                <p className="text-center h4">No process Engine selected</p>
            )}            
            {processEngine.source_engine === SOURCE.CAMUNDA_EIGHT && (
                <StartStepProcessor8
                    id={id}
                    handleProcessActions={handleProcessActions}
                    camundaVars={camundaVars}
                    formVars={formVars}
                />
            )}
        </div>
    );
}

export default StartStepProcessor;
