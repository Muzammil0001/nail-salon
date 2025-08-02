export interface NavitemsType {
  [x: string]: any;
  id?: number|string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: NavitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
}
