import React from "react";

const Messsage = props => {
    const { message } = props;
    return (
        <div className="s2a-subscription-msg text-center">
            <span>
                Subscription for the
                <span className="text-danger"> {message} </span>
                Component is expired
            </span>
        </div>
    );
};

export default Messsage;
