import React from "react";
import SiteTabs from "./SiteTabs";

const SiteForm = props => {
    const {
        domain,
        selectedItem,
        setSelectedItem,
        encodedFilesCollection,
        setEncodedFilesCollection,
        handleSaveData,
        handleInputField,
        handleEditor,
        subDomainIsUnique,
        subDomainIsValid,
        entityList,
        contentList,
        getData,
        editItem,
        capitalizeFirstLetter,
        colorPalette,
        saveIsDisabled,
        clearFields,
        handleColorPalette,
        styles,
        guestUserList,
        selectedGuestUser,
        setSelectedGuestUser,
    } = props;
    return (
        <SiteTabs
            domain={domain}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            encodedFilesCollection={encodedFilesCollection}
            setEncodedFilesCollection={setEncodedFilesCollection}
            handleSaveData={handleSaveData}
            handleInputField={handleInputField}
            handleEditor={handleEditor}
            subDomainIsValid={subDomainIsValid}
            subDomainIsUnique={subDomainIsUnique}
            entityList={entityList}
            contentList={contentList}
            getData={getData}
            editItem={editItem}
            capitalizeFirstLetter={capitalizeFirstLetter}
            colorPalette={colorPalette}
            saveIsDisabled={saveIsDisabled}
            clearFields={clearFields}
            handleColorPalette={handleColorPalette}
            styles={styles}
            guestUserList={guestUserList}
            selectedGuestUser={selectedGuestUser}
            setSelectedGuestUser={setSelectedGuestUser}
        />
    );
};

export default SiteForm;
