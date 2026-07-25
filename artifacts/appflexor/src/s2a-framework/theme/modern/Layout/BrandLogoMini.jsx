import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../AppContext";
import { IMAGE_BASE } from "../../../Config";
import { NAVBAR_STATE } from "../../../contants";

function BrandLogoMini({ toggleMiniState, STATE = NAVBAR_STATE }) {
    const appContext = useContext(AppContext);
    const [brand, setBrand] = useState({});
    const [imageUrl, setImageUrl] = useState("/theme/images/default-logo.png");

    useEffect(() => {
        if (appContext?.channel) setBrand(appContext.channel);
    }, [appContext]);

    useEffect(() => {
        if (brand?.brand_logo) {
            setImageUrl(`${IMAGE_BASE}/app_site/${brand.id}/${brand.brand_logo}?datasource=master`);
        }
    }, [brand]);

    const imgSrc = brand.brand_logo ? `/file/service/app_site/${brand.id}/${brand.brand_logo}` : imageUrl;

    if (toggleMiniState === STATE.CON) {
        return (
            <div className="flex w-full items-center justify-center h-full">
                <img
                    className="h-8 w-8 object-contain"
                    src={imgSrc}
                    alt={brand?.brand_title || "Logo"}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/theme/images/default-logo.png"; }}
                />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-4 w-full h-full">
            <img
                className="h-8 w-8 object-contain shrink-0"
                src={imgSrc}
                alt={brand?.brand_title || "Logo"}
                onError={(e) => { e.target.onerror = null; e.target.src = "/theme/images/default-logo.png"; }}
            />
            <div className="flex flex-col justify-center overflow-hidden">
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">
                    {brand?.brand_title || "Appflexor"}
                </span>
            </div>
        </div>
    );
}

export default BrandLogoMini;
