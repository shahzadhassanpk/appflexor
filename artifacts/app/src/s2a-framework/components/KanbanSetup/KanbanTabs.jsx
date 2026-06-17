// import React, { useState, useEffect, useContext } from "react"
// import KanbanSetup from "./KanbanSetup"
// import { MemberKanban } from "./MemberKanban/MemberKanban"
// import { AppContext } from "../../AppContext"

// function KanbanTabs() {

//   return (
//     <React.Fragment>
//       <div id="CmsSetup" className="mb-2">
//         {/* <ul className="pt-3 mx-1 nav nav-tabs" id="myTab" role="tablist">
//           { (
//             <li className="nav-item" role="presentation">
//               <button
//                 className="nav-link active"
//                 id="ManagerKanban-tab"
//                 name="ManagerKanban"
//                 data-bs-toggle="tab"
//                 data-bs-target="#ManagerKanban"
//                 type="button"
//                 role="tab"
//                 aria-controls="ManagerKanban"
//                 aria-selected="false"
//                 // onClick={(event) => handleTabsChange(event)}
//               >
//                 Teams
//               </button>
//             </li>
//           )}
//           {(
//             <li className="nav-item" role="presentation">
//               <button
//                 className="nav-link"
//                 id="MemberKanban-tab"
//                 name="MemberKanban"
//                 data-bs-toggle="tab"
//                 data-bs-target="#MemberKanban"
//                 type="button"
//                 role="tab"
//                 aria-controls="MemberKanban"
//                 aria-selected="false"
//                 // onClick={(event) => handleTabsChange(event)}
//               >
//                 Member
//               </button>
//             </li>
//           )}
//         </ul> */}
//         <div className="tab-content" id="myTabContent">
//           <div
//             className="tab-pane fade show active"
//             id="ManagerKanban"
//             role="tabpanel"
//             aria-labelledby="ManagerKanban-tab"
//           >
//             <KanbanSetup
//             />
//           </div>
//           <div
//             className="tab-pane fade"
//             id="MemberKanban"
//             role="tabpanel"
//             aria-labelledby="MemberKanban-tab"
//           >
//             <div className="d-flex">
//               {/* <div className="sidebar-members mx-2">
//                 <span className="heading-members">Members</span>
//                 <div>
//                   {teamList &&
//                     teamList.length > 0 &&
//                     teamList.map((items) => {
//                       return <div key={items.id}>{items.column}</div>
//                     })}
//                 </div>
//               </div> */}
//               <div className="view-tasks">
//                 <span className="heading-members">View Tasks</span>
//                 {/* {tabs.ManagerKanban === "false" ? <MemberKanban /> :<></>} */}
//                 <MemberKanban/>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </React.Fragment>
//   )
// }

// export { KanbanTabs }
