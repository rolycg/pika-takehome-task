-- Owned by the generations domain. Applied idempotently at startup.
CREATE TABLE IF NOT EXISTS generations (
    id               TEXT PRIMARY KEY,
    owner_id         TEXT NOT NULL DEFAULT 'local-user',
    prompt           TEXT NOT NULL CHECK (length(trim(prompt)) > 0),
    aspect_ratio     TEXT NOT NULL CHECK (aspect_ratio IN ('1:1', '16:9', '9:16')),
    style            TEXT NOT NULL CHECK (style IN ('Photorealistic', 'Illustration', 'Cinematic')),
    provider         TEXT NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'succeeded', 'failed')),
    version          INTEGER NOT NULL DEFAULT 1,
    attempts         INTEGER NOT NULL DEFAULT 0,
    idempotency_key  TEXT,
    asset_key        TEXT,
    error            TEXT,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    started_at       TEXT,
    completed_at     TEXT
);

-- At most one active (queued or processing) generation per owner, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS ux_generations_one_active
    ON generations (owner_id) WHERE status IN ('queued', 'processing');

-- Idempotency keys are scoped per owner. NULL keys are distinct, so requests without a key never collide.
CREATE UNIQUE INDEX IF NOT EXISTS ux_generations_owner_idempotency
    ON generations (owner_id, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_generations_owner_created
    ON generations (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_generations_status_created
    ON generations (status, created_at);
