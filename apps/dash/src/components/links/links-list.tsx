import { LinkPreview } from './link-preview';

interface LinksListProps {
  count?: number;
  linkIds?: string[];
}

const SAMPLE_DATA = [
  {
    title: 'Customer Demo Recording',
    createdBy: 'Sarah Wilson',
    createdAt: new Date(Date.now() - 1 * 86400000),
    projectName: 'Project 1',
    isReusable: true,
  },
  {
    title: 'Bug Report - Login Issue',
    createdBy: 'Michael Chen',
    createdAt: new Date(Date.now() - 3 * 86400000),
    projectName: 'Project 2',
    isReusable: false,
  },
  {
    title: 'Onboarding Flow Testing',
    createdBy: 'Emma Rodriguez',
    createdAt: new Date(Date.now() - 5 * 86400000),
    projectName: 'Project 1',
    isReusable: true,
  },
  {
    title: 'Feature Walkthrough - Dashboard',
    createdBy: 'James Park',
    createdAt: new Date(Date.now() - 7 * 86400000),
    projectName: 'Project 3',
    isReusable: false,
  },
  {
    title: 'Team Standup Meeting',
    createdBy: 'Olivia Brown',
    createdAt: new Date(Date.now() - 14 * 86400000),
    projectName: 'Project 2',
    isReusable: true,
  },
];

export function LinksList({ count = 5, linkIds }: LinksListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {[...Array(count)].map((_, i) => {
        const data = SAMPLE_DATA[i % SAMPLE_DATA.length];
        if (!data) return null;
        return (
          <LinkPreview
            key={i}
            linkId={linkIds?.[i] || `link-${i + 1}`}
            title={data.title}
            createdBy={data.createdBy}
            createdAt={data.createdAt}
            projectName={data.projectName}
            isReusable={data.isReusable}
          />
        );
      })}
    </div>
  );
}
