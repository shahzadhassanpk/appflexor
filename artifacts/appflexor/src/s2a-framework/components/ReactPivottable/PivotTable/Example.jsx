// import React from "react"
// import ReactDOM from "react-dom"
// import ClipboardJS from "clipboard"
// import PivotTableUI from "react-pivottable/PivotTableUI"
// import "react-pivottable/pivottable.css"

// import "./styles.css"

// const data = [
//   {
//     country: "Spain",
//     name: "Santiago",
//     surname: "Ramón y Cajal",
//     sex: "Male",
//     age: 57,
//     subject: "Medicine",
//   },
//   {
//     country: "United Kingdom",
//     name: "Ada",
//     surname: "Lovelace",
//     sex: "Female",
//     age: 47,
//     subject: "Computing",
//   },
//   {
//     country: "United Kingdom",
//     name: "Alan",
//     surname: "Turing",
//     sex: "Male",
//     age: 55,
//     subject: "Computing",
//   },
//   {
//     country: "France",
//     name: "Antoine",
//     surname: "Lavoisier",
//     sex: "Male",
//     age: 12,
//     subject: "Chemistry",
//   },
//   {
//     country: "Poland",
//     name: "Marie",
//     surname: "Curie",
//     sex: "Female",
//     age: 33,
//     subject: "Chemistry",
//   },
//   {
//     country: "Austria",
//     name: "Hedy",
//     surname: "Lamarr",
//     sex: "Female",
//     age: 34,
//     subject: "Computing",
//   },
//   {
//     country: "Austria",
//     name: "Erwin",
//     surname: "Schrödinger",
//     sex: "Male",
//     age: 38,
//     subject: "Physics",
//   },
// ]

// const pivotPresets = {
//   cols: ["sex"],
//   rows: ["subject", "country"],
//   rendererName: "Table Heatmap",
//   aggregatorName: "Average",
//   vals: ["age"],
//   derivedAttributes: { completeName: (el) => el.name + " " + el.surname },
// }

// export default function Example(props){
//   constructor(props) {
//     super(props)
//     this.state = props
//     this.init()
//   }

//   init() {
//     const clipboard = new ClipboardJS(".clipboard")
//     console.log("init")
//     clipboard.on("success", function (e) {
//       console.info("Action:", e.action)
//       console.info("Text:", e.text)
//       console.info("Trigger:", e.trigger)

//       e.clearSelection()
//     })
//     return (
//       <div className="App">
//         <input
//           type="button"
//           className="clipboard"
//           value="Copy to Clipboard"
//           data-clipboard-target=".js-plotly-plot"
//         />
//         <div className="js-plotly-plot">
//           <h1>Hello</h1>
//           <h2>
//             All this html will be copied to clipboard when you click the button
//           </h2>
//           <table>
//             <tr>
//               <td>This table</td>
//               <td>too</td>
//             </tr>
//             <tr>
//               <td>so</td>
//               <td>this one</td>
//             </tr>
//           </table>
//         </div>
//         <hr />
//         <h2>Test with Pivot Table:</h2>
//         <input
//           type="button"
//           className="clipboard"
//           value="Copy Pivot Table result to Clipboard"
//           data-clipboard-target=".pvtOutput"
//         />
//         <br />
//         <br />
//         <br />
//         <PivotTableUI
//           data={data}
//           onChange={(s) => this.setState(s)}
//           {...pivotPresets}
//           {...this.state}
//         />
//       </div>
//     )
  
// }
