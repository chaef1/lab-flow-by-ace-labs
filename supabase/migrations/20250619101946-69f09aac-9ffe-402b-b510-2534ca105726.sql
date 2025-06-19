
-- Add foreign key constraints for proper relationships
ALTER TABLE client_comments 
ADD CONSTRAINT fk_client_comments_created_by 
FOREIGN KEY (created_by) REFERENCES profiles(id);

ALTER TABLE project_assignments 
ADD CONSTRAINT fk_project_assignments_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES profiles(id);

ALTER TABLE project_assignments 
ADD CONSTRAINT fk_project_assignments_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES profiles(id);

-- Add foreign key constraint for influencers to profiles
ALTER TABLE influencers 
ADD CONSTRAINT fk_influencers_profile 
FOREIGN KEY (id) REFERENCES profiles(id);
