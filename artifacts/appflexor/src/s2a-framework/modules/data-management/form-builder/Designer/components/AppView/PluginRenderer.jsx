import React, { Suspense, lazy, useContext } from "react";
import { AppContext } from "../../../../../../../AppContext";
import * as appConfig from "../../../../../../Config";
import * as appUtils from "../../../../../../utils/utils";

// Lazy load remote plugin
const AppView = lazy(() => import("app_plugins/AppView"));

export default function RemotePluginRenderer({ appView, formData={} }) {
  const appContext = useContext(AppContext);
  return (
    <Suspense fallback={<div>Loading remote plugin...</div>}>
      {/* <span>{JSON.stringify(appView)}</span> */}
      <AppView appView={appView} appContext={appContext} appConfig={appConfig} appUtils={appUtils} formData={formData}/>
    </Suspense>
  );
}
