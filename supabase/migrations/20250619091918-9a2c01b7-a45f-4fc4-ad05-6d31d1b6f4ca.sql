
-- Add RLS policies for projects table
CREATE POLICY "Users can view all projects" 
  ON public.projects 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update projects" 
  ON public.projects 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete projects" 
  ON public.projects 
  FOR DELETE 
  USING (auth.role() = 'authenticated');
