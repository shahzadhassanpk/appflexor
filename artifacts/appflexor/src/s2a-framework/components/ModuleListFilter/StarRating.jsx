import React, { useState } from "react";
import "./StarRating.css";

function StarRating({ data, handleData, searchFields }) {
  const [rating, setRating] = useState([]);
  const [unFilteredArray, setUnFilteredArray] = useState([]);
  const [filteredArray, setFilteredArray] = useState([]);

  function handleRating(evt) {
    let check = evt.target.checked;
    let val = evt.target.value;
    let tempArr = [...rating];

    if (check) {
      tempArr.push(val);
    } else {
      const index = tempArr.indexOf(val);
           if (index > -1) {
        tempArr.splice(index, 1); // 2nd parameter means remove one item only
      }
    }
    if (data.length > 0 && unFilteredArray.length === 0) {
      setUnFilteredArray(data);
    }
    let result = filterIt(tempArr, data, unFilteredArray, searchFields);
    setFilteredArray(result);
    setRating(tempArr);
  }
  function filterIt(value, arr, unFilteredArray, searchFields) {
    if (value.length === 0) {
      handleData(unFilteredArray);
      return unFilteredArray;
    } else {
      if (unFilteredArray.length === 0) {
        unFilteredArray = [...arr];
      }
      // unFilteredArray.length === 0 ? (unFilteredArray = [...arr]) : null;
      let _filteredArray = [...unFilteredArray];
      _filteredArray = _filteredArray.filter((item) => {
        let resultNameFilter = checker(item, searchFields, value);
        let result = resultNameFilter;
        return result;
      });

      handleData(_filteredArray);
      return _filteredArray;
    }
  }
  function checker(item , searchFields, value=[]) {
    let result;

    let name = item[searchFields];
    if(name){
      let bool = value.map((item, index) => name.includes(item));

    for (let index = 0; index < bool.length; index++) {
      const element = bool[index];
      if (index === 0) {
        result = element;
      } else {
        result = result || element;
      }
    }
    return result;
    }else{
      return 
    }
    
  }
  return (
    <>
      <div>
        <input
          type="checkbox"
          value="5"
          onChange={(event) => handleRating(event)}
        />
        <div className="stars mx-2" style={{ "--rating": "5" }}></div>
      </div>
      <div>
        <input
          type="checkbox"
          value="4"
          onChange={(event) => handleRating(event)}
        />
        <div className="stars mx-2" style={{ "--rating": "4" }}></div>
      </div>
      <div>
        <input
          type="checkbox"
          value="3"
          onChange={(event) => handleRating(event)}
        />
        <div className="stars mx-2" style={{ "--rating": "3" }}></div>
      </div>
      <div>
        <input
          type="checkbox"
          value="2"
          onChange={(event) => handleRating(event)}
        />
        <div className="stars mx-2" style={{ "--rating": "2" }}></div>
      </div>
      <div>
        <input
          type="checkbox"
          value="1"
          onChange={(event) => handleRating(event)}
        />
        <div className="stars mx-2" style={{ "--rating": "1" }}></div>
      </div>
    </>
  );
}

export default StarRating;
