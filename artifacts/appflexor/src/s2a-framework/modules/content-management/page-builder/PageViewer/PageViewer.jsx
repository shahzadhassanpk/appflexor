import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { API_URL } from "../../../../Config";
// import RenderPreview from "../../../modules/site-builder/Designer/RenderPreview";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import RenderPreview from "../../../content-management/page-builder/Designer/RenderPreview";

const modeType = {
    design: "DESIGN_MODE",
    preview: "PREVIEW_MODE",
    readonly: "READONLY_MODE",
    render: "RENDER_MODE",
};

const pageType = {
    idPage: "GET_PAGE_BY_ID",
    slugPage: "GET_PAGE_BY_SLUG",
};

function PageViewer() {
    const [layout, setLayout] = useState([]);
    const [components, setComponents] = useState({});
    const [pageConfig, setPageConfig] = useState({
        params: "",
        type: "",
    });
    const [htmlCollection, setHtmlCollection] = useState({});
    const [styles, setStyles] = useState(undefined);
    const [cssClasses, setCssClasses] = useState("");
    const [pageId, setPageId] = useState("");

    useEffect(() => {
        const url = new URL(window.location.href);
        const query = url.searchParams;

        // Extract embed and tab_code
        const embed = query.get("embed") === "true";
        const tabCode = query.get("tab_code") || null;

        const pathname = url.pathname;

        if (pathname.includes(":id=")) {
            // extract id safely
            const id = pathname.split(":id=")[1];
            setPageConfig({
                params: id,
                type: pageType.idPage,
            });
        } else if (pathname.includes("/page/")) {
            // extract slug safely
            const slug = pathname.split("/page/")[1];
            setPageConfig({
                params: slug,
                type: pageType.slugPage,
            });
        }
    }, [window.location.href]);

    useEffect(() => {
        if (pageConfig.params !== "") {
            getData(pageConfig);
        }
    }, [pageConfig]);

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    function getData(pageConfig) {
        let serviceKey = "";
        if (pageConfig.type === pageType.idPage) {
            serviceKey = "sys.get.page";
        } else if (pageConfig.type === pageType.slugPage) {
            serviceKey = "sys.get.page.slug";
        }

        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: pageConfig.params,
                    dataKey: "page",
                    serviceKey: serviceKey,
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.page) {
                        let page = response.data.C_DATA.page[0];

                        let design = tryParseJSONObject(page.design, {
                            layout: [],
                            components: {},
                            htmlCollection: {},
                        });

                        setStyles(page.css_styles);
                        setLayout(design.layout);
                        setComponents(design.components);
                        setHtmlCollection(design.htmlCollection);
                        setCssClasses(page?.css_classes);
                        setPageId(page.id);
                    } else {
                        console.log(
                            `Either get.page does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function unescapeSlashes(str = "") {
        let parsedStr = "";
        try {
            parsedStr = str.replaceAll("\n", "");
        } catch (e) {
            return str;
        }
        return parsedStr;
    }

    try {
        return (
            <ErrorBoundary>
                <div>
                    <style>{styles && unescapeSlashes(styles)}</style>
                    <RenderPreview
                        pageId={pageId}
                        layout={layout}
                        components={components}
                        htmlCollection={htmlCollection}
                        mode={modeType.render}
                        modeType={modeType}
                        cssClasses={cssClasses}
                    />
                </div>
            </ErrorBoundary>
        );
    } catch (error) {
        console.log(error);
    }
}

export default PageViewer;
