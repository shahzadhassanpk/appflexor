import { Interweave } from "interweave";
import React, { useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import HTMLPropsEditor from "../../props-editor/HTMLPropsEditor";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import { evaluateExpression } from "../../../datalist-viewer/datalist-filter-helpers/DatalistFilters";
import TextToSpeech from "../../../../../../components/TextToSpeech";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function HTML(props) {
    // const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});

    const htmlModalRef = useRef(null);
    const handleShow = () => htmlModalRef?.current?.show();
    const handleClose = () => htmlModalRef?.current?.close();
    const setShow = bool => {
        bool ? handleShow() : handleClose();
    };

    useEffect(() => {
        try {
            let visibleExp = props.component.data.condition;
            let disableExp = props.component.data.disabled;

            if (disableExp && disableExp !== "") {
                setDisable(
                    evaluateExpression({ expression: disableExp }, data),
                );
            }

            if (visibleExp && visibleExp !== "") {
                setDisable(
                    !evaluateExpression({ expression: visibleExp }, data),
                );
            }
        } catch (error) {
            console.log(error);
        }
    }, [data]);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }
    }, [props.component.data]);

    const Error = () => {
        return (
            <div>
                <center className="text-danger">Error occurred in HTML</center>
            </div>
        );
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    if (isEmpty(componentData))
        return (
            <div className="p-3 ">
                <label className="form-label">HTML</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <>
                    <>
                        {props.mode &&
                            props.modeType &&
                            props.mode !== props.modeType.design && (
                                <RenderHTML
                                    componentData={componentData}
                                    htmlCollection={
                                        props.htmlCollection
                                    }></RenderHTML>
                            )}

                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <div className="">
                                    <div className="d-flex justify-content-center align-items-center pointer">
                                        <span
                                            className="m-2 fa-regular fa-pen-to-square mx-1"
                                            onClick={() =>
                                                setShow(true)
                                            }></span>{" "}
                                        Enter Text
                                    </div>
                                </div>
                            )}
                    </>
                    <ChildrenModal
                        ref={htmlModalRef}
                        size="xl"
                        header="Edit Html">
                        <HTMLPropsEditor setShow={setShow} />
                    </ChildrenModal>
                </>
            )}
        </ErrorBoundary>
    );
}

function RenderHTML({ componentData, htmlCollection }) {
  const htmlId = componentData?.html_id;
  const iconClass = componentData?.icon;
  const position = componentData?.position;
  const collapse = componentData?.collapse;
  const htmlContent = htmlId ? htmlCollection[htmlId] : "";

  const floating = {
    left: "row",
    right: "row-reverse",
    undefined: "row",
  };

  const collapseClass =
    collapse === "horizontal" ? "collapse collapse-horizontal" : "collapse";

  const contentRef = useRef(null);

  useEffect(() => {
    // Collapse on outside click
    function handleClickOutside(event) {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target)
      ) {
        const collapseEl = document.getElementById(htmlId);
        if (collapseEl && collapseEl.classList.contains("show")) {
          const bsCollapse = window.bootstrap.Collapse.getInstance(collapseEl);
          if (bsCollapse) {
            bsCollapse.hide();
          } else {
            new window.bootstrap.Collapse(collapseEl, { toggle: false }).hide();
          }
        }
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [htmlId]);

  return collapse && collapse !== "none" ? (
    <>
      <div className={`w-100 d-flex flex-${floating[position]}`}>
        <span
          className="mb-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#${htmlId}`}
          aria-expanded="false"
          aria-controls="collapse"
        >
          <i className={iconClass || "bi bi-info-circle"}></i>
          {iconClass && iconClass.length > 0 ? "" : " Info"}
        </span>
      </div>

      <div className={collapseClass} id={htmlId}>
        <div
          ref={contentRef}
          style={{ width: "inherit" }}
          className="content-body p-2"
        >
          <Interweave content={htmlContent} />
        </div>
      </div>
    </>
  ) : (
    <>
      <Interweave content={htmlContent} />
    </>
  );
}

export default HTML;
