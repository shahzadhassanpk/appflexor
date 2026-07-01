import { lazy } from "react";
import inherits from "inherits-browser";

import Viewer from "bpmn-js/lib/Viewer";
import SketchyRendererModule from "bpmn-js-sketchy";

export default function CustomViewer(options) {
    return new Viewer(options);
}

inherits(CustomViewer, Viewer);

CustomViewer.prototype._customModules = [
    // ZoomScrollModule,
    // MoveCanvasModule,
    SketchyRendererModule,
];

CustomViewer.prototype._modules = [].concat(
    Viewer.prototype._modules,
    CustomViewer.prototype._customModules,
);
