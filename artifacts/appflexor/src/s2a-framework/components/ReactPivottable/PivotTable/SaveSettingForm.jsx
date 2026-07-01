import React from "react";

export default function SaveSettingForm(props) {
    const { handleInput, hanldeSaveConfig, saveConfig } = props;
    return (
        <div>
            <span>
                <label
                    className="fw-bold mb-2"
                    htmlFor="title">
                    Title
                </label>
                <input
                    id="title"
                    className="form-control"
                    name="title"
                    value={saveConfig.title}
                    onChange={handleInput}
                />
            </span>
            <span className="mt-3 float-end">
                <button
                    disabled={saveConfig.title.length === 0}
                    className="btn btn-sm button-theme"
                    onClick={hanldeSaveConfig}>
                    Ok
                </button>
            </span>
        </div>
    );
}
