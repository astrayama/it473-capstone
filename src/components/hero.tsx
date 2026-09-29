import { stagger } from "@/lib/motion";
import type { ReactNode } from "react";
import type { BrandPhoto } from "@/config/photos";
import { Photo } from "@/components/photo";

interface Props {
  photo: BrandPhoto;
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  actions: ReactNode;
  /** Short factual notes shown in a ruled row along the bottom. */
  facts?: { label: string; value: string }[];
}

/**
 * Full-bleed cinematic hero. Sits under the transparent header (pulled up by the header
 * height), photo in slow push-in with a noir vignette so the copy always reads.
 */
export function Hero({ photo, eyebrow, title, lede, actions, facts = [] }: Props) {
  return (
    <section className="relative -mt-[var(--header-h)] flex min-h-[max(40rem,100svh)] flex-col justify-end overflow-hidden">
      {/* Phones: a poster (photo on top, copy beneath). Desktop: photo on the right two-thirds. */}
      <div className="hero-media absolute inset-x-0 top-0 h-[30rem] lg:inset-0 lg:left-[24%] lg:h-auto">
        <Photo photo={photo} eager sizes="(min-width: 1024px) 76vw, 100vw" className="absolute inset-0" imgClassName="kenburns" decorative />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--bg)_0%,rgb(14_12_10/0)_55%),linear-gradient(180deg,rgb(14_12_10/0.6)_0%,rgb(14_12_10/0)_28%)] lg:hidden" />
      </div>
      <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,var(--bg)_24%,rgb(14_12_10/0.75)_34%,rgb(14_12_10/0)_56%)] lg:block" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(0deg,var(--bg)_0%,rgb(14_12_10/0.7)_12%,rgb(14_12_10/0)_30%),linear-gradient(180deg,rgb(14_12_10/0.65)_0%,rgb(14_12_10/0)_18%)] lg:block" />

      <div className="container-page relative pt-[22rem] pb-12 md:pb-16 lg:pt-[calc(var(--header-h)+4rem)]">
        <div className="max-w-3xl">
          <p className="eyebrow rise" style={stagger(0)}>{eyebrow}</p>
          <h1 className="display-xl mt-6">{title}</h1>
          <p className="lede rise mt-8 max-w-xl" style={stagger(4)}>{lede}</p>
          <div className="rise mt-10 flex flex-wrap gap-3" style={stagger(5)}>{actions}</div>
        </div>
        {facts.length > 0 && (
          <dl className="rise mt-16 grid gap-6 border-t border-line-strong pt-6 sm:grid-cols-3" style={stagger(6)}>
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-eyebrow font-medium tracking-label text-fg-3 uppercase">{f.label}</dt>
                <dd className="mt-2 text-sm text-fg-2">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
