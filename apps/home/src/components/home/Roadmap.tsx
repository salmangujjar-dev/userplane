export interface RoadmapProps {
  title: string;
  description: string;
  status: 'completed' | 'inProgress' | 'notStarted' | 'planned';
  date?: string;
}

interface RoadmapComponentProps {
  items: RoadmapProps[];
}

const RoadmapComponent = ({ items }: RoadmapComponentProps) => {
  const getStatusBadge = (status: RoadmapProps['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Completed
          </span>
        );
      case 'inProgress':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            In Progress
          </span>
        );
      case 'notStarted':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Not Started
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Planned
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-left">
      <div className="flex flex-col gap-6">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 py-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(item.status)}
                <h3 className="font-medium text-lg">{item.title}</h3>
              </div>
              {item.date && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {item.date}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export { RoadmapComponent };
