
CREATE POLICY "Sales can update activation code"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'sales'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales'::app_role));

CREATE OR REPLACE FUNCTION public.restrict_sales_vehicle_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF has_role(auth.uid(), 'sales'::app_role) THEN
    -- Only allow changing the `code` column
    IF to_jsonb(NEW) - 'code' - 'updated_at' IS DISTINCT FROM to_jsonb(OLD) - 'code' - 'updated_at' THEN
      RAISE EXCEPTION 'Sales users can only update the activation code field';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Not authorized to update vehicles';
END;
$$;

DROP TRIGGER IF EXISTS restrict_sales_vehicle_updates_trigger ON public.vehicles;
CREATE TRIGGER restrict_sales_vehicle_updates_trigger
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.restrict_sales_vehicle_updates();
