import MD5 from "crypto-js/md5";
import React, { useRef, useState } from "react";
import { toastEmitter } from "../../../components/Toastify/Toastify";

function UserForm({
    error,
    selectedUser,
    handleInputField,
    confirmPassword,
    MultiSelect,
    generateUsername,
    group,
    filteredGroups,
    handleMultiSelectGroups,
    role,
    setConfirmPassword,
    setSelectedUser,
    show,
    setShow,
    allowUser,
}) {
    const [prevPassword, setPrevPassword] = useState("");
    const [showPassword, setShowPassword] = useState({
        password: false,
        confirm_password: false,
    });

    function changePassword(check) {
        setShow(check);
        if (check) {
            setPrevPassword(selectedUser.password);
            setSelectedUser(prev => ({
                ...prev,
                password: "",
            }));
        } else {
            setSelectedUser(prev => ({
                ...prev,
                password: prevPassword,
            }));
        }
    }
    return (
        <div className="s2a-userform">
            <div className="row mb-2">
                <div className="col-sm-6">
                    <div className="form-group">
                        <label
                            className="mt-1 fw-bold"
                            htmlFor="firstname">
                            First Name&nbsp;
                            <span className="text-danger">*</span>
                        </label>
                        <input
                            id="firstname"
                            type="text"
                            className={
                                error.indexOf("firstname") > -1
                                    ? "form-control is-invalid"
                                    : "form-control"
                            }
                            name="firstname"
                            value={selectedUser.firstname}
                            onChange={handleInputField}
                        />
                    </div>
                    <span
                        id="signup-msg"
                        className={`invalid-feedback ${
                            error.indexOf("firstname") > -1
                                ? "d-block"
                                : "visually-hidden"
                        }`}>
                        First Name is Required.
                    </span>
                </div>
                <div className="col-sm-6">
                    <div className="form-group">
                        <label
                            className="mt-1 fw-bold"
                            htmlFor="lastname">
                            Last Name&nbsp;
                            <span className="text-danger">*</span>
                        </label>
                        <input
                            id="lastname"
                            type="text"
                            className={
                                error.indexOf("lastname") > -1
                                    ? "form-control is-invalid"
                                    : "form-control"
                            }
                            name="lastname"
                            value={selectedUser.lastname}
                            onChange={handleInputField}
                            required
                        />
                        <span
                            id="signup-msg"
                            className={`invalid-feedback ${
                                error.indexOf("lastname") > -1
                                    ? "d-block"
                                    : "visually-hidden"
                            }`}>
                            Last Name is Required.
                        </span>
                    </div>
                </div>
            </div>
            <div className="row mb-2">
                <div className="col-sm-6">
                    <div className="form-group">
                        <label
                            className="mt-1 fw-bold"
                            htmlFor="username">
                            User Name&nbsp;
                            <span
                                className="text-danger"
                                id="signup-msg">
                                *
                            </span>
                        </label>
                        <div className="input-group">
                            {selectedUser.id > "  " ? (
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    className={`form-control ${
                                        error.indexOf("username") > -1
                                            ? "form-control is-invalid"
                                            : "form-control"
                                    }`}
                                    placeholder="Username"
                                    aria-label="username"
                                    aria-describedby="basic-addon2"
                                    value={selectedUser.username}
                                    onChange={handleInputField}
                                    required
                                    readOnly
                                />
                            ) : (
                                <>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        className={`form-control ${
                                            error.indexOf("username") > -1
                                                ? "form-control is-invalid"
                                                : "form-control"
                                        }`}
                                        placeholder="Username"
                                        aria-label="username"
                                        aria-describedby="basic-addon2"
                                        value={selectedUser.username.replaceAll(
                                            /['";,()<>%!#$^&*?=+:[{}`~/|\\\]]/g,
                                            "",
                                        )}
                                        onChange={handleInputField}
                                        required
                                    />
                                    <button
                                        id="basic-addon2"
                                        className={`input-group-text${
                                            selectedUser.firstname == "" ||
                                            selectedUser.lastname == ""
                                                ? " not-allowed text-danger "
                                                : " pointer text-success"
                                        } `}
                                        type="button"
                                        title={`${
                                            selectedUser.firstname == "" ||
                                            selectedUser.lastname == ""
                                                ? "Requires first name, last name"
                                                : "Suggest username"
                                        } `}
                                        onClick={generateUsername}
                                        disabled={
                                            selectedUser.firstname == "" ||
                                            selectedUser.lastname == ""
                                        }>
                                        suggest
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <span
                        id="signup-msg"
                        className={`invalid-feedback ${
                            error.indexOf("username") > -1
                                ? "d-block"
                                : "visually-hidden"
                        }`}>
                        User Name is Required.
                    </span>
                </div>
                <div className="col-sm-6">
                    <div className="form-group">
                        <label
                            className="mt-1 fw-bold"
                            htmlFor="email">
                            Email&nbsp;
                            <span className="text-danger">*</span>
                        </label>
                        <input
                            id="email"
                            type="text"
                            className={
                                error.indexOf("email") > -1
                                    ? "form-control is-invalid"
                                    : "form-control"
                            }
                            name="email"
                            value={selectedUser.email}
                            onChange={handleInputField}
                            required
                        />
                        <span
                            id="signup-msg"
                            className={`invalid-feedback ${
                                error.indexOf("email") > -1
                                    ? "d-block"
                                    : "visually-hidden valid-feedback"
                            }`}>
                            Email is Required.
                        </span>
                    </div>
                </div>
            </div>
            <div className="row mb-2">
                <div className="col-sm-6">
                    <label
                        className="mt-1 fw-bold"
                        htmlFor="multiselect">
                        Group&nbsp;
                        <span className="text-danger">*</span>
                    </label>
                    <MultiSelect
                        id="multiselect"
                        options={group}
                        value={filteredGroups}
                        onChange={handleMultiSelectGroups}
                        labelledBy="Select"
                        required
                    />
                    <span
                        id="signup-msg"
                        className={`invalid-feedback ${
                            error.indexOf("groupid") > -1
                                ? "d-block"
                                : "visually-hidden"
                        }`}>
                        Group is Required.
                    </span>
                </div>
                <div className="col-sm-6">
                    <label
                        className="mt-1 fw-bold"
                        htmlFor="role">
                        Role&nbsp;
                        <span className="text-danger">*</span>
                    </label>
                    <select
                        id="role"
                        className={
                            error.indexOf("roleid") > -1
                                ? "form-control is-invalid"
                                : "form-select"
                        }
                        name="roleid"
                        value={selectedUser.roleid}
                        onChange={event => {
                            handleInputField(event);
                        }}>
                        <option
                            value=""
                            disabled>
                            Select Role
                        </option>

                        {role.map(role => {
                            return (
                                <option
                                    key={role.id}
                                    value={role.id}>
                                    {role.name}
                                </option>
                            );
                        })}
                    </select>
                    <span
                        id="signup-msg"
                        className={`invalid-feedback ${
                            error.indexOf("roleid") > -1
                                ? "d-block"
                                : "visually-hidden"
                        }`}>
                        Role is Required.
                    </span>
                </div>
            </div>
            {show === false && selectedUser.id === " " && (
                <div className="row mb-2">
                    <div className="col-sm-6">
                        <label className="mt-1 fw-bold">
                            Password&nbsp;
                            <span className="text-danger">*</span>
                        </label>
                        <div className="pass-input">
                            <input
                                type={
                                    showPassword.password ? "text" : "password"
                                }
                                className={
                                    error.indexOf("password") > -1
                                        ? "form-control is-invalid password-input"
                                        : "form-control password-input"
                                }
                                id="ciphertext"
                                name="password"
                                value={selectedUser.password}
                                onChange={handleInputField}
                                required
                            />
                            <span
                                className="show-pass"
                                onClick={() =>
                                    setShowPassword({
                                        ...showPassword,
                                        password: !showPassword.password,
                                    })
                                }>
                                {showPassword.password ? (
                                    <i className="fa-regular fa-eye"></i>
                                ) : (
                                    <i className="fa-regular fa-eye-slash"></i>
                                )}
                            </span>
                            <span
                                className={`invalid-feedback ${
                                    error.indexOf("password") > -1
                                        ? "d-block"
                                        : "visually-hidden valid-feedback"
                                }`}>
                                Password is Required.
                            </span>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <label className="mt-1 fw-bold">
                            Confirm Password&nbsp;
                            <span className="text-danger">*</span>
                        </label>
                        <div className="pass-input">
                            <input
                                type={
                                    showPassword.confirm_password
                                        ? "text"
                                        : "password"
                                }
                                value={confirmPassword}
                                className={
                                    error.indexOf("confirm_password") > -1
                                        ? "form-control is-invalid c_password-input"
                                        : "form-control c_password-input"
                                }
                                onChange={e =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                            />
                            <div
                                className="show-pass"
                                onClick={() =>
                                    setShowPassword({
                                        ...showPassword,
                                        confirm_password:
                                            !showPassword.confirm_password,
                                    })
                                }>
                                {showPassword.confirm_password ? (
                                    <i className="fa-regular fa-eye"></i>
                                ) : (
                                    <i className="fa-regular fa-eye-slash"></i>
                                )}
                            </div>
                            <span
                                className={`invalid-feedback ${
                                    error.indexOf("confirm_password") > -1
                                        ? "d-block"
                                        : "visually-hidden"
                                }`}>
                                Password didn't match
                            </span>
                        </div>
                    </div>
                </div>
            )}
            {show === true && selectedUser.id.length > 3 && (
                <>
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <label className="mt-1 fw-bold">
                                Password&nbsp;
                                <span className="text-danger"></span>
                            </label>
                            <div className="pass-input">
                                <input
                                    type={
                                        showPassword.password
                                            ? "text"
                                            : "password"
                                    }
                                    className={
                                        error.indexOf("password") > -1
                                            ? "form-control is-invalid password-input"
                                            : "form-control password-input"
                                    }
                                    id="ciphertext"
                                    name="password"
                                    value={selectedUser.password}
                                    onChange={handleInputField}
                                    required
                                />
                                <div
                                    className="show-pass"
                                    onClick={() =>
                                        setShowPassword({
                                            ...showPassword,
                                            password: !showPassword.password,
                                        })
                                    }>
                                    {showPassword.password ? (
                                        <i
                                            className="fa-regular fa-eye"
                                            title="Hide Password"></i>
                                    ) : (
                                        <i
                                            className="fa-regular fa-eye-slash"
                                            title="Show Password"></i>
                                    )}
                                </div>
                                <span
                                    className={`invalid-feedback ${
                                        error.indexOf("password") > -1
                                            ? "d-block"
                                            : "visually-hidden valid-feedback"
                                    }`}>
                                    Password is Required.
                                </span>
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <label className="mt-1 fw-bold">
                                Confirm Password&nbsp;
                                <span className="text-danger"></span>
                            </label>
                            <div className="pass-input">
                                <input
                                    type={
                                        showPassword.confirm_password
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    className={
                                        error.indexOf("confirm_password") > -1
                                            ? "form-control is-invalid c_password-input"
                                            : "form-control c_password-input"
                                    }
                                    onChange={e =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                />
                                <div
                                    className="show-pass"
                                    onClick={() =>
                                        setShowPassword({
                                            ...showPassword,
                                            confirm_password:
                                                !showPassword.confirm_password,
                                        })
                                    }>
                                    {showPassword.confirm_password ? (
                                        <i
                                            className="fa-regular fa-eye"
                                            title="Hide Password"></i>
                                    ) : (
                                        <i
                                            className="fa-regular fa-eye-slash"
                                            title="Show Password"></i>
                                    )}
                                </div>
                                <span
                                    className={`invalid-feedback ${
                                        error.indexOf("confirm_password") > -1
                                            ? "d-block"
                                            : "visually-hidden"
                                    }`}>
                                    Password didn't match
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {selectedUser.id !== " " && selectedUser.provider == "system" && (
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={show}
                        onChange={e => changePassword(e.target.checked)}
                    />
                    <label
                        className="form-check-label"
                        htmlFor="flexCheckChecked">
                        Change Password
                    </label>
                </div>
            )}
            <div className="row">
                <div className="col-sm-6">
                    <div className="form-check">
                        <input
                            id="active"
                            type="checkbox"
                            className="form-check-input"
                            name="active"
                            disabled={!allowUser && selectedUser.active !== "1"}
                            value={selectedUser.active}
                            checked={selectedUser.active === "1" ? true : false}
                            onChange={handleInputField}
                        />
                        <label className="form-check-label">
                            {selectedUser.active === "1"
                                ? "User is Active"
                                : "User is Inactive"}
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { UserForm };
