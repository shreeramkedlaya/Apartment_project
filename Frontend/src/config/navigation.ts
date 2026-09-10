import {
  Home, User, MessageSquare, Calendar, Settings, AlertTriangle
} from 'lucide-react';
import React from 'react';

export interface SubTabConfig {
  id: string;
  label: string;
  permissionId: string;
}

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  permissionId?: string;
  subTabs?: SubTabConfig[];
}

export const NAVIGATION: TabConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    permissionId: "dashboard.view",
  },
  {
    id: "resident",
    label: "Resident Services",
    icon: User,
    subTabs: [
      { id: "profile", label: "My Profile", permissionId: "resident_services.my_profile.view" },
      { id: "vehicles", label: "Vehicles", permissionId: "resident_services.vehicles.view" },
      { id: "receipts", label: "Receipts", permissionId: "resident_services.receipts.view" },
    ]
  },
  {
    id: "helpdesk",
    label: "Helpdesk",
    icon: MessageSquare,
    subTabs: [
      { id: "requests", label: "Requests", permissionId: "helpdesk.requests.view" },
      { id: "categories", label: "Categories", permissionId: "helpdesk.categories.view" },
    ]
  },
  {
    id: "community",
    label: "Community",
    icon: Calendar,
    subTabs: [
      { id: "notices", label: "Notices", permissionId: "community.notices.view" },
      { id: "amenities", label: "Amenities", permissionId: "community.amenities.view" },
    ]
  },
  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    subTabs: [
      { id: "users", label: "Users", permissionId: "administration.users.view" },
      { id: "roles", label: "Roles", permissionId: "administration.roles.view" },
      { id: "settings", label: "Settings", permissionId: "administration.settings.view" },
    ]
  },
  {
    id: "emergency",
    label: "Emergency",
    icon: AlertTriangle,
    permissionId: "emergency.view",
  }
];
