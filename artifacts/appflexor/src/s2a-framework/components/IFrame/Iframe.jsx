import axios from "axios";
import React, {
    Fragment,
    useContext,
    useEffect,
    useState,
    useRef,
} from "react";
import Modal from "react-bootstrap/Modal";

import { AppContext } from "../../../AppContext";
import { API_URL } from "../../Config";
import { makeid } from "../../utils/utils";
import { ModelBox } from "../ModelBox";
import "./Iframe.css";
import $ from "jquery";

function IFrame(props) {
    const appContext = useContext(AppContext);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showModal, setShowModal] = useState(props.showModal);
    let url = "";
    let id = "";
    let currentUrl = window.location.href;

    const ref = useRef();
    const [height, setHeight] = useState("100vh");

    const onLoad = (o) => {
        // if(o){
        //     o.style.height=o.contentWindow.document.body.scrollHeight+"px";
        // }
        
        // if(ref){
        //     let height = ref?.current?.contentWindow?.document.body.scrollHeight + "px";
        //     setHeight(height);
        //     console.log("************ height:"+height);
        // }        
    }

    // useEffect(() => {
    //     onLoad();
    // }, []);

    if (currentUrl.includes(":id=")) {
        let arr = currentUrl.split(":id=");
        id = arr[1];

        if (id.includes("embed")) {
            let arr2 = id.split("&embed");
            id = arr2[0];
        }

        url = getUrlById(appContext.moduleFeatures, id);
        // console.log("****** url:" + url);
        // console.log(arr, "iframe array");
        // console.log(appContext, "appContext");
        // console.log(appContext.moduleFeatures, "appContext.moduleFeatures");
    } else {
        console.error("ID not found");
    }

    function getUrlById(arr, id) {
        let _url = "";
        arr.forEach(element => {
            if (element.id === id) {
                _url = element.feature_key;
            }
        });
        return _url;
    }

    useEffect(() => {
        SSOLogin();
    }, []);

    function resizeIframe() {
        // let obj = document.getElementById(id);
        // obj.height = obj.contentWindow.document.body.scrollHeight + "px";
        // let height = $(obj).contents().height();
        // $(obj).height(height+"px");
        // $(obj).width($(obj).contents().width());
        // let height = obj.contentWindow.document.documentElement.scrollHeight;
        // obj.style.height = height + "px";
        // console.log("************* height:" + height);
        //obj.contentWindow.top = obj;
    }
    function handleClose() {
        setShowModal(false);
    }
    function SSOLogin() {
        let authKey = localStorage.getItem("AUTH_KEY");
        if (authKey) {
            axios
                .post(API_URL + "?service.key=sso.login&AUTH_KEY=" + authKey)
                .then(response => {
                    setIsLoaded(true);
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    return (
        isLoaded && (
            <>
                {!showModal && (
                    <div className="iframe-main">
                        <iframe
                            ref={ref}
                            id={id}
                            src={url}
                            className=""
                            height={"100vh"}
                            width={'100%'}
                            // onLoad={onLoad(this)}
                            // onload='javascript:(function(o){o.style.height=o.contentWindow.document.body.scrollHeight+"px";}(this));' style="height:200px;width:100%;border:none;overflow:hidden;"
                            // onLoad={resizeIframe}
                            // onLoad="$(this).height($(this).contents().height());$(this).width($(this).contents().width());"
                            scrolling="no"
                            frameborder="0"
                            border="0"
                            cellspacing="0"></iframe>
                    </div>
                )}
                {showModal && (
                    <Modal
                        className="s2a-modal"
                        show={showModal}
                        onHide={() => handleClose()}
                        size={"xl"}
                        fullscreen={"lg"}
                        backdrop="static">
                        <Modal.Header>
                            <Modal.Title className="modal-title">
                                <span>{"Title"}</span>
                                <i
                                    className="fa-solid fa-xmark modal-close"
                                    onClick={handleClose}></i>
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <iframe
                                id={id}
                                src={url}
                                className="iframe-body enable-scroll"
                                frameBorder="0"
                                scrolling="yes"
                                onLoad={resizeIframe}></iframe>
                        </Modal.Body>
                        <Modal.Footer></Modal.Footer>
                    </Modal>
                )}
            </>
        )
    );
}

function IFrameDnd(props) {
    const appContext = useContext(AppContext);
    const [propsData, setPropsData] = useState({});
    const [mode, setMode] = useState("PREVIEW");
    useEffect(() => {
        if (props && props.component) {
            if (props.component.data) {
                let temObj = props.component.data;
                temObj.id = makeid(5);
                setPropsData(temObj);
            }

            if (props.mode && props.mode === "DESIGN_MODE") {
                setMode(props.mode);
            } else {
                setMode("PREVIEW");
            }

            if (props?.showModal) {
                setShowModal(true);
            } else {
                setShowModal(false);
            }
        }
    }, [props]);

    function resizeIframe() {
        let obj = document.getElementById(propsData.id);
        let height = obj.contentWindow.document.documentElement.scrollHeight;
        obj.style.height = height + "px";
        // console.log("************* height:" + height);
        //obj.contentWindow.top = obj;
    }

    // utils

    return (
        <Fragment>
            {mode === "PREVIEW" && (
                <React.Fragment>
                    {propsData.url ? (
                        <div className="iframe-main">
                            <iframe
                                id={propsData.id}
                                onLoad={resizeIframe}
                                src={propsData.url ? propsData.url : ""}
                                className="iframe-body"
                                frameBorder="0"
                                scrolling="no"
                            />
                        </div>
                    ) : (
                        <div
                            style={{ minHeight: "100px" }}
                            className="d-flex align-items-center justify-content-center">
                            <span className="text-muted">
                                No <span className="text-danger">URL</span>{" "}
                                provided.
                            </span>
                        </div>
                    )}
                </React.Fragment>
            )}
            {mode === "DESIGN_MODE" && (
                <React.Fragment>
                    {propsData.url ? (
                        <div className="iframe-main  p-3">
                            <iframe
                                id={propsData.id}
                                src={propsData.url ? propsData.url : ""}
                                className="iframe-body border"
                                frameBorder="0"
                                scrolling="no"
                            />
                        </div>
                    ) : (
                        <div
                            style={{ minHeight: "100px" }}
                            className="d-flex align-items-center justify-content-center">
                            <span className="text-muted">
                                No <span className="text-danger">URL</span>{" "}
                                provided.
                            </span>
                        </div>
                    )}
                </React.Fragment>
            )}
        </Fragment>
    );
}

export { IFrame, IFrameDnd };
