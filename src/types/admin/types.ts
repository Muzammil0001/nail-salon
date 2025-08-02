import { SelectedModifiers } from "../../../lib/priceHelpers";

export interface chartData {
  dataX: Array<string>;
  dataY: Array<number>;
}

export interface PerformerData {
  merchant_id: number;
  store_id: number;
  merchant_name: string;
  order_total: number;
}

export interface RenderTree {
  id: string;
  name: string;
  type: string;
  children?: RenderTree[];
}

export interface Reservation {
  table_id: number;
  reservation_pax: number;
  reservation_id: number;
  store_id: number;
  name: string;
  customer_name: string;
  customer_id: number;
  table_number: string;
  reservation_status: string;
  table_description: string;
  reservation_date: Date;
  reservation_comment: string;
  reservation_created_at: Date;
  customer: Customer[];
  store: Store[];
  table: Tables[];
}

export interface Tables {
  table_id: number;
  store_id: number;
  name: string;
  table_number: string;
  table_description: string | null;
  table_created_at: Date;
  table_seating_cap: number | null;
  tbl_reservations: Reservation[];
  tbl_tables_status?: any[];
  tbl_stores: Store;
}

export interface TableForm {
  table_id: number | null;
  store_id: number;
  store_name: string;
  table_number: string;
  table_description?: string | null;
  table_created_at: Date;
  table_trash?: string | null;
  table_combined_list: number[];
  table_count?: number;
  table_parent_id?: number | null;
  table_sub_table?: boolean | null;
  user_id: string[];
  table_seating_cap?: number | null;
  table_og_number: string;
  table_show?: boolean | null;
  table_show_admin?: boolean | null;
  table_has_sub_tables?: string | "";
  tbl_reservations: Reservation[];
  tbl_sub_tables: any[];
}

export interface tbl_sub_tables {
  sub_table_id: number;
  table_id: number;
  sub_table_name: string;
  sub_table_capacity: number;
}

export interface Allergens {
  id: any;
  product_id: number;
  allergen_id: number;
  name: string;
  type: string;
  selected: boolean;
}

export interface AppVersion {
  app_version_id: number;
  app_version_type?: string | null;
  app_version_number?: string | null;
  app_version_build_number?: string | null;
  app_version_datetime?: Date | null;
  app_version_optional?: boolean | null;
  app_version_live?: boolean | null;
  app_version_trash?: boolean | null;
}

export interface TopSellingData {
  product_id: number;
  product_name: string;
  product_name_es: string;
  product_quantity: number;
}

export interface CategorySchedule {
  category_schedule_id: number;
  category_id: number;
  category_schedule_day: number;
  category_schedule_from: string;
  category_schedule_to: string;
  category_schedule_enabled: string;
  category_schedule_nextday: string;
  category_schedule_show_remove: boolean;
  category_schedule_updated_at: Date;
}

export interface CouponSchedule {
  coupon_schedule_id: number;
  coupon_id: number;
  coupon_schedule_day: number;
  coupon_schedule_from: string;
  coupon_schedule_to: string;
  coupon_schedule_enabled: string;
  coupon_schedule_nextday: string;
  coupon_schedule_show_remove: boolean;
  coupon_schedule_updated_at: Date;
}

export interface Product {
  extension: string;
  videoExtension: string;
  image: string;
  product_id: number;
  product_name: string;
  product_name_es?: string;
  product_show: string;
  user_id: number | undefined;
  merchant_id: any;
  store_id: number[];
  category_id: number;
  category_name: string;
  product_description: string;
  product_description_es?: string;
  product_print_preference?: string;
  product_price?: number;
  product_bonus_percentage?: number;
  product_image?: string;
  product_sort?: number;
  product_notes_enabled?: string;
  product_loyalty_enabled?: string;
  product_delivery_enabled?: boolean;
  product_pickup_enabled?: boolean;
  product_dinein_enabled?: boolean;
  product_loyalty_price?: number;
  product_created_at: Date;
  product_created_by?: number;
  product_updated_at?: Date;
  product_updated_by?: number;
  product_overage_enabled?: string;
  product_popular_enabled?: string;
  product_bonus_enabled?: boolean;
  product_tax_inclusive: string;
  product_trash?: string;
  product_selected: boolean;
  product_modifiers: Modifier[];
  product_price_striked?: number;
  media?: string;
  category: any;
  order_no?: number;
  tbl_categories?: any;
  tbl_product_taxes: ProductTaxes[];
  tbl_product_allergens: Allergens[];
  tbl_order_details: any[];
  tbl_product_recipe: ProductRecipe[];
  typeofImageUpload?: string;
  subdomain?: string;
}

export interface ProductRecipe {
  product_recipe_id: number;
  product_id: number;
  item_id: number;
  item_name: string;
  item_consumption_unit_type: string;
  item_quantity: number;
  unit_id: number;
  tbl_units: Unit;
}

export interface OrderData {
  order_id: number;
  store_id: number;
  name: string;
  order_check_number: number;
  product_quantity: number;
  product_price: number;
  order_total: number;
  table_number: string;
  customer_name: string;
  store_order_type: string;
  order_trash: string;
  order_status: string;
  order_created_at: string;
  merchant_id: number;
  customer_firstname: string;
  customer_lastname: string;
  customer_id: number;
}

export interface ProductStatistics {
  products_units: number;
  product_sales: number;
  product_store_name: string;
  product_store_unit: number;
  product_orders: number;
}

export interface CouponStatistic {
  coupon_redemptions: number;
  coupon_unique_redemptions: number;
  coupon_total_sales: number;
  coupon_total_orders: number;
}

export interface Employee {
  user_id: number | null | undefined;
  emp_id: number;
  emp_token: string;
  emp_name: string;
  store_id: number | null | undefined;
  reseller_id: number | null;
  merchant_id: number | null;
  emp_type: string;
  emp_role: string;
  manager_id: number;
  emp_username: string;
  emp_password: string;
  emp_confirm_password: string;
  emp_image: string;
  emp_email: string;
  emp_dob: Date;
  emp_phone: string;
  emp_sms_enabled: string;
  emp_email_enabled: string;
  emp_send_email: string;
  emp_main: string;
  emp_pin: string;
  emp_created_at: Date;
  emp_created_by: number;
  emp_updated_at: Date;
  emp_updated_by: number;
  emp_deleted: string;
  email: string;
  image: string;
  deleted: boolean;
}

export interface Log {
  log_id: number;
  user_id: string;
  log_description: string;
  log_created_at: Date;
  user: User;
  log_type: number;
}

export interface User {
  email: string;
  confirm_email?: string;
  username: string;
  password: string;
  display_color:string;
  confirm_password?: string;
  image?: string;
  location_id?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  days: Days[];
  client_language_id?: string;
}

interface Days {
  timeSlots: any;
  id: string;
  name: string;
}

export interface user_otp {
  id: number;
  createdAt: Date;
  expired: boolean;
  usedAt: Date;
  merchant_id: number;
  password: string;
  usedFor: string;
}

export interface Languages {
  language_id: string;
  language_name: string;
  language_trash: boolean;
}

export interface ClientLanguages {
  client_languages_id: number;
  merchant_id: number;
  language_id: string;
  client_languages_applied: boolean;
  language_name: string;
  tbl_languages: Languages;
  restaurantId: number;
}

export interface TranslationSubItem {
  languageID: string;
  language_translation: string;
}

export interface TranslationItem {
  itemID: number;
  itemType: string;
  itemName: string;
  itemLanguageID: number | null;
  itemNameValue: string;
  itemDescValue: string;
  itemNameLanguages: TranslationSubItem[];
  itemDesc: string;
  itemNo?: number;
  itemCreatedAt?: Date;
  itemApplied?: boolean;
  itemDescLanguages: TranslationSubItem[];
  itemModifiers: TranslationItem[];
  itemOptions: TranslationItem[];
  itemAllergens: TranslationItem[];
}

export interface Translation {
  products: TranslationItem[];
  sections: TranslationItem[];
  categories: TranslationItem[];
  applied: boolean;
  language_id: string;
  language_from?: string;
  restaurantId: number | undefined | null;
  allergens: TranslationItem[];
}

export interface Supplier {
  supplier_id: number;
  merchant_id: number;
  supplier_name: string;
  supplier_email: string;
  supplier_code: string;
  supplier_phone: string;
  supplier_address: string;
  supplier_unique_id: number;
  supplier_oib: string;
  supplier_contact_person: string;
  supplier_street: string;
  supplier_city: string;
  supplier_zipcode: string;
  supplier_web: string;
  supplier_accountant_email: string;
  supplier_accountant_phone: string;
  supplier_created_at?: Date | null;
  supplier_trash: string;
  latitude?: string;
  longitude?: string;
  supplier_state: string;
  supplier_country: string;
}

export interface Unit {
  unit_id: number;
  unit_name: string;
  unit_type: string;
  unit_trash: string;
}

export interface Item {
  item_id: number;
  supplier_id: number[];
  supplier_id_new: number | null;
  merchant_id?: number | null;
  store_id?: number | null;
  item_section_id?: number | null;
  item_category_id?: number | null;
  item_sub_category_id?: number | null;
  item_name: string;
  item_supplier_name: string;
  item_manufacturer: string;
  item_price_package: number;
  item_quantity?: number;
  item_recieved_quantity?: number;
  item_price_per_unit: number;
  item_barcode: string;
  item_last_price: number;
  item_supplier_code: string;
  item_internal_code: string;
  item_unique_id: number;
  unit_id: number;
  ullage_percentage: number;
  breakage_percentage: number;
  spillage_percentage: number;
  item_consumption_unit_type: string;
  item_existing_quantity: number;
  item_existing_change: boolean;
  item_consumption_unit_id: number;
  item_conversion: number;
  package_conversion: number;
  item_minimum_quantity: number;
  item_minimum_quantity_order_percentage: number;
  item_created_at?: Date | null;
  item_active: boolean;
  tbl_store_items: StoreItems[];
  tbl_items_spent: any[];
  item_trash: string;
  tbl_units: any | null;
}

export interface InventoryReportItems {
  inventory_report_item_id: number;
  inventory_report_id: number;
  item_id: number;
  item_unit: string;
  item_stock_quantity: number;
  item_inventory_stock_changed: boolean;
  item_stock_price: number;
  item_stock_value: number;
  item_inventory_quantity: number;
  item_inventory_value: number;
  item_surplus: number;
  item_deficit: number;
  tbl_items: any; // Assuming TblItems is another interface you have defined
}

export interface InventoryReport {
  inventory_report_id: number;
  store_id: number | undefined;
  inventory_report_document: string;
  inventory_report_base64: string;
  inventory_report_status: string;
  inventory_report_created_at: Date;
  inventory_report_approved_by: string;
  inventory_report_approved_at: Date | null;
  tbl_inventory_report_items: InventoryReportItems[];
  tbl_stores: any;
}

export interface SpillageReportItems {
  spillage_section_name: string;
  spillage_category_name: string;
  spillage_sub_category_name: string;
  spillage_report_item_id: number;
  spillage_report_id: number;
  item_name: string;
  item_id: number;
  item_internal_code: string;
  item_unit: string;
  item_stock_quantity: number;
  item_spillage_stock_changed: boolean;
  item_stock_price: number;
  item_stock_value: number;
  item_inventory_quantity: number;
  item_consumption: number;
  item_spillage: number;
  item_inventory_value: number;

  tbl_items: any; // Assuming TblItems is another interface you have defined
}

export interface SpillageReport {
  spillage_report_id: number;
  store_id: number | undefined;
  spillage_report_document: string;
  spillage_report_base64: string;
  spillage_report_status: string;
  spillage_report_created_at: Date;
  spillage_report_approved_by: string;
  spillage_report_approved_at: Date | null;
  tbl_spillage_report_items: SpillageReportItems[];
  tbl_stores: any;
}

export interface StoreItems {
  store_item_id: number;
  store_id: number;
  item_quantity_change: boolean;
  item_id: number;
  store_name: string;
  item_quantity: number;
}

export interface Purchase {
  purchase_id: number;
  purchase_number: number;
  purchase_type?: string;
  restaurant_id: number;
  supplier_name: string;
  supplier_id: number;
  restaurant_name: string;
  purchase_items: number;
  purchase_status: string;
  purchase_warehouse_receipt_no: string;
  purchase_no: string;
  purchase_storage_unit: string;
  purchase_warehouse_receipt_number: number;

  purchase_delivery_date: Date;
  purchase_delivery_no: string;
  purchase_delivery_receipt: boolean;
  purchase_delivery_receipt_by: string;
  purchase_delivery_receipt_by_id: string;
  purchase_invoice_date: Date;
  purchase_invoice_no: string;
  purchase_invoice: boolean;
  purchase_invoice_by: string;
  purchase_invoice_by_id: string;
  purchase_warehouse_receipt_by?: string;
  purchase_warehouse_receipt_by_id?: string;
  purchase_created_at: Date;
  tbl_suppliers: Supplier;
  Restaurants: Restaurants;
  tbl_purchase_items: PurchaseItems[];
  tbl_purchase_receipts?: tbl_purchase_receipts[];
  purchase_trash: string;
}

export interface tbl_purchase_receipts {
  purchase_receipt_id: number;
  purchase_id: number;
  purchase_warehouse_receipt: string;
  purchase_delivery_receipt: string;
  purchase_invoice: string;
}

export interface PurchaseItems {
  purchase_item_id: number;
  purchase_id: number;
  item_id: number;
  item_name: number;
  item_quantity: number;
  tbl_store_items: StoreItems[];
  item_received_quantity: number;
  item_minimum_quantity: number;
  item_price_package: number;
  item_price_per_unit?: number;
  item_minimum_quantity_order_percentage: number;
  item_status: string;
  unit_id: number;
  tbl_units: Unit;
}

export interface Restaurants {
  check: string;
  id: number;
  unique_id: number;
  store_business_unit: string;
  store_cash_register: string;
  name: string;
  description?: string | null;
  tax_rate?: number | null;
  profile_pic?: string | null;
  address: string;
  latitude?: string | null;
  longitude?: string | null;
  post_code: string;
  city: string;
  state: string;
  country: string;
  subdomain: string;
  reg_no: string;
  licence_no: string;
  licence_doc: string;
  url?: string | null;
  deleted_status: boolean;
  active_status: boolean;
  approved_status: string;
  serviceable_distance?: string | null;
  payment_status: boolean;
  store_welcome_msg: "";
  store_welcome_sub_text: "";
  payment_gateway_username: string;
  payment_gateway_password: string;
  payment_gateway_merchant_id: string;
  about_us?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deleted_at?: Date | null;
  app_status: boolean;
  store_theme?: string;
  store_24_hours: string;
  store_cod_enabled: boolean;
  store_card_enabled: boolean;
  subscriptionId: number;
  subscription_start_date: Date;
  menuPdf?: string | null;

  store_call_waiter_green_time?: number;
  store_call_waiter_red_time?: number;
  store_call_waiter_yellow_time?: number;
  store_preparing_green_time?: number;
  store_preparing_red_time?: number;
  store_preparing_yellow_time?: number;
  store_waiting_green_time?: number;
  store_waiting_red_time?: number;
  store_waiting_yellow_time?: number;
  store_ready_green_time?: number;
  store_ready_red_time?: number;
  store_ready_yellow_time?: number;

  image: string;
  pdf?: string;
  extension: string;
  store_number?: number | null;
  merchant_id: number;
  copy_menu_from: number;

  store_desc?: string | null;
  store_default_tip1?: number | null;
  store_default_tip2?: number | null;
  store_default_tip3?: number | null;

  store_tagline?: string;
  store_title?: string;
  store_sub_title?: string;

  store_bg: string;
  store_bg_color: string;
  store_text_color: string;

  store_default_nca?: number | null;
  store_nca_name?: string | null;
  store_nca_amount_flag?: string | null;
  store_loyalty_enabled?: string | null;
  store_loyalty_amount?: number | null;
  store_loyalty_expire_days?: number | null;
  store_phone?: string | null;
  store_phone_twilio?: string | null;
  store_timezone?: string | null;
  store_tip_enabled?: string | null;
  store_tax_enabled?: string | null;
  store_nca_enabled?: string | null;
  store_new_order_sound_enabled?: string | null;
  store_new_order_sound?: string | null;
  store_printer_mac?: string | null;
  store_printer_enabled: string;
  store_tip_percentage_enabled: string;
  store_gateway?: string | null;
  store_primary_color?: string | null;
  store_secondary_color?: string | null;
  store_button_color?: string | null;
  store_call_waiter_btn_color?: string | null;
  store_section_bg_color?: string;
  store_product_bg_color?: string;
  store_header_1?: string | null;
  store_header_2?: string | null;
  store_header_3?: string | null;
  store_header_4?: string | null;
  store_header_5?: string | null;
  store_footer_1?: string | null;
  store_footer_2?: string | null;
  store_footer_3?: string | null;
  store_footer_4?: string | null;
  store_footer_5?: string | null;
  store_order_type: string;
  store_order_pickup: false;
  store_order_delivery: false;
  store_order_dinein: false;
  store_order_reservation: false;
  store_delivery_fee?: number | null;
  store_delivery_fee_percentage: string;
  store_pickup_time?: string | null;
  store_delivery_time?: string | null;
  store_weekly_order?: string | null;
  store_preorder_days?: number | null;
  store_preorder_hours?: number | null;
  store_tos?: string | null;
  store_privacy_policy?: string | null;
  store_refund_policy?: string | null;
  store_language?: string | null;
  store_last_printer_call?: Date | null;
  store_last_print?: Date | null;
  store_trash?: string | null;
  store_table_reservation_time?: number | null;
  user_id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  password?: string;
  mobile: string;
  confirmPassword?: string;
  roleId?: any;
  sendEmail: string;
  store_taxes: Taxes[];
  store_schedule: Schedule[];
  store_printers: Printer[];
  licence: string | "";
  licenceExtension: string | "";
  payment_enable?: boolean;
}

export interface AccessRights {
  analytics_view: boolean;
  fiscalisation_view: boolean;
  fiscalisation_create: boolean;
  fiscalisation_actions: boolean;
  cost_view: boolean;
  cost_create: boolean;
  cost_actions: boolean;
  dashboard_view: boolean;
  deivces_view: boolean;
  devices_create: boolean;
  devices_actions: boolean;
  inventories_view: boolean;
  invoices_view: boolean;
  item_categories_view: boolean;
  item_categories_create: boolean;
  item_categories_actions: boolean;
  item_sections_view: boolean;
  item_sections_create: boolean;
  item_sections_actions: boolean;
  item_subcategories_view: boolean;
  item_subcategories_create: boolean;
  item_subcategories_actions: boolean;
  items_view: boolean;
  items_create: boolean;
  items_actions: boolean;
  purchases_view: boolean;
  purchases_create: boolean;
  purchases_actions: boolean;
  receipts_view: boolean;
  receipts_create: boolean;
  receipts_actions: boolean;
  restaurants_view: boolean;
  restaurants_create: boolean;
  restaurants_actions: boolean;
  sold_products_view: boolean;
  spend_ingredients_view: boolean;
  spent_ingredients_view: boolean;
  spillagereport_view: boolean;
  spillagereport_edit: boolean;
  spillagereport_create: boolean;
  stock_report_view: boolean;
  stock_report_edit: boolean;
  stock_report_create: boolean;
  suppliers_view: boolean;
  suppliers_create: boolean;
  suppliers_actions: boolean;
  tax_management_view: boolean;
  tax_management_create: boolean;
  tax_management_actions: boolean;
  service_management_view: boolean;
  service_management_create: boolean;
  taxes_view: boolean;
  transactions_view: boolean;
  service_management_add: boolean;
  service_management_edit: boolean;
  service_request_view: boolean;
  service_request_done: boolean;
  plans_view: boolean;
  plan_upgrade: boolean;
  reports_view: boolean;
  orders_view: boolean;
  order_actions: boolean;
  sections_view: boolean;
  sections_create: boolean;
  sections_actions: boolean;
  categories_view: boolean;
  category_add: boolean;
  category_edit: boolean;
  products_view: boolean;
  product_add: boolean;
  product_edit: boolean;
  coupons_view: boolean;
  coupon_add: boolean;
  coupon_edit: boolean;
  tables_view: boolean;
  table_add: boolean;
  table_edit: boolean;
  reservations_view: boolean;
  reservation_actions: boolean;
  order_by_table: boolean;
  order_by_person: boolean;
  print_invoice: boolean;
  payment_by_cash: boolean;
  payment_by_card: boolean;
  scan_qr_code: boolean;
  view_sales_analytics: boolean;
  profile: boolean;
  reverse_invoice: boolean;
  remove_products: boolean;
  make_reservation: boolean;
  customers_view: boolean;
}

export interface Printer {
  printer_id: number;
  printer_name: string;
  printer_serial: string;
  printer_type: string;
  restaurant_id: number;
  printer_enabled: boolean;
}

export interface Device {
  deviceId: number;
  device: string;
  deviceName: string;
  deviceNo: string;
  restaurant?: Restaurants;
  store_id: number;
}

export interface Company {
  id?: number;
  company_name: string;
  company_oib?: string;
  country: string;
  street: string;
  city: string;
  postcode: string;
  state?: string;
  email?: string;
  phone?: string;
  company_currency?: string;
  vat_enabled: boolean;
  send_email: boolean;
  subscription_id: number | null;
  billing_model: "MONTHLY" | "YEARLY";
  user: User;
  fiscal_certificates: fiscal_certificates;
}

export interface User {
  id?: number;
  email: string;
  username: string;
  password: string;
  phone?: string;
  first_name: string;
  last_name: string;
  pin?: string;
  country?: string;
  street?: string;
  city?: string;
  postcode?: string;
  state?: string;
  personal_identification_no?: string;
  roles: string[];
  accessrights: AccessRights2;
  waiter_accessrights: WaiterAccessRights;
}

export interface WaiterAccessRights {
  order_by_table: boolean;
  order_by_person: boolean;
  print_invoice: boolean;
  payment_by_cash: boolean;
  payment_by_card: boolean;
  scan_qr_code: boolean;
  view_sales_analytics: boolean;
  profile: boolean;
  reverse_invoice: boolean;
  remove_products: boolean;
  make_reservation: boolean;
  waiter_nav_menu: boolean;
  waiter_nav_takeaway: boolean;
  waiter_nav_delivery: boolean;
  waiter_nav_reservations: boolean;
  waiter_nav_sales_report: boolean;
  waiter_nav_profit_loss: boolean;
  waiter_nav_cancelled_orders: boolean;
  waiter_nav_activity_log: boolean;
  waiter_nav_support: boolean;
  waiter_nav_stock_management: boolean;
  waiter_nav_Settings: boolean;
  mainpos_nav_tables: boolean;
  mainpos_nav_open_table: boolean;
  mainpos_nav_invoices: boolean;
  mainpos_nav_reservations: boolean;
  mainpos_nav_analytics: boolean;
  mainpos_nav_table_layout: boolean;
  mainpos_nav_profile: boolean;
  mainpos_nav_support: boolean;
}
export interface AccessRights2 {
  links: Links[];
  companies: AccessCompany[];
  locations: AccessLocation[];
}

export interface AccessCompany {
  company_id: string;
  company_name: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}
export interface Links {
  name: string;
  items: LinkItems[];
}

export interface LinkItems {
  title: string;
  href: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface AccessLocation {
  location_id?: number;
  company_id: number;
  location_name: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface fiscal_certificates {
  certificate_name?: string;
  password?: string;
  base64?: string;
}
export interface CardDetails {
  checkoutAttemptId: string;
  encryptedCardNumber: string;
  encryptedExpiryMonth: string;
  encryptedExpiryYear: string;
  encryptedSecurityCode: string;
  type: string;
  holderName: string;
}

export interface FormBillingPaymentInfoValues {
  paymentType: string;
  cardDetails?: CardDetails;
}

export interface Store {
  image: string;
  extension: string;
  store_id: number;
  user_id: any;
  store_number: number | null;
  merchant_id: number;
  store_name: string | null;
  store_desc: string | null;
  store_default_tip1: number | null;
  store_default_tip2: number | null;
  store_default_tip3: number | null;
  store_default_nca: number | null;
  store_nca_name: string | null;
  store_nca_amount_flag: string | null;
  store_loyalty_enabled: string | null;
  store_loyalty_amount: number | null;
  store_loyalty_expire_days: number | null;
  store_logo: string | null;
  store_address: string | null;
  store_city: string | null;
  store_state: string | null;
  store_zip: string | null;
  store_phone: string | null;
  store_phone_twilio: string | null;
  store_timezone: string | null;
  store_trash: string | null;
  store_tip_enabled: string | null;
  store_tax_enabled: string | null;
  store_nca_enabled: string | null;
  store_new_order_sound_enabled: string | null;
  store_new_order_sound: string | null;
  store_created_at: Date;
  store_created_by: number | null;
  store_updated_at: Date | null;
  store_updated_by: number | null;
  store_sub_domain: string | null;
  store_printer_mac: string | null;
  store_printer_enabled: string;
  store_tip_percentage_enabled: string;
  store_gateway: string | null;
  store_gateway_id: string | null;
  store_gateway_username: string | null;
  store_gateway_password: string | null;
  store_gateway_mode: string | null;
  store_primary_color: string | null;
  store_secondary_color: string | null;
  store_button_color: string | null;
  store_header_1: string | null;
  store_header_2: string | null;
  store_header_3: string | null;
  store_header_4: string | null;
  store_header_5: string | null;
  store_footer_1: string | null;
  store_footer_2: string | null;
  store_footer_3: string | null;
  store_footer_4: string | null;
  store_footer_5: string | null;
  store_order_type: string;
  store_delivery_fee: number | null;
  store_pickup_time: string | null;
  store_delivery_time: string | null;
  store_weekly_order: string | null;
  store_preorder_days: number | null;
  store_preorder_hours: number | null;
  store_tos: string | null;
  store_privacy_policy: string | null;
  store_refund_policy: string | null;
  store_latitude: string | null;
  store_longitude: string | null;
  store_language: string | null;
  store_delivery_range: number | null;
  store_last_printer_call: Date | null;
  store_last_print: Date | null;
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  password?: string;
  mobile: string;
  confirmPassword?: string;
  roleId?: any;
  sendEmail: string;
  store_taxes: Taxes[];
  store_schedule: Schedule[];
}

export interface OrderInfo {
  order_id: number;
  table_number?: string;
  order_check_number?: number;
  emp_id?: number;
  table_name?: string;
  guest_count?: number;
  order_amount?: number;
  order_tax?: number;
  order_tip?: number;
  order_nca?: number;
  order_discount?: number;
  order_delivery_charge?: number;
  order_total?: number;
  order_number?: number;
  order_status?: string;
  order_type?: string;
  order_transaction_type?: string;
  customer_id?: number;
  order_guest?: string;
  order_created_at?: Date;
  order_created_by?: number;
  order_updated_at?: Date;
  order_updated_by?: number;
  store_id: number;
  order_trash?: string;
  order_loyalty_enabled?: string;
  order_printed?: string;
  order_printer_count?: number;
  store_order_type?: string;
  order_date_slot?: string;
  order_time_slot?: string;
  order_notes?: string;
  order_id_1?: string;
  order_id_2?: string;
  order_verify_id_status?: string;
  coupon_id?: number;
  order_zki?: string;
  order_jir?: string;
  store_language?: string;
  order_reverse_invoice?: string;
  order_payment_complete?: string;
  store_nca_name: string;
  store_default_nca: number;
  coupon_name?: string;
  customer_firstname?: string;
  customer_lastname?: string;
  customer_email?: string;
  customer_floor?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zipcode?: string;
  customer_created_at?: Date;
  customer_marketing_optin?: string;
  customer_deleted?: string;
}

export interface Coupon {
  coupon_24_hours: any;
  user_id: any;
  coupon_id: number;
  merchant_id: any;
  store_id: any[];
  section_id: any[];
  category_id: any[];
  store_names: string[];
  coupon_type: string;
  coupon_name: string;
  coupon_code: string;
  coupon_schedule_enabled: string;
  coupon_redemption: number;
  coupon_activated_datetime: Date;
  coupon_expired_datetime: Date;
  coupon_desc: string;
  coupon_discount_type: string;
  coupon_discount: number;
  coupon_delivery_type: string;
  coupon_min_subtotal: number;
  qualified_items: [];
  discounted_items: [];
  coupon_guest_enabled: string;
  coupon_redeem_reg_user: number;
  coupon_redeem_total: number;
  coupon_status: string;
  coupon_datetime: Date;
  coupon_trash: string;
  coupon_schedule: CouponSchedule[];
  coupon_qualified_items: Category[];
  coupon_discounted_items: Category[];
}

export interface Cost {
  id: number;
  store_id: number | null | undefined;
  user_id?: string | null;
  cost_type: string;
  cost_name: string;
  cost_year: string;
  users?: User | null;
  tbl_cost_details: CostInfo[];
  selected_user: number;
  restaurants: Restaurants | null;
}

export interface CostInfo {
  cost_details_id: number;
  cost_id: number;
  cost_date: string;
  cost_amount: number;
}

export interface OrderProductDetail {
  order_details_id: number;
  product_id: number;
  order_id: number;
  product_quantity: number;
  product_price: number;
  product_name: string;
  product_name_es: string;
  product_image: string;
  product_status: string;
  product_original_price: number;
  product_guest_number: number;
  product_print_preference?: string;
  category_print_preference?: string;
  product_discount: number;
  product_discount_type: string;
  order_details_person_name: string;
  order_details_person_id: string;
  product_loyalty: string;
  product_loyalty_amount: number;
  product_loyalty_spent: number;
  order_txn_id: number;
  product_notes: string;
  modifiers: Modifier[];
  order_details_trash: string;
}

export interface Modifier {
  modifier_name: string;
  modifier_id: number;
  modifier_name_es: string;
  modifier_required: string;
  modifier_multiselect: string;
  product_id: number;
  modifier_sort: number;
  modifier_group_id: number;
  modifier_group: string;
  product_modifier_deleted: string;
  modifier_type: string;
  modifier_options: Option[];
  modifier_order_options: OrderOption[];
  admin_modifier_id?: Number;
  is_admin_modifier: Boolean;
}

export interface Option {
  modifier_option_id: number;
  option_name: string;
  option_name_es: string;
  option_price: number;
  option_default: string;
  modifier_id: number;
  modifier_option_deleted: string;
  option_sort: number;
  option_show_remove: boolean;
  modifier_option_group: string;
}

export interface OrderOption {
  modifier_option_id: number;
  modifier_option_name: string;
  modifier_option_name_es: string;
  modifier_price: number;
  modifier_option_default: string;
  modifier_option_selected: string;
}

export interface Transaction {
  txn_id: number;
  emp_id?: string;
  customer_firstname: string;
  customer_lastname: string;
  customer_name?: string;
  order_id: number;
  order_check_number: number;
  store_id: number;
  txn_type: string;
  store_nca_name: string;
  store_default_nca: number;
  txn_checkout_type: string;
  txn_amount: number;
  txn_original_amount: number;
  txn_tip: number;
  txn_tax: number;
  txn_nca: number;
  txn_delivery_fee: number;
  txn_total: number;
  txn_discount: number;
  txn_datetime: Date;
  txn_ref_no: string;
  txn_custom_ref_no: string;
  txn_card_name: string;
  txn_card_number: string;
  txn_batch_number: string;
  txn_batch_status: string;
  txn_terminal_type: string;
  txn_status: string;
  txn_tip_adjust_status: string;
  txn_nca_tip_status: string;
  txn_refund_amount: number;
  txn_card_safe_id: string;
  txn_gateway_mode: string;
  txn_receipt_type: string;
  txn_reverse_invoice: boolean;
  txn_reverse_user: string;
  txn_gateway: string;
  txn_business_name: string;
  txn_business_oib: string;
  txn_business_address: string;
  txn_business_city: string;
  txn_business_post_code: string;
  txn_trash: string;
  txn_split?: boolean;
  txn_jir?: string;
  txn_zki?: string;
  device_no: number;
}

export interface Taxes {
  store_id: number;
  txn_id: number;
  tax_id: number;
  tax_type: string[];
  tax_basic?: number;
  merchant_id: number;
  store_ids: number[];
  modifier_ids: number[];
  product_ids: number[];
  category_ids: number[];
  section_ids: number[];
  tax_sub_type: string;
  tax_total: number;
  tax_name: string;
  tax_percentage: number;
  tax_value: number;
  tax_deleted: string;
}

export interface ProductTaxes {
  product_tax_id: number | null | undefined;
  product_tax_trash: string;
  tax_name: string;
  tax_percentage: string;
  tax_type: string;
  tax_sub_type: string;
  product_tax_enabled: string;
  product_id: number;
  tax_id: number;
}

export interface CategoryTaxes {
  category_tax_id: number | null | undefined;
  category_tax_trash: string;
  tax_name: string;
  tax_percentage: string;
  tax_type: string;
  tax_sub_type: string;
  category_tax_enabled: string;
  category_id: number;
  tax_id: number;
}

export interface Inventory {
  product_id: number;
  product_name: string;
  product_orders: number;
  product_quantity: number;
  product_total: number;
  category_id: number;
  store_id: number;
}

export interface Schedule {
  schedule_id: number;
  store_id: number;
  schedule_day: number;
  schedule_from: string;
  schedule_to: string;
  schedule_enabled: string;
  schedule_nextday: string;
  schedule_updated_at: Date;
  schedule_show_remove: boolean;
}

export interface Category {
  user_id: number | undefined;
  category_id: number;
  store_id?: number[];
  merchant_id?: number | undefined | null;
  category_products: number;
  category_active_products: number;
  category_schedule_enabled: string;
  category_24_hours: string;
  category_schedule: CategorySchedule[];
  category_name: string;
  category_logo: string;
  category_name_es?: string;
  category_created_at: Date;
  category_created_by?: number;
  category_print_preference?: string;
  category_updated_at?: Date;
  category_updated_by?: number;
  category_trash: string;
  category_order: number;
  image: string;
  extension: string;
  tbl_products: Product[];
  order_no: number;
  category_status: string;
  section_id: number;
  section?: any;
  tbl_category_taxes: CategoryTaxes[];
  typeofImageUpload?: string;
  subdomain?: string;
  section_name: string;
}

export interface Section {
  category?: any;
  extension: string;
  image: string;
  merchant_id: number | null | undefined;
  user_id: number | undefined;
  id: number;
  name: string;
  order_no?: number;
  enabled: boolean;
  store_id: number[] | [];
  Restaurants: any;
  // store: Store
  categories: Category[];
  subdomain?: any;
  visible: boolean;
}

export interface Affiliate {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  post_code: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  partner_id: any;
  partners?: any;
  sendEmail?: string;
  created_at?: Date;
  updated_at?: Date;
  active_status: boolean;
  deleted_status: boolean;
  approved_status?: string;
  url?: string;
  document?: any;
  affiliate_share?: number;
  domain?: any;
}

export interface Partner {
  id: number;
  username: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  post_code: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  sendEmail?: string;
  created_at?: Date;
  updated_at?: Date;
  active_status: boolean;
  deleted_status: boolean;
  approved_status?: string;
  url?: string;
  document?: any;
  company_id?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapProps {
  initialValue: LatLng;
  open: boolean;
  setMapCoordinates: (coordinates: LatLng, place: any) => void;
  handleClose: () => void;
}

export interface ItemSection {
  item_section_id: number;
  restaurantId: number;
  item_section_unique_id: number;
  item_section_name: string;
  item_section_deleted: boolean;
  item_section_created_at: Date;
  store_id?: number[];
}

export interface ItemCategory {
  item_category_id: number;
  item_section_id: number;
  restaurantId: number;
  item_category_unique_id: number;
  item_category_name: string;
  item_category_deleted: boolean;
  item_category_created_at: Date;
}

export interface ItemSubCategory {
  item_sub_category_id: number;
  item_category_id: number;
  restaurantId: number;
  item_sub_category_unique_id: number;
  item_sub_category_name: string;
  item_sub_category_deleted: boolean;
  item_sub_category_created_at: Date;
}

export interface PreviewProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  open: boolean;
  handleClose: () => void;
}

// tbl_customers.ts
export interface Customer {
  customer_id: number;
  store_id?: number;
  customer_firstname?: string;
  customer_lastname?: string;
  customer_username?: string;
  customer_email?: string;
  customer_password?: string;
  customer_fb_id?: string;
  customer_floor?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_dob?: Date;
  customer_zipcode?: string;
  customer_billing_address?: string;
  customer_billing_city?: string;
  customer_billing_state?: string;
  customer_billing_country?: string;
  customer_billing_zipcode?: String;
  customer_created_at?: Date;
  customer_updated_at?: Date;
  customer_deleted?: string;
  customer_token?: string;
  customer_is_guest?: string;
  customer_phone?: string;
  customer_orders?: number;
  customer_sales?: number;
  customer_marketing_optin?: string;
}

// Be sure to also create the TblOrders and

export interface AlertInterface {
  open: boolean;
  title?: any;
  description?: any;
  callback?: () => void;
}

export interface RequestPayload {
  type: string;
  custom_html: string;
  features_list: string[];
  heading: string;
  html: string;
  status?: string;
  id?: number;
  sendDateTime?: string;
}

export interface ReceiptEmailProps {
  store: Restaurants;
  transaction: Transaction;
  order: OrderInfo;
  products: OrderProductDetail[];
  taxes: Taxes[];
}

export interface ReceiptTemplate {
  client_id?: string;
  logo: string;
  location_id: string | null;
  from_superadmin: boolean;
  template_name: string;
  template_type: string;
  deleted_status: boolean;
  active_status: boolean;
  receipt_items: ReceiptItem[];
  receipt_units: ReceiptUnit[];
}

export interface ReceiptUnit {
  id: string;
  receipt_id: string;
  production_unit_id: string;
}
// Define interface for tbl_receipt_items
export interface ReceiptItem {
  receipt_item_name: string;
  receipt_item_type: string;
  receipt_item_order?: number;
  deleted_status: boolean;
  active_status: boolean;
  receipt_item_properties: ReceiptItemProperty[];
}

// Define interface for tbl_receipt_item_properties
export interface ReceiptItemProperty {
  item_properties_name: string;
  item_properties_type: string;
  item_properties_value: string;
}

export interface PurchaseEmailProps {
  purchaseItems: PurchaseItems[];
}

export interface MessageRequest {
  from: string;
  to: string;
  text: string;
}

export interface MessageResponse {
  messages: Array<{
    to: string;
    status: {
      groupId: number;
      groupName: string;
      id: number;
      name: string;
      description: string;
    };
    smsCount: number;
    messageId: string;
  }>;
}
