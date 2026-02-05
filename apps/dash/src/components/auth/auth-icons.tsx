import Image from 'next/image';

import { mediaClient } from '@/lib/media';

export function AuthIcons() {
  return (
    <>
      <div className="absolute left-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src={mediaClient.tiles.get('bubble')}
          alt=""
          width={80}
          height={80}
          unoptimized
          className="absolute top-[18%] -left-6 rotate-[-15deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('fin')}
          alt=""
          width={90}
          height={90}
          unoptimized
          className="absolute top-[38%] -left-8 rotate-12 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('letterbox')}
          alt=""
          width={85}
          height={85}
          unoptimized
          className="absolute top-[58%] -left-7 rotate-[-8deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('paperplane')}
          alt=""
          width={75}
          height={75}
          unoptimized
          className="absolute top-[78%] -left-5 rotate-18 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      <div className="absolute right-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src={mediaClient.tiles.get('intercom')}
          alt=""
          width={85}
          height={85}
          unoptimized
          className="absolute top-[17%] -right-7 rotate-10 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('browsercursor')}
          alt=""
          width={75}
          height={75}
          unoptimized
          className="absolute top-[38%] -right-5 rotate-[-14deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('magf')}
          alt=""
          width={80}
          height={80}
          unoptimized
          className="absolute top-[59%] -right-6 rotate-[-10deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('documentation')}
          alt=""
          width={85}
          height={85}
          unoptimized
          className="absolute top-[80%] -right-7 rotate-13 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 w-full h-32 block lg:hidden">
        <Image
          src={mediaClient.tiles.get('bubble')}
          alt=""
          width={70}
          height={70}
          unoptimized
          className="absolute bottom-[-20px] left-[10%] rotate-[-15deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('intercom')}
          alt=""
          width={75}
          height={75}
          unoptimized
          className="absolute bottom-[-25px] left-[32%] rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('fin')}
          alt=""
          width={70}
          height={70}
          unoptimized
          className="absolute bottom-[-22px] left-[54%] rotate-[-8deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.tiles.get('pointer')}
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
