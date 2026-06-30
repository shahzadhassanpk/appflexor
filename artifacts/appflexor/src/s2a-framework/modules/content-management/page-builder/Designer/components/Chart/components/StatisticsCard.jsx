import React, { useState } from "react";
import DescriptionModal from "./DescriptionModal";
import { Interweave } from "interweave";
import { ErrorBoundary } from "../../../../../../../utils/ErrorBoundry";

export default function StatisticsCard(props) {
    const {
        data: {
            title,
            color_palette,
            keyColumn,
            show_legend,
            chart_description,
            refresh_interval,
            func,
        },
        chartData: { height, width, data: Data, columns },
        setFlag,
    } = props;

    let keys = {};

    const [showDescription, setShowDescription] = useState(false);
    const handleClose = () => setShowDescription(false);
    const handleShow = () => setShowDescription(true);

    function calculateFacts(data) {
        if (
            data &&
            JSON.stringify(data) !== "[]" &&
            JSON.stringify(columns) !== "[]"
            // func
        ) {
            keys = columns;
        }
        return keys ? keys : 0;
    }

    calculateFacts(Data);
    if (columns && JSON.stringify(columns) !== "{}")
        return (
            <ErrorBoundary>
                <div className="chart-card">
                    <React.Fragment>
                        <DescriptionModal
                            show={showDescription}
                            close={handleClose}
                            title={title}>
                            <Interweave content={chart_description} />
                        </DescriptionModal>
                        <div className="chart-title">
                            <span>{title ? title : ""}</span>
                            <span className="chart-refresh-btn cursor-pointer">
                                <i
                                    className="fa-solid fa-circle-info me-2"
                                    onClick={() => handleShow()}></i>
                                <i
                                    title={
                                        refresh_interval
                                            ? `auto refresh in ${refresh_interval} seconds`
                                            : ""
                                    }
                                    onClick={() => setFlag("get")}
                                    className={`fa-solid fa-arrows-rotate ${
                                        refresh_interval
                                            ? "refresh_interval"
                                            : ""
                                    }`}></i>
                            </span>
                        </div>

                        {Object.keys(keys).map(key => (
                            <div className="chart-card-content">
                                <h2 className="col-sm-12 chart-data figure">
                                    {keys[key]}
                                </h2>                                
                            </div>
                        ))}
                    </React.Fragment>
                </div>
            </ErrorBoundary>
        );
}
