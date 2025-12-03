import { useState } from 'react';
import { ChevronRight, Play, BugPlay, SquareTerminal, Puzzle } from 'lucide-react';
import {
  FEATURES,
  FEATURES_HEADING,
  FEATURES_HIGHLIGHTS,
  type Feature,
} from '@/constants/v2/features';
import Highlight from '../Highlight';

const iconMap = {
  Play,
  BugPlay,
  SquareTerminal,
  Puzzle,
};

interface FeatureItemProps extends Feature {
  isActive: boolean;
  onClick: () => void;
}

function FeatureItem({ title, description, icon, isActive, onClick }: FeatureItemProps) {
  const IconComponent = iconMap[icon as keyof typeof iconMap];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left py-8 px-6 rounded-xl transition-all cursor-pointer ${
        isActive ? 'bg-zinc-100' : 'hover:bg-zinc-50'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        {IconComponent && (
          <IconComponent
            className={`w-5 h-5 transition-colors ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`}
          />
        )}
        <h3
          className={`text-xl font-semibold transition-colors ${
            isActive ? 'text-zinc-900' : 'text-zinc-600'
          }`}
        >
          {title}
        </h3>
      </div>
      {isActive && (
        <>
          <p className="text-sm leading-relaxed text-zinc-700 mb-4">{description}</p>
          <div className="flex items-center gap-1 text-sm font-medium text-zinc-900">
            Explore <ChevronRight className="w-4 h-4" />
          </div>
        </>
      )}
    </button>
  );
}

export default function Features() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeFeature = FEATURES[activeIndex];

  const words = FEATURES_HEADING.title.split(' ');
  const highlightMap = new Map(FEATURES_HIGHLIGHTS.map((h) => [h.wordIndex, h.color]));

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 scroll-mt-20" id="features">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="flex flex-col gap-6">
          <h2 className="font-dm-sans font-medium text-4xl text-foreground tracking-tighter md:text-5xl lg:text-6xl leading-tight">
            {words.map((word, index) => {
              const color = highlightMap.get(index);
              return (
                <span key={index}>
                  {color ? <Highlight color={color}>{word}</Highlight> : word}{' '}
                </span>
              );
            })}
          </h2>
          <p className="md:text-lg max-w-2xl mx-auto">{FEATURES_HEADING.subtitle}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left side - Clickable feature list */}
          <div className="flex flex-col">
            {FEATURES.map((feature, index) => (
              <FeatureItem
                key={index}
                {...feature}
                isActive={activeIndex === index}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          {/* Right side - Single image that changes */}
          <div className="sticky top-24">
            <img
              src={activeFeature?.image}
              alt={activeFeature?.imageAlt}
              className="w-full h-auto transition-opacity duration-300"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
