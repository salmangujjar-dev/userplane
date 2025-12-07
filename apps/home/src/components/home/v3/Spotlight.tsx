import { SPOTLIGHT_IMAGE } from '@/constants/v3/spotlight';

export default function Spotlight() {
  return (
    <section className="w-full pt-8 md:pt-12 pb-16 md:pb-24">
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
    </section>
  );
}
