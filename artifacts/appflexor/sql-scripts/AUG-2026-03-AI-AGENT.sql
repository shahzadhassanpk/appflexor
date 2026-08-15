-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Unified KB table with dual embeddings
CREATE TABLE kb_vectors (
    id BIGSERIAL PRIMARY KEY,
    collection TEXT NOT NULL,              -- e.g. 'dine-app'
    content_type TEXT NOT NULL,            -- e.g. 'product-feature'
    content_text TEXT NOT NULL,            -- raw text chunk
    embedding_vector_nomic VECTOR(768),    -- Ollama nomic-embed-text
    embedding_vector_openai VECTOR(1536),  -- optional external provider
    model_name TEXT NOT NULL DEFAULT 'nomic-embed-text',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for categorical filters
CREATE INDEX idx_kb_vectors_collection ON kb_vectors (collection);
CREATE INDEX idx_kb_vectors_content_type ON kb_vectors (content_type);

-- Vector indexes for similarity search
CREATE INDEX idx_kb_vectors_embedding_nomic ON kb_vectors
USING ivfflat (embedding_vector_nomic vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_kb_vectors_embedding_openai ON kb_vectors
USING ivfflat (embedding_vector_openai vector_cosine_ops)
WITH (lists = 100);

-- Optional JSONB index for metadata queries
CREATE INDEX idx_kb_vectors_metadata ON kb_vectors USING gin (metadata);


-- Table: public.app_fd_ai_agent

-- DROP TABLE IF EXISTS public.app_fd_ai_agent;

CREATE TABLE IF NOT EXISTS public.app_fd_ai_agent
(
    id uuid NOT NULL,
    createdby character varying(255) COLLATE pg_catalog."default",
    modifiedby character varying(255) COLLATE pg_catalog."default",
    datecreated timestamp without time zone,
    datemodified timestamp without time zone,
    c_business_key text COLLATE pg_catalog."default",
    c_agent_name text COLLATE pg_catalog."default",
    c_agent_key text COLLATE pg_catalog."default",
    c_ai_provider text COLLATE pg_catalog."default",
    c_system_prompt text COLLATE pg_catalog."default",
    c_default_vector_query text COLLATE pg_catalog."default",
    c_provider text COLLATE pg_catalog."default",
    c_category text COLLATE pg_catalog."default",
    CONSTRAINT app_fd_ai_agent_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.app_fd_ai_agent
    OWNER to postgres;


-- Table: public.app_fd_ai_task

-- DROP TABLE IF EXISTS public.app_fd_ai_task;
CREATE TABLE IF NOT EXISTS public.app_fd_ai_task
(
    id uuid NOT NULL,
    createdby character varying(255) COLLATE pg_catalog."default",
    modifiedby character varying(255) COLLATE pg_catalog."default",
    datecreated timestamp without time zone,
    datemodified timestamp without time zone,
    c_business_key text COLLATE pg_catalog."default",
    c_task_name text COLLATE pg_catalog."default",
    c_vector_query text COLLATE pg_catalog."default",
    c_task_key text COLLATE pg_catalog."default",
    c_sql_query text COLLATE pg_catalog."default",
    c_user_prompt text COLLATE pg_catalog."default",
    c_agent text COLLATE pg_catalog."default",
    CONSTRAINT app_fd_ai_task_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.app_fd_ai_task
    OWNER to postgres;

-- Table: public.app_fd_ai_agent_category

-- DROP TABLE IF EXISTS public.app_fd_ai_agent_category;

CREATE TABLE IF NOT EXISTS public.app_fd_ai_agent_category
(
    id uuid NOT NULL,
    createdby character varying(255) COLLATE pg_catalog."default",
    modifiedby character varying(255) COLLATE pg_catalog."default",
    datecreated timestamp without time zone,
    datemodified timestamp without time zone,
    c_business_key text COLLATE pg_catalog."default",
    c_title text COLLATE pg_catalog."default",
    c_key text COLLATE pg_catalog."default",
    CONSTRAINT app_fd_ai_agent_category_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.app_fd_ai_agent_category
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.app_fd_process_gov
(
    id character varying(255) COLLATE pg_catalog."default",
    createdby character varying(255) COLLATE pg_catalog."default",
    modifiedby character varying(255) COLLATE pg_catalog."default",
    datecreated timestamp without time zone,
    datemodified timestamp without time zone,
    c_title text COLLATE pg_catalog."default",
    c_key text COLLATE pg_catalog."default",
    c_desc text COLLATE pg_catalog."default",
    c_business_key text COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.app_fd_process_gov
    OWNER to postgres;

-- Add column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_fd_process_map'
          AND column_name = 'c_business_area'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.app_fd_process_map
        ADD COLUMN c_business_area TEXT;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_fd_process_map'
          AND column_name = 'c_process_gov'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.app_fd_process_map
        ADD COLUMN c_process_gov TEXT;
    END IF;
END$$;
