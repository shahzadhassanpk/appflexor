import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    API_URL,
    ASSETS_DB_TABLE,
    IMAGE_BASE,
    FOLDER_ASSETS_DB_TABLE,
} from "../../../../Config";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import {
    filterArrayByTerms,
    isEmpty,
    makeShortId,
} from "../../../../utils/utils";
import ImageFileUploader from "./ImageFileUploader";
import RenderImageGallery from "./RenderImageGallery";
import ImageFolder from "./ImageFolder";

export const MODE_TYPE = {
    update: "UPDATE",
    add: "ADD",
};

export const tableName = ASSETS_DB_TABLE;

function AssetsViewer({ channel, activeTab }) {
    const [list, setList] = useState([]);
    const [filteredlList, setFilteredList] = useState([]);
    const [selectedItem, setSelectedItem] = useState({});
    const [showUploader, setShowUploader] = useState(false);
    const [searchField, setSearchField] = useState("");
    const [hoveredItem, setHoveredItem] = useState({});
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [uploadMode, setUploadMode] = useState("INITIAL STATE");
    const [parent, setParent] = useState();
    const keysToSearch = ["image", "title", "tags"];
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (activeTab === "ASSET_MANAGER" && channel.id) {
            // getData(channel.id);
            setParent({
                id: "1",
                title: channel.brand_title ? channel.brand_title : "Site Root",
            });
            setShowUploader(false);
            setSelectedItem({});
        }
    }, [channel, activeTab]);

    useEffect(() => {
        if (channel && parent) {
            getData(channel.id);
        }
    }, [parent]);

    useEffect(() => {
        if (searchField !== "") {
            let filteredData = filterArrayByTerms(
                list,
                searchField,
                keysToSearch,
            );

            setFilteredList(filteredData);
        } else {
            setFilteredList(list);
        }
    }, [searchField]);

    function handleGetData() {
        getData(channel.id);
    }

    function hideUploader() {
        setShowUploader(false);
    }

    function getData() {
        setLoaded(false);
        const dataRequest = {            
            dataKeys: [
                {
                    serviceParams: channel.id + "," + parent.id,
                    dataKey: "assets",
                    serviceKey: "list.image.assets",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let assets = response.data.C_DATA.assets;
                    // if (typeof selectedItem.id !== "undefined") {
                    // if (typeof assets !== "undefined" && assets.length > 0) {
                    //     for (let index = 0; index < assets.length; index++) {
                    //         const element = assets[index];
                    //         // if (selectedItem.id === element.id) {
                    //         assets[index] = {
                    //             ...element,
                    //             imageHash: makeShortId(8),
                    //         };
                    //         // }
                    //     }
                    // }

                    if (assets && assets.length > 0) {
                        setList(assets);
                        setSelectedItem({});
                        setFilteredList(assets);
                    } else {
                        setList([]);
                        setSelectedItem({});
                        setFilteredList([]);
                    }
                } else {
                    console.log(response.data?.C_MESSAGE);
                    console.error(
                        "Unable to get data from 'list.image.assets'",
                    );
                }
                setLoaded(true);
            })
            .catch(error => {
                console.error(error);
            })
            .finally(() => {});
    }

    return (
        <div className="assets-viewer container-fluid">
            <ErrorBoundary>
                {channel && parent && (
                    <>
                        <ImageFolder
                            channel={channel}
                            activeTab={activeTab}
                            parent={parent}
                            setParent={setParent}
                            mode={"EDIT"}
                            showUploader={showUploader}
                            setShowUploader={setShowUploader}
                        />
                        <ActionBar
                            setUploadMode={setUploadMode}
                            uploadMode={uploadMode}
                            totalImages={list.length}
                            filteredImages={filteredlList.length}
                            setShowUploader={setShowUploader}
                            showUploader={showUploader}
                            searchField={searchField}
                            setSelectedItem={setSelectedItem}
                            setSearchField={setSearchField}
                            loaded={loaded}
                        />

                        <div
                            className={`${
                                showUploader ? "visually-hidden" : "d-block"
                            }`}>
                            {loaded ? (
                                <RenderImageGallery
                                    list={filteredlList}
                                    selectedItem={selectedItem}
                                    hoveredItem={hoveredItem}
                                    setHoveredItem={setHoveredItem}
                                    tableName={tableName}
                                    setSelectedItem={setSelectedItem}
                                    showImageViewer={showImageViewer}
                                    setShowImageViewer={setShowImageViewer}
                                    setUploadMode={setUploadMode}
                                    handleGetData={handleGetData}
                                    setShowUploader={setShowUploader}
                                    parent={parent}
                                />
                            ) : (
                                "Loading..."
                            )}
                        </div>
                        <div
                            className={`${
                                !showUploader ? "visually-hidden" : "d-block"
                            }`}>
                            <ImageFileUploader
                                uploadMode={uploadMode}
                                list={list}
                                showUploader={showUploader}
                                selectedItem={selectedItem}
                                tableName={tableName}
                                channelId={channel.id}
                                getData={handleGetData}
                                hideUploader={hideUploader}
                                parent={parent}
                            />
                        </div>
                    </>
                )}
            </ErrorBoundary>
        </div>
    );
}

function ActionBar({
    setUploadMode,
    setSelectedItem,
    setShowUploader,
    showUploader,
    searchField,
    setSearchField,
    filteredImages,
    totalImages,
    loaded,
}) {
    return (
        <div className="row">
            <div
                className={`w-100 col-sm-12 d-flex mb-2 align-items-center ${
                    showUploader
                        ? "justify-content-end"
                        : "justify-content-between"
                } `}>
                {!showUploader && (
                    <h5>Images ({loaded ? totalImages : "..."})</h5>
                )}
                {!showUploader && (
                    <div className="w-50 input-group">
                        {/* <span className="input-group-text">
                        <div
                            title="Search"
                            className="fa-solid fa-magnifying-glass fs-5"></div>
                    </span> */}
                        {/* <input
                        type="text"
                        className="form-control"
                        value={searchField}
                        onChange={e => setSearchField(e.target.value)}
                        placeholder="Search images..."
                    />
                    <span className="input-group-text">
                        &nbsp; {filteredImages} of {totalImages}
                    </span> */}
                    </div>
                )}
                <button
                    type="button"
                    disabled={!loaded}
                    className=" button-theme  btn btn-sm my-2 d-flex align-items-center justify-content-end"
                    onClick={() => {
                        setUploadMode(MODE_TYPE.add);

                        setSelectedItem({});
                        setShowUploader(prev => !prev);
                    }}>
                    {showUploader ? (
                        <i className="fa-solid fa-images fs-6"></i>
                    ) : (
                        <i className="fa-solid fa-plus fs-6"></i>
                    )}
                    {showUploader ? "Go Back" : "Add Images"}
                </button>
            </div>
        </div>
    );
}

export default AssetsViewer;
