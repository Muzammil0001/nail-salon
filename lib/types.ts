export interface ErrorResponse {
  message: string;
}

export interface SuccessResponse {
  message?: string;
  orders?: order[];
  languages?: language[];
  menu?: Menu;
  products?: Product[];
  uniq_products?: string[];
  order?: order;
  clientLanguages?: client_language[];
  categories?: Categories[];
  sections?: Section[];
}

export interface Section {
  id: number;
  name: string;
  is_24_hours: boolean;
  order_type: string[];
  deleted_status: boolean;
  active_status: boolean;
  location_id: number;
  client_id: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  company: Company; // Replace with the correct type for company
  location: Location; // Replace with the correct type for location
  client: User; // Replace with the correct type for client (if it's a user)
  section_custom_tax: SectionCustomTax[]; // Define the related custom tax type
  section_schedule: SectionSchedule[]; // Define the related section schedule type
  // Add other properties as needed
}

// Define the correct type for company
export interface Company {
  id: number;
  company_name: string;
  company_oib: string | null;
  country: string;
  street: string;
  vat_enabled: boolean;
}

// Define the correct type for location
export interface Location {
  id: number;
  name: string;
  country: string;
  city: string;
  postal_code: string;
}

// Define the correct type for user (client)
export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

// Define the custom tax related to a section
export interface SectionCustomTax {
  tax_name: string;
  tax_percentage: number;
}

// Define custom production units related to a section
export interface SectionCustomProductionUnit {
  name: string;
}

// Define the section schedule
export interface SectionSchedule {
  schedule_day: number;
  schedule_enabled: boolean;
  schedule_from: string; // Store time as a string (HH:MM:SS) or Date if needed
  schedule_to: string; // Store time as a string (HH:MM:SS) or Date if needed
}

// Define types for allergens
export interface AllergenLanguage {
  allergen_languages_id: number;
  client_languages_id: number;
  allergen_id: number;
  language_translation: string;
}

export interface Allergen {
  id: number;
  name: string;
  type: string | null;
  deleted: boolean | null;
  product_allergens: ProductAllergen[]; // Related product allergens
}

export interface ProductAllergen {
  id: number;
  name: string | null;
  product_id: number;
  allergen_id: number | null;
  type: string | null;
  allergens: Partial<Allergen> | null; // Allows a subset of `Allergen` properties
  allergen_languages: AllergenLanguage[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number | null;
  category_id: number;
  deleted_status: boolean;
  active_status: boolean;
  location_id: number;
  client_id: string;
  company_id: number;
  product_allergens: ProductAllergen[];
}

export interface Categories {
  id: number;
  name: string;
  section_id: number;
  deleted_status: boolean;
  active_status: boolean;
  location_id: number;
  client_id: string;
  company_id: number;
}

export interface client_language {
  id: number;
  deleted_status: boolean;
  active_status: boolean;
  language_id: number;
  client_id: string;
}

export interface language {
  id?: number;
  language_name?: string;
  language_code?: string;
  deleted_status?: Boolean;
}

export interface order {
  id?: number;
  ordered_by?: string;
  order_number?: string;
  total?: number;
  status?: string;
  order_type?: string;
  order_time?: Date;
  sector?: string;
  table?: string;
  isdeleted?: Boolean;
  items?: order_item[];
}

export interface Menu {
  id?: number;
  product_name?: string;
  category?: string;
  price?: number;
  status?: string;
}

export interface order_item {
  id: number;
  order_id: number;
  product: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Column<T> {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  render?: (row: T) => React.ReactNode;
}

export interface Device {
  location_id: string;
  device_name: string;
  devices_type: string;
  device_id: string;
  production_unit?: string;
  serial_number?: string;
  device_number?: string;
}

interface Cost {
  id: number;
  location_id: number;
  client_id: string;
  cost_type: string;
  cost_year: number;
  cost_name: string;
  deleted_status: boolean;
}