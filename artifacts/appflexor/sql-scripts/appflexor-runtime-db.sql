-- ============================================================
-- AppFlexor Runtime Store
-- PostgreSQL
--
-- Purpose:
--   1. External task idempotency / dispatch control
--   2. Service task performance monitoring
--   3. Execution audit trail
--
-- Tenant isolation:
--   tenant_id is included in all runtime tables and keys.
-- ============================================================


-- Optional: dedicated database for AppFlexor runtime tables
CREATE DATABASE IF NOT EXISTS appflexor_runtime;


-- ============================================================
-- 1. External Task Dispatch
--
-- One row represents the lifecycle of a Camunda external task
-- as managed by AppFlexor.
--
-- Primary purpose:
--   - Idempotency
--   - Kafka dispatch state
--   - Duplicate detection
-- ============================================================

CREATE TABLE external_task_dispatch (
    tenant_id          VARCHAR(100) NOT NULL,
    external_task_id   VARCHAR(255) NOT NULL,

    status             VARCHAR(30) NOT NULL DEFAULT 'CLAIMED',

    fetched_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at       TIMESTAMPTZ,
    completed_at       TIMESTAMPTZ,

    PRIMARY KEY (tenant_id, external_task_id)
);

--Ensure you have a proper unique constraint, Without this, ON CONFLICT never triggers.
CREATE UNIQUE INDEX ON external_task_dispatch (tenant_id, external_task_id);

-- Fast lookup by task status
CREATE INDEX IF NOT EXISTS idx_dispatch_tenant_status
ON public.external_task_dispatch (
    tenant_id,
    status
);


-- Find recent tasks
CREATE INDEX IF NOT EXISTS idx_dispatch_tenant_created
ON public.external_task_dispatch (
    tenant_id,
    created_at DESC
);


-- Worker monitoring
CREATE INDEX IF NOT EXISTS idx_dispatch_worker_status
ON public.external_task_dispatch (
    tenant_id,
    worker_id,
    status
);


-- Kafka correlation
CREATE INDEX IF NOT EXISTS idx_dispatch_kafka
ON public.external_task_dispatch (
    kafka_topic,
    kafka_partition,
    kafka_offset
);


-- ============================================================
-- 2. Task Execution
--
-- One row represents one logical execution/attempt.
--
-- Purpose:
--   - Performance monitoring
--   - SLA measurement
--   - Worker performance
--   - Queue / delivery / processing latency
-- ============================================================

CREATE TABLE IF NOT EXISTS public.task_execution (
    execution_id           UUID NOT NULL DEFAULT gen_random_uuid(),

    tenant_id              UUID NOT NULL,

    external_task_id       VARCHAR(255) NOT NULL,

    process_instance_id    VARCHAR(255),
    process_definition_id  VARCHAR(255),
    process_definition_key VARCHAR(255),

    task_definition_key    VARCHAR(255),
    task_definition_name   VARCHAR(500),

    topic_name             VARCHAR(255),

    worker_id              VARCHAR(255),

    attempt_number         INTEGER NOT NULL DEFAULT 1,

    status                  VARCHAR(30) NOT NULL DEFAULT 'FETCHED',

    fetched_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at           TIMESTAMPTZ,
    received_at            TIMESTAMPTZ,
    started_at             TIMESTAMPTZ,
    completed_at           TIMESTAMPTZ,
    failed_at              TIMESTAMPTZ,

    -- Performance metrics
    queue_duration_ms      BIGINT,
    delivery_duration_ms   BIGINT,
    processing_duration_ms BIGINT,
    total_duration_ms      BIGINT,

    -- Kafka metadata
    kafka_topic            VARCHAR(255),
    kafka_partition        INTEGER,
    kafka_offset           BIGINT,

    -- Result
    result_code             VARCHAR(100),
    error_code              VARCHAR(100),
    error_message           TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (execution_id),

    CONSTRAINT chk_execution_status
        CHECK (
            status IN (
                'FETCHED',
                'PUBLISHED',
                'RECEIVED',
                'PROCESSING',
                'COMPLETED',
                'FAILED'
            )
        ),

    CONSTRAINT chk_attempt_number
        CHECK (attempt_number > 0)
);


-- Find execution history for a task
CREATE INDEX IF NOT EXISTS idx_execution_task
ON public.task_execution (
    tenant_id,
    external_task_id,
    attempt_number
);


-- Tenant performance reports
CREATE INDEX IF NOT EXISTS idx_execution_tenant_created
ON public.task_execution (
    tenant_id,
    created_at DESC
);


-- Status monitoring
CREATE INDEX IF NOT EXISTS idx_execution_tenant_status
ON public.task_execution (
    tenant_id,
    status
);


-- Worker performance
CREATE INDEX IF NOT EXISTS idx_execution_worker
ON public.task_execution (
    tenant_id,
    worker_id,
    created_at DESC
);


-- Process/task performance
CREATE INDEX IF NOT EXISTS idx_execution_task_definition
ON public.task_execution (
    tenant_id,
    task_definition_key,
    created_at DESC
);


-- ============================================================
-- 3. Task Execution Events / Audit
--
-- Append-only event history.
--
-- Purpose:
--   - Full audit trail
--   - Troubleshooting
--   - Timeline reconstruction
--   - Operational diagnostics
-- ============================================================

CREATE TABLE IF NOT EXISTS public.task_execution_event (
    event_id                BIGINT GENERATED ALWAYS AS IDENTITY,

    tenant_id               UUID NOT NULL,

    execution_id            UUID,

    external_task_id        VARCHAR(255) NOT NULL,

    process_instance_id     VARCHAR(255),

    worker_id               VARCHAR(255),

    event_type              VARCHAR(50) NOT NULL,

    event_time              TIMESTAMPTZ NOT NULL DEFAULT now(),

    kafka_topic              VARCHAR(255),
    kafka_partition          INTEGER,
    kafka_offset             BIGINT,

    attempt_number           INTEGER,

    message                 TEXT,

    error_code               VARCHAR(100),
    error_message            TEXT,

    -- Optional structured event information
    metadata                JSONB,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (event_id)
);


-- Timeline lookup
CREATE INDEX IF NOT EXISTS idx_event_task_time
ON public.task_execution_event (
    tenant_id,
    external_task_id,
    event_time
);


-- Execution timeline
CREATE INDEX IF NOT EXISTS idx_event_execution_time
ON public.task_execution_event (
    execution_id,
    event_time
);


-- Event monitoring
CREATE INDEX IF NOT EXISTS idx_event_tenant_type
ON public.task_execution_event (
    tenant_id,
    event_type,
    event_time DESC
);


-- Worker audit
CREATE INDEX IF NOT EXISTS idx_event_worker
ON public.task_execution_event (
    tenant_id,
    worker_id,
    event_time DESC
);


-- ============================================================
-- 4. Useful foreign-key relationship
--
-- Keep this optional if you want maximum write throughput.
-- ============================================================

ALTER TABLE public.task_execution_event
    DROP CONSTRAINT IF EXISTS fk_event_execution;

ALTER TABLE public.task_execution_event
    ADD CONSTRAINT fk_event_execution
    FOREIGN KEY (execution_id)
    REFERENCES public.task_execution(execution_id)
    ON DELETE SET NULL;


-- ============================================================
-- 5. Updated-at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_dispatch_updated_at
ON public.external_task_dispatch;

CREATE TRIGGER trg_dispatch_updated_at
BEFORE UPDATE ON public.external_task_dispatch
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS trg_execution_updated_at
ON public.task_execution;

CREATE TRIGGER trg_execution_updated_at
BEFORE UPDATE ON public.task_execution
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();