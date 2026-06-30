import { useContext, useState } from "react";
import FormContext from "../Context/FormContext";
import { modeType } from "./Designer";
import RenderPreview from "./RenderPreview";

function FormPreviewModal() {
    const formContext = useContext(FormContext);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    return (
        <div
            id="form-preview"
            className="s2a-modal modal fade form-preview"
            data-bs-backdrop="static"
            data-bs-keyboard="false">
            <div
                className={`modal-dialog modal-xl ${
                    toggleModalWindow === "maximize"
                        ? "modal-fullscreen"
                        : "modal-xl"
                } `}>
                <div className="modal-content ">
                    <div className="modal-header modal-title">
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
                                            formContext.setRenderPreview(false);
                                        }, 500);
                                    }}>
                                    <i className="fa-solid fa-x modal-close fs-5"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-body">
                        {formContext.renderPreview ? (
                            <RenderPreview
                                layout={formContext.layout}
                                components={formContext.components}
                                images={formContext.images}
                                htmlCollection={formContext.htmlCollection}
                                mode={modeType.preview}
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

export default FormPreviewModal;
