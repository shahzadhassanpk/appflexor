/**
 * ProcessModelViewer — bpmn-js NavigatedViewer with token simulation support.
 *
 * Replaces the `react-bpmn` component used in ScenarioPanel. Manages the
 * bpmn-js lifecycle (create / importXML / destroy) inside a React effect.
 * Exposes the live viewer instance via onViewerReady so that SimulationControls
 * can reach its services (toggleMode, pauseSimulation, simulator, eventBus, …).
 *
 * Props:
 *   xml            string | null  — BPMN XML to render; null clears the view.
 *   xmlKey         any            — change this to force the viewer to re-import
 *                                   the same XML (e.g. after a retry).
 *   onViewerReady  (viewer) => void — called after a successful importXML; the
 *                                   viewer instance is fully usable at this point.
 *   onViewerReset  () => void     — called just before the viewer is destroyed
 *                                   (xml changed, component unmounts, or xmlKey changed).
 */
import React, { useEffect, useRef } from "react";
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer";
import TokenSimulationViewer from "bpmn-js-token-simulation/lib/viewer";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";

export default function ProcessModelViewer({
    xml,
    xmlKey,
    onViewerReady,
    onViewerReset,
}) {
    const containerRef = useRef(null);
    const viewerRef    = useRef(null);

    /* Stable callback refs — avoids re-running the effect when the parent
       re-renders and passes new function references. */
    const onViewerReadyRef = useRef(onViewerReady);
    const onViewerResetRef = useRef(onViewerReset);
    useEffect(() => { onViewerReadyRef.current = onViewerReady; }, [onViewerReady]);
    useEffect(() => { onViewerResetRef.current = onViewerReset; }, [onViewerReset]);

    useEffect(() => {
        /* ── Destroy any previous viewer first ─────────────────────────── */
        if (viewerRef.current) {
            viewerRef.current.destroy();
            viewerRef.current = null;
            onViewerResetRef.current?.();
        }

        /* ── Nothing to render ─────────────────────────────────────────── */
        if (!xml || !containerRef.current) return;

        /* ── Create a fresh NavigatedViewer with the token-simulation
           module loaded as an additional module ─────────────────────────── */
        const viewer = new NavigatedViewer({
            container: containerRef.current,
            additionalModules: [TokenSimulationViewer],
        });
        viewerRef.current = viewer;

        viewer
            .importXML(xml)
            .then(() => {
                try { viewer.get("canvas").zoom("fit-viewport"); } catch (_) {}
                onViewerReadyRef.current?.(viewer);
            })
            .catch((err) => {
                console.error("[ProcessModelViewer] importXML failed:", err);
                /* Destroy the broken instance so the container stays clean. */
                if (viewerRef.current === viewer) {
                    viewer.destroy();
                    viewerRef.current = null;
                    onViewerResetRef.current?.();
                }
            });

        /* ── Cleanup: destroy when xml / xmlKey changes or on unmount ─── */
        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
                onViewerResetRef.current?.();
            }
        };
    }, [xml, xmlKey]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            ref={containerRef}
            className="psim-model-viewer-root"
        />
    );
}
