import axios from "axios";
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Modal } from "react-bootstrap";
import { API_URL } from "../../../../../../Config";
import TagListPropsEditor from "../../props-editors/TagListPropsEditor";
import TagList from "./TagList";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";
export default function TagWrapper(props) {
    const {
        component,
        modeType,
        formData,
        mode,
        handleInputFields,
        handleOnFieldBlur,
    } = props;

    const [suggestions, setSuggestions] = useState([]);
    const [suggestionTagsId, setSuggestionsTagsId] = useState("");
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const [obj, setObj] = useState({});
    const classes = component?.data?.classes ?? "";
    const dbColumnAsClass = component?.data?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (mode !== modeType.design) {
            try {
                let visibleExp = component.data.condition;
                let disableExp = component.data.disabled;
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

    useEffect(() => {
        let key = component.data.db_column;
        if (formData) {
            setObj(prev => ({
                ...prev,
                [key]: formData[key],
            }));
        }
    }, [formData, component.data]);

    function getTagsByCategory() {
        let selectedData = component.data;
        let { category } = selectedData;
        if (props && modeType && modeType.design !== mode) {
            let request = {
                dataKeys: [
                    {
                        serviceParams: category,
                        dataKey: "tagSuggestionList",
                        serviceKey: "sys.tag.suggestion.list",
                        mode: "formData",
                    },
                ],
            };
            axios
                .post(API_URL + `?service.key=masterKey.tenantData`, request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        try {
                            let suggestionList =
                                response.data.C_DATA.tagSuggestionList[0];
                            let id = suggestionList.id;
                            let selectedTags = suggestionList.list;
                            let parsedTags = tryToParse(selectedTags);
                            if (parsedTags) {
                                setSuggestions(parsedTags);
                                setSuggestionsTagsId(id);
                            } else {
                                setSuggestions([]);
                                setSuggestionsTagsId("");
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    } else if (response.data.C_STATUS === "FAIL") {
                        getTagsByCategory(component.data);
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        }
    }

    function tryToParse(tags) {
        let length = tags ? tags.length : 0;
        if (typeof tags === "string" && length > 0) {
            try {
                tags = JSON.parse(tags);
            } catch (error) {
                console.log(error);
            }
        }
        return tags ? tags : [];
    }

    function checkDisable() {
        let flag = false;
        if (component.data.readonly === "YES") {
            flag = true;
        } else if (disable) {
            flag = true;
        } else {
            flag = false;
        }
        return flag;
    }

    function DbColumn() {
        return component && component.data && component.data.db_column;
    }

    function Category() {
        return component && component.data && component.data.category;
    }

    function Suggustion() {
        return suggestions ? suggestions : [];
    }

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <div className={"s2a-taglist " + userDefineClasses()}>
            <div className="s2a-taglist-wrap">
                {visible && (
                    <div>
                        {mode && modeType && mode === modeType.design && (
                            <span
                                className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                onClick={() => setShow(true)}></span>
                        )}
                        {!props.isInDatalistMode && (
                            <label className="form-label">
                                {component.data.label
                                    ? component.data.label
                                    : "Taglist"}
                                {component.data.required &&
                                    component.data.required === "YES" && (
                                        <span className="text-danger">
                                            &nbsp;*
                                        </span>
                                    )}
                            </label>
                        )}
                    </div>
                )}

                {mode === modeType.design && (
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={obj[component.data.db_column]}
                        disabled
                    />
                )}

                {props && mode === modeType.readonly && (
                    <TagList
                        category={Category()}
                        suggestions={Suggustion()}
                        db_column={DbColumn()}
                        handleInputTag={handleInputFields}
                        mode={mode}
                        modeTypes={modeType}
                        formData={formData}
                        placeHolder=""
                        suggestionTagsId={suggestionTagsId}
                        getTagsByCategory={getTagsByCategory}
                        setData={setData}
                        disable={true}
                    />
                )}
                {(mode === modeType.preview || mode === modeType.render) && (
                    <>
                        {props && visible && (
                            <>
                                <TagList
                                    category={Category()}
                                    suggestions={Suggustion()}
                                    db_column={DbColumn()}
                                    disable={checkDisable()}
                                    handleInputFields={handleInputFields}
                                    handleOnFieldBlur={handleOnFieldBlur}
                                    mode={mode}
                                    modeTypes={modeType}
                                    formData={formData}
                                    placeHolder=""
                                    suggestionTagsId={suggestionTagsId}
                                    getTagsByCategory={getTagsByCategory}
                                    setData={setData}
                                />
                            </>
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
                        <span>Edit Taglist</span>
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
                    <TagListPropsEditor setShow={setShow} />
                </Modal.Body>
            </Modal>
        </div>
    );
}
