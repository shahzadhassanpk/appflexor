import React from "react";
import ModuleContext from "./ModuleContext";
import { useContext } from "react";
import ModuleCard from "./ModuleCard";

export default function Listing() {
    const moduleContext = useContext(ModuleContext);
    const { items, setChildInput } = moduleContext;
    if (items && items.length > 0 && typeof items === "object")
        return (
            <div className="module-listing enable-scroll">
                {items?.map(item => (
                    <div key={item.id}>
                        <ModuleCard
                            id={item.id}
                            title={item.title}
                            description={item.description}
                            app_id={item.app_id}
                            setChildInput={setChildInput}
                            item={item}
                        />
                    </div>
                ))}
            </div>
        );
}
