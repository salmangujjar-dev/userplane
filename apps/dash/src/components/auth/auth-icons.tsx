import Image from 'next/image';

import { mediaClient } from '@/lib/media';

export function AuthIcons() {
  return (
    <>
      <div className="absolute left-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/bubble.webp')}
          alt=""
          width={80}
          height={80}
          className="absolute top-[18%] -left-6 rotate-[-15deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/fin.webp')}
          alt=""
          width={90}
          height={90}
          className="absolute top-[38%] -left-8 rotate-12 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/letterbox.webp')}
          alt=""
          width={85}
          height={85}
          className="absolute top-[58%] -left-7 rotate-[-8deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/paperplane.webp')}
          alt=""
          width={75}
          height={75}
          className="absolute top-[78%] -left-5 rotate-18 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      <div className="absolute right-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/intercom.webp')}
          alt=""
          width={85}
          height={85}
          className="absolute top-[17%] -right-7 rotate-10 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/browsercursor.webp')}
          alt=""
          width={75}
          height={75}
          className="absolute top-[38%] -right-5 rotate-[-14deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/magf.webp')}
          alt=""
          width={80}
          height={80}
          className="absolute top-[59%] -right-6 rotate-[-10deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/documentation.webp')}
          alt=""
          width={85}
          height={85}
          className="absolute top-[80%] -right-7 rotate-13 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 w-full h-32 block lg:hidden">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/bubble.webp')}
          alt=""
          width={70}
          height={70}
          className="absolute bottom-[-20px] left-[10%] rotate-[-15deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/intercom.webp')}
          alt=""
          width={75}
          height={75}
          className="absolute bottom-[-25px] left-[32%] rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/fin.webp')}
          alt=""
          width={70}
          height={70}
          className="absolute bottom-[-22px] left-[54%] rotate-[-8deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/pointer.webp')}
          alt=""
          width={65}
          height={65}
          className="absolute bottom-[-20px] left-[76%] -rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
      </div>
    </>
  );
}
