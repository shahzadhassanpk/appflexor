import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { API_URL, IMAGE_BASE } from "../../../Config";
import { tryToParse } from "../../../modules/data-management/form-builder/Forms/FormViewer/utils";
import { Interweave } from "interweave";
function BrandLogo({}) {
    const appContext = useContext(AppContext);
    let navigate = useNavigate();

    const [brand, setBrand] = useState({});
    const [imageUrl, setImageUrl] = useState("/theme/images/default-logo.png");
    const tableName = "app_site";

    useEffect(() => {
        if (appContext?.channel) {
            let channel = appContext.channel;

            if (!isEmpty(channel)) {
                setBrand(appContext.channel);
            }
        }
    }, [appContext?.channel]);

    useEffect(() => {
        if (brand && !isEmpty(brand)) {
            setBrandDetails();
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.getElementsByTagName("head")[0].appendChild(link);
            }
            let url =
                brand.brand_logo && brand.brand_logo !== ""
                    ? "/file/service/app_site/" +
                      brand.id +
                      "/" +
                      brand.brand_logo
                    : imageUrl;
            link.href = url;
        }
    }, [brand]);

    function setBrandDetails() {
        document.title = brand?.brand_title;

        let imgUrl = "";
        if (brand?.brand_logo) {
            imgUrl = `${IMAGE_BASE}/${tableName}/${brand.id}/${brand.brand_logo}?datasource=master`;
        } else {
            imgUrl = "/theme/images/default-logo.png";
        }
        setImageUrl(imgUrl);

        const mainEle = document.getElementById("main");
        const footerEle = document.getElementById("footer");

        function addMargin() {
            if (mainEle) mainEle.classList.remove("remove-margin");
            if (mainEle) mainEle.classList.add("add-margin");
            if (footerEle) footerEle.classList.remove("remove-margin");
            if (footerEle) footerEle.classList.add("add-margin");
        }

        function removeMargin() {
            if (mainEle) mainEle.classList.remove("add-margin");
            if (mainEle) mainEle.classList.add("remove-margin");
            if (footerEle) footerEle.classList.remove("add-margin");
            if (footerEle) footerEle.classList.add("remove-margin");
        }

        if (appContext.screenView === "lg") {
            if (menu_position === "header") {
                removeMargin();
            }

            if (menu_position === "body-left") {
                if (appContext.isAuthorized) addMargin();
            }
        }

        if (appContext.screenView === "sm" || appContext.screenView === "md") {
            removeMargin();
        }
    }

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    const site_preference = tryToParse(brand?.site_preference);
    const menu_position = site_preference ? site_preference?.menu_position : "";

    return (
        <React.Fragment>
            <div
                id="brand-logo"
                // onClick={() => navigate("/welcome")}
                className={`brand-expanded  ${
                    appContext.isAuthorized
                        ? menu_position === "body-left" &&
                          appContext?.screenView === "lg"
                            ? "navbar-brand-border"
                            : "navbar-brand-light"
                        : "navbar-brand-light"
                } navbar-brand brand-layout`}>
                <span>
                    <img
                        className="brand-logo"
                        src={
                            brand.brand_logo && brand.brand_logo !== ""
                                ? "/file/service/app_site/" +
                                  brand.id +
                                  "/" +
                                  brand.brand_logo
                                : imageUrl
                        }
                        alt={brand?.brand_title}
                    />
                </span>
                <div className="d-flex flex-column justify-content-center">
                    <span className="navbar-brand-title">
                        <Interweave content={brand?.brand_title}></Interweave>
                    </span>
                    <span className="navbar-brand-text">
                        <Interweave content={brand?.brand_text}></Interweave>
                    </span>
                </div>
            </div>
        </React.Fragment>
    );
}

export default BrandLogo;
