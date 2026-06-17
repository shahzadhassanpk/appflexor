import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import ImageViewPropsEditor from "../../props-editors/ImageViewPropsEditor";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function ImageView(props) {
    const [componentData, setComponentData] = useState({});
    const [show, setShow] = useState(false);
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }
        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        setData(props.formData);
    }, [props.formData, props.component.data]);

    useEffect(() => {
        if (props.mode !== props.modeType.design) {
            try {
                let visibleExp = props.component.data.condition;
                let disableExp = props.component.data.disabled;

                if (disableExp && disableExp !== "") {
                    setDisable(
                        evaluateExpression(
                            { expression: disableExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
                if (visibleExp && visibleExp !== "") {
                    setVisible(
                        !evaluateExpression(
                            { expression: visibleExp },
                            data,
                            ...expressionProps,
                        ),
                    );
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [data]);

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    const Error = () => {
        return <div>Error occurred in ImageView.</div>;
    };

    if (isEmpty(componentData))
        return (
            <div className="mb-3 p-3">
                <label className="form-label">ImageView</label>
            </div>
        );

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <ErrorBoundary render={() => Error}>
            {/* <code>{JSON.stringify(componentData, null, 2)}</code> */}
            {props.mode &&
                props.modeType &&
                props.mode === props.modeType.design && (
                    <span
                        className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                        onClick={() => setShow(true)}></span>
                )}
            <div className={"field-padding s2a-img-view" + userDefineClasses()}>
                {visible && (
                    <>
                        {componentData.use_img_src !== "YES" ? (
                            <RenderLayoutImage
                                componentData={componentData}
                                images={props.images}
                                mode={props.mode}
                            />
                        ) : (
                            <RenderSrcImage
                                componentData={componentData}
                                data={data}
                                mode={props.mode}
                            />
                        )}
                    </>
                )}
            </div>
            <Modal
                className="s2a-modal"
                show={show}
                size="lg"
                onHide={() => setShow(false)}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>Edit Image</span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={() => setShow(false)}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ImageViewPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>{" "}
        </ErrorBoundary>
    );
}

function RenderLayoutImage({ componentData, images, mode }) {
    // console.log(data.componentData);

    let DEFAULT_STATE = {
        maxWidth: "-webkit-fill-available",
    };

    const [style, setStyle] = useState({});
    const [imageSrc, setImagSrc] = useState("");

    useEffect(() => {
        if (images) {
            let imgId = componentData.image_id;
            let imgSrc = images[imgId];

            setImagSrc(imgSrc);
        }

        let temp = {};
        if (componentData.height) {
            temp.height = Number(componentData.height);
        }

        if (componentData.width) {
            temp.width = Number(componentData.width);
        }

        setStyle(temp);
    }, [componentData, images]);

    if (componentData.image_id) {
        return (
            <div>
                <div className="">
                    <img
                        style={{
                            // maxWidth: "-webkit-fill-available",
                            // maxHeight: "-webkit-fill-available",
                            maxWidth: "100%",
                        }}
                        src={`${imageSrc}`}
                        alt=""
                    />
                </div>
            </div>
        );
    } else {
        return (
            <div>
                <span>
                    <center>
                        <i className="fa-regular fa-image image-font mx-1"></i>{" "}
                        Add Image
                    </center>
                </span>
            </div>
        );
    }
}

function RenderSrcImage({ componentData, data, mode }) {
    const [imageSrc, setImagSrc] = useState("");
    const regex = /{([^}]*)}/gi;

    useEffect(() => {
        // console.log(componentData);
        // console.log(data);

        let imgSrc = componentData.image_src || "";
        if (imgSrc !== "") {
            try {
                const varsWithPattern = imgSrc.match(regex);

                if (varsWithPattern) {
                    const variables = purifyPattern(varsWithPattern);

                    console.log(variables);

                    variables.map(item => {
                        let wihoutPattern = item.wihoutPattern;
                        let withPattern = item.withPattern;
                        let value = data[wihoutPattern];
                        if (value) {
                            imgSrc = imgSrc.replace(withPattern, value);
                        }
                    });

                    setImagSrc(imgSrc);
                } else {
                    setImagSrc(imgSrc);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }, [componentData, data]);

    function purifyPattern(arr) {
        return arr.map(item => {
            let leftRemoved = item.replace("{", "");
            let righttRemoved = leftRemoved.replace("}", "");
            return { withPattern: item, wihoutPattern: righttRemoved };
        });
    }

    if (imageSrc) {
        return (
            <ErrorBoundary>
                <img
                    style={{
                        // maxWidth: "-webkit-fill-available",
                        // maxHeight: "-webkit-fill-available",
                        maxWidth: "100%",
                    }}
                    src={`${imageSrc}`}
                    alt=""
                />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <span>
                <center>
                    <i className="fa-regular fa-image image-font mx-1"></i>{" "}
                    Image not found
                </center>
            </span>
        </ErrorBoundary>
    );
}

export default ImageView;
