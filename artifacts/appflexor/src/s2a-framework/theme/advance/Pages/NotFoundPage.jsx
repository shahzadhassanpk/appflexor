import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../../../../AppContext";

const urlWithParamsRegex = /^(?:https?:\/\/)?(?:www\.)?([^\/?]+)/;

function NotFound({ showLogin = false }) {
    const appContext = useContext(AppContext);
    const location = useLocation();

    const [showLoader, setShowLoader] = useState(true);
    const [showNotFound, setShowNotFound] = useState(false);

    useEffect(() => {
        checStatus();
    }, []);

    useEffect(() => {
        checStatus();
    }, [appContext.moduleFeatures, location.pathname]);

    function checStatus() {
        if (appContext?.moduleFeatures?.length > 0) {
            const currentUrl = window.location.href;
            const domainArr = currentUrl.match(urlWithParamsRegex);
            if (domainArr) {
                const domain = domainArr[1] + "/";
                const featureLinkArr = currentUrl.split(domain);
                const featureLink = featureLinkArr[1];
                
                const isAuthorized = appContext.moduleFeatures.some(item => item.feature_key === featureLink);

                if (isAuthorized) {
                    setShowNotFound(false);
                    setShowLoader(true);
                } else {
                    setShowNotFound(true);
                    setShowLoader(false);
                }
            } else {
                setShowNotFound(true);
                setShowLoader(false);
            }
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            {showLoader && (
                <div className="flex flex-col items-center gap-4 text-indigo-600 dark:text-indigo-400">
                    <i className="fa-solid fa-circle-notch animate-spin text-4xl"></i>
                    <span className="font-medium text-sm text-gray-500">Loading...</span>
                </div>
            )}
            {showNotFound && (
                <div className="text-center max-w-md">
                    <h1 className="text-9xl font-black text-indigo-600 dark:text-indigo-500 mb-4 opacity-20">404</h1>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h2>
                        <p className="text-gray-500 dark:text-slate-400 mb-8">
                            The page you're looking for doesn't exist or you don't have permission to view it.
                        </p>
                        <button 
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                            Go Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotFound;
