export interface IssueCategoryObj {
  id: number;
  name: string;
  is_active: boolean;
  description?: string;
}

export type RequestCategory = string | number;
export type RequestPriority = 'Low' | 'Medium' | 'High';
export type RequestStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

// Backward compatibility aliases
export type IssueCategory = RequestCategory;
export type IssuePriority = RequestPriority;
export type IssueStatus = RequestStatus;

export interface RequestTimelineEntry {
  id: string | number;
  status_from: RequestStatus | null;
  status_to: RequestStatus | null;
  comment: string | null;
  proof_metadata_url: string | null;
  created_at: string;
  updated_by?: {
    id: string | number;
    name: string;
  } | null;
}

export interface HelpdeskRequest {
  id: string | number;
  title: string;
  description: string;
  category: RequestCategory;
  category_name?: string;
  is_flat_specific: boolean;
  flat_number?: string;
  mobile_number: string;
  priority: RequestPriority;
  status: RequestStatus;
  created_at: string;
  created_by?: {
    id: string | number;
    name: string;
  };
  assigned_to?: {
    id: string | number;
    name: string;
  };
  resolution_notes?: string;
  timeline?: RequestTimelineEntry[];
}

export type HelpdeskIssue = HelpdeskRequest;

// Mock Data
export const MOCK_ISSUES: HelpdeskIssue[] = [
  {
    id: 'ISS-1001',
    title: 'No water in master bathroom',
    description: 'The tap in the master bathroom has stopped giving water since this morning. Please fix it ASAP.',
    category: 'Water',
    is_flat_specific: true,
    flat_number: 'B-402',
    mobile_number: '9876543210',
    priority: 'High',
    status: 'Open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    created_by: { id: 'u1', name: 'John Doe' },
  },
  {
    id: 'ISS-1002',
    title: 'Treadmill #2 is making noise',
    description: 'The second treadmill from the left is making a very loud screeching noise when running over 8kmph.',
    category: 'Gym',
    is_flat_specific: false,
    mobile_number: '9876543210',
    priority: 'Medium',
    status: 'In Progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    created_by: { id: 'u1', name: 'John Doe' },
    assigned_to: { id: 's1', name: 'Mike (Maintenance)' },
  },
  {
    id: 'ISS-1003',
    title: 'Corridor lights flickering',
    description: 'The lights outside flat A-101 are flickering continuously.',
    category: 'Power',
    is_flat_specific: false,
    mobile_number: '9998887776',
    priority: 'Low',
    status: 'Resolved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    created_by: { id: 'u2', name: 'Alice Smith' },
    assigned_to: { id: 's2', name: 'Electrician Ram' },
    resolution_notes: 'Replaced the faulty LED driver.',
  },
];
