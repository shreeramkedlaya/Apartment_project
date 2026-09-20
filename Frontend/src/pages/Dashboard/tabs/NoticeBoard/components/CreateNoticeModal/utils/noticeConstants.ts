import type { Step } from '../types/noticeForm.types';

export const NOTICE_CATEGORIES = [
  'General', 'Water', 'Electricity', 'Maintenance', 
  'Security', 'Facility', 'Finance', 'Community', 
  'Emergency', 'Event'
];

export const NOTICE_PRIORITIES = ['Low', 'Medium', 'Critical'] as const;

export const AUDIENCE_TYPES = [
  { id: 'everyone', title: 'Everyone', desc: 'Broadcast to all active members' },
  { id: 'roles', title: 'Specific Roles', desc: 'Target specific staff or resident roles' },
  { id: 'blocks', title: 'Blocks / Flats', desc: 'Target specific buildings or apartments' }
] as const;

export const MODAL_STEPS: Step[] = [
  { id: 1, title: 'Content' },
  { id: 2, title: 'Audience' },
  { id: 3, title: 'Scheduling' }
];
