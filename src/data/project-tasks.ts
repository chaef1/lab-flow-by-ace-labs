
import { Task } from "@/lib/project-utils";

export const projectTasks: Record<string, Record<string, Task[]>> = {
  "ace-labs-dial-direct": {
    "kick-off": [
      { 
        id: "task1", 
        title: "SCHEDULE EXTRACTION CALL/MEETING", 
        status: "completed" 
      },
      { 
        id: "task2", 
        title: "SEND FOLLOW-UP MEETING/MINUTES", 
        status: "completed" 
      },
      { 
        id: "task3", 
        title: "CREATE INTERNAL WHATSAPP GROUP", 
        status: "completed" 
      },
      { 
        id: "task4", 
        title: "CREATE PROJECT TICKET (FRESHDESK)", 
        status: "completed" 
      },
      { 
        id: "task5", 
        title: "CONFIRM DELIVERABLES WITH CLIENT", 
        status: "completed" 
      },
      { 
        id: "task6", 
        title: "ATTACH CLIENT BRIEF/PROJECT DELIVERABLES", 
        status: "completed" 
      },
      { 
        id: "task7", 
        title: "MOVE TO CONCEPTUALISATION", 
        status: "completed" 
      }
    ],
    "conceptualisation": [
      { 
        id: "task8", 
        title: "SCHEDULE TEAM STRATEGY MEETING", 
        status: "completed",
        timeTracked: 120,
        assignedTo: ["Alex Smith"]
      },
      { 
        id: "task9", 
        title: "ITEMISE CONCEPTS AS PER MEETING", 
        status: "completed",
        timeTracked: 180,
        assignedTo: ["Jamie Lee"]
      },
      { 
        id: "task10", 
        title: "UPDATE CLIENT ON PROGRESS", 
        status: "completed",
        timeTracked: 45,
        assignedTo: ["Alex Smith"]
      },
      { 
        id: "task11", 
        title: "COLLATE REFERENCE VIDEOS", 
        status: "completed",
        timeTracked: 90,
        assignedTo: ["Robin Banks"]
      },
      { 
        id: "task12", 
        title: "REFERENCE VIDEO LINKS ADDED TO COMMENTS", 
        status: "completed",
        timeTracked: 30,
        assignedTo: ["Robin Banks"]
      },
      { 
        id: "task13", 
        title: "CREATE PRESENTATION", 
        status: "in-progress",
        timeTracked: 150,
        assignedTo: ["Jamie Lee"]
      },
      { 
        id: "task14", 
        title: "SCHEDULE PRESENTATION MEETING WITH CLIENT", 
        status: "pending",
        dueDate: "2025-05-20"
      },
      { 
        id: "task15", 
        title: "CONCEPT APPROVAL", 
        status: "pending",
        dueDate: "2025-05-22"
      },
      { 
        id: "task16", 
        title: "MOVE TO PRE-PRODUCTION", 
        status: "pending"
      }
    ],
    "pre-production": [
      { 
        id: "task17", 
        title: "SCHEDULE PRE-PRODUCTION MEETING", 
        status: "pending"
      },
      { 
        id: "task18", 
        title: "ADD PRE-PRODUCTION MEETING NOTES TO COMMENTS", 
        status: "pending"
      },
      { 
        id: "task19", 
        title: "DEVELOP SCRIPTS, STORYBOARDS, SHOT LISTS, LOCATIONS, MOOD BOARDS & CALL SHEET", 
        status: "pending"
      },
      { 
        id: "task20", 
        title: "COMMUNICATE PRODUCTION TIMELINE WITH CLIENT", 
        status: "pending" 
      },
      { 
        id: "task21", 
        title: "SHARE PRODUCTION SCHEDULE WITH PRODUCTION TEAM", 
        status: "pending"
      },
      { 
        id: "task22", 
        title: "MOVE TO PRODUCTION", 
        status: "pending"
      }
    ],
    "production": [
      {
        id: "task23",
        title: "ADD PRODUCTION NOTES TO COMMENTS (IF APPLICABLE)",
        status: "pending"
      },
      {
        id: "task24",
        title: "MOVE PROJECT TO POST PRODUCTION",
        status: "pending"
      },
      {
        id: "task25",
        title: "COMMUNICATE PROGRESS ON WHATSAPP GROUP",
        status: "pending"
      },
      {
        id: "task26",
        title: "COMMUNICATE PROGRESS WITH CLIENT VIA TICKET",
        status: "pending"
      }
    ],
    "post-production": [
      {
        id: "task27",
        title: "ORGANIZE FOOTAGE",
        status: "pending"
      },
      {
        id: "task28",
        title: "FIND AUDIO",
        status: "pending"
      },
      {
        id: "task29",
        title: "COLOUR GRADING",
        status: "pending"
      },
      {
        id: "task30",
        title: "CONTENT REVIEW [ACE LABS INTERNAL]",
        status: "pending"
      },
      {
        id: "task31",
        title: "COMMUNICATE PROGRESS WITH CLIENT",
        status: "pending"
      },
      {
        id: "task32",
        title: "UPLOAD CONTENT TO GOOGLE DRIVE",
        status: "pending"
      },
      {
        id: "task33",
        title: "SHARE CONTENT WITH CLIENT FOR REVIEW",
        status: "pending"
      }
    ],
    "submission": [
      {
        id: "task34",
        title: "CONTENT SUBMISSION VIA GOOGLE DRIVE",
        status: "pending"
      },
      {
        id: "task35",
        title: "CHANGES (MAX 2 ROUNDS) - ADD CHANGES TO COMMENTS & CONFIRM VIA TICKET",
        status: "pending"
      },
      {
        id: "task36",
        title: "ADD CLIENT NOTES TO TICKET AND CONFIRM ALL IN ORDER",
        status: "pending"
      },
      {
        id: "task37",
        title: "CONTENT RE-SUBMISSION",
        status: "pending"
      },
      {
        id: "task38",
        title: "CONTENT APPROVED",
        status: "pending"
      },
      {
        id: "task39",
        title: "MOVE TO COMPLETED",
        status: "pending"
      }
    ]
  },
  "summer-campaign": {
    "kick-off": [
      { 
        id: "task40", 
        title: "INITIAL MEETING WITH CLIENT", 
        status: "completed",
        timeTracked: 90
      },
      { 
        id: "task41", 
        title: "CREATE PROJECT BRIEF", 
        status: "completed",
        timeTracked: 150
      }
    ],
    "pre-production": [
      { 
        id: "task42", 
        title: "DEVELOP CONCEPTS FOR SUMMER CAMPAIGN", 
        status: "completed",
        timeTracked: 240,
        assignedTo: ["Jamie Lee"]
      },
      { 
        id: "task43", 
        title: "SCOUT LOCATIONS FOR PHOTOSHOOT", 
        status: "in-progress",
        timeTracked: 180,
        assignedTo: ["Sam Jordan"]
      },
      { 
        id: "task44", 
        title: "SECURE TALENT FOR CAMPAIGN", 
        status: "pending",
        dueDate: "2025-05-25"
      }
    ]
  }
};
