
export interface ProductImage {
  id: string;
  url: string;
  name: string;
}

export type GridSlot = string | null; // ID of the product image or null

export type LayoutType = '2' | '3' | '4';

export interface LayoutStyle {
  title: string;
  details: string[];
  textSlotIndex: number;
  titleFontSize: number;
  detailsFontSize: number;
  titleX: number; // 0-100 percentage
  titleY: number; // 0-100 percentage
  detailsX: number; // 0-100 percentage
  detailsY: number; // 0-100 percentage
  titleColor: string;
  detailsColor: string;
  titleFontWeight: string;
  detailsFontWeight: string;
  topPadding: number; // Specific for 2-pack top margin
}

export interface SKUData {
  layoutType: LayoutType;
  fontFamily: string;
  customFont: string;
  styles: {
    '2': LayoutStyle;
    '3': LayoutStyle;
    '4': LayoutStyle;
  };
}
