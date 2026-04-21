import {
  type Feature,
  FEATURES,
  FEATURES_HEADING,
  FEATURES_HIGHLIGHTS,
} from '@/constants/home/features';

import Highlight from '../shared/Highlight';

function FeatureCard({ image, imageMobile, imageAlt, title, description }: Feature) {
  return (
    <div className="relative flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex-none px-6 pt-6">
        <div className="relative aspect-video">
          <img
            src={image}
            srcSet={`${imageMobile} 480w, ${image} 700w`}
            sizes="(max-width: 768px) calc(100vw - 96px), 596px"
            width={700}
            height={394}
            alt={imageAlt}
            className="w-full h-full object-cover object-top-left"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white via-white/90 to-transparent"></div>
        </div>
      </div>
      <div className="flex-none px-6 pb-6">
        <h3 className="text-base font-medium leading-6 text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function Features() {
  const words = FEATURES_HEADING.title.split(' ');
  const highlightMap = new Map(FEATURES_HIGHLIGHTS.map((h) => [h.wordIndex, h.color]));

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 scroll-mt-20" id="features">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="flex flex-col gap-8">
          <p className="text-center text-base text-muted-foreground md:text-lg">
            {FEATURES_HEADING.label}
          </p>
          <h2 className="font-dm-sans font-medium text-4xl text-foreground tracking-tighter md:text-5xl lg:text-6xl leading-tight">
            {words.map((word, index) => {
              const color = highlightMap.get(index);
              return (
                <span key={`${word}-${index}`}>
                  {color ? <Highlight color={color}>{word}</Highlight> : word}{' '}
                </span>
              );
            })}
          </h2>
          <p className="md:text-lg max-w-2xl mx-auto">{FEATURES_HEADING.subtitle}</p>
        </div>
      </div>

      {/* Feature cards grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
