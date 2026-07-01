import { useContext, useState } from "react";
import PageContext from "../Context/PageContext";
import { modeType } from "./Designer";
import RenderPreview from "./RenderPreview";

function PagePreviewModal() {
    const pageContext = useContext(PageContext);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    return (
        <div
            id="form-preview"
            className="modal fade form-preview"
            data-bs-backdrop="static"
            data-bs-keyboard="false">
            <div
                className={`modal-dialog  ${
                    toggleModalWindow === "maximize"
                        ? "modal-fullscreen"
                        : "modal-xl"
                } `}>
                <div className="modal-content ">
                    <div className="modal-header">
                        <div className="flex-row d-flex vw-100 justify-content-between align-items-center">
                            <label
                                htmlFor=""
                                className="my-2 h5 form-label">
                                Design Preview
                            </label>
                            {/* <div className="align-self-center pe-2">
                                <div className="align-self-center btn-group btn-group-sm">
                                    <button
                                        type="button"
                                        className="btn btn-outline-dark fs-5 fa-solid fa-mobile-screen-button"></button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-dark fs-5 fa-solid fa-display"></button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-dark fs-5 fa-solid fa-tablet-screen-button"></button>
                                </div>
                            </div> */}
                            <div className="d-flex">
                                <div
                                    className={`m-2 pointer ${
                                        toggleModalWindow === "maximize"
                                            ? "visually-hidden"
                                            : ""
                                    } `}
                                    onClick={() =>
                                        setToggleModalWindow("maximize")
                                    }
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Maximize window">
                                    <i className="fa-regular fa-window-maximize fs-5"></i>
                                </div>

                                <div
                                    className={`m-2 pointer ${
                                        toggleModalWindow === "restore"
                                            ? "visually-hidden"
                                            : ""
                                    } `}
                                    onClick={() =>
                                        setToggleModalWindow("restore")
                                    }
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Restore Window">
                                    <i className="fa-regular fa-window-restore fs-5"></i>
                                </div>
                                <div
                                    className=""
                                    data-bs-dismiss="modal"
                                    data-bs-toggle="tooltip"
                                    data-bs-title="Close"
                                    onClick={() => {
                                        setTimeout(() => {
                                            pageContext.setRenderPreview(false);
                                        }, 500);
                                    }}>
                                    <i className="fa-solid fa-x modal-close fs-5"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-body scroll-for-all">
                        {pageContext.renderPreview ? (
                            <RenderPreview
                                layout={pageContext.layout}
                                components={pageContext.components}
                                images={pageContext.images}
                                htmlCollection={pageContext.htmlCollection}
                                mode={modeType.render}
                                modeType={modeType}></RenderPreview>
                        ) : null}
                    </div>
                    {/* <div className="modal-footer">
                    <button
                        type="button"
                        className="btn button-theme "
                        onClick={() => generateTable()}
                    >
                        Save
                    </button>
                </div> */}
                </div>
            </div>
        </div>
    );
}

export default PagePreviewModal;
