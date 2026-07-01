import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../../AppContext";
import { API_URL } from "../../../../Config";
import { CONTENT_STATUS } from "../../../../contants";

function RenderContentPage({
    contentPageId = "",
    status = CONTENT_STATUS.draft,
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [contentPage, setContentPage] = useState({});
    // const appContext = useContext(AppContext);
    // const [styles, setStyles] = useState(undefined);

    useEffect(() => {
        if (contentPageId) {
            getContentPage(contentPageId);
        }
    }, [contentPageId]);

    function getContentPage(contentPageId) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: contentPageId,
                    dataKey: "page",
                    serviceKey: "sys.content.page",
                    mode: "formData",
                },
            ],
        };
        dataRequest.datasource = "";
        let url = API_URL + "?service.key=masterKey.tenantData";

        axios
            .post(url, dataRequest)
            .then(response => {
                if (response.data.C_DATA.page) {
                    let record = response.data.C_DATA.page[0];

                    if (record) {
                        setIsLoaded(true);
                        let parsedLayout = {};

                        if (status === CONTENT_STATUS.draft) {
                            parsedLayout = tryToParse(record.stagging);
                        }

                        if (status === CONTENT_STATUS.published) {
                            parsedLayout = tryToParse(record.published);
                        }

                        const htmlCode = parsedLayout.html;
                        const cssCode = parsedLayout.css;

                        setContentPage({
                            html: htmlCode,
                            css: cssCode,
                        });
                        setIsLoaded(true);
                        // setStyles(record.css_styles);
                    }
                }
            })
            .catch(e => {
                console.log(e);
            });
    }

    // utility
    const tryToParse = item => {
        let _item = item;
        if (typeof item === "string" && item !== "") {
            _item = JSON.parse(_item);
        } else {
            _item = {
                html: "<div>Welcome to content builder</div>",
                css: "",
            };
        }
        return _item;
    };

    function unescapeSlashes(str = "") {
        let parsedStr = "";
        try {
            parsedStr = str.replaceAll("\n", "");
        } catch (e) {
            return str;
        }
        return parsedStr;
    }

    return (
        <div>
            {/* <code>{JSON.stringify(contentPage, null, 2)}</code> */}
            {/* <style>{styles && unescapeSlashes(styles)}</style> */}
            {isLoaded ? (
                <Delayed>
                    <div
                        className=""
                        dangerouslySetInnerHTML={{
                            __html: contentPage.html,
                        }}
                    />
                    <style>{contentPage.css}</style>
                </Delayed>
            ) : (
                <span className="text-dark">Loading...</span>
            )}
        </div>
    );
}

function Delayed({ children, waitBeforeShow = 500 }) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsShown(true);
        }, waitBeforeShow);
        return () => clearTimeout(timer);
    }, [waitBeforeShow]);

    return isShown ? children : "Loading...";
}

export default RenderContentPage;
