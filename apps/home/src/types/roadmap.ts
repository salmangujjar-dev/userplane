export interface RoadmapProps {
  title: string;
  description: string;
  status: 'completed' | 'inProgress' | 'notStarted' | 'planned';
  date?: string;
}
