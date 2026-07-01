import { memo, useState, useEffect } from "react";
import { Menu } from "../Menus/Menu";
import { Link } from "../Links/Link";
import { Site } from "../Sites/Site";
import { SiteContext } from "./SiteContext";

export const SiteMenuLinkWrapper = ({
    activeTab,
    channel,
    channels = [],
    mychannel,
    isAuthorized,
}) => {
    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [selectedChannelId, setSelectedChannelId] = useState("");
    const [moduleItem, setModuleItem] = useState({});

    useEffect(() => {
        setSelectedChannelId(channel?.id);
    }, [channel]);

    useEffect(() => {
        if (moduleItem && moduleItem.channel_id) {
            let _moduleItemId = moduleItem.channel_id;

            if (selectedChannelId && _moduleItemId) {
                if (selectedChannelId !== _moduleItemId) {
                    setSelectedModuleId("");
                }
            }
        }
    }, [selectedChannelId, moduleItem]);

    function selectedChannelFromChild(selectedChannel, condition) {
        if (selectedChannel) {
            setSelectedChannelId(selectedChannel);
        }
        if (condition === "delete" && selectedChannel === "") {
            setSelectedChannelId("");
            setSelectedModuleId("");
        }
    }

    function selectedModuleFromChild(moduleId, selectedModuleItem) {
        if (selectedChannelId) {
            setSelectedModuleId(moduleId);
        }
        if (selectedModuleItem) {
            setModuleItem(selectedModuleItem);
        }
    }

    return (
        <>
            <SiteContext.Provider
                value={{ selectedModuleId, selectedChannelId, moduleItem }}>
                <div
                    id=""
                    className="">
                    <div className="s2a-sites p-0">
                        <div className="row sites-row">
                            <div className="col-sm-4 site sites-col">
                                <Site
                                    selectedChannelFromChild={
                                        selectedChannelFromChild
                                    }
                                    activeTab={activeTab}
                                    isAuthorized={isAuthorized}
                                />
                            </div>
                            <div className="col-sm-4 menu sites-col">
                                {selectedChannelId !== "" && (
                                    <Menu
                                        selectedChannelId={selectedChannelId}
                                        selectedModuleFromChild={
                                            selectedModuleFromChild
                                        }
                                        isAuthorized={isAuthorized}
                                    />
                                )}
                            </div>
                            <div className="col-sm-4 link sites-col">
                                {selectedModuleId !== "" && (
                                    <Link
                                        selectedChannelId={selectedChannelId}
                                        selectedModuleId={selectedModuleId}
                                        isAuthorized={isAuthorized}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SiteContext.Provider>
        </>
    );
};
