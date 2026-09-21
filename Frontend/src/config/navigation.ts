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
  },
  {
    id: "resident",
    label: "Resident Services",
    icon: User,
    subTabs: [
      { id: "vehicles", label: "Vehicles", permissionId: "resident_services.vehicles.view" },
      { id: "receipts", label: "Receipts", permissionId: "resident_services.receipts.view" },
      { id: "visitors", label: "Visitors", permissionId: "resident_services.visitors.view" },
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
      { id: "notice-approvals", label: "Notice Approvals", permissionId: "community.notices.approve" },
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
    ]
  },
  {
    id: "emergency",
    label: "Emergency",
    icon: AlertTriangle,
    permissionId: "emergency.view",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  }
];
