import React, { useEffect, useState, useRef } from "react";
import Scroll from "../../../../components/Scroll/Scroll";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import AssetViewer from "../AssetViewer";
import useMobileView from "../../../../components/custom-hooks/useMobileView";

function AssestManager({ isAuthorized, channels, channel, activeTab }) {
    const [selectedChannel, setSelectedChannel] = useState({});
    const listingRef = useRef(null);
    const isMobileView = useMobileView();

    const handleListingScroll = () => {
        if (listingRef.current && isMobileView) {
            listingRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    useEffect(() => {
        setSelectedChannel(channel);
    }, [channel]);

    return (
        <ErrorBoundary>
            <div
                id="asset-manager"
                className="asset-manager container-fluid px-0 mx-0">
                <div className="row m-0">
                    <div className="col-sm-3 listing-col s2a-border-right">
                        <ListChannels
                            list={channels}
                            selectedItem={selectedChannel}
                            setSelectedItem={setSelectedChannel}
                            handleListingScroll={handleListingScroll}
                        />
                    </div>
                    <div
                        className="col-sm-9 p-0"
                        ref={listingRef}>
                        <AssetViewer
                            channel={selectedChannel}
                            activeTab={activeTab}
                        />
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

function ListChannels({
    list = [],
    selectedItem,
    setSelectedItem,
    handleListingScroll,
}) {
    return (
        <div className="">
            <div className="listing-header">
                <div className="">Sites</div>
            </div>
            <Scroll height="48vh">
                <ul
                    name="channel_id"
                    className="list-group list-group-flush p-1">
                    {list &&
                        list.map((item, index) => (
                            <li
                                onClick={() => {
                                    setSelectedItem(item);
                                    handleListingScroll();
                                }}
                                className={`list-group-item ${
                                    selectedItem.id === item.id
                                        ? "selected-cell"
                                        : ""
                                }`}
                                key={index}>
                                <div className="row">
                                    <span className="col-sm-12">
                                        {item.brand_title}
                                    </span>
                                    <span className="col-sm-12">
                                        {item.domain}
                                    </span>
                                </div>
                            </li>
                        ))}
                </ul>
            </Scroll>
        </div>
    );
}

function SearchInput(props) {
    return (
        <div className="row">
            <div className="mb-3 input-group">
                <input
                    type="text"
                    className="form-control"
                    {...props}
                />
                {/* <span className="input-group-text">
                    <i className="fa-solid fa-magnifying-glass"></i>
                </span> */}
            </div>
        </div>
    );
}

export default AssestManager;
