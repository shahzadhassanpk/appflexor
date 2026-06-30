import React, { useContext, lazy, Suspense } from "react";
import {
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import { AppContext } from "../AppContext";
import { IFrame } from "./components/IFrame/Iframe";
import RenderStartProcess from "./components/RenderStartProcess/RenderStartProcess";
import RenderStepProcess from "./components/RenderStepProcess/RenderStepProcess";
import Forget from "./theme/tailwind/Pages/Forget";
import Login from "./theme/tailwind/Pages/Login";
import NotFound from "./theme/tailwind/Pages/NotFoundPage";
import SignUp from "./theme/tailwind/Pages/SignUp";
import PageFormViewer from "./components/RenderForm/PageFormViewer";
import ContentManagement from "./modules/content-management/ContentManagement";

// import ContentPageUrl from "./modules/content-management/content-builder/ContentPageUrl/ContentPageUrl";

const ContentPageUrl = lazy(() =>
    import(
        "./modules/content-management/content-builder/ContentPageUrl/ContentPageUrl"
    ),
);
// import ContentPageUrlWrapper from "./modules/content-management/content-builder/ContentPageUrl/ContentPageWrapper";

const ContentPageUrlWrapper = lazy(() =>
    import(
        "./modules/content-management/content-builder/ContentPageUrl/ContentPageWrapper"
    ),
);
import ContentPageViewer from "./modules/content-management/content-builder/ContentPageViewer/ContentPageViewer";

// import PageViewer from "./modules/content-management/page-builder/PageViewer/PageViewer";
import PageViewer from "./modules/content-management/page-builder/PageViewer/PageViewer";
import PostEditURL from "./modules/content-management/page-builder/PostViewer/PostEditURL";
import DatalistUrlViewer from "./modules/content-management/page-builder/datalist-viewer/datalist-view-with-url/DatalistUrlViewer";

import DataAnalysis from "./modules/data-analysis/DataAnalysis";
import DataManagement from "./modules/data-management/DataManagement";
import ProcessFormViewer from "./modules/data-management/form-builder/Forms/FormViewer/ProcessFormViewer";

import { isEmpty } from "./modules/data-management/form-builder/Forms/FormViewer/utils";
import ProcessConfiguration from "./modules/process-configuration/ProcessConfiguration";
import SiteAdministration from "./modules/site-administrater/SiteAdministrater";
import UserManagement from "./modules/user-management/UserManagement";
import SignUpSubscription from "./theme/tailwind/Pages/SignUpSubscription";
import UserProfile from "./theme/tailwind/Pages/UserProfile";
import StripeSubscription from "./modules/subscription/payment";
import { ErrorBoundary } from "./utils/ErrorBoundry";
import Welcome from "./theme/tailwind/Pages/Welcome";

function AppRoutes({
    errorMessage,
    initailRoute,
    isLoaded,
    isLoading,
    wrapperSetIsLoading,
    wrapperSetErrorMessage,
    wrapperSetIsAuthorized,
    isEmbeded = false,
    channel,
}) {
    const { isAuthorized, moduleFeatures, handleLogout } =
        useContext(AppContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const componentList = {
        // "/access-control": AccessControl,
        "/iframe": IFrame,
        "/user-profile": UserProfile,
        "/data-analysis": DataAnalysis,
        "/datalist": DatalistUrlViewer,
        "/user-management": UserManagement,
        "/data-management": DataManagement,
        "/datalist/:id": DatalistUrlViewer,
        "/payment-processor": StripeSubscription,
        "/content-management": ContentManagement,
        "/site-administration": SiteAdministration,
        "/process-configuration": ProcessConfiguration,
        "/welcome": Welcome,
    };

    return (
        <Suspense fallback={<>Loading module...</>}>
            <ErrorBoundary>
                <Routes>
                    <Route
                        element={
                            <PrivateRoutes
                                isAuthorized={isAuthorized}
                                channel={channel}
                                isEmbeded={isEmbeded}
                            />
                        }>
                        {moduleFeatures.map((feature, index) => {
                            if (feature.type === "IFRAME") {
                                const path = `iframe:id=${feature.id}${
                                    isEmbeded ? "?embed=true" : ""
                                }`;
                                return (
                                    <Route
                                        key={index}
                                        path={path}
                                        element={<IFrame />}
                                    />
                                );
                            } else if (feature.type === "PAGE") {
                                let path = "";

                                if (!feature.slug) {
                                    path = `page:id=${feature.id}`;
                                } else {
                                    path = `page/${feature.slug}`;
                                }

                                return (
                                    <Route
                                        key={index}
                                        path={path}
                                        element={<PageViewer />}
                                    />
                                );
                            } else {
                                if (feature.type === "HYPER_LINK") {
                                    return null;
                                }

                                return (
                                    <Route
                                        key={index}
                                        path={feature.feature_key}
                                        element={CreateComponent(
                                            feature,
                                            componentList,
                                        )}
                                    />
                                );
                            }
                        })}
                        <Route
                            path="/welcome"
                            element={
                                <Welcome/>
                            }
                        />

                        <Route
                            path="/datalist/:id"
                            element={<DatalistUrlViewer />}
                        />
                        <Route
                            path="/content-page-design/:id&embed=true"
                            element={<ContentPageUrl />}
                        />
                        <Route
                            path="/content-page-design"
                            element={<ContentPageUrlWrapper />}
                        />
                        <Route
                            path="/post-edit/:id&embed=true"
                            element={<PostEditURL />}
                        />
                        <Route
                            path="/content-page-viewer/:id&embed=true"
                            element={<ContentPageViewer />}
                        />
                        <Route
                            path="/user-profile"
                            element={
                                <UserProfile
                                    isAuthorized={isAuthorized}
                                    errorMessage={errorMessage}
                                />
                            }
                        />
                        <Route
                            path="/form-viewer"
                            element={<ProcessFormViewer />}
                        />
                        <Route
                            path="/page-form-viewer"
                            element={<PageFormViewer />}
                        />
                        <Route
                            path="/process-start"
                            element={<RenderStartProcess />}
                        />
                        <Route
                            path="/process-step"
                            element={<RenderStepProcess />}
                        />
                        
                        <Route
                            path="*"
                            element={<NotFound />}
                        />
                    </Route>

                    <Route
                        element={
                            <PublicRoutes
                                isAuthorized={isAuthorized}
                                initailRoute={initailRoute}
                            />
                        }>
                        <Route
                            path="/login"
                            element={
                                <Login
                                    setIsAuthorized={wrapperSetIsAuthorized}
                                    isAuthorized={isAuthorized}
                                    isLoaded={isLoaded}
                                    initailRoute={initailRoute}
                                    isLoading={isLoading}
                                    setIsLoading={wrapperSetIsLoading}
                                    errorMessage={errorMessage}
                                    setErrorMessage={wrapperSetErrorMessage}
                                    handleLogout={handleLogout}
                                />
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <SignUp
                                    isLoading={isLoading}
                                    errorMessage={errorMessage}
                                    setIsAuthorized={wrapperSetIsAuthorized}
                                    setErrorMessage={wrapperSetErrorMessage}
                                    setIsLoading={wrapperSetIsLoading}
                                />
                            }
                        />
                        <Route
                            path="/subscription"
                            element={
                                <SignUpSubscription
                                    isLoading={isLoading}
                                    errorMessage={errorMessage}
                                    setIsAuthorized={wrapperSetIsAuthorized}
                                    setErrorMessage={wrapperSetErrorMessage}
                                    setIsLoading={wrapperSetIsLoading}
                                />
                            }
                        />
                        <Route
                            path="/forget"
                            element={
                                <Forget
                                    isLoading={isLoading}
                                    errorMessage={errorMessage}
                                    setIsAuthorized={wrapperSetIsAuthorized}
                                    setErrorMessage={wrapperSetErrorMessage}
                                    setIsLoading={wrapperSetIsLoading}
                                />
                            }
                        />
                        <Route
                            path="/sociallogin"
                            element={null}
                        />
                    </Route>
                </Routes>
            </ErrorBoundary>
        </Suspense>
    );
}

function BackToHistory() {
    // console.log(`INSIDE BACK TO HISTORY`);

    let navigate = useNavigate();
    navigate(-1);
    return null;
}

const UnkownRouteHandler = ({ to }) => {
    const prevRoute = useLocation();
    return (
        <Navigate
            to={to}
            state={{ prevRoute }}
            replace
        />
    );
};

function PrivateRoutes({ isAuthorized, channel, isEmbeded }) {
    const location = useLocation();
    const isPage = location.pathname.startsWith("/page");
    if (isAuthorized) {
        return (
            <div
                id="page-wrapper"
                className={isPage?"s2a-page-wrapper":`s2a-page-wrapper s2a-module-wrapper`}>
                <Outlet />
            </div>
        );
    }

    return null;

    // let AUTH_KEY = localStorage.getItem("AUTH_KEY");

    // console.log(channel);

    // if (isEmpty(channel)) {
    //     return null;
    // }

    // if (channel.guest_login === "YES") {
    //
    //     return <Navigate to="/guest-login" />;
    // }

    // if (AUTH_KEY && isAuthorized) {
    //     return (
    //         <div
    //             id="page-wrapper"
    //             className="s2a-page-wrapper">
    //             <Outlet />
    //         </div>
    //     );
    // }

    // if (!isAuthorized) {
    //
    //     return <Navigate to="/login" />;
    // }

    // return null;

    // return <Navigate to="/login" />;
}

function PublicRoutes({ isAuthorized, initailRoute }) {
    // const location = useLocation();
    // const route = location.pathname;

    // if (!isAuthorized && route === "/") return <Navigate to="/login" />;

    // if (isAuthorized && route !== "/login" && route !== "register")
    //     return <Navigate to={initailRoute} />;

    return <Outlet />;
}

function CreateComponent(block, componentList) {
    if (typeof componentList[block.feature_key] !== "undefined") {
        return React.createElement(componentList[block.feature_key], {
            key: block.id,
            block: block,
        });
    }
    return React.createElement(
        () => (
            <div
                style={{ minHeight: "90vh" }}
                className="d-flex align-items-center justify-content-center vh-100">
                <div className="text-center">
                    <p className="fs-3">
                        {" "}
                        The page for{" "}
                        <span className="text-danger">
                            {block.feature_key}
                        </span>{" "}
                        has not been created yet.
                    </p>
                </div>
            </div>
        ),
        { key: block.id },
    );
}

export default AppRoutes;
