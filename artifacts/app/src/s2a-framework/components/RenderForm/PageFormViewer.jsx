import { useSearchParams } from "react-router-dom";
import FormViewer, {
    modeType,
} from "../../modules/data-management/form-builder/Forms/FormViewer";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import { toastEmitter } from "../Toastify/Toastify";
import MultiFormViewer from "../../modules/data-management/form-builder/Forms/FormViewer/MultiFormViewer";
import { useEffect, useState } from "react";
import { API_URL } from "../../Config";
import axios from "axios";
import { isEmpty } from "../../modules/data-management/form-builder/Forms/FormViewer/utils";
export default function PageFormViewer() {
    let [searchParams] = useSearchParams();
    const [details, setDetails] = useState({});
    const [loaded, setLoaded] = useState(false);

    const formKey = searchParams.get("formKey");
    const businessKey = searchParams.get("businessKey");
    const external = searchParams.get("external");

    function handleActions(type) {
        console.log(type);
        toastEmitter("Save Successfully", true);
    }

    useEffect(() => {
        getForm(formKey);
    }, [formKey]);

    function getForm(formKey) {
        var dataRequest = {};

        dataRequest = {
            dataKeys: [
                {
                    serviceParams: formKey,
                    dataKey: "formList",
                    serviceKey: "sys.get.form",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.formList) {
                        let list = response.data.C_DATA.formList;
                        let form = list[0];
                        try {
                            let parsedDesign = tryParseJSONObject(form.design, {
                                layout: [],
                                components: {},
                                images: {},
                                htmlCollection: {},
                            });
                            let layout = parsedDesign.layout;
                            let components = parsedDesign.components;
                            let images = parsedDesign.images;
                            let htmlCollection = parsedDesign.htmlCollection;
                            getFormData({
                                form,
                                layout,
                                images,
                                htmlCollection,
                                components,
                                businessKey,
                                formKey,
                            });
                        } catch (error) {
                            console.error(error);
                        }
                    } else {
                        console.log(
                            `Either list.all.forms does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getDefaultFormData(){
        const entries = Array.from(searchParams.entries());
        let _entries = entries.reduce((acc, a) => {
            (acc[a[0]] = acc[a[0]] || []).push(a[1]);
            return acc;
        }, {});
        
        let result = Object.fromEntries(Object.entries(_entries).map(([key, value]) => [key, value[0]]));
    
        return result;
    }
    

    function getFormData({
        form,
        layout,
        images,
        htmlCollection,
        components,
        businessKey,
        formKey,
    }) {
        var dataRequest = {
            datasource: form.datasource,
            usePrefix: form.useprefix,
            dataKeys: [
                {
                    businessKey: businessKey,
                    dataKey: "formData",
                    getFormBy: "key",
                    formKey: formKey,
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=get.formData", dataRequest)
            .then(response => {
                if (response.data.C_DATA.formData.length > 0) {
                    let formDataTemp = response.data.C_DATA.formData;                   

                    setDetails({
                        form,
                        layout,
                        images,
                        htmlCollection,
                        components,
                        formData: formDataTemp[0],
                    });
                }else{
                    let formDataTemp = getDefaultFormData();
                    delete formDataTemp.formKey;
                    setDetails({
                        form,
                        layout,
                        images,
                        htmlCollection,
                        components,
                        formData: formDataTemp,
                    });
                }
                setLoaded(true);
            })
            .catch(error => {
                console.error(error);
            });
    }

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    return (
        <ErrorBoundary>
            {loaded && (
                <MultiFormViewer
                    form={details?.form}
                    businessKey={businessKey}
                    formVars={details?.formData}
                    mode={modeType.render}
                    handleActions={handleActions}></MultiFormViewer>
            )}
        </ErrorBoundary>
    );
}
