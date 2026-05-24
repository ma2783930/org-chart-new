/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DepartmentGroup {
  id: string;
  name: string;
  colorTheme?: string; // Visual accent color for the group wrapper
}

export interface OrgNode {
  id: number | string;
  name: string;
  department_number?: string;
  department_group?: DepartmentGroup | null;
  children?: OrgNode[];
  
  // Custom interactive & styling attributes
  role?: string; // e.g., "مدیر کل", "معاون", "رئیس اداره"
  type?: 'general_office' | 'office' | 'department' | 'committee' | 'staff'; // for styling custom boxes
  managerName?: string; // Name of the person leading this node (e.g., "دکتر محمدی")
  managerAvatar?: string; // Avatar URL of the section's head
  employeeCount?: number; // statistic to display on the nodes
  colorAccent?: string; // custom css color or tailwind theme color
  isTemporary?: boolean; // temporary node with animated dashed border
}

export type LayoutOrientation = 'vertical' | 'horizontal' | 'compact' | 'grid' | 'left-cascade' | 'right-cascade' | 'centered-column' | 'split-columns';

export interface ChartSettings {
  orientation: LayoutOrientation;
  showAvatars: boolean;
  showRoles: boolean;
  zoom: number;
}
