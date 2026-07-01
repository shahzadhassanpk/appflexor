import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../AppContext";
import axios from "axios";
import { API_URL } from "../../Config";
import { BPM_API_URL } from "../camunda/CamundaConfig";
import ProcessesContext from "../camunda/ProcessesContext";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { TablePagination } from "../../components/TablePagination/TablePagination";
import TableSorting from "../../components/TableSorting/TableSorting";

function ProcessMapViewer(props) {
    // 	let initialState = {
    // 		id: "",
    // 		title: "",
    // 		process_id: "",
    // 		form_id: "",
    // 	};
    // 	const [formList, setFormList] = useState([]);
    // 	const [items, setItems] = useState([]);
    // 	const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    // 	const [selectedItem, setSelectedItem] = useState(initialState);
    // 	const [size, setSize] = useState(5);
    // 	const [processList, setProcessList] = useState([]);
    // 	const [mode, setMode] = useState("DESIGN_MODE")
    // 	const [current, setCurrent] = useState(1);
    // 	const [selectedForm, setSelectedForm] = useState({});
    // 	const [show, setShow] = useState(false);

    // 	const getPaginateData = (current, pageSize) => {
    // 		return items.slice((current - 1) * pageSize, current * pageSize);
    // 	};

    // 	useEffect(() => {
    // 		getData()
    // 	}, [])

    // 	useEffect(() => {
    // 		getProcessDefination()
    // 	}, [])

    // 	function getProcessDefination() {
    // 		const dataRequest = {
    // 			method: "GET",
    // 			path: "/process-definition?latestVersion=true",
    // 			data: {},
    // 		};
    // 		axios
    // 			.post(BPM_API_URL + "?service.key=bpm.data", dataRequest)
    // 			.then((response) => {
    // 				if (response.status === 200) {
    // 					let data = response.data.data;
    // 					if (data) {
    // 						setProcessList(data);
    // 						// setLoaded(true);
    // 					}
    // 				}
    // 			})
    // 			.catch((err) => {
    // 				console.error(err);
    // 			});
    // 	}

    // 	function handleSelectedForms(e) {
    // 		let value = e.target.value

    // 		setSelectedItem((prev) => ({
    // 			...prev,
    // 			form_id: value
    // 		}))
    // 	}

    // 	function getData() {
    // 		var dataRequest = {
    // 			dataKeys: [
    // 				{
    // 					serviceParams: "",
    // 					dataKey: "formList",
    // 					serviceKey: "sys.forms",
    // 					mode: "formData",
    // 				},
    // 				{
    // 					serviceParams: "",
    // 					dataKey: "processMap",
    // 					serviceKey: "process.map",
    // 					mode: "formData",
    // 				},
    // 			],
    // 		}

    // 		axios
    // 			.post(API_URL + "?service.key=multiKey.data", dataRequest)
    // 			.then((response) => {
    // 				if (response.data.C_STATUS === "UNAUTHORIZED") {
    // 					console.log(`UNAUTHORIZED, please login.`)
    // 				} else if (response.data.C_STATUS === "SUCCESS") {
    // 					setFormList(response.data.C_DATA.formList)
    // 					setItems(response.data.C_DATA.processMap)
    // 				}
    // 			})
    // 			.catch((error) => {
    // 				console.error(error)
    // 			})
    // 	}

    // 	function getNameById(id) {
    // 		let name = ""
    // 		formList.forEach((item) => {
    // 			if (item.id === id) {
    // 				name = item.name
    // 			}
    // 		})
    // 		return name ? name : ""
    // 	}

    // 	function getProcessByName(id) {
    // 		let name = ""
    // 		processList.forEach((item) => {
    // 			if (item.id === id) {
    // 				name = item.name
    // 			}
    // 		})
    // 		return name ? name : ""
    // 	}

    // 	return (
    // 		<React.Fragment>
    // 			<div id="processlist" className="py-3 mx-3">
    // 				{props.mode &&
    // 					props.modeType &&
    // 					(props.mode === props.modeType.design ||
    // 						props.mode === props.modeType.readonly) && (
    // 						<div>
    // 							<div type="button" onClick={() => getData()}>
    // 								<i className="fa-solid fa-gear px-1"></i>
    // 							</div>
    // 							<center>
    // 								<span>ProcessMap added successfully</span>
    // 							</center>
    // 						</div>
    // 					)}
    // 				{props.mode &&
    // 					props.modeType &&
    // 					(props.mode === props.modeType.render ||
    // 						props.mode === props.modeType.design ||
    // 						props.mode === props.modeType.preview) && (
    // 						<div className="shadow-box bg-white px-3">
    // 							{/* Header */}
    // 							<div className="row border-bottom py-2 px-3 mx-1">
    // 								{mode === "DESIGN_MODE" ||
    // 									mode === "PREVIEW" ||
    // 									mode === "RENDER_MODE" ? (
    // 									<div className="col-sm-9 d-inline-flex align-self-center">
    // 										<div className="col-sm-6 fw-bold">
    // 											{selectedItem && selectedItem.name}
    // 										</div>
    // 									</div>
    // 								) : (
    // 									<></>
    // 								)}
    // 							</div>
    // 							{/* Views */}
    // 							{show &&
    // 								(props.mode === props.modeType.design ||
    // 									props.mode === props.modeType.preview ||
    // 									props.mode === props.modeType.readonly) ? (
    // 								<div className="row p-3">
    // 									<div className="col-sm-12 ps-0">
    // 										{/* <table></table> */}
    // 										<ProcessListViewerModal
    // 											selectedItem={selectedItem}
    // 											// getFormById={getFormById}
    // 											size={size}
    // 											current={current}
    // 											getPaginateData={getPaginateData}
    // 											setSize={setSize}
    // 											setCurrent={setCurrent}
    // 											processList={processList}
    // 											// handleSearch={handleSearch}
    // 											setSelectedItem={setSelectedItem}
    // 											// ProcessListById={ProcessListById}
    // 											setShow={setShow}
    // 											show={show}
    // 										/>
    // 									</div>
    // 								</div>
    // 							) : (
    // 								selectedItem &&
    // 								selectedForm && (
    // 									<ProcessListById
    // 										selectedItem={selectedItem}
    // 										selectedForm={selectedForm}
    // 										getData={getData}
    // 									/>
    // 								)
    // 							)}
    // 						</div>
    // 					)}

    // 			</div>
    // 		</React.Fragment >
    // 	);
    // }

    // function ProcessListViewerModal({
    // 	selectedItem,
    // 	size,
    // 	current,
    // 	getPaginateData,
    // 	setSize,
    // 	processList,
    // 	setCurrent,
    // 	handleSearch,
    // 	setSelectedItem,
    // 	saveProcessListIdInLayout,
    // 	show,
    // 	setShow,
    // }) {
    // 	console.log(show, "inside modal")
    // 	return (
    // 		<>
    // 			<Modal
    // 				show={show}
    // 				onHide={() => setShow(false)}
    // 				keyboard={true}
    // 				animation={true}
    // 			>
    // 				<Modal.Header>
    // 					<Modal.Title>Process List</Modal.Title>
    // 				</Modal.Header>
    // 				<Modal.Body>
    // 					<>
    // 						<div className="row">
    // 							<div className="col-sm-4 mx-2 mb-2">
    // 								<div className="input-group">
    // 									<input
    // 										type="text"
    // 										className="form-control"
    // 										onChange={handleSearch}
    // 										placeholder="Search Data List"
    // 									/>
    // 									<div className="input-group-append">
    // 										<span
    // 											className="input-group-text"
    // 											style={{ height: "38px" }}
    // 										>
    // 											<i className="fas fa-search"></i>
    // 										</span>
    // 									</div>
    // 								</div>
    // 							</div>
    // 						</div>
    // 						<div className="table col-sm-9">
    // 							<div className="row">
    // 								<div className="col-sm-12">
    // 									<Table className="s2a-table table-bordered table-hover mb-0">
    // 										<Thead className="thead">
    // 											<Tr className="tableHeader">
    // 												<Th className="col-sm-2 table-row text-left">Title</Th>
    // 												<Th className="col-sm-2 table-row text-left">Link</Th>
    // 											</Tr>
    // 										</Thead>
    // 										<Tbody>
    // 											{getPaginateData(current, size).map((item) => {
    // 												return (
    // 													<Tr
    // 														key={item.id}
    // 														className={` ${selectedItem &&
    // 															item &&
    // 															item["id"] === selectedItem["id"]
    // 															? "selected-cell"
    // 															: " "
    // 															}`}
    // 													>
    // 														<Td className="col-sm-1 table-row text-left">
    // 															{item.name}
    // 														</Td>

    // 														<Td className="col-sm-3 table-row text-left">
    // 															<a
    // 																type="button"
    // 																className="link-post-btn btn btn-sm btn-link text-decoration-none col-sm-2"
    // 															>
    // 																{selectedItem &&
    // 																	item["id"] === selectedItem["id"] ? (
    // 																	<i
    // 																		className="fa-solid fa-link-slash"
    // 																		onClick={() => setSelectedItem({})}
    // 																	></i>
    // 																) : (
    // 																	<i
    // 																		className="fa-solid fa-link"
    // 																		onClick={() => setSelectedItem(item)}
    // 																	></i>
    // 																)}
    // 															</a>
    // 														</Td>
    // 													</Tr>
    // 												)
    // 											})}
    // 										</Tbody>
    // 									</Table>
    // 								</div>
    // 							</div>
    // 						</div>
    // 						<div className="row">
    // 							<div className="col-sm-2">
    // 								<button
    // 									className="btn btn-sm button-theme "
    // 									onClick={() => saveProcessListIdInLayout()}
    // 								>
    // 									Ok
    // 								</button>
    // 							</div>
    // 							<div className="col-sm-10">
    // 								<TablePagination
    // 									size={size}
    // 									setSize={setSize}
    // 									current={current}
    // 									setCurrent={setCurrent}
    // 									tableData={processList}
    // 								/>
    // 							</div>
    // 						</div>
    // 					</>
    // 				</Modal.Body>
    // 			</Modal>
    // 		</>
    // 	)
    return <></>;
}

export default ProcessMapViewer;
