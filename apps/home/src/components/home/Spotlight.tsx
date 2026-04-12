import { useState } from 'react';

import { SPOTLIGHT_IMAGE, SPOTLIGHT_VIDEO } from '@/constants/home/spotlight';

export default function Spotlight() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="w-full pt-8 md:pt-12 pb-16 md:pb-24">
      <div className="w-full px-6 md:px-12">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
          {playing ? (
            <iframe
              src={SPOTLIGHT_VIDEO.src}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={SPOTLIGHT_VIDEO.title}
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="relative w-full h-full cursor-pointer group"
            >
              <img
                src={SPOTLIGHT_IMAGE.src}
                srcSet={SPOTLIGHT_IMAGE.srcSet}
                sizes={SPOTLIGHT_IMAGE.sizes}
                width={SPOTLIGHT_IMAGE.width}
                height={SPOTLIGHT_IMAGE.height}
                alt={SPOTLIGHT_IMAGE.alt}
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center justify-center w-20 h-20 md:w-28 md:h-28 rounded-full bg-white shadow-2xl transition-transform group-hover:scale-110">
                  <svg
                    className="w-9 h-9 md:w-12 md:h-12 text-gray-900 ml-1"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
