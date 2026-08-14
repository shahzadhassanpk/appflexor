/**
 * SimulationControls — lifecycle controls for bpmn-js token simulation.
 *
 * Manages a local state machine (IDLE → ACTIVE → RUNNING → PAUSED → COMPLETED)
 * by listening to real bpmn-js-token-simulation eventBus events. Exposes
 * buttons that call the library's actual service APIs — no invented APIs used.
 *
 * What the library genuinely supports (v0.40.0):
 *   ✓ Toggle simulation mode on / off  (toggleMode.toggleMode)
 *   ✓ Pause / Resume                   (pauseSimulation.pause / unpause / toggle)
 *   ✓ Reset                            (resetSimulation.resetSimulation)
 *   ✓ Exclusive-gateway path routing   (simulator.setConfig with activeOutgoing)
 *
 * What the library does NOT support (requires custom logic or is simply unsupported):
 *   ✗ Automatic task-duration advance — user must click each context-pad button
 *   ✗ Resource pools
 *   ✗ Maximum-token enforcement        — shown as informational only
 *   ✗ Time-horizon enforcement         — shown as informational only
 *
 * Props:
 *   viewer             bpmn-js NavigatedViewer instance (or null when no diagram is loaded)
 *   scenario           scenario form object — read .parameters and .constraints from it
 *   maximized          bool — whether the BPMN section is currently maximized
 *   onToggleMaximize   () => void — toggle the maximized state
 */
import React, { useEffect, useRef, useState } from "react";

/* ── Simulation lifecycle states ───────────────────────────────────────── */
const S = {
    IDLE:      "IDLE",      // mode off
    ACTIVE:    "ACTIVE",    // mode on, no tokens created yet (or after reset)
    RUNNING:   "RUNNING",   // mode on, tokens flowing, not paused
    PAUSED:    "PAUSED",    // mode on, paused
    COMPLETED: "COMPLETED", // mode on, all process scopes destroyed
};

/* Real event-name constants from bpmn-js-token-simulation/lib/util/EventHelper */
const EV_TOGGLE_MODE      = "tokenSimulation.toggleMode";
const EV_PLAY             = "tokenSimulation.playSimulation";
const EV_PAUSE            = "tokenSimulation.pauseSimulation";
const EV_RESET            = "tokenSimulation.resetSimulation";
const EV_SCOPE_CREATE     = "tokenSimulation.simulator.createScope";
const EV_SCOPE_DESTROYED  = "tokenSimulation.simulator.destroyScope";

/* ── Gateway config helper ─────────────────────────────────────────────── */
/**
 * Apply exclusive-gateway probability configuration from the scenario to the
 * running bpmn-js simulator. We pick the outgoing sequence flow with the
 * highest configured probability and set it as activeOutgoing.
 *
 * This runs AFTER the library's own ExclusiveGatewaySettings handler (which
 * sets up defaults) because our eventBus listener is registered later.
 *
 * simulator.setConfig(element, { activeOutgoing: sequenceFlowElement }) is
 * the only gateway-configuration API the library exposes.
 */
function applyGatewayConfig(viewer, scenario) {
    try {
        const elementRegistry = viewer.get("elementRegistry");
        const simulator       = viewer.get("simulator");
        const gateways        = scenario?.parameters?.gateways || {};

        Object.entries(gateways).forEach(([gwId, cfg]) => {
            const paths = cfg?.paths;
            if (!paths?.length) return;

            const gwElement = elementRegistry.get(gwId);
            if (!gwElement) return;

            /* Select the path with the highest probability. */
            const best = paths.reduce(
                (a, b) =>
                    (parseFloat(b.probability) || 0) > (parseFloat(a.probability) || 0)
                        ? b
                        : a,
                paths[0],
            );
            if (!best?.id) return;

            const flowElement = elementRegistry.get(best.id);
            if (!flowElement) return;

            simulator.setConfig(gwElement, { activeOutgoing: flowElement });
        });
    } catch (e) {
        console.warn("[SimulationControls] applyGatewayConfig:", e);
    }
}

/* ═════════════════════════════════════════════════════════════════════════
   Component
   ═════════════════════════════════════════════════════════════════════════ */
/* Speed presets — values accepted by animation.setAnimationSpeed() */
const SPEEDS = [
    { value: 1, label: "1×", faIcon: "fa-angle-right",  title: "Normal speed (1×)"  },
    { value: 2, label: "2×", faIcon: "fa-angles-right", title: "Fast speed (2×)"     },
    { value: 4, label: "4×", faIcon: "fa-forward-fast", title: "Fastest speed (4×)"  },
];

/* ── Multi-token injection helper ──────────────────────────────────────── */
/**
 * After simulation mode is active, programmatically inject `count` process
 * instances by repeatedly triggering the none-start event subscription on the
 * root process scope.
 *
 * The library registers each none-start event as a persistent (non-interrupting)
 * subscription on the root process scope, so calling simulator.trigger() with
 * the same subscription multiple times creates multiple independent tokens.
 *
 * Tokens are injected in small batches to avoid freezing the renderer.
 */
function findNoneStartEventSub(viewer) {
    try {
        const elementRegistry = viewer.get("elementRegistry");
        const simulator       = viewer.get("simulator");

        /* Find the root process or participant element */
        let rootEl = null;
        elementRegistry.forEach(el => {
            if (!rootEl && (el.type === "bpmn:Process" || el.type === "bpmn:Participant")) {
                rootEl = el;
            }
        });
        if (!rootEl) return null;

        /* Find the first none-start event (no eventDefinitions = none type) */
        const startEvent = (rootEl.children || []).find(el =>
            el.type === "bpmn:StartEvent" &&
            !el.businessObject?.eventDefinitions?.length
        );
        if (!startEvent) return null;

        /* The library registers a persistent (interrupting:false) subscription
           on the root process scope for each start event. */
        const subs = simulator.findSubscriptions({ element: startEvent });
        return subs.length ? { simulator, sub: subs[0] } : null;
    } catch (e) {
        console.warn("[SimulationControls] findNoneStartEventSub:", e);
        return null;
    }
}

export default function SimulationControls({ viewer, scenario }) {
    const [simState,  setSimState]  = useState(S.IDLE);
    const [modeActive, setModeActive] = useState(false);
    const [speed,      setSpeed]      = useState(1);
    const scopeCountRef     = useRef(0);
    const listenersRef      = useRef([]);   /* [eventName, handler] pairs for cleanup */
    const pendingInjectRef  = useRef(0);    /* tokens to inject when mode activates   */
    const injectTimerRef    = useRef(null); /* setTimeout handle for batched injection */

    /* Cancel any in-progress token injection */
    const cancelInjection = () => {
        if (injectTimerRef.current) {
            clearTimeout(injectTimerRef.current);
            injectTimerRef.current = null;
        }
        pendingInjectRef.current = 0;
    };

    /* ── Event subscriptions — re-subscribe whenever viewer changes ────── */
    useEffect(() => {
        /* clean up previous listeners first */
        const prev = listenersRef.current;
        if (prev.length && prev._eb) {
            prev.forEach(([ev, fn]) => prev._eb.off(ev, fn));
        }
        listenersRef.current = [];

        /* reset local state */
        cancelInjection();
        setSimState(S.IDLE);
        setModeActive(false);
        scopeCountRef.current = 0;

        if (!viewer) return;

        const eventBus = viewer.get("eventBus");

        /* ── Batched token injection ──────────────────────────────────── */
        function scheduleBatch(found, remaining) {
            if (remaining <= 0) return;
            const BATCH = 5;
            injectTimerRef.current = setTimeout(() => {
                injectTimerRef.current = null;
                const n = Math.min(BATCH, remaining);
                for (let i = 0; i < n; i++) {
                    try { found.simulator.trigger({ event: found.sub.event, scope: found.sub.scope }); }
                    catch (_) { break; }
                }
                scheduleBatch(found, remaining - n);
            }, 120);
        }

        const onToggle = (event) => {
            const active = event.active;
            setModeActive(active);
            if (active) {
                /* Simulation mode enabled: apply gateway config from scenario.
                   ExclusiveGatewaySettings already ran at default priority
                   (registered at viewer creation); we override here. */
                applyGatewayConfig(viewer, scenario);
                setSimState(S.ACTIVE);

                /* Auto-inject configured number of tokens */
                const total = pendingInjectRef.current;
                pendingInjectRef.current = 0;
                if (total > 0) {
                    const found = findNoneStartEventSub(viewer);
                    if (found) {
                        /* First token immediately */
                        try { found.simulator.trigger({ event: found.sub.event, scope: found.sub.scope }); }
                        catch (_) {}
                        /* Remaining tokens in batches */
                        scheduleBatch(found, total - 1);
                    }
                }
            } else {
                /* Simulation mode disabled — cancel any pending injection */
                cancelInjection();
                scopeCountRef.current = 0;
                setSimState(S.IDLE);
                setSpeed(1);
            }
        };

        const onScopeCreate = () => {
            scopeCountRef.current += 1;
            setSimState(S.RUNNING);
        };

        const onScopeDestroyed = () => {
            scopeCountRef.current = Math.max(0, scopeCountRef.current - 1);
            if (scopeCountRef.current === 0) {
                setSimState(S.COMPLETED);
            }
        };

        const onPlay  = () => setSimState(S.RUNNING);
        const onPause = () => setSimState(S.PAUSED);
        const onReset = () => {
            cancelInjection();
            scopeCountRef.current = 0;
            setSimState(S.ACTIVE); /* mode still on, ready for new tokens */
        };

        const pairs = [
            [EV_TOGGLE_MODE,     onToggle],
            [EV_SCOPE_CREATE,    onScopeCreate],
            [EV_SCOPE_DESTROYED, onScopeDestroyed],
            [EV_PLAY,            onPlay],
            [EV_PAUSE,           onPause],
            [EV_RESET,           onReset],
        ];

        pairs.forEach(([ev, fn]) => eventBus.on(ev, fn));

        /* store with a back-reference to the eventBus for cleanup */
        listenersRef.current       = pairs;
        listenersRef.current._eb   = eventBus;

        return () => {
            cancelInjection();
            pairs.forEach(([ev, fn]) => eventBus.off(ev, fn));
            listenersRef.current = [];
        };
    }, [viewer]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Speed control ─────────────────────────────────────────────────── */
    const changeSpeed = (value) => {
        try { viewer?.get("animation").setAnimationSpeed(value); } catch (_) {}
        setSpeed(value);
    };

    /* ── Control functions (call real library service APIs) ────────────── */
    const startSimulation = () => {
        /* Record how many tokens to inject once mode is active */
        const count = parseInt(scenario?.constraints?.maxTokens, 10);
        pendingInjectRef.current = (count > 0) ? count : 1;
        viewer?.get("toggleMode").toggleMode(true);
    };
    const stopSimulation  = () => { cancelInjection(); viewer?.get("toggleMode").toggleMode(false); };
    const pauseSimulation = () => viewer?.get("pauseSimulation").pause();
    const resumeSimulation = () => viewer?.get("pauseSimulation").unpause();
    const resetSimulation = () => { cancelInjection(); viewer?.get("resetSimulation").resetSimulation(); };

    /* ── Informational constraint values from scenario ─────────────────── */
    const maxTokens    = scenario?.constraints?.maxTokens;
    const thValue      = scenario?.constraints?.timeHorizonValue;
    const thUnit       = scenario?.constraints?.timeHorizonUnit || "hours";
    const hasInfo      = !!(maxTokens || thValue);

    /* ── State meta ────────────────────────────────────────────────────── */
    const stateMeta = {
        [S.IDLE]:      { label: "Idle",       cls: "psim-sim-badge--idle",      icon: "fa-circle" },
        [S.ACTIVE]:    { label: "Active",      cls: "psim-sim-badge--active",    icon: "fa-circle-dot" },
        [S.RUNNING]:   { label: "Running",     cls: "psim-sim-badge--running",   icon: "fa-circle-play" },
        [S.PAUSED]:    { label: "Paused",      cls: "psim-sim-badge--paused",    icon: "fa-circle-pause" },
        [S.COMPLETED]: { label: "Completed",   cls: "psim-sim-badge--completed", icon: "fa-circle-check" },
    }[simState];

    const disabled = !viewer;

    return (
        <div className="psim-sim-bar">
            {/* state badge */}
            <span className={`psim-sim-badge ${stateMeta.cls}`}>
                <i className={`fa-solid ${stateMeta.icon}`} aria-hidden="true" />
                {simState === S.RUNNING && <span className="psim-sim-pulse" />}
                {stateMeta.label}
            </span>

            {/* constraint hints — informational only */}
            {hasInfo && (
                <span className="psim-sim-info">
                    {maxTokens && (
                        <span title="Max tokens (informational — not enforced by the simulator)">
                            <i className="fa-solid fa-circle-nodes" />
                            {maxTokens} tokens max
                        </span>
                    )}
                    {thValue && (
                        <span title="Time horizon (informational — not enforced by the simulator)">
                            <i className="fa-solid fa-clock" />
                            {thValue} {thUnit}
                        </span>
                    )}
                </span>
            )}

            {/* spacer */}
            <span style={{ flex: 1 }} />

            {/* speed buttons — visible only when simulation mode is on */}
            {modeActive && (
                <div className="psim-sim-speed">
                    <i className="fa-solid fa-gauge-high psim-sim-speed-icon" aria-hidden="true" />
                    {SPEEDS.map(s => (
                        <button
                            key={s.value}
                            type="button"
                            className={`psim-sim-speed-btn${speed === s.value ? " psim-sim-speed-btn--active" : ""}`}
                            title={s.title}
                            onClick={() => changeSpeed(s.value)}>
                            <i className={`fa-solid ${s.faIcon}`} aria-hidden="true" />
                        </button>
                    ))}
                </div>
            )}

            {/* buttons */}
            <div className="psim-sim-btns">

                {/* IDLE → Start */}
                {simState === S.IDLE && (
                    <button type="button"
                        className="psim-sim-btn psim-sim-btn--start"
                        disabled={disabled}
                        title="Enable token simulation mode — click a Start Event on the diagram to create a token"
                        onClick={startSimulation}>
                        <i className="fa-solid fa-play" />
                        Simulate
                    </button>
                )}

                {/* ACTIVE: only Stop — waiting for first token */}
                {simState === S.ACTIVE && (
                    <>
                        <span className="psim-sim-tip">
                            <i className="fa-solid fa-hand-pointer" />
                            Click a Start Event on the diagram
                        </span>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--stop"
                            onClick={stopSimulation}
                            title="Exit simulation mode">
                            <i className="fa-solid fa-stop" />Stop
                        </button>
                    </>
                )}

                {/* RUNNING: Pause · Reset · Stop */}
                {simState === S.RUNNING && (
                    <>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--pause"
                            onClick={pauseSimulation}
                            title="Pause token simulation">
                            <i className="fa-solid fa-pause" />Pause
                        </button>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--reset"
                            onClick={resetSimulation}
                            title="Reset — remove all tokens">
                            <i className="fa-solid fa-rotate-left" />Reset
                        </button>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--stop"
                            onClick={stopSimulation}
                            title="Exit simulation mode">
                            <i className="fa-solid fa-stop" />Stop
                        </button>
                    </>
                )}

                {/* PAUSED: Resume · Reset · Stop */}
                {simState === S.PAUSED && (
                    <>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--start"
                            onClick={resumeSimulation}
                            title="Resume token simulation">
                            <i className="fa-solid fa-play" />Resume
                        </button>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--reset"
                            onClick={resetSimulation}
                            title="Reset — remove all tokens">
                            <i className="fa-solid fa-rotate-left" />Reset
                        </button>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--stop"
                            onClick={stopSimulation}
                            title="Exit simulation mode">
                            <i className="fa-solid fa-stop" />Stop
                        </button>
                    </>
                )}

                {/* COMPLETED: Reset · Stop */}
                {simState === S.COMPLETED && (
                    <>
                        <span className="psim-sim-tip psim-sim-tip--done">
                            <i className="fa-solid fa-circle-check" />
                            All tokens completed
                        </span>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--reset"
                            onClick={resetSimulation}
                            title="Reset — start a new simulation">
                            <i className="fa-solid fa-rotate-left" />Reset
                        </button>
                        <button type="button"
                            className="psim-sim-btn psim-sim-btn--stop"
                            onClick={stopSimulation}
                            title="Exit simulation mode">
                            <i className="fa-solid fa-stop" />Stop
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}
