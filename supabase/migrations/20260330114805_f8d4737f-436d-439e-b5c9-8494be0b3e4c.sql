ALTER TABLE public.vehicles ALTER COLUMN original_hand TYPE text USING original_hand::text;
ALTER TABLE public.vehicles ALTER COLUMN current_hand TYPE text USING current_hand::text;