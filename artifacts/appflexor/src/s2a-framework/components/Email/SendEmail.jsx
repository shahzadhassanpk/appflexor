import React, { useState, useEffect } from "react";
import { API_URL } from "../../Config";
import axios from "axios";
import './SendEmail.css';

function SendEmail({ item }) {

    const [Email, setEmail] = useState({});

    function runProcess(processId, variables, callback, errorCallback) {
        var processUrl = "/jw/web/json/workflow/process/start/" + processId;
        if (variables && variables !== "") {
            processUrl = processUrl + "?" + variables;
        }
        try {
            axios.post(processUrl)
                .then(function (response) {
                    if ((response.status == 200)) {
                        if (callback) {
                            callback();
                        }
                    } else {
                        if (errorCallback) {
                            errorCallback();
                        }
                        console.log("Error running process:" + processId);
                    }
                });

        } catch (e) {
            console.log('saveGig error:' + e);
        }
    }

    // function sendEmail() {
    //     runProcess(
    //         "back_office:latest:send_mail",
    //         "var_templateKey=send.booking&var_dataParams=&var_to=" + item.assign_email + "&var_message=" + Email.message + "&var_subject=" + Email.subject);
    // }

    function sendEmail() {
        runProcess(
            "back_office:latest:send_mail",
            "var_templateKey=send.booking&var_dataParams=&var_to=" + item.manager_email + "," + item.assign_email + "&var_message=" + Email.message + "&var_subject=" + Email.subject);
    }

    function handleChange(evt) {
        let value = evt.target.value;
        let name = evt.target.name;
        setEmail((prevState) => ({
            ...prevState,
            [name]: value
        }));
    }

    return (
        <React.Fragment>
            <div className="">

                <div className="container">
                    <div className="row">
                        <div className="col-sm-6 form-group mb-2">
                            <label className="fw-bold mb-1">To:</label>
                            <select className="form-select mb-2 select" value={item.email} multiple>
                                {/* <select className="form-select mb-2 select" value={item.email}> */}
                                <option name="assign_email" value={item.assign_email}>{item.assign_email}</option>
                                <option name="manager_email" value={item.manager_email}>{item.manager_email}</option>
                            </select>
                        </div>
                        <div className="col-sm-6 form-group mb-2">
                            <label className="fw-bold mb-1">Cc:</label>
                            <input className="form-control" name="cc_mail" type="text"
                                value="support@LightinDark.com"
                            />
                        </div>
                        <div className="col-sm-6 form-group mb-2">
                            <label className="fw-bold mb-1">Subject:</label>
                            <input className="form-control" name="subject" type="text" onChange={handleChange}
                                value={Email.subject}
                            />
                        </div>
                        <div className="col-sm-6 form-group mb-2">
                            <label className="fw-bold mb-1">Message</label>
                            <textarea className="form-control" name="message" onChange={handleChange}
                                value={Email.message}
                            >
                            </textarea>
                        </div>
                        <div className="row my-3">
                            <span className="">
                                <i className="btn button-theme  btn-sm me-2" onClick={() => sendEmail()}><span className="fa fa-plus" style={{ paddingRight: "5px" }}></span>Send Email</i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export { SendEmail }