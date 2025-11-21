import { INTEGRATION_LOGOS, SPOTLIGHT_IMAGE } from '../../constants/spotlight';

function LogoCarousel() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex animate-infinite-scroll">
        {Array.from({ length: 4 }, (_, set) => (
          <div key={set} className="flex shrink-0">
            {INTEGRATION_LOGOS.map((logo, index) => (
              <div
                key={`${set}-${index}`}
                className="w-[120px] flex items-center justify-center px-8 shrink-0"
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    width={64}
                    height={64}
                    className="max-w-16 max-h-16 w-auto h-auto opacity-40 grayscale hover:opacity-60 hover:grayscale-0 transition-all duration-300 object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Spotlight() {
  return (
    <section className="w-full pt-8 md:pt-12 pb-16 md:pb-24">
      <div className="flex flex-col items-center gap-12 md:gap-16">
        <div className="w-full px-6 md:px-12">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden">
            <img
              src={SPOTLIGHT_IMAGE.src}
              alt={SPOTLIGHT_IMAGE.alt}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
          <div className="relative overflow-hidden">
            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-white to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-white to-transparent z-10"></div>

            {/* Logo Carousel */}
            <LogoCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
