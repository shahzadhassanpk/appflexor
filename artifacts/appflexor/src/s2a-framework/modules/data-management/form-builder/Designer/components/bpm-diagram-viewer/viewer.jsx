// BpmnViewer.js
import React, { useRef, useEffect, useState } from "react";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import BpmPropsEditor from "../../props-editors/BpmPropsEditor";
import { isEmpty } from "../../../Forms/FormViewer/utils";
import { FILE_URL } from "../../../../../../Config";
import useCustomViewer from "./CustomBpmnJs";
import Scroll from "../../../../../../components/Scroll/Scroll";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";

export default function BpmnViewerComponent(props) {
    const { mode, modeType, formData, component, formDetails } = props;
    const label = component?.data.label;
    const db_column = component?.data.db_column;
    const table = formDetails?.table;
    const configModalRef = useRef(null);
    const [bpmUrl, setBpmUrl] = useState("");
    const height = component?.data?.height;
    const width = component?.data?.width;
    const background_color = "white";//component?.data?.background_color;
    // const foreground_color = component?.data?.foreground_color;

    const root = document.querySelector(":root");
    const bpmLineStroke = "black";//root.style.getPropertyValue("--bpmn-line-stroke");
    const backgroundColor = "white"; //root.style.getPropertyValue("--bpmn-background");

    useEffect(() => {
        try {
            if (!formData || isEmpty(formData)) {
                return;
            }
            const origin = window.location.origin;
            const recordId = formData?.id;
            const fileNameStr = formData[db_column];

            if (fileNameStr) {
                const fileName = fileNameStr.slice(0, fileNameStr.length - 1);
                const _bpmUrl =
                    origin +
                    FILE_URL +
                    "/" +
                    table +
                    "/" +
                    recordId +
                    "/" +
                    fileName;
                setBpmUrl(_bpmUrl);
            }
        } catch (error) {
            toastEmitter(error, true, "error");
        }
    }, [formData]);

    useEffect(() => {
        if (bpmUrl) {
            const bgColor = background_color
                ? background_color
                : backgroundColor;
            const container = document.getElementById("bpmn-container");
            const modeler = useCustomViewer({
                container: container,
                keyboard: {
                    bindTo: document,
                },
                bpmnRenderer: {
                    defaultFillColor: bgColor,
                    defaultStrokeColor: bpmLineStroke,
                },
                textRenderer: {
                    // defaultStyle: {
                    //     fontFamily: '"Nothing You Could Do"',
                    //     fontWeight: "bold",
                    //     fontSize: 12,
                    //     lineHeight: 16,
                    // },
                    // externalStyle: {
                    //     fontSize: 12,
                    //     lineHeight: 16,
                    // },
                },
            });
            loadDiagram(bpmUrl, modeler, container);

            // var searchPad = modeler.get("searchPad");

            // if (searchPad) {
            //     // Hide the search input
            //     searchPad.setVisible(false);
            // } else {
            //     console.error(
            //         "Search pad not available in the BPMN viewer or modeler.",
            //     );
            // }

            return () => {
                modeler.destroy();
            };
        }
    }, [bpmUrl]);

    async function loadDiagram(bpmUrl, modeler, container) {
        const res = await fetch(bpmUrl);
        const diagram = await res.text();

        modeler
            .importXML(diagram)
            .then(({ warnings }) => {
                if (warnings.length) {
                    console.log(warnings);
                }

                // center diagram and zoom

                function centerAndFitViewport(modeler) {
                    const canvas = modeler.get("canvas");

                    const { inner } = canvas.viewbox();

                    const center = {
                        x: inner.x + inner.width / 2,
                        y: inner.y + inner.height / 2,
                    };

                    canvas.zoom("fit-viewport", center);
                }
                centerAndFitViewport(modeler);
            })
            .catch(err => {
                console.log(err);
            });
    }

    return (
        <>
            {modeType.design === mode && (
                <>
                    <ChildrenModal
                        header="Bpm Viewer"
                        ref={configModalRef}>
                        <BpmPropsEditor
                            close={() => configModalRef.current.close()}
                        />
                    </ChildrenModal>
                    <div className="flex-between p-3 ">
                        <span
                            className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                            onClick={() =>
                                configModalRef.current.show()
                            }></span>
                        <span className="font-bold">
                            Added Successfully {label ? label : "Bpm Viewer"}
                        </span>
                        <span></span>
                    </div>
                </>
            )}
            {modeType.design !== mode && modeType.readonly !== mode && (
                <Scroll
                    width="100%"
                    height="100%">
                    <div
                        id="bpmn-container"
                        className="bpmn-container"
                        style={{
                            width: width ?? "100%",
                            height: height ?? "100%",
                            overflow: "hidden",
                        }}></div>
                </Scroll>
            )}
        </>
    );
}
