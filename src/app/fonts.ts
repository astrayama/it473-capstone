import { Cormorant_Garamond, Inter_Tight } from "next/font/google";

/** Display face: headlines, product names, numerals. Variable, roman + italic. */
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

/** UI and data face: navigation, forms, tables, prices (tabular numerals). Variable. */
export const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});
