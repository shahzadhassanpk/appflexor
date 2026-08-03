import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import "./NotificationBell.css";


const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const host = window.location.host;
const WS_URL = `${protocol}://${host}/ws`;
const API_URL = "/app/service";

const MAX_RETRIES = 10;

const NotificationBell = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unseenCount, setUnseenCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("disconnected"); // 'connected' | 'disconnected'

    const wsRef = useRef(null);
    const retryRef = useRef(0);
    const reconnectTimerRef = useRef(null);
    const shouldReconnectRef = useRef(true);
    const dropdownRef = useRef(null);

    const connect = () => {
        if (!shouldReconnectRef.current) return;

        const ws = new WebSocket(WS_URL);
        const authKey = localStorage.getItem("AUTH_KEY");
        wsRef.current = ws;

        setConnectionStatus("disconnected");

        ws.onopen = () => {
            retryRef.current = 0;
            setConnectionStatus("connected");
            ws.send(JSON.stringify({ type: "AUTH", authKey }));
        };

        ws.onmessage = event => {
            const payload = JSON.parse(event.data);
            if (payload.type === "INIT") {
                setNotifications(payload.data);
                setUnseenCount(payload.data.filter(n => !n.seen).length);
            }

            if (payload.type === "NEW") {
                let notification = payload.data;
                notification.id =
                    notification.notificationid ||
                    notification.id ||
                    notification.notificationId; // Normalize ID field
                setNotifications(prev => [notification, ...prev]);
                setUnseenCount(c => c + 1);
                ws.send(
                    JSON.stringify({
                        type: "ACK",
                        notificationId: payload.data.id,
                        notification: payload.data,
                    }),
                );
            }
        };

        ws.onerror = () => {
            ws.close();
        };

        ws.onclose = () => {
            setConnectionStatus("disconnected");

            if (!shouldReconnectRef.current) return;

            if (retryRef.current >= MAX_RETRIES) {
                console.warn("WS reconnect limit reached");
                return;
            }

            const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
            retryRef.current += 1;

            reconnectTimerRef.current = setTimeout(connect, delay);
        };
    };

    useEffect(() => {
        shouldReconnectRef.current = true;
        connect();

        return () => {
            shouldReconnectRef.current = false;
            clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
        };
    }, [userId]);

    // useEffect(() => {
    //     const onStorage = e => {
    //         if (e.key !== "notif:lastSync") return;
    //         getNotifications();
    //     };

    //     window.addEventListener("storage", onStorage);
    //     return () => window.removeEventListener("storage", onStorage);
    // }, []);

    const markAllSeen = () => {
        const unseenItems = notifications.filter(n => !n.seen);
        if (!unseenItems.length) return;
        updateDBStatus(unseenItems);
    };

    const markAsSeen = item => {
        if (item.seen) return;
        updateDBStatus([item]);
    };

    function updateDBStatus(items) {
        if (!items?.length) return;

        const request = {
            data: items.map(item => ({
                formId: "notification",
                entity: "notification",
                action: "update",
                id: item.notificationid || item.id || item.notificationId,
                formData: { ...item, seen: true },
            })),
        };

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(res => {
                if (res.data.C_STATUS === "SUCCESS") {
                    // Optimistic update instead of refetch (see below)
                    setNotifications(prev =>
                        prev.map(n =>
                            items.some(i => i.id === n.id)
                                ? { ...n, seen: true }
                                : n,
                        ),
                    );
                    localStorage.setItem(
                        "notif:lastSync",
                        new Date().toISOString(),
                    );
                    setUnseenCount(c => Math.max(0, c - items.length));
                }
            })
            .catch(console.error);
    }

    useEffect(() => {
        const handler = e => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        getNotifications();
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    function getNotifications() {
        return;
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "notifications",
                    serviceKey: "sys.tenant.notifications",
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (
                    response.status === 200 &&
                    response.data.C_STATUS === "SUCCESS"
                ) {
                    let data = response.data.C_DATA;
                    if (data.notifications) {
                        setNotifications(data.notifications);
                        setUnseenCount(
                            data.notifications.filter(n => !n.seen).length,
                        );
                    } else {
                        setNotifications([]);
                        console.log("Unable to fetch Features Subscription");
                    }
                } else {
                    setNotifications([]);
                }
            })
            .catch(error => {
                setNotifications([]);
            });
    }

    function markAllAsRead() {
        // filter only unseen notifications
        const unseenNotifications = notifications.filter(n => !n.seen);

        // if nothing to update, stop
        if (unseenNotifications.length === 0) return;

        let request = {};
        request.data = [];

        unseenNotifications.forEach(item => {
            let entityForm = {};
            entityForm.formId = "notification";
            entityForm.entity = "notification";
            entityForm.action = "update";

            // mark seen true
            entityForm.id = item.id;
            entityForm.formData = {
                ...item,
                seen: true,
            };

            request.data.push(entityForm);
        });

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    getNotifications(); // refresh list
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <div className="notification-bell position-relative">
            <button
                type="button"
                title="Notifications"
                aria-label={`${unseenCount || "No"} unread notifications`}
                aria-expanded={open}
                className={`top-navbar-icon navbar-action-button notification-bell-btn ${connectionStatus}`}
                onClick={() => setOpen(!open)}>
                <i className="bi bi-bell"></i>
                {unseenCount > 0 && (
                    <span className="badge">{unseenCount}</span>
                )}
            </button>
            {open && (
                <div
                    className="dropdown"
                    ref={dropdownRef}>
                    <div className="mb-3 notification-header">
                        <span>Notifications</span>
                        <div className="me-0">
                            <button
                                className="btn btn-sm btn-link mark-all-seen"
                                onClick={() => {
                                    markAllSeen();
                                }}>
                                Mark all as seen
                            </button>
                        </div>
                    </div>
                    <div className="notification-list enable-scroll">
                        {notifications.length === 0 ? (
                            <div className="empty">No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${!n.seen ? "unseen" : "seen"}`}
                                    onClick={() => markAsSeen(n)}>
                                    <div className="title">{n.title}</div>
                                    <div className="message">{n.message}</div>
                                    <div
                                        className="timestamp"
                                        title={new Date(
                                            n.created_at,
                                        ).toLocaleString()}>
                                        {formatDistanceToNow(
                                            new Date(n.created_at),
                                            { addSuffix: true },
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
