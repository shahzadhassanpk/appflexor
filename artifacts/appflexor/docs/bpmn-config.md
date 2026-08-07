⚙️ How to Configure BPMN Nodes with bpmn-js in React
1. Initialize the Modeler
tsx
import React, { useEffect, useRef } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";

const BpmnConfig: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      modelerRef.current = new BpmnModeler({ container: containerRef.current });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
          <bpmn:process id="Process_1" isExecutable="false">
            <bpmn:startEvent id="StartEvent_1"/>
          </bpmn:process>
        </bpmn:definitions>`;
      
      modelerRef.current.importXML(xml);
    }
  }, []);

  return <div style={{ width: "100%", height: "400px" }} ref={containerRef}></div>;
};

export default BpmnConfig;
2. Configure Existing Nodes
Use the modeling API to update properties:

tsx
const elementRegistry = modelerRef.current.get("elementRegistry");
const modeling = modelerRef.current.get("modeling");

const startEvent = elementRegistry.get("StartEvent_1");
modeling.updateProperties(startEvent, { name: "Kickoff Event" });
3. Add New Nodes Programmatically
tsx
const elementFactory = modelerRef.current.get("elementFactory");
const canvas = modelerRef.current.get("canvas");
const modeling = modelerRef.current.get("modeling");

const taskShape = elementFactory.createShape({ type: "bpmn:Task" });
modeling.createShape(taskShape, { x: 300, y: 200 }, canvas.getRootElement());
📊 Key APIs for Node Configuration
API	Purpose
modeling.updateProperties	Change node attributes (name, type, etc.)
elementRegistry.get	Access existing BPMN elements by ID
elementFactory.createShape	Create new BPMN nodes programmatically
modeling.createShape	Place new nodes on the canvas
canvas.getRootElement	Get the diagram root for adding nodes


✅ Summary
You don’t need the bpmn-js properties panel or drag-and-drop editor if you only want to configure nodes.

Just use the modeling API inside React hooks to update or create BPMN elements.

This approach keeps the diagram static but configurable, ideal for automation or SaaS workflows.