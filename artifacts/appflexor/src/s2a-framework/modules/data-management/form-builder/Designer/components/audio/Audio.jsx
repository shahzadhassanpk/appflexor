import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import DynamicInput from "../../../../../../components/dynamic-input/DynamicInput";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import { makeid } from "../../../../../../utils/utils";
import { toastEmitter } from "../../../../../../components/Toastify/Toastify";
import { tryToParse } from "../../../Forms/FormViewer/utils";
import TableWrapper from "../../../../../../components/react-table/TableWrapper";
import ModalBox from "../../../../../../components/Modal/Modal";
import AudioPropsEditor from "../../props-editors/AudioPropsEditor";
import Scroll from "../../../../../../components/Scroll/Scroll";
import { evaluateExpression } from "../../../../../content-management/page-builder/datalist-viewer/datalist-filter-helpers/DatalistFilters";
import useGlobalData from "../../../../../../components/useGlobal";

/**
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

const initialAudioState = {
    id: "",
    label: "",
    link: "",
    thumbnail: "",
};

const initialDelState = { item: {}, show: false };

function Audio(props) {
    //states
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});
    const [show, setShow] = useState(false);
    const [selectedAudio, setSelectedAudio] = useState(initialAudioState);
    const [audioList, setAudioList] = useState([]);
    const [selectedAudioForPlay, setSelectedAudioForPlay] = useState({});
    const [errors, setErrors] = useState([]);
    const [deleteItem, setDeleteItem] = useState(initialDelState);
    const alignContent = {
        top: "mb-2",
        bottom: "mt-2",
        right: "ms-2",
        left: "me-2",
    };
    const { height, width, show_pagination, position } = componentData;
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const expressionProps = useGlobalData();

    //refs
    const audioListModalRef = useRef(null);
    const audioEl = useRef(null);

    const attemptPlay = () => {
        audioEl &&
            audioEl.current &&
            audioEl.current.play().catch(error => {
                toastEmitter(error, true, "error");
                console.error("Error attempting to play", error);
            });
    };

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

    useEffect(() => {
        try {
            if (props.component && props.component.data) {
                setComponentData(props.component.data);
            }

            if (!props.formData || isEmpty(props.formData)) {
                return;
            }

            let key = props.component.data.db_column;
            const list = props.formData[key];
            setObj(prev => ({
                ...prev,
                [key]: list,
            }));
            if (list) {
                var parseList = tryToParse(list);
            } else {
                parseList = [];
            }
            setAudioList(parseList);

            if (
                props.isFormSaved ||
                (props.formData.id && props.formData.id !== "new")
            ) {
                let stringToValidate = props.formData[key];

                let isStringValid = true;
                let lengthOfString = (""+stringToValidate).length;

                let _message = "";

                let minCharacters = parseInt(
                    props.component.data.min_characters,
                );
                let maxCharacters = parseInt(
                    props.component.data.max_characters,
                );

                if (!minCharacters) minCharacters = -1; // backtrack compatibility
                if (!maxCharacters) maxCharacters = 255; // backtrack compatibility

                if (
                    lengthOfString >= minCharacters &&
                    lengthOfString <= maxCharacters
                ) {
                    isStringValid = true;
                    _message = "";
                } else {
                    isStringValid = false;
                    _message =
                        minCharacters > 0
                            ? `Letter count should be ${minCharacters} to ${maxCharacters}`
                            : `Letter count cannot exceed ${maxCharacters}`;
                }

                if (isStringValid && props.component.data.required === "YES") {
                    if (lengthOfString > 0) {
                        isStringValid = true;
                        _message = "";
                    } else {
                        isStringValid = false;
                        _message = "Required field.";
                    }
                }

                if (
                    props.component.data.regex &&
                    props.component.data.regex.length > 0
                ) {
                    const regexExp = new RegExp(props.component.data.regex);

                    let strToValidate = stringToValidate;
                    let strIsValid = regexExp.test(strToValidate);

                    if (!strIsValid) {
                        let regexInfo = `Field must match regex pattern.`;
                        if (props.component.data.regexinfo) {
                            regexInfo = props.component.data.regexinfo;
                        }
                        _message = regexInfo;
                    } else {
                        _message = "";
                    }
                }
                setMessage(_message);
            }

            setData(props.formData);
        } catch (e) {
            console.log("***********" + e);
        }
    }, [props.formData, props.component.data, props.isFormSaved]);

    const Error = () => {
        return <div>Error occurred in Text Field.</div>;
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    const pushAudioInList = (item, setItem) => {
        if (checkValidation(item, ["label", "link"], setErrors)) {
            let list = [];
            let msg = "";
            const types = ["mp3", "ogg", "wav"];

            if (typeValidation(item, types)) {
                if (item.id) {
                    // update item
                    list = [...audioList];
                    const selectedIndex = list.findIndex(
                        _item => _item.id === item.id,
                    );
                    list.splice(selectedIndex, 1, item);
                    msg = "audio updated";
                } else {
                    // insert item
                    item.id = makeid();
                    list = [...audioList, item];
                    setAudioList(list);
                    msg = "audio saved";
                }

                if (props.handleInputFields) {
                    // update in parent
                    props.handleInputFields(
                        componentData.db_column,
                        JSON.stringify(list),
                        true,
                    );
                }

                setItem(initialAudioState);
                closeForm();
                toastEmitter(msg, true);
            } else {
                toastEmitter(
                    "Audio link must have these types " + types.join(" "),
                    true,
                    "warning",
                );
            }
        }
    };

    const checkValidation = (item, requiredField, setErrors) => {
        const _requiredField = requiredField;
        const invalidFields = [];
        let validity = false;

        try {
            for (const key in item) {
                if (
                    !_requiredField ||
                    (_requiredField && _requiredField.includes(key))
                )
                    if (item[key].length < 1) {
                        invalidFields.push(key);
                    }
            }
        } catch (error) {
            toastEmitter(error, true, "error");
        }

        validity = invalidFields.length > 0 ? false : true;

        if (!validity) {
            // toastEmitter(invalidFields.join(" "), true);
            if (setErrors) {
                setErrors(_requiredField);
            }
        }

        return validity;
    };

    const showForm = () => {
        audioListModalRef.current.show();
        setErrors([]);
    };

    const addNew = () => {
        showForm();
        setSelectedAudio(initialAudioState);
    };

    const closeForm = () => {
        audioListModalRef.current.close();
        setErrors([]);
    };

    const deleteAudioFromList = (_item, confirm) => {
        if (!confirm) {
            setDeleteItem({ ...deleteItem, item: _item, show: true });
        }
        if (confirm) {
            const { id } = _item;
            const list = audioList.filter(item => item.id !== id);
            setAudioList(list);
            setDeleteItem(initialDelState);
            if (props.handleInputFields) {
                props.handleInputFields(
                    componentData.db_column,
                    JSON.stringify(list),
                    true,
                );
            }
        }
    };

    const editItem = obj => {
        setSelectedAudio(obj);
        showForm();
    };

    const playAudio = obj => {
        setSelectedAudioForPlay(obj);
        attemptPlay();
    };

    const handleActions = (obj, action) => {
        const actionReducer = {
            DELETE: () => deleteAudioFromList(obj),
            EDIT: () => editItem(obj),
            PLAY: () => playAudio(obj),
        };
        actionReducer[action]();
    };

    const setPosition = position => {
        const map = {
            top: "d-flex flex-column",
            bottom: "d-flex flex-column-reverse",
            right: "d-inline-flex flex-row-reverse",
            left: "d-flex flex-row",
        };
        if (!selectedAudioForPlay.link) return "";

        return map[position];
    };

    const typeValidation = (item, types) => {
        return types.some(type => item.link.includes(type));
    };

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <div className="s2a-audio">
            <ErrorBoundary render={() => Error}>
                <ModalBox
                    state={deleteItem}
                    message={`Are you sure to delete ${deleteItem.item.label}`}
                    operation={deleteAudioFromList}
                    header="Delete"
                    setState={setDeleteItem}
                />
                <ChildrenModal
                    ref={audioListModalRef}
                    header="Audios">
                    <>
                        {props.mode &&
                            props.modeType &&
                            (props.mode === props.modeType.preview ||
                                props.mode === props.modeType.render) && (
                                <>
                                    {visible && (
                                        <div className="container-fluid p-0">
                                            <div className="">
                                                <DynamicInput
                                                    label="Label"
                                                    db_column="label"
                                                    formData={selectedAudio}
                                                    setFormData={
                                                        setSelectedAudio
                                                    }
                                                    required={errors.includes(
                                                        "label",
                                                    )}
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <DynamicInput
                                                    label="Link"
                                                    db_column="link"
                                                    formData={selectedAudio}
                                                    setFormData={
                                                        setSelectedAudio
                                                    }
                                                    required={errors.includes(
                                                        "link",
                                                    )}
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <DynamicInput
                                                    label="Thumbnail"
                                                    db_column="thumbnail"
                                                    formData={selectedAudio}
                                                    setFormData={
                                                        setSelectedAudio
                                                    }
                                                />
                                            </div>
                                            <div className="float-end mt-2">
                                                <button
                                                    className="btn btn-sm button-theme"
                                                    onClick={() =>
                                                        pushAudioInList(
                                                            selectedAudio,
                                                            setSelectedAudio,
                                                        )
                                                    }>
                                                    Ok
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                    </>
                </ChildrenModal>
                <div
                    className={`form-group s2a-audio-form ${userDefineClasses()}`}>
                    {visible && (
                        <>
                            {props.mode &&
                                props.modeType &&
                                props.mode === props.modeType.design && (
                                    <span
                                        className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                        onClick={() => setShow(true)}></span>
                                )}
                            {!props.isInDatalistMode && (
                                <>
                                    {props.mode &&
                                        props.modeType &&
                                        props.mode ===
                                            props.modeType.render && (
                                            <>
                                                <div className="flex-between">
                                                    <label className="form-label">
                                                        {componentData.label
                                                            ? componentData.label
                                                            : "Text field"}
                                                        {componentData.required &&
                                                            componentData.required ===
                                                                "YES" && (
                                                                <span className="text-danger">
                                                                    &nbsp;*
                                                                </span>
                                                            )}
                                                    </label>
                                                    <div className="d-flex justify-content-end align-items-center gap-2 mb-2">
                                                        <button
                                                            disabled={disable}
                                                            className={
                                                                disable
                                                                    ? "button-theme-disable"
                                                                    : "button-theme"
                                                            }
                                                            onClick={addNew}>
                                                            <span className="fa fa-plus me-1"></span>
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                                <div
                                                    className={setPosition(
                                                        position,
                                                    )}>
                                                    {selectedAudioForPlay?.link && (
                                                        <div
                                                            className={`audio-viewer ${alignContent[position]}`}>
                                                            <div className="audio-player">
                                                                <Scroll width="100%">
                                                                    <audio
                                                                        style={{
                                                                            width: `${
                                                                                width
                                                                                    ? width
                                                                                    : `50%`
                                                                            }`,
                                                                        }}
                                                                        autoPlay
                                                                        alt="All the devices"
                                                                        src={
                                                                            selectedAudioForPlay?.link
                                                                        }
                                                                        ref={
                                                                            audioEl
                                                                        }
                                                                        controls></audio>
                                                                </Scroll>
                                                            </div>
                                                            <div
                                                                className="fw-bold fs-4 mb-2 ellipses"
                                                                title={
                                                                    selectedAudioForPlay?.label
                                                                }>
                                                                {
                                                                    selectedAudioForPlay?.label
                                                                }
                                                            </div>
                                                            <div className="video-details-style">
                                                                <span className="d-flex gap-1">
                                                                    <label htmlFor="thumbnail">
                                                                        Thumbnail:
                                                                    </label>
                                                                    <img
                                                                        src={`${selectedAudioForPlay.thumbnail}`}
                                                                        loading="lazy"
                                                                        height={
                                                                            20
                                                                        }
                                                                        width={
                                                                            20
                                                                        }
                                                                    />
                                                                </span>
                                                                <span className="d-flex gap-1">
                                                                    <label htmlFor="label">
                                                                        Label:
                                                                    </label>
                                                                    <div
                                                                        className="label ellipses"
                                                                        title={
                                                                            selectedAudioForPlay?.label
                                                                        }>
                                                                        {
                                                                            selectedAudioForPlay?.label
                                                                        }
                                                                    </div>
                                                                </span>
                                                                <span className="d-flex gap-1">
                                                                    <label htmlFor="Link">
                                                                        Link:
                                                                    </label>
                                                                    <div
                                                                        className="link ellipses"
                                                                        title={
                                                                            selectedAudioForPlay?.link
                                                                        }>
                                                                        {
                                                                            selectedAudioForPlay.link
                                                                        }
                                                                    </div>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <TableWrapper
                                                        data={audioList}
                                                        callBackActions={
                                                            handleActions
                                                        }
                                                        hideCols={[
                                                            "id",
                                                            "link",
                                                        ]}
                                                        actionsRequired={true}
                                                        customActions={[
                                                            {
                                                                id: "play",
                                                                lable: "Play",
                                                            },
                                                        ]}
                                                        colsWithDataTypes={{
                                                            thumbnail: "image",
                                                        }}
                                                        show_pagination={
                                                            show_pagination
                                                        }
                                                        customColPosition={[
                                                            "thumbnail",
                                                            "label",
                                                        ]}
                                                    />
                                                </div>
                                            </>
                                        )}
                                </>
                            )}
                        </>
                    )}

                    {props.mode &&
                        props.modeType &&
                        (props.mode === props.modeType.design ||
                            props.mode === props.modeType.readonly ||
                            props.mode === props.modeType.preview) && (
                            <div className="d-flex justify-content-center fw-bold mb-4">
                                Audio
                                <span className="text-danger px-2">added</span>
                                successfully
                            </div>
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
                            <span>Edit Audio</span>
                            <div className="d-flex">
                                <div
                                    className={`${
                                        toggleModalWindow === "maximize"
                                            ? "visually-hidden"
                                            : ""
                                    } `}
                                    onClick={() =>
                                        setToggleModalWindow("maximize")
                                    }
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
                                    onClick={() =>
                                        setToggleModalWindow("restore")
                                    }
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
                        <AudioPropsEditor setShow={setShow} />
                    </Modal.Body>
                </Modal>
            </ErrorBoundary>
        </div>
    );
}

export default Audio;
