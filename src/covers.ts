import { IMG } from "./data";

export interface CoverChoice { label: string; src: string }

/** Cover image palette offered in the Studio editor's metadata rail. */
export const COVER_CHOICES: CoverChoice[] = [
  { label: "Shirodhara", src: IMG.coverPanchakarma },
  { label: "Golden milk", src: IMG.coverGoldenMilk },
  { label: "Brahmi", src: IMG.coverBrahmi },
  { label: "Morning ritual", src: IMG.coverDinacharya },
  { label: "Triphala", src: IMG.coverTriphala },
  { label: "Kadha", src: IMG.coverKadha },
  { label: "Abhyanga oil", src: IMG.productOil },
];
