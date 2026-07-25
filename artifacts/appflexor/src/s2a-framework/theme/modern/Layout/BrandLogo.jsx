import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../AppContext";
import { IMAGE_BASE } from "../../../Config";
import { Interweave } from "interweave";

function BrandLogo() {
    const appContext = useContext(AppContext);
    const [brand, setBrand] = useState({});
    const [imageUrl, setImageUrl] = useState("/theme/images/default-logo.png");

    useEffect(() => {
        if (appContext?.channel && Object.keys(appContext.channel).length > 0) {
            setBrand(appContext.channel);
        }
    }, [appContext?.channel]);

    useEffect(() => {
        if (brand && Object.keys(brand).length > 0) {
            document.title = brand.brand_title || "Appflexor";
            
            let url = brand.brand_logo 
                ? `${IMAGE_BASE}/app_site/${brand.id}/${brand.brand_logo}?datasource=master` 
                : "/theme/images/default-logo.png";
            setImageUrl(url);

            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.getElementsByTagName("head")[0].appendChild(link);
            }
            link.href = brand.brand_logo ? `/file/service/app_site/${brand.id}/${brand.brand_logo}` : url;
        }
    }, [brand]);

    return (
        <div className="flex items-center gap-3 px-2 h-full">
            <img
                className="h-8 w-auto object-contain"
                src={brand.brand_logo ? `/file/service/app_site/${brand.id}/${brand.brand_logo}` : imageUrl}
                alt={brand?.brand_title || "Logo"}
                onError={(e) => { e.target.onerror = null; e.target.src = "/theme/images/default-logo.png"; }}
            />
            <div className="flex flex-col justify-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                    <Interweave content={brand?.brand_title || "Appflexor"} />
                </span>
                {brand?.brand_text && (
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium tracking-wide uppercase">
                        <Interweave content={brand?.brand_text} />
                    </span>
                )}
            </div>
        </div>
    );
}

export default BrandLogo;
