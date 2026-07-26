import React from "react";
import { appList } from "./AppRegistry";

export default function AppView(props) {
  const { appView, appContext, appConfig } = props;
  const app = appList[appView?.app];

  return (
    <div className="app-view">
      {/* <code>{JSON.stringify(appContext)}</code> */}
      {app[appView?.view] ? (
        React.createElement(app[appView.view],  { appContext })
      ) : (
        <div>View not found {JSON.stringify(appView)}</div>
      )}
    </div>
  );
}
