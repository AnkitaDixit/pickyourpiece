export interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  currency: "INR";
  category: "Ring";
  metal: string;
  gemstone: string[];
  occasion: string[];
  style: string[];
  gender: "Women" | "Men" | "Unisex";
  image: string;
  allImages?: string[] | string;
  productUrl: string;
  availability: boolean;
  updatedAt: string;
  purity?: string;
  metalColor?: string;
  diamondCarat?: string;
  diamondQuality?: string;
  style_brand?: string[];
  occasion_brand?: string[];
  ocassion_brand?: string[];
  styleOccasion?: string[];
}
