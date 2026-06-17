import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../AppContext";
import { API_URL } from "../../../Config";
import { default as RenderFormPreview } from "../Designer/components/FormViewer/index";
function FormViewer() {
    // const appContext = useContext(AppContext);
    // const [layout, setLayout] = useState([]);
    // const [pages, setPages] = useState([]);
    // const [components, setComponents] = useState({});
    // let currentUrl = window.location.href;
    // let page = {};

    // if (currentUrl.includes(":id=")) {
    //     let arr = currentUrl.split(":id=");
    //     let id = arr[1];
    //     let feature = {};
    //     feature = getElementById(appContext.moduleFeature, id);
    //     page = getElementById(pages, feature.feature_key);
    // }

    // useEffect(() => {
    //     getData();
    // }, []);

    // useEffect(() => {
    //     try {
    //         if (page.layout) {
    //             setLayout(JSON.parse(page.layout));
    //         }
    //         if (page.components) {
    //             setComponents(JSON.parse(page.components));
    //         }
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }, [page]);

    // function getElementById(arr, id) {
    //     let obj = {};
    //     arr.forEach((item) => {
    //         if (item.id === id) {
    //             obj = item;
    //         }
    //     });
    //     return obj;
    // }

    // function getData() {
    //     var dataRequest = {
    //         dataKeys: [
    //             {
    //                 serviceParams: "",
    //                 dataKey: "pages",
    //                 serviceKey: "pages",
    //                 mode: "formData",
    //             },
    //         ],
    //     };

    //     axios
    //         .post(API_URL + "?service.key=multiKey.data", dataRequest)
    //         .then((response) => {
    //             if (response.data.C_STATUS === "UNAUTHORIZED") {
    //                 console.log(`UNAUTHORIZED, please login.`);
    //             } else if (response.data.C_STATUS === "SUCCESS") {
    //                 if (response.data.C_DATA.pages) {
    //                     setPages(response.data.C_DATA.pages);
    //                 } else {
    //                     console.log(
    //                         `Either dir.group does not exists or SQL query returns no result.`
    //                     );
    //                 }
    //             }
    //         })
    //         .catch((error) => {
    //             console.error(error);
    //         });
    // }

    return (
        <div>
            <button className="button-theme ">Link form</button>
        </div>
    );
}

/**
 * <RenderFormPreview
            // layout={formContext.layout}
            // components={formContext.components}
            // mode={mode.preview}
            ></RenderFormPreview>
 */

export default FormViewer;
