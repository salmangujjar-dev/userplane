import Image from 'next/image';

import { mediaClient } from '@/lib/media';

export function AuthIcons() {
  return (
    <>
      <div className="absolute left-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/bubble.png')}
          alt=""
          width={80}
          height={80}
          unoptimized
          className="absolute top-[18%] -left-6 rotate-[-15deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/fin.png')}
          alt=""
          width={90}
          height={90}
          unoptimized
          className="absolute top-[38%] -left-8 rotate-12 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/letterbox.png')}
          alt=""
          width={85}
          height={85}
          unoptimized
          className="absolute top-[58%] -left-7 rotate-[-8deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/paperplane.png')}
          alt=""
          width={75}
          height={75}
          unoptimized
          className="absolute top-[78%] -left-5 rotate-18 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      <div className="absolute right-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/intercom.png')}
          alt=""
          width={85}
          height={85}
          unoptimized
          className="absolute top-[17%] -right-7 rotate-10 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/browsercursor.png')}
          alt=""
          width={75}
          height={75}
          unoptimized
          className="absolute top-[38%] -right-5 rotate-[-14deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/magf.png')}
          alt=""
          width={80}
          height={80}
          unoptimized
          className="absolute top-[59%] -right-6 rotate-[-10deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/documentation.png')}
          alt=""
          width={85}
          height={85}
          unoptimized
          className="absolute top-[80%] -right-7 rotate-13 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 w-full h-32 block lg:hidden">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/bubble.png')}
          alt=""
          width={70}
          height={70}
          unoptimized
          className="absolute bottom-[-20px] left-[10%] rotate-[-15deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/intercom.png')}
          alt=""
          width={75}
          height={75}
          unoptimized
          className="absolute bottom-[-25px] left-[32%] rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/fin.png')}
          alt=""
          width={70}
          height={70}
          unoptimized
          className="absolute bottom-[-22px] left-[54%] rotate-[-8deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/pointer.png')}
          alt=""
          width={65}
          height={65}
          unoptimized
          className="absolute bottom-[-20px] left-[76%] -rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
      </div>
    </>
  );
}
