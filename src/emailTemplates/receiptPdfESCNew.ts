import moment from "moment-timezone";
import path from "path";
const PDFDocument = require("pdfkit-table");
import QRCode from "qrcode";
import fs from "fs";

import { promisify } from "util";
import stream from "stream";
import sharp from "sharp";
import {
  ReceiptItem,
  ReceiptItemProperty,
  ReceiptTemplate,
} from "@/types/admin/types";
import { getProductPrices } from "../../lib/priceHelpers";

const finished = promisify(stream.finished);
let doc: any;
let pageWidth = 226;

let fontPath = "public/fonts/NotoSans.ttf";
let fontBoldPath = "public/fonts/Poppins-Bold.ttf";
let line = "----------------------------------------------------------------";

export async function createReceiptPdfTemplateNew(
  order: any,
  template: ReceiptTemplate,
  is_business_invoice: boolean,
  business_data: any
) {
  doc = new PDFDocument({
    size: [226, 1300],
    margins: {
      top: 10,
      bottom: 10,
      left: 5,
      right: 5,
    },
  });

  if (!template) return;

  const operator =
    order.location.company.client.first_name +
    " " +
    order.location.company.client.last_name;

  const file = moment() + ".pdf";
  const filePath = process.env.NEXT_PUBLIC_SHARED_IMG_DIR + "/pdf/";
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }
  const fileName = filePath + file;
  const stream = fs.createWriteStream(fileName);

  doc.pipe(stream);

  doc.font(fontPath);

  pageWidth = doc.page.width - 10;
  const pageHeight = doc.page.height;

  doc.moveDown();

  let imageBuffer: any = "";
  if (order.location.logo) {
    try {
      const imageUrl =
        process.env.NEXT_PUBLIC_SHARED_IMG_DIR +
        "/images/clients/" +
        order.location.logo;
      const imagePath = path.resolve(imageUrl);
      const imgBuffer1 = fs.readFileSync(imagePath);
      imageBuffer = await sharp(imgBuffer1)
        .png()
        .toBuffer();
    } catch (error) {
      console.error(error);
    }
  }

  let str =
    "https://porezna.gov.hr/rn?jir=" +
    order?.order_transaction[0]?.jir +
    "&datv=" +
    moment(order.created_at, "DD.MM.YYYY HH:mm").format("YYYYMMDD") +
    "_" +
    moment(order.created_at, "DD.MM.YYYY HH:mm").format("HHmm") +
    "&izn=" +
    (
      order?.order_transaction[0]?.amount -
      order?.order_transaction[0]?.discount
    )
      .toFixed(2)
      .replace(".", ",") +
    ` ${order.currency}`;
  const qrSvg = await QRCode.toDataURL(str);

  template.receipt_items.forEach((item, index) => {
    if (item.active_status) {
      if (item.receipt_item_type === "IMAGE") {
        if (imageBuffer != "") {
          processImageProperties(item, imageBuffer);
        }
      } else if (item.receipt_item_type === "TEXT") {
        if (item.receipt_item_name === "Company Name" && is_business_invoice) {
          processTextProperties(item, business_data.company_name ?? "");
        } else if (
          item.receipt_item_name === "Company Address" &&
          is_business_invoice
        ) {
          let address = `${
            business_data.address ? business_data.address + ", " : ""
          }${business_data.city ? business_data.city + " " : ""}${
            business_data.postcode ? business_data.postcode : ""
          }`;

          processTextProperties(item, address);
        } else if (item.receipt_item_name === "Location Name") {
          processTextProperties(item, order.location.location_name);
        } else if (item.receipt_item_name === "Location Address") {
          let address;
          address = `${
            order.location.street ? order.location.street + ", " : ""
          }${order.location.postcode ? order.location.postcode + " " : ""}${
            order.location.city ? order.location.city : ""
          } ${order.location.country ? order.location.country : ""}`;

          processTextProperties(item, address);
        } else if (item.receipt_item_name === "OIB" && is_business_invoice) {
          processTextProperties(
            item,
            "OIB: " + (business_data.company_oib ?? "")
          );
        } else if (
          item.receipt_item_name === "Bill No." &&
          order?.order_transaction?.length !== 0
        ) {
          if (template.template_type === "I") {
            processTextProperties(
              item,
              "Broj računa: " + order?.order_transaction[0]?.invoice_number
            );
          } else {
            processTextProperties(
              item,
              "Bill No.: " + order?.order_transaction[0]?.invoice_number
            );
          }

          // if (order.personName) {
          //   processTextProperties(item, order.personName);
          // }
        } else if (item.receipt_item_name === "Table No.") {
          if (
            order.order_type === "qr_dine_in" ||
            order.order_type === "waiter_dine_in"
          ) {
            if (template.template_type === "I") {
              processTextProperties(item, "Stol: " + order.table?.name);
            } else {
              processTextProperties(item, "Table: " + order.table?.name);
            }
          }
        } else if (item.receipt_item_name === "Order No.") {
          processTextProperties(item, "Order #" + order.order_number);
        } else if (
          item.receipt_item_name === "Order Type Takeaway with No." &&
          order.order_type === "takeaway"
        ) {
          if (template.template_type === "I") {
            processTextProperties(
              item,
              "ZA PREUZIMANJE: NARUDŽBA BR. " + order.order_number
            );
          } else {
            processTextProperties(
              item,
              "Takeaway: Order No. " + order.order_number
            );
          }
        } else if (
          item.receipt_item_name === "Order Type Delivery with No." &&
          order.order_type === "delivery"
        ) {
          processTextProperties(
            item,
            "DOSTAVA: NARUDZBA BR. " + order.order_number
          );
        } else if (item.receipt_item_name === "Order Type") {
          if (
            order.order_type === "qr_dine_in" ||
            order.order_type === "waiter_dine_in"
          ) {
            processTextProperties(item, "Dinein");
          } else if (order.order_type === "takeaway") {
            processTextProperties(item, "Takeaway");
          } else if (order.order_type === "delivery") {
            processTextProperties(item, "Delivery");
          }
        } else if (item.receipt_item_name === "Order Scheduled Time") {
          processTextProperties(
            item,
            moment(order.order_date_slot, "DD/MM/YYYY").format("DD.MM.YYYY") +
              " " +
              order.order_time_slot
          );
        } else if (item.receipt_item_name === "Order Submitted Time") {
          processTextProperties(item, "Submitted: " + order.created_at);
        } else if (item.receipt_item_name === "Customer Name") {
          processTextProperties(
            item,
            "Customer: " +
              order.customer?.firstname +
              " " +
              order.customer?.lastname
          );
        } else if (item.receipt_item_name === "Customer Phone") {
          processTextProperties(item, "Phone: " + order.customer?.phone);
        } else if (item.receipt_item_name === "Order Notes") {
          if (
            order.order_notes &&
            order.order_notes != "" &&
            order.order_notes != "null"
          ) {
            processTextProperties(item, "ORDER NOTES:\n" + order.order_notes);
          }
        } else if (
          item.receipt_item_name === "ZKI" &&
          order?.order_transaction?.length !== 0
        ) {
          processTextProperties(
            item,
            `ZKI: ${
              order?.order_transaction[0]?.zki
                ? order?.order_transaction[0]?.zki
                : ""
            }`
          );
        } else if (
          item.receipt_item_name === "JIR" &&
          order?.order_transaction?.length !== 0
        ) {
          processTextProperties(
            item,
            `JIR: ${
              order?.order_transaction[0]?.jir
                ? order?.order_transaction[0]?.jir
                : ""
            }`
          );
        } else if (item.receipt_item_name === "Tip Instruction") {
          processTextProperties(item, "TIP IS NOT INCLUDED");
        } else if (item.receipt_item_name === "Thank You") {
          if (template.template_type === "I") {
            processTextProperties(item, "HVALA");
          } else {
            processTextProperties(item, "Thank You");
          }
        }
        // else if (item.receipt_item_name=== "Reverse Invoice Tag") {
        //   if (transaction.txn_reverse_invoice) {
        //     if (template.template_type=== "I") {
        //       processTextProperties(item, "STORNO");
        //     }
        //   }
        // }
      } else if (item.receipt_item_type === "CUSTOM") {
        if (item.receipt_item_name === "Custom Text") {
          processCustomProperties(item);
        }
      } else if (item.receipt_item_type === "2TEXT") {
        // if (item.receipt_item_name=== "Cash Register") {
        //   if (template.template_type=== "I") {
        //     processText2Properties(
        //       item,
        //       order.location.location_number,
        //       "Blagajna: " +
        //         (transaction.device_no ? transaction.device_no : "0")
        //     );
        //   } else {
        //     processText2Properties(
        //       item,
        //       store.name,
        //       "Cash Register: " + store.store_cash_register
        //     );
        //   }
        // }

        if (item.receipt_item_name === "Order Datetime") {
          if (template.template_type === "I") {
            processText2Properties(
              item,
              "Datum: " +
                moment(order.created_at, "DD.MM.YYYY HH:mm").format(
                  "DD.MM.YYYY"
                ),
              "Vrijeme: " +
                moment(order.created_at, "DD.MM.YYYY HH:mm").format("HH:mm")
            );

            // if (transaction.txn_receipt_type=== "B") {
            //   processTextProperties(item, "R1");
            //   processTextProperties(item, transaction.txn_business_name);
            //   processTextProperties(
            //     item,
            //     "OIB: " + transaction.txn_business_oib
            //   );

            //   let merchantAddress: any = [];

            //   if (
            //     transaction.txn_business_address != null &&
            //     transaction.txn_business_address != "null" &&
            //     transaction.txn_business_address != ""
            //   ) {
            //     merchantAddress.push(transaction.txn_business_address);
            //   }

            //   if (
            //     transaction.txn_business_post_code != null &&
            //     transaction.txn_business_post_code != "null" &&
            //     transaction.txn_business_post_code != ""
            //   ) {
            //     merchantAddress.push(transaction.txn_business_post_code);
            //   }

            //   if (
            //     transaction.txn_business_city != null &&
            //     transaction.txn_business_city != "null" &&
            //     transaction.txn_business_city != ""
            //   ) {
            //     merchantAddress.push(transaction.txn_business_city);
            //   }

            //   processTextProperties(item, merchantAddress.join(","));
            // }
          } else {
            processText2Properties(
              item,
              "Date: " +
                moment(order.created_at, "DD.MM.YYYY HH:mm").format(
                  "DD.MM.YYYY"
                ),
              "Time: " +
                moment(order.created_at, "DD.MM.YYYY HH:mm").format("HH:mm")
            );
          }
        } else if (
          item.receipt_item_name === "Total" &&
          order?.order_transaction?.length !== 0
        ) {
          if (template.template_type === "I") {
            processText2Properties(
              item,
              "Ukupno: ",
              (
                order?.order_transaction[0]?.amount -
                order?.order_transaction[0]?.discount
              )
                .toFixed(2)
                .replace(".", ",") + ` ${order.currency}`
            );
          } else {
            processText2Properties(
              item,
              "Total: ",
              (
                order?.order_transaction[0]?.amount -
                order?.order_transaction[0]?.discount
              )
                .toFixed(2)
                .replace(".", ",") + ` ${order.currency}`
            );
          }

          doc.moveDown();
        } else if (item.receipt_item_name === "Tips") {
          if (template.template_type === "I") {
            if (order?.order_transaction[0]?.order_tip > 0) {
              processText2Properties(
                item,
                "NAPOJNICA: ",
                order?.order_transaction[0]?.order_tip.toFixed(2)
              );
            }
          }

          doc.moveDown();
        } else if (
          item.receipt_item_name === "Delivery Fee" &&
          order?.order_transaction?.length !== 0
        ) {
          if (template.template_type === "I") {
            if (order?.order_transaction[0]?.delivery_fee > 0) {
              processText2Properties(
                item,
                "DOSTAVA: ",
                order?.order_transaction[0]?.delivery_fee.toFixed(2)
              );
            }
          }

          doc.moveDown();
        } else if (
          item.receipt_item_name === "Discount" &&
          order?.order_transaction?.length !== 0
        ) {
          if (template.template_type === "I") {
            if (order?.order_transaction[0]?.discount > 0) {
              processText2Properties(
                item,
                "POPUST: ",
                order?.order_transaction[0]?.discount.toFixed(2)
              );
            }
          }

          doc.moveDown();
        }

        // else if (item.receipt_item_name=== "Kn Conversion") {
        //   processText2Properties(
        //     item,
        //     "1 EUR = 7,53450 Kn ",
        //     (transaction.txn_total * 7.5345).toFixed(2).replace(".", ",") +
        //       " Kn"
        //   );
        // }
        else if (item.receipt_item_name === "Operator") {
          if (
            order.location.company.client.first_name != "" ||
            order.location.company.client.last_name != ""
          ) {
            if (template.template_type === "I") {
              processText2Properties(
                item,
                "Operater: ",
                order.location.company.client.first_name +
                  " " +
                  order.location.company.client.last_name
              );
            } else {
              processText2Properties(
                item,
                "Operator: ",
                order.location.company.client.first_name +
                  " " +
                  order.location.company.client.last_name
              );
            }
          } else {
            if (template.template_type === "I") {
              processText2Properties(item, "Operater: ", operator);
            } else {
              processText2Properties(item, "Operator: ", operator);
            }
          }
          doc.moveDown();
        } else if (
          item.receipt_item_name === "Transaction Type" &&
          order?.order_transaction?.length !== 0
        ) {
          if (template.template_type === "I") {
            processText2Properties(
              item,
              "Način plaćanja: ",
              order?.order_transaction[0]?.type === "C" ? "Kartica" : "Gotovina"
            );
          } else {
            processText2Properties(
              item,
              "Method of Payment: ",
              order?.order_transaction[0]?.type === "C" ? "Card" : "Cash"
            );
          }
        }
      } else if (item.receipt_item_type === "SPACE") {
        processSpaceProperties(item);
      } else if (item.receipt_item_type === "LINE") {
        doc.fontSize(10).text(line, {
          align: "left",
          width: pageWidth,
        });
      } else if (item.receipt_item_type === "4COLUMNS") {
        if (item.receipt_item_name === "Product Info") {
          let headers = [
            {
              label: "Artikl",
              property: "name",
              width: 72.73,
              headerColor: "#fff",
              headerOpacity: 0,
              columnColor: "#fff",
              columnOpacity: 1,
            },
            {
              label: "Cijena",
              property: "name",
              width: 38,
              headerColor: "#fff",
              headerOpacity: 0,
              columnColor: "#fff",
              columnOpacity: 1,
            },
            {
              label: "Kol.",
              property: "name",
              width: 40.62,
              headerColor: "#fff",
              headerOpacity: 0,
              align: "left",
              columnColor: "#fff",
              columnOpacity: 1,
            },
            {
              label: "Ukupno",
              property: "name",
              width: pageWidth * 0.3,
              headerColor: "#fff",
              headerOpacity: 0,
              columnColor: "#fff",
              columnOpacity: 1,
            },
          ];
          let rows: any[] = [];
          order.order_details.map((detail: any) => {
            rows.push([
              detail.product.name.substr(14, 7),
              detail.product.name.substr(21, 7),
              detail.product.name.substr(28, 11),
            ]);
            rows.push([
              detail.product.name.substr(0, 14),
              getProductPrices(detail.product as any, 1, [])
                .priceWithTax.toFixed(2)
                .toString()
                .replace(".", ","),
              detail.product_quantity
                .toFixed(2)
                .toString()
                .replace(".", ","),
              getProductPrices(
                detail.product as any,
                detail.product_quantity,
                []
              )
                .priceWithTax.toFixed(2)
                .toString()
                .replace(".", ","),
            ]);
            let modifiersArray: any = [];
            detail.order_details_modifiers.forEach((modifier: any) => {
              if (
                modifiersArray.find((m: any) => m.id === modifier.modifier_id)
              ) {
                modifiersArray = modifiersArray.map((m: any) => {
                  if (m.id === modifier.modifier_id) {
                    m.options.push({
                      option: modifier.modifier_option_name,
                      price: modifier.modifier_price_with_tax,
                    });
                  }
                  return m;
                });
              } else {
                modifiersArray.push({
                  id: modifier.modifier_id,
                  name: modifier.modifier_name,
                  options: [
                    {
                      option: modifier.modifier_option_name,
                      price: modifier.modifier_price_with_tax,
                    },
                  ],
                });
              }
            });

            for (const mod of modifiersArray) {
              rows.push([`- ${mod.name}`]);
              for (const option of mod.options) {
                rows.push([
                  `${option.option}`,
                  "",
                  "",
                  option.price
                    .toFixed(2)
                    .toString()
                    .replace(".", ","),
                ]);
              }
            }
          });

          processText4Properties(item, headers, rows);

          doc.fontSize(10).text(line, {
            align: "left",
            width: pageWidth,
          });
        } else if (item.receipt_item_name === "Tax Info") {
          if (order.total_tax > 0) {
            let headers = [
              {
                label: "Vrsta poreza",
                property: "name",
                align: "left",
                width: pageWidth * 0.34,
                headerColor: "#fff",
                headerOpacity: 1,
                columnColor: "#fff",
                columnOpacity: 1,
              },
              {
                label: "Stopa%",
                property: "name",
                align: "left",
                width: pageWidth * 0.17,
                headerColor: "#fff",
                headerOpacity: 1,
                columnColor: "#fff",
                columnOpacity: 1,
              },
              {
                label: "Osnovica",
                property: "name",
                align: "left",
                width: pageWidth * 0.23,
                headerColor: "#fff",
                headerOpacity: 1,
                columnColor: "#fff",
                columnOpacity: 1,
              },
              {
                label: "Iznos",
                property: "name",
                align: "left",
                width: pageWidth * 0.26,
                headerColor: "#fff",
                headerOpacity: 1,
                columnColor: "#fff",
                columnOpacity: 1,
              },
            ];

            let rows: any[] = [];
            order.order_taxes.map((tax: any) => {
              rows.push([
                tax?.tax?.tax_name,
                tax?.tax?.tax_percentage.toFixed(2).replace(".", ","),
                order.order_total_without_tax.toFixed(2).replace(".", ","),
                tax.tax_price.toFixed(2).replace(".", ","),
              ]);
            });

            processText4Properties(item, headers, rows);

            doc.fontSize(10).text(line, {
              align: "left",
              width: pageWidth,
            });
          }
        }
      } else if (item.receipt_item_type === "2COLUMNS") {
        if (item.receipt_item_name === "Kitchen Product Info") {
          let headers = [
            {
              label: "Item",
              align: "left",
              property: "name",
              width: pageWidth * 0.8,
              headerColor: "#fff",
              headerOpacity: 1,
              columnColor: "#fff",
              columnOpacity: 1,
            },
            {
              label: "Qty.",
              property: "name",
              width: pageWidth * 0.2,
              align: "right",
              headerColor: "#fff",
              headerOpacity: 1,
              columnColor: "#fff",
              columnOpacity: 1,
            },
          ];
          let rows: any[] = [];

          order.order_details.map((detail: any) => {
            rows.push([
              detail.product.name.substr(0, 14),
              detail.product_quantity,
            ]);
            let modifiersArray: any = [];
            detail.order_details_modifiers.forEach((modifier: any) => {
              if (
                modifiersArray.find((o: any) => o.id === modifier.modifier_id)
              ) {
                modifiersArray = modifiersArray.map((o: any) => {
                  if (o.id === modifier.modifier_id) {
                    o.modifier_option_names = `${o.modifier_option_names}, ${modifier.modifier_option_name}`;
                  }
                  return o;
                });
              } else {
                modifiersArray.push({
                  id: modifier.modifier_id,
                  modifier_name: modifier.modifier_name,
                  modifier_option_names: modifier.modifier_option_name,
                });
              }
            });

            for (const mod of modifiersArray) {
              rows.push([
                `-${mod.modifier_name}: ${mod.modifier_option_names}`,
                detail.product_quantity,
              ]);
            }
          });

          processText2TableProperties(item, headers, rows);

          doc.fontSize(10).text(line, {
            align: "left",
            width: pageWidth,
          });
        }
      } else if (item.receipt_item_type === "QRCode") {
        if (
          item.receipt_item_name === "QRCode" &&
          order?.order_transaction?.length !== 0
        ) {
          let str =
            "https://porezna.gov.hr/rn?jir=" +
            order?.order_transaction[0]?.jir +
            "&datv=" +
            moment(order.created_at, "DD.MM.YYYY hh:mm A").format("YYYYMMDD") +
            "_" +
            moment(order.created_at, "DD.MM.YYYY hh:mm A").format("HHmm") +
            "&izn=" +
            (
              order?.order_transaction[0]?.amount -
              order?.order_transaction[0]?.discount
            )
              .toFixed(2)
              .replace(".", ",");

          doc.image(qrSvg, pageWidth / 2 - 50, undefined, {
            width: 100,
            align: "center",
          });

          doc.moveDown();
          doc.moveDown();
          doc.moveDown();
          doc.moveDown();
          doc.moveDown();
          doc.moveDown();
          doc.moveDown();

          //	processQRCodeProperties(item, str);
        }
      }
    }
  });

  doc.fontSize(10).text("Orby POS", { align: "center", width: pageWidth });

  doc
    .fontSize(10)
    .text("www.orbypos.com", { align: "center", width: pageWidth });

  doc.end();

  await finished(stream);
  const pdfBuffer = fs.readFileSync(fileName);
  const base64String = pdfBuffer.toString("base64");
  // write file to disk
  // fs.writeFileSync(fileName, pdfBuffer);
  return { file, base64String };
}

function processText4Properties(
  item: ReceiptItem,
  headers: any,
  rows: string[]
) {
  let size = 10;
  let align1 = "left";
  let align2 = "left";
  let align3 = "left";
  let align4 = "left";

  let font = fontPath;
  let properties = item.receipt_item_properties;

  properties.forEach((property, index) => {
    if (property.item_properties_type === "ALIGN") {
      var alignments = property.item_properties_value.split(",");

      if (alignments.length === 4) {
        if (parseInt(alignments[0]) === 0) {
          align1 = "left";
        } else if (parseInt(alignments[0]) === 1) {
          align1 = "left";
        } else if (parseInt(alignments[0]) === 2) {
          align1 = "left";
        }

        headers[0].align = align1;

        if (parseInt(alignments[1]) === 0) {
          align2 = "left";
        } else if (parseInt(alignments[1]) === 1) {
          align2 = "left";
        } else if (parseInt(alignments[1]) === 2) {
          align2 = "left";
        }

        headers[1].align = align2;

        if (parseInt(alignments[2]) === 0) {
          align3 = "left";
        } else if (parseInt(alignments[2]) === 1) {
          align3 = "left";
        } else if (parseInt(alignments[2]) === 2) {
          align3 = "left";
        }

        headers[2].align = align3;

        if (parseInt(alignments[3]) === 0) {
          align4 = "left";
        } else if (parseInt(alignments[3]) === 1) {
          align4 = "left";
        } else if (parseInt(alignments[3]) === 2) {
          align4 = "left";
        }
        headers[3].align = align4;
      }
    } else if (property.item_properties_type === "SIZE") {
      if (parseInt(property.item_properties_value) > 1) {
        font = fontBoldPath;
      }
    } else if (property.item_properties_type === "STYLE") {
      if (property.item_properties_value === "Y") {
        size = 14;
      }
    }
  });

  let table = {
    title: "",

    headers: headers,
    rows: rows,
  };
  // options
  let options = {
    width: pageWidth,
    headerColor: "#fff",
    headerOpacity: 1,
    columnColor: "#fff",
    columnOpacity: 1,
    divider: {
      header: { disabled: false },
      horizontal: { disabled: true },
    },
    columnSpacing: 0,
    prepareHeader: () => doc.font(font).fontSize(size),
    prepareRow: () => doc.font(font).fontSize(size),
  };
  doc.table(table, options);
}

function processText2TableProperties(
  item: ReceiptItem,
  headers: any,
  rows: string[]
) {
  let size = 10;
  let align1 = "left";
  let align2 = "right";

  let font = fontPath;

  let properties = item.receipt_item_properties;

  properties.forEach((property, index) => {
    if (property.item_properties_type === "ALIGN") {
      let alignments = property.item_properties_value.split(",");

      if (alignments.length === 2) {
        if (parseInt(alignments[0]) === 0) {
          align1 = "left";
        } else if (parseInt(alignments[0]) === 1) {
          align1 = "center";
        } else if (parseInt(alignments[0]) === 2) {
          align1 = "right";
        }

        headers[0].align = align1;

        if (parseInt(alignments[1]) === 0) {
          align2 = "left";
        } else if (parseInt(alignments[1]) === 1) {
          align2 = "center";
        } else if (parseInt(alignments[1]) === 2) {
          align2 = "right";
        }

        headers[1].align = align2;
      }
    } else if (property.item_properties_type === "SIZE") {
      if (parseInt(property.item_properties_value) > 1) {
        font = fontBoldPath;
      }
    } else if (property.item_properties_type === "STYLE") {
      if (property.item_properties_value === "Y") {
        size = 14;
      }
    }
  });

  let table = {
    title: "",
    headers: headers,
    rows: rows,
  };
  // options
  let options = {
    width: pageWidth,
    headerColor: "#fff",
    headerOpacity: 1,
    columnColor: "#fff",
    columnOpacity: 1,
    divider: {
      header: { disabled: false },
      horizontal: { disabled: true },
    },
    prepareHeader: () => doc.font(font).fontSize(size),
    prepareRow: () => doc.font(font).fontSize(size),
  };
  doc.table(table, options);
}

async function processImageProperties(item: ReceiptItem, imageBuffer: Buffer) {
  let align = 0;
  let properties = item.receipt_item_properties;

  properties.forEach((property, index) => {
    if (property.item_properties_type === "ALIGN") {
      if (parseInt(property.item_properties_value) === 0) {
        align = 0;
      } else if (parseInt(property.item_properties_value) === 1) {
        align = pageWidth / 2 - 75;
      } else if (parseInt(property.item_properties_value) === 2) {
        align = pageWidth - 150;
      }
    }
  });

  await doc.image(imageBuffer, align, undefined, { width: 150 });

  imageLoad = true;
}

let imageLoad = false;

function processTextProperties(item: ReceiptItem, text: string) {
  let size = 10;
  let align = "left";
  let font = fontPath;
  let properties = item.receipt_item_properties;

  properties.forEach((property: ReceiptItemProperty, index) => {
    if (property.item_properties_type === "ALIGN") {
      if (parseInt(property.item_properties_value) === 0) {
        align = "left";
      } else if (parseInt(property.item_properties_value) === 1) {
        align = "center";
      } else if (parseInt(property.item_properties_value) === 2) {
        align = "right";
      }
    } else if (property.item_properties_type === "SIZE") {
      if (parseInt(property.item_properties_value) > 1) {
        font = fontBoldPath;
      }
    } else if (property.item_properties_type === "STYLE") {
      if (property.item_properties_value === "Y") {
        size = 14;
      }
    }
  });

  doc
    .font(font)
    .fontSize(size)
    .text(text, { align: align, width: pageWidth });
}

function processCustomProperties(item: ReceiptItem) {
  var size = 10;
  var align = "left";
  var font = fontPath;
  var text = "";

  var itemType = item.receipt_item_type;
  var properties = item.receipt_item_properties;

  properties.forEach((property, index) => {
    if (property.item_properties_type === "ALIGN") {
      if (parseInt(property.item_properties_value) === 0) {
        align = "left";
      } else if (parseInt(property.item_properties_value) === 1) {
        align = "center";
      } else if (parseInt(property.item_properties_value) === 2) {
        align = "right";
      }
    } else if (property.item_properties_type === "SIZE") {
      if (parseInt(property.item_properties_value) > 1) {
        font = fontBoldPath;
      }
    } else if (property.item_properties_type === "STYLE") {
      if (property.item_properties_value === "Y") {
        size = 14;
      }
    } else if (property.item_properties_type === "VALUE") {
      text = property.item_properties_value;
    }
  });

  doc
    .font(font)
    .fontSize(size)
    .text(text, { align: align, width: pageWidth });
}

function processText2Properties(
  item: ReceiptItem,
  text1: string,
  text2: string
) {
  let size = 10;
  let align1 = "left";
  let align2 = "right";
  let font = fontPath;
  let text = "";

  let itemType = item.receipt_item_type;
  let properties = item.receipt_item_properties;

  properties.forEach((property, index) => {
    if (property.item_properties_type === "ALIGN") {
      let alignments = property.item_properties_value.split(",");

      if (alignments.length === 2) {
        if (parseInt(alignments[0]) === 0) {
          align1 = "left";
        } else if (parseInt(alignments[0]) === 1) {
          align1 = "center";
        } else if (parseInt(alignments[0]) === 2) {
          align1 = "right";
        }

        if (parseInt(alignments[1]) === 0) {
          align2 = "left";
        } else if (parseInt(alignments[1]) === 1) {
          align2 = "center";
        } else if (parseInt(alignments[1]) === 2) {
          align2 = "right";
        }
      }
    } else if (property.item_properties_type === "SIZE") {
      if (parseInt(property.item_properties_value) > 1) {
        font = fontBoldPath;
      }
    } else if (property.item_properties_type === "STYLE") {
      if (property.item_properties_value === "Y") {
        size = 14;
      }
    }
  });

  doc
    .fontSize(size)
    .text(text1, { continued: true, align: align1 })
    .text(text2, { align: align2 });
}

function processSpaceProperties(item: ReceiptItem) {
  const properties = item.receipt_item_properties;

  properties.forEach((property, index) => {
    if (property.item_properties_type === "SPACE") {
      doc.moveDown();
    }
  });
}
