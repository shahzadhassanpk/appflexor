import React, { useState, useEffect } from "react";
import { API_URL } from "../../Config";
import axios from "axios";
// import './ContactList.css';

function ContactList({ entity, service_key, master_id }) {

    const confirm = window.confirm;
    const [contactList, setContactList] = useState([]);
    let initailState = {
        id: "new",
        name: "",
        phone_no: "",
        email: "",
        designation: "",
    };
    const [cont, setCont] = useState(initailState);
    const [page, setPage] = useState("table");
    const [showDiv, setShowDiv] = useState(true);
    const [isDisabled, setIsdisabled] = useState(true);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);

    useEffect(() => {
        if (master_id !== "new" && master_id !== "" && master_id !== " " && master_id !== undefined) {
            getData(master_id);
            setIsdisabled(false);
        } else {
            setIsdisabled(true);
        }

        if (master_id === "new" || master_id === undefined) {
            setContactList([]);
        }
        switchPage("table");
        setShowDiv(true);

    }, [master_id]);

    useEffect(() => {
        if (cont.name.length > 0 && cont.phone_no.length > 0 && cont.email.length > 0 && cont.designation.length > 0) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [cont]);

    function getData(id) {
        const dataRequest = {
            dataKeys: [
                {
                    // serviceParams: id,
                    serviceParams: master_id,
                    dataKey: entity,
                    serviceKey: service_key,
                    mode: "formData"
                }
            ],
        };
        try {
        axios
            .post(API_URL + "?service.key=multiKey.data", dataRequest)
            .then((response) => {
                    let _response = [];
                    if (response.data.C_DATA[entity]) {
                        _response = response.data.C_DATA[entity];
                        setContactList(_response);
                    } else {
                        console.error(`Either service key for ${service_key} is missing or SQL query returns no record`);
                        setContactList([]);
                    }
            });

        } catch (error) {
            setContactList([]);
            console.error(error);
        }
    }

    function switchPage(page) {
        setPage(page);
        setShowDiv(true);
    }

    function handleChange(evt) {
        let value = evt.target.value;
        let name = evt.target.name;
        setCont((prevState) => ({
            ...prevState,
            [name]: value
        }));
    }

    function edit(contact) {
        setCont(contact);
        switchPage("form");
        setShowDiv(false);
    }
    function addNew() {
        setCont(initailState);
        switchPage("form");
        setShowDiv(false);
        setSaveIsDisabled(true);

    }

    function saveContData(callback) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = entity; //"formid"
        entityForm.entity = entity; //Db- "table name"
        entityForm.action = "update";

        if (!cont.id || cont.id == "" || cont.id == "new") {
            entityForm.id = "new";
            cont.id = "new";
        } else {
            entityForm.id = cont.id;
            console.log("Update");
        }
        cont.master_id = master_id;
        entityForm.formData = cont;
        request.data.push(entityForm);

        try {
            axios.post(url, request)
                .then(function (response) {
                    if (response.status === 200) {
                        if (cont.id === "new" || cont.id === "") {
                            cont.id = response.data.C_NEW_RECORD_ID;
                        }
                        getData(master_id);
                        switchPage("table");
                        setShowDiv(true);
                    }
                });
        } catch (e) {
            console.log('saveGig error:' + e);
        };
    };

    function delContData(cont) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = entity;  //"formid"
        entityForm.entity = entity;  //Db- "table name"
        entityForm.action = "delete";
        entityForm.id = cont.id;

        request.data.push(entityForm);
        var confirmBox = confirm("Are you sure?");
        if (confirmBox) {
            try {
                axios.post(url, request)
                    .then(function (response) {
                        if (response.status === 200) {
                            getData(master_id);
                        }
                    });
            } catch (e) {
                console.log('saveGig error:' + e);
            }
        }
    };

    return (
        <React.Fragment>
            <div className="" id="contacts">
                {
                    showDiv && <>
                                <div className="row s2a-table-heading m-0 p-0">
                                    <div className="col-sm-3 p-0">
                                        <h6>Name</h6>
                                    </div>
                                    <div className="col-sm-2 p-0">
                                        <h6>Phone</h6>
                                    </div>
                                    <div className="col-sm-3 p-0">
                                        <h6>Email</h6>
                                    </div>
                                    <div className="col-sm-3 p-0">
                                        <h6>Designation</h6>
                                    </div>
                                    <div className="col-sm-1 p-0">
                                        <h6 style={{ height: "31px" }}></h6>
                                    </div>
                                </div>
                        {
                            contactList.map((contact, index) => {
                                return (
                                    <div className="p-0" key={index} >
                                        <div className={`row cont-table p-0 m-0 ${(contact.id == cont.id) ? 'activeCell' : ''}`} >
                                            <div className="col-sm-3 p-0" onClick={() => edit(contact)}>
                                                <p className="padding">
                                                    {contact.name}
                                                </p>
                                            </div>
                                            <div className="col-sm-2 p-0" onClick={() => edit(contact)}>
                                                <p className="padding">
                                                    {contact.phone_no}
                                                </p>
                                            </div>
                                            <div className="col-sm-3 p-0" onClick={() => edit(contact)}>
                                                <p className="padding">
                                                    {contact.email}
                                                </p>
                                            </div>
                                            <div className="col-sm-3 p-0" onClick={() => edit(contact)}>
                                                <p className="padding">
                                                    {contact.designation}
                                                </p>
                                            </div>
                                            <div className="col-sm-1 p-0">
                                                <div className="del-btn">
                                                    <p className="del-btn-sm"><i className="btn btn-danger btn-sm" onClick={() => delContData(contact)}><span className="fa fa-times"></span></i></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }

                            <div className="col-sm-12 my-2">
                            <button className="btn button-theme  btn-sm" onClick={() => addNew()} disabled={isDisabled}><span className="fa fa-plus pe-2"></span>Add New</button>
                            </div>

                    </>
                }
                {page == "form" && (
                    <React.Fragment>
                        <div className="container">
                            <div className="row">
                                <div className="col-sm-6 form-group mb-3">
                                    <label className="fw-bold mb-1">Name</label><br />
                                    <input className="form-control" name="name" onChange={handleChange} type="text"
                                        value={cont.name}
                                    />
                                </div>
                                <div className="col-sm-6 form-group mb-3">
                                    <label className="fw-bold mb-1">Phone</label><br />
                                    <input className="form-control" name="phone_no" onChange={handleChange} type="number"
                                        value={cont.phone_no}
                                    />
                                </div>
                                <div className="col-sm-6 form-group mb-3">
                                    <label className="fw-bold mb-1">Email</label><br />
                                    <input className="form-control" name="email" onChange={handleChange} type="text"
                                        value={cont.email}
                                    />
                                </div>
                                <div className="col-sm-6 form-group mb-3">
                                    <label className="fw-bold mb-1">Designation</label><br />
                                    <input className="form-control" name="designation" onChange={handleChange} type="text"
                                        value={cont.designation}
                                    />
                                </div>
                            </div>
                            <div className="">
                                <button id="save" className="btn button-theme  btn-sm m-2" onClick={() => saveContData()} disabled ={saveIsDisabled}><span className="fa fa-save pe-2"></span>Save</button>
                                <i
                                    className="btn btn-sm btn-info m-0 my-2 m-2"
                                    onClick={() => switchPage("table")}
                                >
                                    <span className="fa fa-chevron-left pe-2"></span>Back
                                </i>
                            </div>
                        </div>
                    </React.Fragment>
                )}
            </div>
        </React.Fragment >
    );
}

export { ContactList };