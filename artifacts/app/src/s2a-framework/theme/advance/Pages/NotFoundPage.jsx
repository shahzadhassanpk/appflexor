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
        if (
            appContext &&
            appContext.moduleFeatures &&
            appContext.moduleFeatures.length > 0
        ) {
            const currentUrl = window.location.href;
            const domainArr = currentUrl.match(urlWithParamsRegex);
            if (domainArr) {
                const domain = domainArr[1] + "/"; // https://example.com/path/to/resource
                const featureLinkArr = currentUrl.split(domain);

                const featureLink = featureLinkArr[1];
                let isAuthorized = false;

                appContext.moduleFeatures.map(item => {
                    console.log(item);

                    if (item.feature_key === featureLink) {
                        isAuthorized = true;
                    }
                });

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
                console.log("Invalid URL format");
            }
        } else {
            // if (appContext.isAuthorized) {
            //     setTimeout(() => {
            //         setShowNotFound(true);
            //         setShowLoader(false);
            //     }, 500);
            // }
        }
    }

    return (
        <div
            id="page-not-found"
            className="d-flex align-items-center justify-content-center">
            {showLoader && <LoadingSpinner />}
            {showNotFound && <NotFoundMessage showLogin={showLogin} />}
        </div>
    );
}

function LoadingSpinner(params) {
    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "80vh" }}>
            <div
                className="spinner-border"
                role="status">
                <span className="visually-hidden"> Loading...</span>
            </div>
        </div>
    );
}

function NotFoundMessage({ showLogin = false }) {
    return (
        <div
            style={{ height: "80vh" }}
            className={`text-center not-found-text`}>
            <h1 className="display-1 fw-bold">404</h1>
            <p className="fs-3">
                {" "}
                <span className="text-danger">Opps!</span> Page not found.
            </p>
            <p className="lead">The page you’re looking for doesn’t exist.</p>
            {/* {showLogin && (
                <Link
                    className="btn btn-link"
                    to="/login">
                    Redirect to login page
                </Link>
            )} */}
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

export default NotFound;
