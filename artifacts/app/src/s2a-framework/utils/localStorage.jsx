import { useState, useEffect } from "react";

function write(key, value = "") {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Error setting localStorage key:", key, error);
        return false;
    }
}

function read(key, defaultValue) {
    try {
        const item = window.localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        } else {
            console.error("Error reading localStorage key:", key);
            localStorage.removeItem(key);
            return defaultValue;
        }
    } catch (error) {
        console.error("Error reading localStorage key:", key, error);
        return defaultValue;
    }
}

export { read, write };
