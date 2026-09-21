export type ProjectRecord = {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'planning' | 'on_hold' | 'complete';
  summary: string;
  members: string[];
};

export const PROJECT_CATALOG: Record<string, ProjectRecord> = {
  'alpha-tower': {
    id: 'alpha-tower',
    name: 'Alpha Tower',
    code: 'AT-101',
    status: 'active',
    summary: 'Core commercial tower rebuild and tenant-fit out coordination.',
    members: ['Alicia Stone', 'Marcus Hall', 'Jenna Patel']
  },
  'northline-logistics': {
    id: 'northline-logistics',
    name: 'Northline Logistics',
    code: 'NL-220',
    status: 'planning',
    summary: 'Regional distribution center expansion and staging plan.',
    members: ['Nia Brooks', 'Rafael Chen']
  },
  'harbor-suites': {
    id: 'harbor-suites',
    name: 'Harbor Suites',
    code: 'HS-310',
    status: 'on_hold',
    summary: 'Hotel conversion and waterfront amenities rework.',
    members: ['Priya Shah', 'Omar Grant', 'Leah Flores']
  }
};

export function getProjectList() {
  return Object.values(PROJECT_CATALOG).map((project) => ({
    ...project,
    statusLabel: project.status.replace('_', ' ')
  }));
}

export function getProjectById(projectId: string) {
  return PROJECT_CATALOG[projectId] ?? null;
}
