export interface Section {
  id: string;
  name: string;
  is_24_hours: boolean;
  order_type: string[];
  deleted_status: boolean;
  active_status: boolean;
  background_color: string;
  text_color: string;
  location_id: string;
  client_id: string;
  company_id: string;
  created_at: Date;
  updated_at?: Date;
  categories: Category[];
  section_tax: SectionTax[];
  section_languages: SectionCategoryLanguage[];
}
export interface SectionCategoryLanguage {
  client_languages_id: string;
  language_translation: string;
}
export interface Category {
  id: string;
  name: string;
  is_24_hours: boolean;
  order_type: string[];
  image: string;
  combo_enabled: string;
  section_id: string;
  deleted_status: boolean;
  active_status: boolean;
  background_color: string;
  text_color: string;
  location_id: string;
  client_id: string;
  company_id: string;
  created_at: Date;
  updated_at?: Date;
  products: Product[];
  category_tax: CategoryTax[];
  category_languages: SectionCategoryLanguage[];
}

export interface Product {
  id: string;
  name: string;
  image: string;
  video?: string;
  descrition: string;
  enable_special_notes: boolean;
  is_24_hours: boolean;
  order_type: string[];
  price: number;
  description: string;
  category_id: string;
  section_id: string;
  deleted_status: boolean;
  active_status: boolean;
  background_color: string;
  text_color: string;
  location_id: string;
  client_id: string;
  company_id: string;
  bonus_enabled: boolean;
  add_to_items: boolean;
  sold_out: boolean;
  bonus_percentage: number;
  created_at: Date;
  updated_at?: Date;
  section: Section;
  categories: Category;
  product_modifiers: ProductModifiers[];
  product_tax: ProductTax[];
  product_languages: ProductLanguage[];
  schedule_enabled: boolean;
}
export interface ProductLanguage {
  client_languages_id: string;
  name_translation: string;
  description_translation: string;
}

export interface ProductModifiers {
  id: string;
  name: string;
  modifier_required: boolean;
  modifier_multiselect: boolean;
  product_id: string;
  admin_modifier_id?: number;
  is_admin_modifier: boolean;
  modifier_options: ModifierOptions[];
  modifier_languages: SectionCategoryLanguage[];
}

export interface ModifierOptions {
  id: string;
  name: string;
  option_price: number;
  option_default: boolean;
  modifier_id: string;
  option_sort: number;
  modifier_option_tax: ProductModifierTax[];
  modifier_option_languages: SectionCategoryLanguage[];
}
export interface SectionTax {
  id: string;
  section_id: string;
  tax_id: string;
  tax: Tax;
}
export interface CategoryTax {
  id: string;
  category_id: string;
  tax_id: string;
  tax: Tax;
}
export interface ProductTax {
  id: string;
  product_id: string;
  tax_id: string;
  tax: Tax;
}
export interface ProductModifierTax {
  id: string;
  modifier_option_id: string;
  tax_id: string;
  tax: Tax;
}

export interface Tax {
  id: string;
  tax_type: string;
  tax_name: string;
  tax_percentage: number;
  category_tax: CategoryTax[];
  section_tax: SectionTax[];
  product_tax: ProductTax[];
  modifier_option_tax: ProductModifierTax[];
}

export interface SelectedModifiers {
  modifier_id: string;
  selected_options: string[];
}
export const getProductPrices = (
  product: Product,
  quantity: number,
  selectedModifiers: SelectedModifiers[]
) => {
  let totalTax = 0;
  let modifiersPrice = 0;
  const taxes: any = [];
  const modifierTaxes: any = [];
  getUniqueTaxes(product).map((tax) => {
    taxes.push({
      ...tax,
      tax_price: ((product.price * tax.tax_percentage) / 100) * quantity,
    });
  });

  selectedModifiers.map((sm) => {
    const modifier = product.product_modifiers.find(
      (pm) => pm.id === sm.modifier_id
    );
    modifier?.modifier_options.map((o) => {
      if (sm.selected_options.includes(o.id)) {
        const { price, modifierTaxes: taxes } = getModifierPrice(
          modifier,
          o,
          product,
          quantity
        );
        modifiersPrice += parseFloat(price);
        modifierTaxes.push(...taxes);
      }
    });
  });
  const combinedModifierTaxes: any = [];
  for (const tax of [...modifierTaxes, ...taxes]) {
    if (!combinedModifierTaxes.some((t: Tax) => t.id === tax.id)) {
      combinedModifierTaxes.push(tax);
    } else {
      const index = combinedModifierTaxes.findIndex(
        (t: Tax) => t.id === tax.id
      );
      combinedModifierTaxes[index].tax_price += tax.tax_price;
    }
  }
  totalTax = combinedModifierTaxes.reduce(
    (acc: any, tax: any) => acc + tax.tax_price,
    0
  );
  return {
    priceWithTax: parseFloat(
      (product.price * quantity + totalTax + modifiersPrice).toFixed(2)
    ),
    price: parseFloat((product.price * quantity + modifiersPrice).toFixed(2)),
    taxes: combinedModifierTaxes,
    totalTax: parseFloat(totalTax.toFixed(2)),
  };
};

export const getModifierPrice = (
  modifier: ProductModifiers,
  selctedOption: ModifierOptions,
  product: Product,
  quantity: number
) => {
  let totalTax = 0;
  const modifierTaxes: any = [];
  selctedOption.modifier_option_tax
    .map((t) => t.tax)
    .filter((t) => getUniqueTaxes(product).some((tax) => tax.id !== t.id))
    .map((tax) => {
      totalTax +=
        ((selctedOption.option_price * tax.tax_percentage) / 100) * quantity;
      modifierTaxes.push({
        ...tax,
        tax_price:
          ((selctedOption.option_price * tax.tax_percentage) / 100) * quantity,
      });
    });
  getUniqueTaxes(product)
    .filter((tax) => modifierTaxes.some((t: Tax) => tax.id !== t.id))
    .map((tax) => {
      totalTax += (selctedOption.option_price * tax.tax_percentage) / 100;
      modifierTaxes.push({
        ...tax,
        tax_price: (selctedOption.option_price * tax.tax_percentage) / 100,
      });
    });

  return {
    price: (selctedOption.option_price * quantity).toFixed(2),
    priceWithTax: (selctedOption.option_price * quantity + totalTax).toFixed(2),
    modifierTaxes,
    totalTax: totalTax.toFixed(2),
  };
};

const getUniqueTaxes = (product: Product) => {
  const allSCPTaxes = [
    ...product.section.section_tax.map((t) => t.tax),
    ...product.categories.category_tax.map((t) => t.tax),
    ...product.product_tax.map((t) => t.tax),
  ];
  const uniqueTaxesMap = new Map();
  allSCPTaxes.forEach((tax) => {
    uniqueTaxesMap.set(tax.id, tax);
  });
  return Array.from(uniqueTaxesMap.values());
};
