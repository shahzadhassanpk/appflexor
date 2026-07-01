import React from "react";
import { useContext } from "react";
import { AppContext } from "../../../../AppContext";

function SocialLogin({ socialLogins = [] }) {
    const appContext = useContext(AppContext);
    const clientID = appContext.brandDetails.google_client_id;
    const clientSecret = appContext.brandDetails.google_client_secret;
    const handleGoogleLogin = path => {
        const newWin = window.open(
            `/auth/${path}?clientID=${encodeURIComponent(
                clientID,
            )}&clientSecret=${encodeURIComponent(clientSecret)}`,
            "_self",
        );

        if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
            toastEmitter("Please allow popups.", true, "warning");
        }
    };
    const handleLogin = path => {
        const newWin = window.open(
            `/auth/${path}?clientID=${encodeURIComponent(
                clientID,
            )}&clientSecret=${encodeURIComponent(clientSecret)}`,
            "_self",
        );

        if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
            toastEmitter("Please allow popups.", true, "warning");
        }
    };

    return (
        <>
            <button
                type="button"
                className="sso-buttons rounded pointer"
                onClick={() => handleGoogleLogin("google")}>
                <i className="fa-brands fa-google"></i>&nbsp; Continue with
                Google
            </button>
            {socialLogins.map((item, i) => {
                return (
                    <React.Fragment key={i}>
                        {item === "google" && (
                            <GoogleLogin
                                handleGoogleLogin={handleGoogleLogin}
                            />
                        )}
                        {item === "facebook" && (
                            <Facebook handleLogin={handleLogin} />
                        )}
                        {item === "github" && (
                            <Github handleLogin={handleLogin} />
                        )}
                        {item === "twitter" && (
                            <Twitter handleLogin={handleLogin} />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
}

function GoogleLogin({ handleGoogleLogin }) {
    return (
        <button
            type="button"
            className="sso-buttons rounded pointer"
            onClick={() => handleGoogleLogin("google")}>
            <i className="fa-brands fa-google"></i>&nbsp; Google
        </button>
    );
}
function Facebook({ handleLogin }) {
    return (
        <button
            type="button"
            className="sso-buttons rounded pointer"
            onClick={() => handleLogin("facebook")}>
            <i className="fa-brands fa-facebook"></i>&nbsp; Facebook
        </button>
    );
}
function Github({ handleLogin }) {
    return (
        <button
            type="button"
            className="sso-buttons rounded pointer"
            onClick={() => handleLogin("github")}>
            <i className="fa-brands fa-github"></i>&nbsp; Github
        </button>
    );
}
function Twitter({ handleLogin }) {
    return (
        <button
            type="button"
            className="sso-buttons rounded pointer"
            onClick={() => handleLogin("twitter")}>
            <i className="fa-brands fa-twitter"></i>&nbsp; Twitter
        </button>
    );
}

export default SocialLogin;
