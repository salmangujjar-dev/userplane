import Image from 'next/image';

export function AuthIcons() {
  return (
    <>
      <div className="absolute left-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src="/auth/zendesk.png"
          alt=""
          width={80}
          height={80}
          className="absolute top-[18%] -left-6 rotate-[-15deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/hiver.png"
          alt=""
          width={90}
          height={90}
          className="absolute top-[32%] -left-8 rotate-12 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/linear.png"
          alt=""
          width={85}
          height={85}
          className="absolute top-[48%] -left-7 rotate-[-8deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/pylon.png"
          alt=""
          width={75}
          height={75}
          className="absolute top-[64%] -left-5 rotate-18 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/freshdesk.png"
          alt=""
          width={80}
          height={80}
          className="absolute top-[78%] -left-6 -rotate-12 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      <div className="absolute right-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src="/auth/slack.png"
          alt=""
          width={85}
          height={85}
          className="absolute top-[17%] -right-7 rotate-10 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/intercom.png"
          alt=""
          width={75}
          height={75}
          className="absolute top-[33%] -right-5 rotate-[-14deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/helpscout.png"
          alt=""
          width={80}
          height={80}
          className="absolute top-[50%] -right-6 rotate-[-10deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/discord.png"
          alt=""
          width={85}
          height={85}
          className="absolute top-[67%] -right-7 rotate-13 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/happyfox.png"
          alt=""
          width={75}
          height={75}
          className="absolute top-[83%] -right-5 rotate-[-16deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 w-full h-32 block lg:hidden">
        <Image
          src="/auth/slack.png"
          alt=""
          width={70}
          height={70}
          className="absolute bottom-[-20px] left-[10%] rotate-[-15deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/intercom.png"
          alt=""
          width={75}
          height={75}
          className="absolute bottom-[-25px] left-[32%] rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/zendesk.png"
          alt=""
          width={70}
          height={70}
          className="absolute bottom-[-22px] left-[54%] rotate-[-8deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src="/auth/discord.png"
          alt=""
          width={65}
          height={65}
          className="absolute bottom-[-20px] left-[76%] -rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
      </div>
    </>
  );
}
