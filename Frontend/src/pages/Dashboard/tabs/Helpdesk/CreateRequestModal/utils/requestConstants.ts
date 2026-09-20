import { Droplet, Zap, Sparkles, Dumbbell, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  'Water': Droplet,
  'Power': Zap,
  'Housekeeping': Sparkles,
  'Gym': Dumbbell,
  'Pool': Waves,
};

export const GROUPED_COMMON_AREAS = [
  { group: 'Outdoor & Perimeter', items: ['Main Entrance / Security Gates', 'Visitor Parking', 'Children Play Area / Park'] },
  { group: 'Clubhouse & Amenities', items: ['Community Hall', 'Gymnasium', 'Swimming Pool Area & Deck'] },
  { group: 'Block Shared Facilities', items: ['Elevator Lobby', 'Passenger Elevators', 'Staircases', 'Corridors / Passages', 'Terrace / Rooftop'] },
  { group: 'Basement & Utilities', items: ['Basement Parking', 'DG Room & Transformer Yard', 'Pump Room & Water Sumps', 'STP Area'] },
];
