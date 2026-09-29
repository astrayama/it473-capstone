/**
 * Brand photography (Unsplash License), committed under public/brand/photos/.
 * Art direction: single-source light, deep shadow, warm grade. See CREDITS.md there.
 * Product photos are separate: they come from the media bucket (see lib/media.ts).
 */
export interface BrandPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
  photographer: string;
  profileUrl: string;
  sourceUrl: string;
  /** CSS object-position, to keep the subject clear of overlaid text. */
  position?: string;
}

export const photos = {
  hero: {
    src: "/brand/photos/hero.jpg",
    width: 2400,
    height: 1654,
    alt: "Autumn vegetables heaped on a dark table: squash, cabbage, carrots, beets and tomatoes",
    photographer: "Sharon Pittaway",
    profileUrl: "https://unsplash.com/@sharonp",
    sourceUrl: "https://unsplash.com/photos/KUZnfk-2DSQ",
    position: "55% 75%",
  },
  produce: {
    src: "/brand/photos/produce.jpg",
    width: 1600,
    height: 1067,
    alt: "Vine tomatoes glowing red against a dark background",
    photographer: "Christina Rumpf",
    profileUrl: "https://unsplash.com/@rumpf",
    sourceUrl: "https://unsplash.com/photos/dBm8NKNVX_k",
  },
  dairy: {
    src: "/brand/photos/dairy.jpg",
    width: 1600,
    height: 1073,
    alt: "Wheels and wedges of cheese on a candlelit table",
    photographer: "olimpia campean",
    profileUrl: "https://unsplash.com/@olimpiaborodiunsplash",
    sourceUrl: "https://unsplash.com/photos/To4qNTlmjWw",
  },
  bakery: {
    src: "/brand/photos/bakery.jpg",
    width: 1600,
    height: 1040,
    alt: "A crusty loaf of bread on a wooden board in low light",
    photographer: "Robert Stump",
    profileUrl: "https://unsplash.com/@stumpie10",
    sourceUrl: "https://unsplash.com/photos/DNqwLdfo0b8",
  },
  pantry: {
    src: "/brand/photos/pantry.jpg",
    width: 1600,
    height: 1143,
    alt: "Flour, dried wheat and fresh pasta on a dark table",
    photographer: "Mae Mu",
    profileUrl: "https://unsplash.com/@picoftasty",
    sourceUrl: "https://unsplash.com/photos/Z1_f9NCYnMs",
  },
  delivery: {
    src: "/brand/photos/delivery.jpg",
    width: 2400,
    height: 1594,
    alt: "A truck on an open highway at dusk",
    photographer: "Natalia Marcelewicz",
    profileUrl: "https://unsplash.com/@nataliila",
    sourceUrl: "https://unsplash.com/photos/CtFk1YWtbyw",
  },
  chef: {
    src: "/brand/photos/chef.jpg",
    width: 1600,
    height: 1067,
    alt: "A chef plating a dish with tweezers in a dark kitchen",
    photographer: "Sebastian Coman",
    profileUrl: "https://unsplash.com/@sebastiancoman",
    sourceUrl: "https://unsplash.com/photos/cQbOSRpElxw",
  },
} satisfies Record<string, BrandPhoto>;

const CATEGORY_COVERS: Record<string, BrandPhoto> = {
  produce: photos.produce,
  dairy: photos.dairy,
  bakery: photos.bakery,
};

/** Cover photo for a Firestore category id; categories added later get the pantry cover. */
export function categoryCover(categoryId: string): BrandPhoto {
  return CATEGORY_COVERS[categoryId] ?? photos.pantry;
}

export const photoCredits: BrandPhoto[] = Object.values(photos);
