-- What an analyses row holds: a vehicle analysis (the homepage photo flow)
-- or a part identification (/part-identifier). Existing rows are vehicles.
-- For part rows, result_data holds the part identification and
-- detected_products stays null.

ALTER TABLE public.analyses
    ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'vehicle';

ALTER TABLE public.analyses
    DROP CONSTRAINT IF EXISTS analyses_kind_check;

ALTER TABLE public.analyses
    ADD CONSTRAINT analyses_kind_check CHECK (kind IN ('vehicle', 'part'));
