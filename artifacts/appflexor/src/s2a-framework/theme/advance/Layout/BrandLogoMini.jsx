import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../AppContext";
import { API_URL, IMAGE_BASE } from "../../../Config";
import { NAVBAR_STATE } from "../../../contants";
import { tryToParse } from "../../../modules/data-management/form-builder/Forms/FormViewer/utils";
function BrandLogoMini({
    children,
    classes = "",
    toggleMiniState,
    state = NAVBAR_STATE.CON,
    mini = false,
}) {
    const appContext = useContext(AppContext);

    const [brand, setBrand] = useState({});
    const [imageUrl, setImageUrl] = useState("/theme/images/default-logo.png");
    const tableName = "app_site";
    const site_preference = tryToParse(brand?.site_preference);
    const menu_position = site_preference
        ? brand?.site_preference?.menu_position
        : "";

    useEffect(() => {
        if (appContext.channel) {
            setBrand(appContext.channel);
        }
    }, [appContext]);

    useEffect(() => {
        setBrandDetails();
    }, [brand]);

    useEffect(() => {
        var link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.getElementsByTagName("head")[0].appendChild(link);
        }
        link.href = imageUrl;
    }, [imageUrl]);

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

        function addMargin() {
            if (mainEle) mainEle.classList.remove("remove-margin");
            if (mainEle) mainEle.classList.add("add-margin");
        }

        function addMargin60() {
            if (mainEle) mainEle.classList.remove("remove-margin");
            if (mainEle) mainEle.classList.add("add-margin-60");
        }

        function removeMargin() {
            if (mainEle) mainEle.classList.remove("add-margin");
            if (mainEle) mainEle.classList.add("remove-margin");
        }

        if (appContext.screenView === "lg") {
            if (menu_position === "header") {
                removeMargin();
            }

            if (menu_position === "body-left") {
                if (appContext.isAuthorized) {
                    if (toggleMiniState === NAVBAR_STATE.CON) {
                        addMargin60();
                    } else {
                        addMargin();
                    }
                }
            }
        }

        if (appContext.screenView === "sm" || appContext.screenView === "md") {
            removeMargin();
        }
    }

    return (
        <React.Fragment>
            {toggleMiniState === NAVBAR_STATE.CON && (
                <div
                    id="brand-logo-mini"
                    className={`d-flex justify-content-end mini-brand-border ${classes} `}>
                    <div className={`navbar-brand brand-layout`}>
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

                        {typeof children !== "undefined" && (
                            <div className="d-flex flex-column justify-content-center px-2">
                                {children}
                            </div>
                        )}
                        {/* <div className="d-flex flex-column justify-content-center px-2">
                            {children}
                        </div> */}
                    </div>
                </div>
            )}
            {toggleMiniState === NAVBAR_STATE.EXP && (
                <div
                    id="brand-logo-mini"
                    className={`brand-expanded ${
                        appContext.isAuthorized
                            ? menu_position === "body-left" &&
                              appContext?.screenView === "lg"
                                ? ""
                                : "navbar-brand-light"
                            : "navbar-brand-light"
                    } navbar-brand brand-layout d-flex justify-content-center`}>
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
                    <div className="d-flex flex-column justify-content-center px-2">
                        <span className="navbar-brand-title">
                            {brand?.brand_title}
                        </span>
                        <span className="navbar-brand-text">
                            {brand?.brand_text}
                        </span>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}

export default BrandLogoMini;
