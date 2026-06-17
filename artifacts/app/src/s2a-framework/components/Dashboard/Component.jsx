import React, { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useDrag } from "react-dnd";
import { COMPONENT } from "./Constants";

const style = {
    // border: "1px dashed black",
    padding: "0.5rem 1rem",
    backgroundColor: "white",
    cursor: "move",
};
const Component = ({ data, components, path, previewMode }) => {
    const ref = useRef(null);
    //const[component, setComponent] = useState(null);
    const [{ isDragging }, drag] = useDrag({
        item: { type: COMPONENT, id: data.id, path },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    function getObjectById(arr, idField, idValue) {
        let result;
        arr.forEach((obj) => {
            if (obj[idField] === idValue) {
                result = obj;
            }
        });
        return result;
    }
    // useEffect(()=>{
    //   let c = getObjectById(components, "component_id", data.component_id);
    //   if(c){
    //     setComponent(c);
    //   }
    // },[data, components]);

    const opacity = isDragging ? 0 : 1;
    drag(ref);
    const component = components[data.component_id];

    return (
        <>
            {previewMode ? (
                <div
                    ref={ref}
                    style={{ ...style, opacity }}
                    className="component"
                >
                    <div>{component.content}</div>
                </div>
            ) : (
                <div
                    ref={ref}
                    style={{ ...style, opacity }}
                    className="component draggable"
                >
                    <div>{component.content}</div>
                </div>
            )}
        </>
    );
};
export default Component;
