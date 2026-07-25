import { Interweave } from "interweave";
import React, { useContext } from "react";
import { AppContext } from "../../../../AppContext";

function Footer() {
    const appContext = useContext(AppContext);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 text-sm text-gray-500 dark:text-slate-400 mt-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
                {appContext.channel && appContext.channel.footer_html ? (
                    <Interweave content={appContext.channel.footer_html} />
                ) : (
                    <span>© {new Date().getFullYear()} AppFlexor. All rights reserved.</span>
                )}
            </div>
            
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    <span>System Operational</span>
                </div>
                <span className="hidden sm:block text-gray-300 dark:text-slate-600">|</span>
                <span>v1.0.0</span>
            </div>
        </div>
    );
}

export default Footer;
