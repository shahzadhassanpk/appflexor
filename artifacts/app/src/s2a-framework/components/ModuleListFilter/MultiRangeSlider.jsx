import React, { useCallback, useEffect, useState, useRef } from "react";
import classnames from "classnames";
import PropTypes from "prop-types";

const MultiRangeSlider = ({
  min,
  max,
  getValue,
  data,
  handleData,
  searchFields,
}) => {
  const [minVal, setMinVal] = useState(min);
  const [maxVal, setMaxVal] = useState(max);
  const minValRef = useRef(null);
  const maxValRef = useRef(null);
  const range = useRef(null);
  const [filteredArray, setFilteredArray] = useState([]);
  const [unFilteredArray, setUnFilteredArray] = useState([]);
  // Convert to percentage
  const getPercent = useCallback(
    (value) => Math.round(((value - min) / (max - min)) * 100),
    [(min, max)]
  );

  useEffect(() => {
    setMinVal(min);
    setMaxVal(max);
  }, [min, max]);
  // Set width of the range to decrease from the left side
  useEffect(() => {
    if (maxValRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(+maxValRef.current.value); // Preceding with '+' converts the value from type string to type number

      if (range.current) {
        range.current.style.left = `${minPercent}%`;
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    if (minValRef.current) {
      const minPercent = getPercent(+minValRef.current.value);
      const maxPercent = getPercent(maxVal);

      if (range.current) {
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [maxVal, getPercent]);

  // Get min and max values when their state changes
  useEffect(() => {
    getValue({ min: minVal, max: maxVal });
  }, [minVal, maxVal, getValue]);

  function filterData(minVal, maxVal) {
    if (data.length > 0 && unFilteredArray.length === 0) {
      setUnFilteredArray(data);
    }
    let result = filterIt(minVal, maxVal, data, unFilteredArray, searchFields);
    setFilteredArray(result);
  }
  function filterIt(minVal, maxVal, arr, unFilteredArray, searchFields) {
    if (unFilteredArray.length === 0) {
      unFilteredArray = [...arr];
    }
    let _filteredArray = [...unFilteredArray];
    // if ("" === terms || terms.length < 3) {
    //   _filteredArray = [..._filteredArray];
    // }
    // if (terms.length >= 3) {
    _filteredArray = _filteredArray.filter((a) => {
      let resultNameFilter = checker(a, searchFields, minVal, maxVal);
      let result = resultNameFilter;
      return result;
    });
    // }

    handleData(_filteredArray);
    return _filteredArray;
  }
  function checker(a, searchFields, minVal, maxVal) {
    let name = a[searchFields];
    if (minVal <= name && maxVal >= name) {
      return true;
    } else {
      return false;
    }
  }

  return (
    <div className="container my-3" id="multi-range-slider">
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        ref={minValRef}
        onChange={(event) => {
          const value = Math.min(+event.target.value, maxVal - 1);
          setMinVal(value);
          filterData(value, maxVal);
          event.target.value = value.toString();
        }}
        className={classnames("thumb thumb--zindex-3", {
          "thumb--zindex-5": minVal > max - 100,
        })}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        ref={maxValRef}
        onChange={(event) => {
          const value = Math.max(+event.target.value, minVal + 1);
          setMaxVal(value);
          filterData(minVal, value);

          event.target.value = value.toString();
        }}
        className="thumb thumb--zindex-4"
      />

      <div className="slider">
        <div className="slider__track" />
        <div ref={range} className="slider__range" />
        <div className="slider__left-value">{minVal}</div>
        <div className="slider__right-value">{maxVal}</div>
      </div>
    </div>
  );
};

MultiRangeSlider.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  getValue: PropTypes.func.isRequired,
};

export default MultiRangeSlider;
