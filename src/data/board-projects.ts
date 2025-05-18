
import { BoardProject } from "@/lib/project-utils";

export const boardProjects: BoardProject[] = [
  {
    id: "ace-labs-dial-direct",
    name: "ACE LABS X DIAL DIRECT X HERO 2.0",
    description: "Creative social media campaign focused on humorous content for insurance promotion.",
    client: "Dial Direct",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=DD",
    status: "conceptualisation",
    dueDate: "2025-06-15",
    progress: 45,
    team: [
      { id: "u1", name: "Alex Smith", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS" },
      { id: "u2", name: "Jamie Lee", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL" },
      { id: "u3", name: "Robin Banks", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RB" },
    ],
    campaignFocus: "The goal is to create humorous, engaging, and memorable content across multiple channels while integrating effective lead-generation mechanics.",
    productFocus: "Comprehensive Car Insurance, Home Contents, and Portable Possessions Insurance.",
    primaryChannels: ["TikTok", "Meta", "YouTube", "Radio"],
    objectives: [
      "Lead Generation: The content will direct users to take action and explore the brand's offerings.",
      "Brand Love: Increase the brand's follower base through humor and relatable messaging."
    ],
    documents: [
      {
        id: "doc1",
        name: "Concept & Pitch: DIALDIRECT HERO 2.0",
        url: "#",
        type: "document"
      },
      {
        id: "doc2",
        name: "Campaign Tracker: DIAL DIRECT HERO2.0 CAMPAIGN TIMELINE",
        url: "#",
        type: "spreadsheet"
      }
    ],
    customFields: {
      "SHOOT DATE": "May 25, 2025"
    }
  },
  {
    id: "summer-campaign",
    name: "Summer Social Media Campaign",
    description: "Social media campaign for summer products targeting young adults.",
    client: "Beachside Co.",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=BC",
    status: "pre-production",
    dueDate: "2025-06-22",
    progress: 35,
    team: [
      { id: "u2", name: "Jamie Lee", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL" },
      { id: "u4", name: "Sam Jordan", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ" },
    ],
    primaryChannels: ["Instagram", "TikTok"],
    objectives: [
      "Increase summer product sales by 30%",
      "Grow social media following by 15%"
    ]
  },
  {
    id: "product-launch",
    name: "Product Launch Video",
    description: "Promotional video series for new tech gadget lineup.",
    client: "TechGadgets Inc.",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=TG",
    status: "production",
    dueDate: "2025-07-05",
    progress: 60,
    team: [
      { id: "u1", name: "Alex Smith", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS" },
      { id: "u3", name: "Robin Banks", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RB" },
      { id: "u5", name: "Taylor Kim", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TK" },
    ],
    primaryChannels: ["YouTube", "Website"]
  },
  {
    id: "brand-redesign",
    name: "Brand Redesign",
    description: "Complete brand refresh for coffee chain including logo, packaging and store design.",
    client: "Morning Brew",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=MB",
    status: "post-production",
    dueDate: "2025-05-30",
    progress: 85,
    team: [
      { id: "u1", name: "Alex Smith", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS" },
      { id: "u6", name: "Jordan Patel", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JP" },
    ],
    primaryChannels: ["Print", "Store", "Digital"]
  },
  {
    id: "email-campaign",
    name: "Email Campaign",
    description: "Seasonal email marketing series with personalized content.",
    client: "Fashion Forward",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=FF",
    status: "submission",
    dueDate: "2025-05-28",
    progress: 95,
    team: [
      { id: "u2", name: "Jamie Lee", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=JL" },
      { id: "u4", name: "Sam Jordan", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ" },
    ],
    primaryChannels: ["Email", "Social"]
  },
  {
    id: "seo-optimization",
    name: "SEO Optimization",
    description: "Website SEO improvement for local business to improve rankings and traffic.",
    client: "Hometown Bakery",
    clientAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=HB",
    status: "completed",
    dueDate: "2025-05-15",
    progress: 100,
    team: [
      { id: "u4", name: "Sam Jordan", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ" },
      { id: "u5", name: "Taylor Kim", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TK" },
    ],
    primaryChannels: ["Search", "Website"]
  }
];
