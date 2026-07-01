import React, { useState, useEffect } from "react";
import { API_URL } from "../../Config";
import axios from "axios";

function Email({ emailkey }) {

  function sendEmail() {
    var dataRequest = {
      dataKeys: [
        {
          serviceParams: "",
          emailKey: emailkey,
        },
      ],
    };
    try {
      axios.post(API_URL + "?service.key=send.email", dataRequest)
        .then(function (response) {
          if ((response.status == 200)) {
            console.log(response);
          }
        });

    } catch (e) {
      console.log('SendEmail error:' + e);
    }
  }

  return (
    <React.Fragment>
      <button className="btn button-theme btn-sm m-0"
        onClick={sendEmail}
      >
        Send Email
      </button>
    </React.Fragment>
  );
}

export { Email }