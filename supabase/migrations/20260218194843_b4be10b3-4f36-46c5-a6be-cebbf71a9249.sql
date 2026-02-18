
-- Fix 1: Restrict profiles SELECT to own profile only (admins still get data via service role in edge function)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to view all profiles (needed if any admin-side client queries exist)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Add missing DELETE policy for profiles (only admins can delete)
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Restrict vehicles SELECT to authenticated users only (already is, but tighten to require auth)
-- The current policy USING (true) allows anyone; tighten to auth.role() = 'authenticated'
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;

CREATE POLICY "Authenticated users can view vehicles"
  ON public.vehicles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Same for vehicle_expenses
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.vehicle_expenses;

CREATE POLICY "Authenticated users can view expenses"
  ON public.vehicle_expenses
  FOR SELECT
  USING (auth.role() = 'authenticated');
