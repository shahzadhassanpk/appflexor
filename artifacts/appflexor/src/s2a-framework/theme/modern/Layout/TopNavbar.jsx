import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../AppContext";
import { tryToParse } from "../../../modules/data-management/form-builder/Forms/FormViewer/utils";
import Avatar from "./Avatar";
import BrandLogo from "./BrandLogo";
import RightMenu from "./RightMenu";

function TopNavbar({
    isAuthorized,
    modules,
    features,
    screenView,
    mainItems,
    mainBackOfficeItems,
    brandDetails,
    setToggleMiniNavbar,
    toggleMiniNavbar,
    MENU,
}) {
    const appContext = useContext(AppContext);
    const { setOffice, userOrgList, userOrg, setUserOrg } = appContext;

    const [toggleTopSubMenu, setToggleTopSubMenu] = useState(false);
    const [topNavbarHeight, setTopNavbarHeight] = useState(0);
    const [width, setWidth] = useState("desktop");
    const site_preference = tryToParse(appContext.channel?.site_preference);
    const menu_position = site_preference?.menu_position || "below-header";

    const [showOrgMenu, setShowOrgMenu] = useState(false);
    const orgMenuRef = useRef(null);

    const [isLight, setIsLight] = useState(localStorage.getItem("theme") === "light");

    useEffect(() => {
        const body = document.body;
        if (isLight) {
            body.classList.remove("dark");
        } else {
            body.classList.add("dark");
        }
    }, [isLight]);

    const handleThemeToggle = () => {
        setIsLight(prev => {
            const newTheme = !prev;
            localStorage.setItem("theme", newTheme ? "light" : "dark");
            return newTheme;
        });
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (orgMenuRef.current && !orgMenuRef.current.contains(event.target)) {
                setShowOrgMenu(false);
            }
        }
        function handleEsc(event) {
            if (event.key === "Escape") setShowOrgMenu(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    function handleToggleMiniNavbar() {
        let prevState = toggleMiniNavbar;
        let newState = MENU[prevState] === MENU.HOVER ? MENU.FIXED : MENU.HOVER;

        const mainEle = document.getElementById("main");
        const footerEle = document.getElementById("footer");

        if (mainEle) {
            mainEle.style.transition = "all 0.2s ease";
            if (newState === MENU.HOVER) {
                mainEle.classList.remove("add-margin");
                mainEle.classList.add("add-margin-60");
            } else {
                mainEle.classList.remove("add-margin-60");
                mainEle.classList.add("add-margin");
            }
        }
        if (footerEle) {
            footerEle.style.transition = "all 0.2s ease";
            if (newState === MENU.HOVER) {
                footerEle.classList.remove("add-margin");
                footerEle.classList.add("add-margin-60");
            } else {
                footerEle.classList.remove("add-margin-60");
                footerEle.classList.add("add-margin");
            }
        }

        setToggleMiniNavbar(newState);
        localStorage.setItem("SIDE_NAVBAR_STATE", newState);
    }

    function handleLogin() {
        localStorage.removeItem("user_groups");
        appContext.handleLogout("/login");
    }
    function handleSignup() {
        localStorage.removeItem("user_groups");
        localStorage.setItem("redirect_on_logout", "/register");
        appContext.handleLogout("/register");
    }

    return (
        <React.Fragment>
            <nav className="fixed top-0 left-0 right-0 h-14 z-40 bg-white border-b border-gray-200 dark:bg-slate-800 dark:border-slate-700 flex items-center px-4 transition-colors">
                <div className="flex items-center w-full justify-between">
                    {/* Left Section */}
                    <div className="flex items-center gap-2">
                        {/* Desktop sidebar toggle — always first */}
                        {screenView === "lg" && isAuthorized && (
                            <button
                                onClick={handleToggleMiniNavbar}
                                className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                title="Toggle sidebar"
                            >
                                <i className="fa-solid fa-bars text-base"></i>
                            </button>
                        )}

                        {/* Mobile hamburger */}
                        {appContext.isAuthorized && screenView !== "lg" && (
                            <button
                                data-bs-toggle="offcanvas"
                                data-bs-target="#sideNavbarMobile"
                                className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <i className="fa-solid fa-bars-staggered text-base"></i>
                            </button>
                        )}

                        {/* Brand logo */}
                        <BrandLogo />
                    </div>

                    {/* Center Section: Search */}
                    {appContext.isAuthorized && screenView === "lg" && (
                        <div className="flex-1 max-w-lg mx-4">
                            <div className="relative group">
                                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="text"
                                    placeholder="Search for processes, tasks, deployments, users..."
                                    className="w-full bg-gray-100 dark:bg-slate-700 border-none rounded-full py-1.5 pl-10 pr-12 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none placeholder:text-gray-500 dark:placeholder:text-slate-400"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <kbd className="hidden sm:inline-block border border-gray-200 dark:border-slate-600 rounded px-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800">⌘K</kbd>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Section */}
                    {appContext.isAuthorized && appContext.userGroups?.groupid && (
                        <div className="flex items-center gap-3">
                            {appContext?.channel?.show_org_context === "YES" && userOrgList?.length > 0 && (
                                <div className="relative" ref={orgMenuRef}>
                                    <button
                                        onClick={() => setShowOrgMenu(prev => !prev)}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                                        title="Organization"
                                    >
                                        <i className="fa-solid fa-building"></i>
                                        <span className="max-w-[120px] truncate">{userOrg?.name || "Select Organization"}</span>
                                    </button>

                                    {showOrgMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 py-1 z-50">
                                            <button
                                                onClick={() => {
                                                    setUserOrg(null);
                                                    localStorage.removeItem("userOrg");
                                                    setShowOrgMenu(false);
                                                    window.location.reload();
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${!userOrg ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                            >
                                                Select Organization
                                            </button>
                                            {userOrgList.map(org => (
                                                <button
                                                    key={org.id}
                                                    onClick={() => {
                                                        setUserOrg(org);
                                                        localStorage.setItem("userOrg", JSON.stringify(org));
                                                        setShowOrgMenu(false);
                                                        window.location.reload();
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${userOrg?.id === org.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                                >
                                                    {org.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button className="text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                <i className="fa-regular fa-bell text-[17px]"></i>
                                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none shadow">
                                    1
                                </span>
                            </button>

                            <button className="text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                <i className="fa-regular fa-circle-question"></i>
                            </button>

                            <button
                                onClick={handleThemeToggle}
                                className="text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                title="Toggle theme"
                            >
                                <i className={`fa-solid ${isLight ? "fa-moon" : "fa-sun"}`}></i>
                            </button>

                            {appContext.userGroups?.groupid?.includes("ADMIN") && (
                                <button
                                    title="Control Panel"
                                    data-bs-toggle="offcanvas"
                                    data-bs-target="#rightMenu"
                                    className="text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <i className="fa-solid fa-gear"></i>
                                </button>
                            )}

                            {appContext.userGroups?.groupid?.includes("GUEST") ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleLogin} className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400">Login</button>
                                    {appContext?.channel?.allow_signup === "YES" && (
                                        <button onClick={handleSignup} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">Sign up</button>
                                    )}
                                </div>
                            ) : (
                                <Avatar screenView={screenView} />
                            )}
                        </div>
                    )}
                </div>
            </nav>

            <RightMenu
                isAuthorized={isAuthorized}
                modules={modules}
                features={features}
                screenView={screenView}
                mainItems={mainItems}
                brandDetails={brandDetails}
            />
        </React.Fragment>
    );
}

export default TopNavbar;
