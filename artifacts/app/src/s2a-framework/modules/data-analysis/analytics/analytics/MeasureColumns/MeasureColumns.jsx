import { useCallback, useEffect, useRef } from "react";
import { useDrop } from "react-dnd";
import update from "immutability-helper";
import { COLUMN_NAMES } from "../COLUMN_NAMES";
import MeasureRows from "../MeasureRows/MeasureRows";
import ChildrenModal from "../../../../../components/ChildrenModal/ChildrenModal";
import MeasureForm from "./MeasureForm";

function MeasureColumns(props) {
    const {
        title,
        handleMeasure,
        userMeasures,
        setUserMeasures,
        setSelect,
        select,
        measures,
    } = props;

    const moveCard = useCallback((dragIndex, hoverIndex) => {
        setUserMeasures(prevCards =>
            update(prevCards, {
                $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, prevCards[dragIndex]],
                ],
            }),
        );
    }, []);

    const [, drop] = useDrop({ accept: COLUMN_NAMES.Measures });
    const childModal = useRef(null);

    useEffect(() => {
        if (select) {
            handleMeasure("selectedAll");
        } else if (select === false) {
            handleMeasure("deSelectAll");
        }
    }, [select]);

    const renderMeasures = useCallback(
        (measure, handleMeasure, moveCard, measureId, index) => {
            return (
                <div
                    key={index}
                    className="s2a-measure-row">
                    {
                        <MeasureRows
                            measure={measure}
                            id={measureId}
                            index={index}
                            handleMeasure={handleMeasure}
                            moveCard={moveCard}
                        />
                    }
                </div>
            );
        },
        [userMeasures],
    );

    const selectOrNot = () => {
        setSelect(prev => !prev);
    };

    const openModal = () => {
        childModal.current.show();
    };

    return (
        <div className="col-sm-4">
            <ChildrenModal
                ref={childModal}
                header="Add Aggrigations">
                <MeasureForm
                    childModal={childModal}
                    userMeasures={userMeasures}
                    measures={measures}
                    setUserMeasures={setUserMeasures}
                />
            </ChildrenModal>
            <div
                ref={drop}
                className="s2a-measure-col-wrap"
                key={title}>
                <div className="heading measure-heading">
                    <div className="">
                        <input
                            className="form-check-input col-sm-1 px-1 me-2 cursor-pointer"
                            type="checkbox"
                            checked={
                                userMeasures &&
                                userMeasures.length > 0 &&
                                userMeasures.every(measure => measure?.selected)
                            }
                            onChange={() => selectOrNot()}
                        />
                        <span className="">
                            <i className="fas fa-calculator"></i> {title}
                        </span>
                    </div>
                    <span
                        className="fa fa-plus"
                        onClick={openModal}></span>
                </div>

                <div className="analytic-scroll s2a-border p-2">
                    {userMeasures &&
                        userMeasures.map((measure, index) =>
                            renderMeasures(
                                measure,
                                handleMeasure,
                                moveCard,
                                measure.id,
                                index,
                            ),
                        )}
                </div>
            </div>
        </div>
    );
}

export default MeasureColumns;
