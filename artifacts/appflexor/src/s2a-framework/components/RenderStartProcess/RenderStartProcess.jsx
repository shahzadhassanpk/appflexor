import { useSearchParams } from "react-router-dom";
import StartStepProcessor from "../../modules/camunda/StartStepProcessor";
import { ErrorBoundary } from "../../utils/ErrorBoundry";

export default function RenderStartProcess() {
    let [searchParams] = useSearchParams();

    function handleActions(type) {
        console.log(type);
    }
    const processId = searchParams.get("processId");
    let formVars = getDefaultFormData();

    function getDefaultFormData(){
        const entries = Array.from(searchParams.entries());
        return entries.reduce((acc, a) => ((acc[a[0]] = acc[a[0]] || []).push(a[1]), acc), {});

    }

    return (
        <ErrorBoundary>
            <StartStepProcessor
                id={processId}
                handleProcessActions={handleActions}
                camundaVars={{}}
                formVars={formVars}
            />
        </ErrorBoundary>
    );
}
