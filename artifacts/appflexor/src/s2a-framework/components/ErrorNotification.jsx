import React, { useEffect, useState } from "react";

const ErrorNotification = props => {
    const { error, labels } = props;
    const [err, setErr] = useState(error);

    useEffect(() => {
        const _err = [];
        error.forEach(err => {
            if (labels[err]) {
                _err.push(labels[err]);
            }
        });
        setErr(_err);

        const id = setTimeout(() => {
            setErr([]);
        }, [3000]);

        return () => {
            clearTimeout(id);
        };
    }, [error]);

    if (Array.isArray(err) && err.length > 0)
        return (
            <div
                className="alert alert-danger mb-1 p-2"
                role="alert">
                <div>
                    <span className="fw-bold text-danger">
                        Required Field(s) :{" "}
                    </span>
                    {err.join(" , ")}
                </div>
            </div>
        );
};

export default ErrorNotification;
