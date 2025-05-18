
import Dashboard from "@/components/layout/Dashboard";
import ProjectList from "@/components/projects/ProjectList";

const Projects = () => {
  return (
    <Dashboard title="Projects" subtitle="Manage and track all your agency projects">
      <ProjectList />
    </Dashboard>
  );
};

export default Projects;
