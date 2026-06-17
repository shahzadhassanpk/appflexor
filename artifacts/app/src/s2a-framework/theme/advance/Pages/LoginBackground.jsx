import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { Interweave } from "interweave";

function LoginBackground() {
    const appContext = useContext(AppContext);

    return (
        <>
        
            <div className="col-sm-6 login-content-bg">
                {appContext?.channel?.login_html &&
                appContext?.channel?.login_html !== "" ? (
                    <>
                        <div className="login-content">
                            <Interweave
                                content={
                                    appContext?.channel?.login_html
                                }></Interweave>
                            <div className="col-sm-12 powered-by">
                                <Interweave
                                    content={
                                        appContext?.channel?.footer_html
                                    }></Interweave>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="login-content">
                            <div className="col-sm-12">
                                <h3>
                                    <font className="login-text registerd-text">
                                        Simpler, Faster Digital Transformation
                                        That Drive Growth
                                    </font>
                                </h3>
                            </div>
                            <div className="col-sm-12 content-btns">
                                <button
                                    type="button"
                                    className="read-btn me-3">
                                    Read More..
                                </button>
                                <button
                                    type="button"
                                    className="video-btn">
                                    <i className="fa-solid fa-circle-play"></i>
                                    &nbsp; Watch video..
                                </button>
                            </div>
                            <div className="img-container">
                                <img
                                    className="login-signup-image"
                                    src="/theme/images/bpm.png"
                                    alt="image"
                                />
                            </div>
                        </div>
                        <div className="col-sm-12 powered-by">
                            Powered by Step 2 Agility Ltd.
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
export default LoginBackground;
