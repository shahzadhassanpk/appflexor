import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { API_URL, IMAGE_BASE } from "../../../Config";
import {
    formatDateForUserView,
    formatDateTimeForUserView,
} from "../../../utils/utils";

function Avatar({ screenView }) {
    const navigate = useNavigate();
    const appContext = useContext(AppContext);
    const [profile, setProfile] = useState({});
    const [profileImgUrl, setProfileImgUrl] = useState("");
    useEffect(() => {
        if (appContext.profile) {
            let url = "";
            let profile = appContext.profile;
            // if (appContext.profile.profile_img) {
            //   url = `${IMAGE_BASE}/dir_user/${profile.id}/${profile.profile_img}`
            // } else {
            //   url = "./theme/images/default-user-profile-img.png"
            // }

            if (profile.profile_img) {
                if (profile.provider !== "system") {
                    url = profile.profile_img;
                } else {
                    url = `${IMAGE_BASE}/dir_user/${profile.id}/${profile.profile_img}`;
                }
            } else {
                url = `${window.location.origin}/app/theme/images/default-user-profile-img.png`;
            }

            setProfileImgUrl(url);
            setProfile(profile);
        }
    }, [appContext.profile]);
    return (
        <div
            title="User Menu"
            className={`d-flex profile-avatar ${
                appContext.screenView === "lg" ? "position-relative" : ""
            }`}>
            <div
                className="avatar"
                data-bs-toggle="dropdown">
                <React.Fragment>
                    <img
                        className="image-styling-navbar dropdown"
                        src={profileImgUrl}
                        alt="image"
                        aria-expanded="false"
                    />
                    {/* <span className="position-absolute bottom-0 end-0 status-online border border-2 border-light rounded-circle"></span> */}
                </React.Fragment>
            </div>

            {appContext?.userGroups.group_code !== "GUEST" ? (
                <ul
                    id="dropdown-styles"
                    className={`avatar-dropdown-menu dropdown-menu dropdown-menu-end`}>
                    <li className="dropdown-list-item pointer">
                        <Link
                            to={"/user-profile"}
                            className="dropdown-item">
                            <i className=" fa-regular fa-user me-2"></i>
                            {profile.firstname} {profile.lastname}
                        </Link>
                    </li>

                    <li className="dropdown-list-item pointer">
                        <div
                            className="dropdown-item"
                            onClick={() => appContext.handleLogout("/login")}>
                            <i className="fa-solid fa-arrow-right-from-bracket me-2"></i>
                            Logout
                        </div>
                    </li>
                </ul>
            ) : (
                <ul
                    id="dropdown-styles"
                    className={`avatar-dropdown-menu dropdown-menu dropdown-menu-end`}>
                    <li className="dropdown-list-item pointer">
                        <div
                            className="dropdown-item"
                            onClick={() => appContext.handleLogout("/login")}>
                            <i className="fa-solid fa-arrow-right-from-bracket me-2"></i>
                            Login
                        </div>
                    </li>
                </ul>
            )}
        </div>
    );
}

export default Avatar;
