import React, { useEffect, useRef, useState } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

const BpmnProcessTracker = ({ processDefinitionId, camundaApiBase }) => {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const [bpmnXml, setBpmnXml] = useState(null);
    const [historyData, setHistoryData] = useState([]);

    // Fetch BPMN XML from Camunda
    useEffect(() => {
        async function fetchBpmn() {
            const res = await fetch(
                `${camundaApiBase}/process-definition/${processDefinitionId}/xml`,
            );
            const data = await res.json();
            setBpmnXml(data.bpmn20Xml);
        }
        fetchBpmn();
    }, [processDefinitionId, camundaApiBase]);

    // Fetch history data from Camunda
    useEffect(() => {
        async function fetchHistory() {
            const res = await fetch(
                `${camundaApiBase}/history/activity-instance?processDefinitionId=${processDefinitionId}`,
            );
            const data = await res.json();
            // Normalize into { activityId, state }
            const normalized = data.map(item => ({
                activityId: item.activityId,
                state: item.endTime ? "COMPLETED" : "ACTIVE",
            }));
            setHistoryData(normalized);
        }
        fetchHistory();
    }, [processDefinitionId, camundaApiBase]);

    // Render BPMN diagram with highlights
    useEffect(() => {
        if (!bpmnXml || !containerRef.current) return;

        if (!viewerRef.current) {
            viewerRef.current = new BpmnViewer({
                container: containerRef.current,
            });
        }

        const viewer = viewerRef.current;

        viewer.importXML(bpmnXml).then(() => {
            const canvas = viewer.get("canvas");
            const elementRegistry = viewer.get("elementRegistry");
            canvas.zoom("fit-viewport");

            // Clear old markers
            elementRegistry.getAll().forEach(el => {
                canvas.removeMarker(el.id, "highlight-completed");
                canvas.removeMarker(el.id, "highlight-active");
            });

            // Apply new markers
            historyData.forEach(event => {
                const element = elementRegistry.get(event.activityId);
                if (element) {
                    if (event.state === "COMPLETED") {
                        canvas.addMarker(element.id, "highlight-completed");
                    } else if (event.state === "ACTIVE") {
                        canvas.addMarker(element.id, "highlight-active");
                    }
                }
            });
        });
    }, [bpmnXml, historyData]);

    return (
        <div>
            <style>
                {`
          .highlight-completed > .djs-visual > :nth-child(1) {
            stroke: green !important;
            stroke-width: 4px !important;
          }
          .highlight-active > .djs-visual > :nth-child(1) {
            stroke: red !important;
            stroke-width: 4px !important;
          }
        `}
            </style>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "600px",
                    border: "1px solid #ccc",
                }}
            />
        </div>
    );
};

export default BpmnProcessTracker;
