// import React, { useContext, useEffect, useState } from "react";
// import ReactPivotTable from "../PivotTable/ReactPivottable";
// import DataSet from "../TableData/DataSet";

// export default function PivotTableTabs(props) {
//     //    const appContext = useContext(AppContext)
//     const [tabs, setTabs] = useState({
//         ReactPivotTable: "true",
//         Data_Set: "false",
//     });

//     useEffect(() => {
//         window.scrollTo(0, 0);
//     }, []);

//     function handleTabsChange(event) {
//         let name = event.target.name;
//         let keys = Object.keys(tabs);
//         let obj = {};

//         keys.forEach(key => {
//             if (name == key) obj[key] = "true";
//             else obj[key] = "false";
//         });
//         setTabs(obj);
//     }

//     return (
//         <div className="mb-2 container-fluid pivot-table">
//             {props.mode &&
//                 props.modeType &&
//                 (props.mode === props.modeType.design ||
//                     props.mode === props.modeType.readonly) && (
//                     <div className="title">
//                         <center>
//                             <span className="cursor-pointer">
//                                 <span className="fa-solid fa-magnifying-glass-chart icon-space"></span>
//                                 Module Pivot Table added successfully
//                             </span>
//                         </center>
//                     </div>
//                 )}
//             {props.mode &&
//                 props.modeType &&
//                 (props.mode === props.modeType.render ||
//                     props.mode === props.modeType.preview) && (
//                     <>
//                         <ul
//                             className="nav nav-tabs"
//                             id="myTab"
//                             role="tablist">
//                             <li
//                                 className="nav-item"
//                                 role="presentation">
//                                 <button
//                                     className="nav-link active"
//                                     id="ReactPivotTable-tab"
//                                     name="ReactPivotTable"
//                                     data-bs-toggle="tab"
//                                     data-bs-target="#ReactPivotTable"
//                                     type="button"
//                                     role="tab"
//                                     aria-controls="ReactPivotTable"
//                                     aria-selected="false"
//                                     onClick={event => handleTabsChange(event)}>
//                                     Pivot
//                                 </button>
//                             </li>
//                             <li
//                                 className="nav-item"
//                                 role="presentation">
//                                 <button
//                                     className="nav-link"
//                                     id="Data_Set-tab"
//                                     name="Data_Set"
//                                     data-bs-toggle="tab"
//                                     data-bs-target="#Data_Set"
//                                     type="button"
//                                     role="tab"
//                                     aria-controls="Data_Set"
//                                     aria-selected="false"
//                                     onClick={event => handleTabsChange(event)}>
//                                     Data Set
//                                 </button>
//                             </li>
//                         </ul>
//                         <div
//                             className="tab-content"
//                             id="myTabContent">
//                             <div
//                                 className="tab-pane fade"
//                                 id="Data_Set"
//                                 role="tabpanel"
//                                 aria-labelledby="Data_Set-tab">
//                                 <DataSet activeTab={tabs} />
//                             </div>
//                             <div
//                                 className="tab-pane fade show active"
//                                 id="ReactPivotTable"
//                                 role="tabpanel"
//                                 aria-labelledby="ReactPivotTable-tab">
//                                 <ReactPivotTable activeTab={tabs} />
//                             </div>
//                         </div>
//                     </>
//                 )}
//         </div>
//     );
// }
