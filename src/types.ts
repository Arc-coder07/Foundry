export type WorkspaceItemType = 'Idea' | 'Research' | 'PRD' | 'Architecture' | 'Experiment' | 'Task' | 'Launch';

export type WorkspaceItemStatus = 'Captured' | 'Expanded' | 'Validated' | 'Planning' | 'Building' | 'Released' | 'Archived';

export interface TimelineEntry {
  id: string;
  version: string;
  title: string;
  date: string;
  summary: string;
}

export interface DecisionEntry {
  id: string;
  status: 'Decided' | 'Pending' | 'Rejected';
  title: string;
  content: string;
}

export interface AttachmentEntry {
  id: string;
  filename: string;       // stored filename on disk
  originalName: string;   // user-facing filename
  type: 'md' | 'pdf';
  note: string;
  uploadedAt: string;
}

export interface MoodboardCard {
  id: string;
  type: 'image' | 'note' | 'link';
  content: string;        // note text, or link URL, or empty for images
  caption: string;
  imageFilename?: string; // stored filename for uploaded images
  url?: string;           // external URL for link cards
  createdAt: string;
}

export interface WorkspaceItem {
  id: string;
  type: WorkspaceItemType;
  title: string;
  summary: string; // One sentence summary
  status: WorkspaceItemStatus;
  
  // Core structured thoughts
  problem: string;
  proposedSolution: string;
  uniqueInsight: string;
  targetAudience: string;
  validationHypothesis: string;
  mvp: string;
  longTermVision: string;
  businessModel: string;
  technicalChallenges: string;
  
  // Metadata & parameters
  provenance: string; // e.g., "OCT 12, 2023"
  source: string;     // e.g., "WHITEBOARD", "BRAINSTORM"
  confidence: string; // e.g., "85%"
  priority: 'Low' | 'Medium' | 'High';
  interestLevel: string; // e.g., "High", "9/10"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  
  // Organization & Relations
  tags: string[];
  collection: string; // e.g., "AI", "Business", "Experiments"
  pinned: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  relatedIds: string[];
  timeline: TimelineEntry[];
  decisions: DecisionEntry[];
  
  // Attachments & Moodboard
  attachments: AttachmentEntry[];
  moodboard: MoodboardCard[];
}

export interface AISuggestionResponse {
  type: 'improve' | 'audit' | 'expand';
  content: string;
}

export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
}
