
-- First, let's drop all existing RLS policies on the profiles table to clear the recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create simple, non-recursive RLS policies for profiles
CREATE POLICY "Enable read access for own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Also fix any potential issues with project_assignments table
DROP POLICY IF EXISTS "Users can view project assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Users can manage project assignments" ON public.project_assignments;

CREATE POLICY "Enable read access for project assignments" ON public.project_assignments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for project assignments" ON public.project_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for project assignments" ON public.project_assignments
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for project assignments" ON public.project_assignments
    FOR DELETE USING (true);

ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
