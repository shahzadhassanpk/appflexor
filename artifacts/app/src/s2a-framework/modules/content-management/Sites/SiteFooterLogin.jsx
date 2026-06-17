import TextEditor from "../../../components/TextEditor/RichTextEditor";

function SiteFooterLogin({
    // selectedItem,
    // handleEditor,
    // saveIsDisabled,
    // clearFields,
    // handleSaveData,
    // setShowSiteModal,
    selectedItem,
    saveData,
    handleInputField,
    handleEditor,
    entityList,
    getData,
    styles,
    capitalizeFirstLetter,
    colorPalette,
    saveIsDisabled,
    clearFields,
    handleColorPalette,
    showModal,
    setShowSiteModal,
    handleSaveData,
}) {
    return (
        <>
            <div className="row">
                <div className="form-group">
                    <label className="mt-1 fw-bold pe-2">
                        Login Content Html
                        <span className="text-danger"></span>
                    </label>
                    <TextEditor
                        id="login_html"
                        value={selectedItem.login_html}
                        onChange={handleEditor}
                        height="220px"
                    />
                </div>
            </div>
            <div className="row">
                <div className="form-group">
                    <label className="mt-1 fw-bold pe-2">
                        Footer Html
                        <span className="text-danger"></span>
                    </label>
                    <TextEditor
                        id="footer_html"
                        value={selectedItem.footer_html}
                        onChange={handleEditor}
                        height="220px"
                    />
                </div>
            </div>
            <div className="d-flex text-align-center justify-content-end py-3">
                <button
                    className="btn button-theme btn-sm me-2 pull-left"
                    onClick={() => {
                        clearFields();
                        setShowSiteModal(false);
                    }}>
                    <i className="fa-solid fa-xmark pe-1"></i>
                    Close
                </button>
                <button
                    className={` ${
                        saveIsDisabled ? "pointer" : "not-allowed"
                    } btn button-theme btn-sm pull-left  ms-0`}
                    onClick={() => handleSaveData(true)}
                    disabled={saveIsDisabled}
                    data-bs-dismiss="modal">
                    <i className="fa-solid fa-floppy-disk pe-1"></i>

                    {selectedItem.id === "" ? "Save" : "Update"}
                </button>
            </div>
        </>
    );
}
export default SiteFooterLogin;
