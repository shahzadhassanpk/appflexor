import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { API_URL } from "../../../../../../Config";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { tryParseJSONObject } from "../../../../../../utils/utils";
import RenderPreview from "../../../../../data-analysis/dashboards/Designer/RenderPreview";

export default function DashboardViewer(props) {
    const [dashboard, setDashboard] = useState({});

    useEffect(() => {
        let dashboardId = props.dashboard.id;

        if (dashboardId) {
            getDashboard(dashboardId);
        }
    }, [props]);

    function getDashboard(id) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "item",
                    serviceKey: "sys.dashboard",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.item[0]) {
                        let data = response.data.C_DATA.item[0];
                        data.design = tryParseJSONObject(data.design, {
                            layout: [],
                            components: {},
                        });
                        setDashboard(data);
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return (
        <ErrorBoundary>
            {!isEmpty(dashboard) && (
                <RenderPreview
                    layout={dashboard.design.layout}
                    components={dashboard.design.components}
                    mode={props.mode}
                    modeType={props.modeType}></RenderPreview>
            )}
        </ErrorBoundary>
    );
}
