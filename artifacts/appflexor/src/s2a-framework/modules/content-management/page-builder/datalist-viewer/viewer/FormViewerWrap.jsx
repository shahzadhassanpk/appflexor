import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import DataListFormViewer from "../../../../data-management/form-builder/Forms/FormViewer/DataListFormViewer";
//  FormViewer is wrapped inside FormViewerWrap because DataListViewer
//  is importing FormViewer which then conflicts with already imported/exported FormViewer
//  [parent in which DataListViewer is imported].This wrapping will prevent name colision of FormViewer.

function FormViewerWrap(props) {
    const {
        formKey,
        businessKey,
        handleActions,
        fkColumn,
        fkValue,
        nextElementId,
        handleClose,
        mode,
        showTitle=false,
        tenantIdMain = "",
        confirmationMessage="",
        formVars={},
    } = props;

    return (
        <ErrorBoundary>
            <DataListFormViewer
                formKey={formKey}
                businessKey={businessKey}
                handleActions={handleActions}
                fkColumn={fkColumn}
                fkValue={fkValue}
                nextElementId={nextElementId}
                handleClose={handleClose}
                mode={mode}
                showTitle={showTitle}
                tenantIdMain = {tenantIdMain}
                confirmationMessage={confirmationMessage}
                formVars={formVars}
            />
        </ErrorBoundary>
    );
}

export default FormViewerWrap;
