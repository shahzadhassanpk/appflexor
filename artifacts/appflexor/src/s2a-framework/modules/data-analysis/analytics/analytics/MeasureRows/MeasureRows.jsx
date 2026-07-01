import { COLUMN_NAMES } from "../COLUMN_NAMES";
import { useDrag, useDrop } from "react-dnd";
import { useContext, useRef } from "react";
import ChildrenModal from "../../../../../components/ChildrenModal/ChildrenModal";
import AnalyticContext from "../AnalyticsContext";
import { useState } from "react";
import { useEffect } from "react";
import SelectedMeasureForm from "../Components/SelectedMeasureForm";

export default function MeasureRows({
    measure,
    id,
    index,
    handleMeasure,
    moveCard,
}) {
    const ref = useRef(null);
    const modalRef = useRef(null);
    const [update, setUpdate] = useState(false);
    const [selectedMeasure, setSelectedMeasure] = useState({});
    const analyticContext = useContext(AnalyticContext);
    const { handleSaveSetting, setUserMeasures } = analyticContext;

    const [{ isDragging }, drag] = useDrag({
        type: COLUMN_NAMES.Measures,
        item: () => {
            return { id, index };
        },
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [{ handlerId }, drop] = useDrop({
        accept: COLUMN_NAMES.Measures,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) {
                return;
            }
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            moveCard(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const opacity = isDragging ? 0 : 1;

    const style = {
        // backgroundColor: "white",
        cursor: "move",
    };

    useEffect(() => {
        if (update) {
            handleSaveSetting();
            setUpdate(false);
        }
    }, [update]);

    const handleEditMeasure = item => {
        if (modalRef.current) {
            modalRef.current.show();
            setSelectedMeasure(item);
        }
    };

    const deleteMeasure = id => {
        setUpdate(true);
        setUserMeasures(prev => prev.filter(item => item.id !== id));
    };

    drag(drop(ref));
    return (
        <div
            data-handler-id={handlerId}
            key={index}
            ref={ref}
            className="fact-title-style s2a-measure-rows"
            style={{ ...style, ...opacity }}>
            <ChildrenModal
                ref={modalRef}
                header={selectedMeasure.label}>
                <SelectedMeasureForm
                    measure={measure}
                    modalRef={modalRef}
                />
            </ChildrenModal>
            <div className="col-sm-12">
                <div className="measure-body">
                    <div className="d-flex">
                        <input
                            className="form-check-input me-2"
                            type="checkbox"
                            checked={measure?.selected}
                            onChange={e => handleMeasure(measure, e)}
                        />
                        <label
                            className="title-style"
                            title={
                                measure.method == "percentile"
                                    ? measure["percentile_percentage"] +
                                      "th_" +
                                      measure["label"]
                                    : measure["label"]
                            }>
                            <span>
                            {measure.method == "percentile"
                                    ? measure["percentile_percentage"] +
                                      "th_" +
                                      measure["label"]
                                    : measure["label"]}
                                {/* {measure.method == "percentile"
                                    ? measure["label"] +
                                      "_" +
                                      measure["percentile_percentage"] +
                                      "th"
                                    : measure["label"]} */}
                            </span>
                        </label>
                        <div className="dropdown">
                            <i
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                className="fa-solid fa-gear"></i>
                            <ul className="dropdown-menu">
                                <li
                                    className="ps-2 py-1 table-edit-font"
                                    onClick={() => handleEditMeasure(measure)}>
                                    <span className="fa-solid fa-pen-to-square "></span>
                                    <span className="ps-2">Edit</span>
                                </li>
                                <li
                                    className="ps-2 py-1 table-del-font"
                                    onClick={() => deleteMeasure(measure.id)}>
                                    <span className="fa-solid fa-trash-can"></span>
                                    <span className="ps-2">Delete</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
