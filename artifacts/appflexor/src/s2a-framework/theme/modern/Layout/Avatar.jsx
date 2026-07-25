import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { IMAGE_BASE } from "../../../Config";

function Avatar({ screenView }) {
    const appContext = useContext(AppContext);
    const [profile, setProfile] = useState({});
    const [profileImgUrl, setProfileImgUrl] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (appContext.profile) {
            let url = "";
            let p = appContext.profile;

            if (p.profile_img) {
                if (p.provider !== "system") {
                    url = p.profile_img;
                } else {
                    url = `${IMAGE_BASE}/dir_user/${p.id}/${p.profile_img}`;
                }
            } else {
                url = `${window.location.origin}/app/theme/images/default-user-profile-img.png`;
            }

            setProfileImgUrl(url);
            setProfile(p);
        }
    }, [appContext.profile]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isGuest = appContext?.userGroups?.group_code === "GUEST";

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors focus:outline-none"
            >
                {screenView === "lg" && !isGuest && (
                    <div className="hidden md:flex flex-col items-end text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                            {profile.firstname} {profile.lastname}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                            {appContext.userGroups?.group_code || 'User'}
                        </span>
                    </div>
                )}
                <div className="relative w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-gray-200 dark:bg-slate-700 overflow-hidden shrink-0">
                    <img
                        className="w-full h-full object-cover"
                        src={profileImgUrl || "/app/theme/images/default-user-profile-img.png"}
                        alt="Profile"
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src="/app/theme/images/default-user-profile-img.png";
                        }}
                    />
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-2 z-50 transform origin-top-right transition-all">
                    {!isGuest ? (
                        <>
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 md:hidden">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {profile.firstname} {profile.lastname}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                    {profile.email}
                                </p>
                            </div>
                            <Link
                                to="/user-profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <i className="fa-regular fa-user text-gray-400 dark:text-slate-500"></i>
                                Profile Settings
                            </Link>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    appContext.handleLogout("/login");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                                Sign out
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                appContext.handleLogout("/login");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                            <i className="fa-solid fa-arrow-right-to-bracket"></i>
                            Sign in
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default Avatar;
