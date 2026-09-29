import type { ReactNode } from "react";
import { photos } from "@/config/photos";
import { Photo } from "@/components/photo";
import { CrestMark } from "@/components/brand/crest";

/** Two-panel frame for sign-in and applications: photograph + quote on the left, form on the right. */
export function AuthSplit({ eyebrow, title, intro, children, wide = false }: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="grid min-h-[calc(100dvh-var(--header-h))] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="relative hidden overflow-hidden lg:block">
        <Photo photo={photos.chef} decorative sizes="45vw" className="absolute inset-0" imgClassName="kenburns" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(14_12_10/0.9)_0%,rgb(14_12_10/0.1)_60%)]" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <CrestMark className="size-12 text-accent-ink" />
          <p className="display-s mt-6 max-w-sm italic">For kitchens that notice the difference.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-16 sm:px-10">
        <div className={`rise-group w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display-m mt-4">{title}</h1>
          {intro && <div className="mt-4 text-fg-2">{intro}</div>}
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
