
-- Add brief field to clients table
ALTER TABLE clients ADD COLUMN brief text;

-- Create project assignments table for team members/departments
CREATE TABLE project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE CASCADE,
  department text,
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid REFERENCES profiles(id),
  UNIQUE(project_id, assigned_to)
);

-- Create client comments table for client feedback
CREATE TABLE client_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  status text DEFAULT 'unread' CHECK (status IN ('read', 'unread'))
);

-- Create client access table for client portal login
CREATE TABLE client_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  UNIQUE(client_id, user_id)
);

-- Add RLS policies for project assignments
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and creators can manage project assignments" 
  ON project_assignments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'creator')
    )
  );

-- Add RLS policies for client comments
ALTER TABLE client_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and creators can view all client comments" 
  ON client_comments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'creator')
    )
  );

CREATE POLICY "Clients can view their own comments" 
  ON client_comments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM client_access ca
      JOIN clients c ON ca.client_id = c.id
      WHERE ca.user_id = auth.uid() 
      AND c.id = client_comments.client_id
      AND ca.is_active = true
    )
  );

CREATE POLICY "Clients can create comments on their projects" 
  ON client_comments 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_access ca
      JOIN clients c ON ca.client_id = c.id
      JOIN projects p ON p.client_id = c.id
      WHERE ca.user_id = auth.uid() 
      AND p.id = client_comments.project_id
      AND ca.is_active = true
    )
  );

-- Add RLS policies for client access
ALTER TABLE client_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client access" 
  ON client_access 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update projects RLS to allow clients to view their assigned projects
CREATE POLICY "Clients can view their assigned projects" 
  ON projects 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM client_access ca
      JOIN clients c ON ca.client_id = c.id
      WHERE ca.user_id = auth.uid() 
      AND c.id = projects.client_id
      AND ca.is_active = true
    )
  );

-- Add notification trigger for client comments
CREATE OR REPLACE FUNCTION notify_team_of_client_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for notification logic
  -- In a real implementation, you might insert into a notifications table
  -- or trigger an email/push notification
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_comment_notification
  AFTER INSERT ON client_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_team_of_client_comment();
