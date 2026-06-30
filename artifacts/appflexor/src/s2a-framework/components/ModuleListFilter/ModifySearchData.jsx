import React, { useState, useEffect } from "react";

function ModifySearchData({ data =[], handleData, searchFields = [] , placeHolder = ""}) {
  const [unFilteredArray, setUnFilteredArray] = useState([]);

  function filterIt(terms, arr, unFilteredArray, searchFields) {
    if (unFilteredArray.length === 0) {
      unFilteredArray = [...arr];
    }
    let _filteredArray = [...unFilteredArray];
    if ("" === terms || terms.length < 3) {
      _filteredArray = [..._filteredArray];
    }
    if (terms.length >= 3) {
      _filteredArray = _filteredArray.filter((a) => {
        let resultNameFilter = checker(a, searchFields, terms);

        let result = resultNameFilter;
        return result;
      });
    }

    handleData(_filteredArray);
    return _filteredArray;
  }
  function checker(object, searchFields, term) {
    let result;
    let _result = searchFields.map((field, index) => {
      let name = object[field].trim().toLowerCase();
      let bool = name.includes(term.toLowerCase());
      if (bool) {
        return true;
      } else {
        return false;
      }
    });
    for (let index = 0; index < _result.length; index++) {
      const element = _result[index];
      if (index === 0) {
        result = element;
      } else {
        result = result || element;
      }
    }
    return result;
  }

  function handleSearch(evt) {
    let value = evt.target.value;
    if (data.length > 0 && unFilteredArray.length === 0) {
      setUnFilteredArray(data);
    }
    console.log(unFilteredArray);
    let result = filterIt(value, data, unFilteredArray, searchFields);
  }

  return (
    <>
      <div>
        <input
          type="email"
          className="form-control"
          id="searchHotelorDestination"
          aria-describedby="search"
          placeholder={placeHolder}
          onChange={handleSearch}
        />
      </div>
    </>
  );
}

export default ModifySearchData;
