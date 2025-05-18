
import { useState } from "react";
import ProjectCard from "./ProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

// Sample project data
const projectsData = [
  {
    id: "1",
    name: "Summer Campaign",
    description: "Social media campaign for summer products",
    client: "Beachside Co.",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=Beachside",
    dueDate: "2025-06-15",
    status: "in-progress" as const,
    progress: 45,
    team: [
      { id: "u1", name: "Alex Smith", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS" },
      { id: "u2", name: "Jamie Lee", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL" },
      { id: "u3", name: "Robin Banks", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RB" },
    ],
  },
  {
    id: "2",
    name: "Product Launch Video",
    description: "Promotional video for new tech gadget",
    client: "TechGadgets Inc.",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=TechGadgets",
    dueDate: "2025-07-01",
    status: "planning" as const,
    progress: 20,
    team: [
      { id: "u2", name: "Jamie Lee", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL" },
      { id: "u4", name: "Sam Jordan", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ" },
    ],
  },
  {
    id: "3",
    name: "Brand Redesign",
    description: "Complete brand refresh for coffee chain",
    client: "Morning Brew",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=MB",
    dueDate: "2025-05-30",
    status: "review" as const,
    progress: 80,
    team: [
      { id: "u1", name: "Alex Smith", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS" },
      { id: "u3", name: "Robin Banks", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RB" },
      { id: "u5", name: "Taylor Kim", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TK" },
      { id: "u6", name: "Jordan Patel", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JP" },
    ],
  },
  {
    id: "4",
    name: "SEO Optimization",
    description: "Website SEO improvement for local business",
    client: "Hometown Bakery",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=HB",
    dueDate: "2025-05-20",
    status: "completed" as const,
    progress: 100,
    team: [
      { id: "u2", name: "Jamie Lee", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL" },
      { id: "u5", name: "Taylor Kim", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TK" },
    ],
  },
  {
    id: "5",
    name: "Email Campaign",
    description: "Seasonal email marketing series",
    client: "Fashion Forward",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=FF",
    dueDate: "2025-06-05",
    status: "in-progress" as const,
    progress: 60,
    team: [
      { id: "u1", name: "Alex Smith", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS" },
      { id: "u4", name: "Sam Jordan", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ" },
    ],
  },
];

const ProjectList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProjects = projectsData.filter((project) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No projects found matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
