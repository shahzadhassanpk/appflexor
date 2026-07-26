import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../../../../Config";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import grapesjs from "grapesjs";
import Handlebars from "handlebars";
import DOMPurify from "dompurify";
import { Interweave } from "interweave";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import HTMLPropsEditor from "../../props-editor/HTMLTemplatePropsEditor";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import { evaluateExpression } from "../../../datalist-viewer/datalist-filter-helpers/DatalistFilters";
import { formatDateForUserView } from "../../../../../../components/DatePicker/DatePicker";

function HTMLTemplate(props) {
    // const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});

    const htmlModalRef = useRef(null);
    const handleShow = () => htmlModalRef?.current?.show();
    const handleClose = () => htmlModalRef?.current?.close();
    const setShow = bool => {
        bool ? handleShow() : handleClose();
    };

    Handlebars.registerHelper("formatDateForUserView", function (date) {
        try {
            if(!date) return "";
            return formatDateForUserView(date);
        } catch (error) {
            console.error("Error in formatDateForUserView helper:", error);
            return date; // Return original date if formatting fails
        }
    });

    useEffect(() => {
        try {
            let visibleExp = props.component.data.condition;
            let disableExp = props.component.data.disabled;

            if (disableExp && disableExp !== "") {
                setDisable(
                    evaluateExpression({ expression: disableExp }, data),
                );
            }

            if (visibleExp && visibleExp !== "") {
                setDisable(
                    !evaluateExpression({ expression: visibleExp }, data),
                );
            }
        } catch (error) {
            console.log(error);
        }
    }, [data]);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }
        if (props.component.data?.service_key) {
            let _data = getData(props.component.data.service_key, "");            
        }
    }, [props.component.data]);

    const Error = () => {
        return (
            <div>
                <center className="text-danger">Error occurred in HTML</center>
            </div>
        );
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function getData(serviceKey, serviceParams) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: serviceParams,
                    dataKey: "data",
                    serviceKey: serviceKey,
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=multiKey.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setData(response.data.C_DATA.data);
                }else{
                  toastEmitter(
                            `HTMLTemplate error ${response.data.C_MESSAGE}`,
                            true,
                            "error",
                        );
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    if (isEmpty(componentData))
        return (
            <div className="p-3 ">
                <label className="form-label">HTML</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <>
                    <>
                        {props.mode &&
                            props.modeType &&
                            props.mode !== props.modeType.design &&
                            data && (
                                <RenderHTML
                                    componentData={componentData}
                                    htmlCollection={props.htmlCollection}
                                    data={data}></RenderHTML>
                            )}

                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <div className="">
                                    <div className="d-flex justify-content-center align-items-center pointer">
                                        <span
                                            className="m-2 fa-regular fa-pen-to-square mx-1"
                                            onClick={() =>
                                                setShow(true)
                                            }></span>{" "}
                                        Edit Template
                                    </div>
                                    {data && (
                                        <RenderHTML
                                            componentData={componentData}
                                            htmlCollection={
                                                props.htmlCollection
                                            }
                                            data={data}></RenderHTML>
                                    )}
                                </div>
                            )}
                    </>
                    <ChildrenModal
                        ref={htmlModalRef}
                        size="xl"
                        header="Edit Html">
                        <HTMLPropsEditor setShow={setShow} />
                    </ChildrenModal>
                </>
            )}
        </ErrorBoundary>
    );
}

function RenderHTML({ componentData, htmlCollection, data }) {
    const htmlId = componentData?.html_id;
    const iconClass = componentData?.icon;
    const position = componentData?.position;
    const collapse = componentData?.collapse;
    const htmlContent = htmlId ? htmlCollection[htmlId] : "";

    const floating = {
        left: "row",
        right: "row-reverse",
        undefined: "row",
    };

    const collapseClass =
        collapse === "horizontal" ? "collapse collapse-horizontal" : "collapse";

    const contentRef = useRef(null);

    useEffect(() => {
        // Collapse on outside click
        function handleClickOutside(event) {
            if (
                contentRef.current &&
                !contentRef.current.contains(event.target)
            ) {
                const collapseEl = document.getElementById(htmlId);
                if (collapseEl && collapseEl.classList.contains("show")) {
                    const bsCollapse =
                        window.bootstrap.Collapse.getInstance(collapseEl);
                    if (bsCollapse) {
                        bsCollapse.hide();
                    } else {
                        new window.bootstrap.Collapse(collapseEl, {
                            toggle: false,
                        }).hide();
                    }
                }
            }
        }

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [htmlId]);

    function previewTemplate(html, data) {
        if (!html || html.length === 0) {
            return "";
        }
        if (!data) {
            data = {};
        }
        const compiled = Handlebars.compile(html);
        const output = compiled({data: data});
        return DOMPurify.sanitize(output);
    }

    return collapse && collapse !== "none" ? (
        <>
            <div className={`w-100 d-flex flex-${floating[position]}`}>
                <span
                    className="mb-1"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${htmlId}`}
                    aria-expanded="false"
                    aria-controls="collapse">
                    <i className={iconClass || "bi bi-info-circle"}></i>
                    {iconClass && iconClass.length > 0 ? "" : " Info"}
                </span>
            </div>

            <div
                className={collapseClass}
                id={htmlId}>
                <div
                    ref={contentRef}
                    style={{ width: "inherit" }}
                    className="content-body p-2">
                    {data && (
                        <Interweave
                            content={previewTemplate(htmlContent, data)}
                        />
                    )}
                </div>
            </div>
        </>
    ) : (
        <>
            {data && (
                <Interweave content={previewTemplate(htmlContent, data)} />
            )}
        </>
    );
}

function HtmlTemplateEditor({ data, onSave }) {
    const editorRef = useRef(null);

    useEffect(() => {
        const editor = grapesjs.init({
            container: "#gjs",
            height: "500px",
            fromElement: false,
            storageManager: false,
            panels: { defaults: [] },
        });

        editor.setComponents(`
      <div>
        <h3>Hello {{ user.name }}</h3>
        <table border="1">
          <tr><th>Item</th><th>Price</th></tr>
          {{#each order.items}}
            <tr><td>{{name}}</td><td>{{price}}</td></tr>
          {{/each}}
        </table>
      </div>
    `);

        editorRef.current = editor;
    }, []);

    function previewTemplate() {
        const html = editorRef.current.getHtml();
        const compiled = Handlebars.compile(html);
        const output = compiled(data);
        return DOMPurify.sanitize(output);
    }

    return (
        <>
            <div id="gjs" />
            <button
                className="btn btn-primary mt-2"
                onClick={() => onSave(editorRef.current.getHtml())}>
                Save Template
            </button>

            <h5 className="mt-3">Preview</h5>
            <div
                className="border p-3"
                dangerouslySetInnerHTML={{ __html: previewTemplate() }}
            />
        </>
    );
}

export default HTMLTemplate;
