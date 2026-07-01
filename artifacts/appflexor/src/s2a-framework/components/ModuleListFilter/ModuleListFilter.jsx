import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../AppContext";
import ModifySearchData from "./ModifySearchData";
import MultiRangeSlider from "./MultiRangeSlider";
import StarRating from "./StarRating";

function ModuleListFilter({
    data = [],
    handleData,
    searchFields = [],
    placeHolder = "",
    searchTitle = "",
    priceTitle = "",
    showSearch = false,
    showPrice = false,
    showRating = false,
}) {
    const [rating, setRating] = useState([]);
    const appContext = useContext(AppContext);
    const [minValue, setMinValue] = useState();
    const [minVal, setMinVal] = useState(0);
    const [maxVal, setMaxVal] = useState(0);
    let width = appContext.width;

    let _data = [];
    if (data === undefined) {
        _data = [];
    } else {
        _data = [...data];
    }
    // useEffect(() => {
    // if (_data.length > 0 && minVal === 0 && maxVal === 0) {
    //   _data.forEach(element => {
    //     console.log("name" + element.name ,+ "city" + element.city)
    //   });
    //   let sortedArray = [];
    //   let arrayLength = 0;
    //   sortedArray = _data.sort((a, b) => a.single - b.single);
    //   arrayLength = sortedArray.length;
    //   setMinVal(parseInt(sortedArray[0].single));
    //   setMaxVal(parseInt(sortedArray[arrayLength - 1].single));
    // }
    // }),
    //   [minVal, maxVal];

    useEffect(() => {
        if (
            _data.length > 0
            // && minVal === 0 && maxVal === 0
        ) {
            let sortedArray = [];
            let arrayLength = 0;
            sortedArray = _data.sort((a, b) => a.single - b.single);
            arrayLength = sortedArray.length;
            setMinVal(parseInt(sortedArray[0].single));
            setMaxVal(parseInt(sortedArray[arrayLength - 1].single));
        }
    }, [data]);
    function SliderValue(min, max) {
        return;
    }

    return (
        <>
            {showSearch && (
                <div
                    className={`row shadow-box bg-white ${
                        width === "desktop" ? "mt-2 mb-0 mx-2" : "my-2 ms-2"
                    }`}
                >
                    <Accordion
                        id={"modify-search"}
                        title={
                            searchTitle !== "" ? searchTitle : "Filter Result"
                        }
                        data={
                            <ModifySearchData
                                data={data}
                                handleData={handleData}
                                searchFields={searchFields}
                                placeHolder={placeHolder}
                            />
                        }
                    />
                </div>
            )}
            {showPrice && (
                <div
                    className={`row shadow-box bg-white ${
                        width === "desktop" ? "mt-2 mb-0 mx-2" : "my-2 ms-2"
                    }`}
                >
                    <div className="accordion px-0" id="">
                        <Accordion
                            id={"price-avg"}
                            title={
                                priceTitle !== ""
                                    ? priceTitle
                                    : "Price (avg/price)"
                            }
                            data={
                                <MultiRangeSlider
                                    min={minVal ? minVal : 0}
                                    max={maxVal ? maxVal : 0}
                                    getValue={SliderValue}
                                    // getValue={({ min, max }) => "r"
                                    //   // console.log(`min = ${min}, max = ${max}`)
                                    // }
                                    data={data}
                                    handleData={handleData}
                                    searchFields={"single"}
                                />
                            }
                        />
                    </div>
                </div>
            )}
            {showRating && (
                <div
                    className={`row shadow-box bg-white ${
                        width === "desktop" ? "mt-2 mb-0 mx-2" : "my-2 ms-2"
                    }`}
                >
                    <Accordion
                        id={"user-reviews"}
                        title={"User reviews"}
                        data={
                            <StarRating
                                data={data}
                                handleData={handleData}
                                searchFields={"rating"}
                            />
                        }
                    />
                </div>
            )}
        </>
    );
    // }
    // return null;
}

function Accordion({ id = "demo", title = "Accordion", data = "..." }) {
    // console.log(data);
    return (
        <div className="accordion px-0" id="">
            <div className="accordion-item">
                <h2 className="accordion-header" id="">
                    <button
                        className={`accordion-button collapsed`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#${id}`}
                        aria-expanded="true"
                        aria-controls="modify-search"
                    >
                        {title}
                    </button>
                </h2>
                <div
                    id={id}
                    className={`accordion-collapse collapse`}
                    aria-labelledby=""
                >
                    <div className="accordion-body">{data}</div>
                </div>
            </div>
        </div>
    );
}

export default ModuleListFilter;
