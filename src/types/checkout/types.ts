export interface IProduct {
  title: string;
  price: number;
  discount: number;
  total: number;
  salesPrice: number | undefined;
  rating: number;
  qty: number;
  photo: string;
  id: number | string;
  description: string;
  partner_id?: number | string
  affiliate?: number | string
  billingModel?: number | string
}
