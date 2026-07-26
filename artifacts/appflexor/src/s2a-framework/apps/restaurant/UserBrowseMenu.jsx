import React from "react";
import "./UserBrowseMenu.css";

export const UserBrowseMenu = props => {
    const { appContext, appConfig } = props;
    return (
        <div className="restaurant-user-browse-menu">           

            <div class="section">
                <h2>Recent Escalations</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Case Ref</th>
                            <th>SLA</th>
                            <th>Urgency</th>
                            <th>Escalation Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>INC-10452</td>
                            <td>System Outage Issue</td>
                            <td>
                                <span class="badge badge-critical">
                                    CRITICAL
                                </span>
                            </td>
                            <td>Resolution SLA Breached</td>
                            <td>
                                <span class="badge badge-breached">Open</span>
                            </td>
                        </tr>
                        <tr>
                            <td>INC-10447</td>
                            <td>System Performance Issue</td>
                            <td>
                                <span class="badge badge-high">HIGH</span>
                            </td>
                            <td>Multiple Customer Follow-ups</td>
                            <td>In Progress</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};