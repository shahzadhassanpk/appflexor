import React, { useEffect } from "react";
// import "./ColorPicker.css";
import $ from 'jquery';
import moment from 'moment';

function ColorPicker({ colorArray, colorSelector, singleProduct }) {
  const $ = window.$;
  let tempArray = [];
  for (const property in colorArray) {
    tempArray.push(colorArray[property]);
  }
  $(".colorPicker").click(function (event) {
    $(".colorPicker").removeClass("active");
    $(this).toggleClass("active");
  });

  return (
    <React.Fragment>
      <div id="cp" className="">
        {colorArray[0] !== "" ? (
          <>
            <div className="col-sm-2 text-start">
              <span>Color:</span>
            </div>
            <div className="col-sm-10 wrapper py-1">
              {colorArray.map((item, index) => (
                // <span key={index}>
                //   <input
                //   className ="colorPicker"
                //     type="radio"
                //     name="color"
                //     onClick={() => {
                //       colorSelector(item);
                //     }}
                //     style={{ backgroundColor: item }}
                //   />
                // </span>
                <li
                  className="colorPicker "
                  key={index}
                  style={{ backgroundColor: item }}
                  onClick={() => {
                    colorSelector(item);
                  }}
                >
                </li>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </React.Fragment>
  );
}
export { ColorPicker };
