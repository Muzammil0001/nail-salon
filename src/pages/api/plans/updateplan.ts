import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import moment from "moment-timezone";
import axios from "axios";
import { getEnvKey } from "../../../../lib/extras";
import { execSync } from "child_process";
import { logToFile } from "../../../../utils/logHelper";
import InvoiceEmail from "@/emailTemplates/InvoiceEmail";
import { generatePDF } from "../../../../lib/invoicePDFGenerator";
import sendEmail from "../../../../lib/sendEmail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["Owner", "BackOfficeUser"],
      "POST"
    );
    if (session) {
      const adyenResponse = req.body.cardSession;
      if (!adyenResponse?.id) {
        res.status(StatusCodes.BAD_REQUEST);
        return res.json({ message: "Adyen Response is required" });
      }
      let nextpayment;
      if (req.body.billingModel === "YEARLY") {
        const today = moment().tz("UTC");
        const nextYear = today.clone().add(1, "year");
        nextpayment = nextYear.format();
      } else {
        const today = moment().tz("UTC");
        const nextMonth = today.clone().add(1, "month");
        nextpayment = nextMonth.format();
      }
      try {
        const response = await axios.get(
          `${process.env.ADYEN_PAYMENT_API}sessions/${adyenResponse?.id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.API_KEY}`,
              "Content-Type": "application/json",
              "x-API-key": process.env.API_KEY,
            },
            params: {
              sessionResult: adyenResponse?.sessionResult,
            },
          }
        );
        if (response?.data?.status === "completed") {
          await prisma.user.update({
            where: {
              id: session.user.roles.includes("Owner")
                ? session.user.id
                : session.user.client_id,
            },
            data: {
              subscription_id: req.body.selectedPlan.id,
              next_payment_on: nextpayment,
              billing_model: req.body.billingModel,
            },
          });
          let ZKI = "";
          let JIR = "";
          const OIB = await getEnvKey("OIB");
          try {
            try {
              const dateTimeCreatedZagreb = moment().tz("Europe/Zagreb");
              let vatTaxesString = "";
              let pnpTaxesString = "";
              let otherTaxesString = "";
              const taxes = [
                {
                  tax_name: "VAT",
                  tax_percentage: req.body.vat,
                  tax_amount: req.body.vat_amount,
                  tax_basic: req.body.price,
                  tax_sub_type: "V",
                },
              ];

              const vatTaxes: string[] = [];
              const pnpTaxes: string[] = [];
              const otherTaxes: string[] = [];
              let xmlData = `
              <ZastitniKodZahtjev>
                  <Oib>${OIB}</Oib>
                  <DatVrijeme>${dateTimeCreatedZagreb.format(
                    "DD.MM.YYYYTHH:mm:ss"
                  )}</DatVrijeme>
                  <BrRac>
                      <BrOznRac>1</BrOznRac>
                      <OznPosPr>1</OznPosPr>
                      <OznNapUr>1</OznNapUr>
                  </BrRac>
                  <IznosUkupno>${req.body.price}</IznosUkupno>
              </ZastitniKodZahtjev>
              `;

              taxes.forEach((tax) => {
                const taxString = `
                        <Porez>
                            ${
                              tax.tax_sub_type === "O"
                                ? `<Naziv>${tax.tax_name}</Naziv>`
                                : ""
                            }
                            <Stopa>${tax.tax_percentage}</Stopa>
                            <Osnovica>${tax.tax_basic}</Osnovica>
                            <Iznos>${tax.tax_amount}</Iznos>
                        </Porez>
                        `;

                if (tax.tax_sub_type === "V") {
                  vatTaxes.push(taxString);
                } else if (tax.tax_sub_type === "P") {
                  pnpTaxes.push(taxString);
                } else if (tax.tax_sub_type === "O") {
                  otherTaxes.push(taxString);
                }
              });

              vatTaxesString = vatTaxes.join("\n");
              pnpTaxesString = pnpTaxes.join("\n");
              otherTaxesString = otherTaxes.join("\n");

              let filtered: any = [];
              const command = `curl -X POST --data '${xmlData}' ${process.env
                .FISCAL_BASE_URL + "xml/zk"}`;
              const output = execSync(command, { encoding: "utf-8" });
              const splitted = output.split(/\r?\n/);
              filtered = splitted.filter((e) => {
                return e.indexOf("<?xml") !== -1;
              });

              if (filtered.length > 0) {
                const response = filtered[0];
                ZKI = response
                  .split("<ZastitniKodOdgovor>")[1]
                  .split("</ZastitniKodOdgovor>")[0];
              }

              if (ZKI.length > 0) {
                let xmlData = `<Racun>
                                <Oib>${OIB}</Oib>
                                <USustPdv>true</USustPdv>
                                <DatVrijeme>${dateTimeCreatedZagreb.format(
                                  "DD.MM.YYYYTHH:mm:ss"
                                )}</DatVrijeme>
                                <OznSlijed>P</OznSlijed>
                                   <BrRac>
                                     <BrOznRac>1</BrOznRac>
                                    <OznPosPr>1</OznPosPr>
                                    <OznNapUr>1</OznNapUr>
                                </BrRac>
                                ${
                                  vatTaxesString.length > 0
                                    ? `<Pdv>${vatTaxesString}</Pdv>`
                                    : ""
                                }
                                ${
                                  pnpTaxesString.length > 0
                                    ? `<Pnp>${pnpTaxesString}</Pnp>`
                                    : ""
                                }
                                ${
                                  otherTaxesString.length > 0
                                    ? `<OstaliPor>${otherTaxesString}</OstaliPor>`
                                    : ""
                                }
                                <IznosOslobPdv>0</IznosOslobPdv>
                                <IznosMarza>0</IznosMarza>
                                <Naknade>
                                    <Naknada>
                                        <NazivN>Povratna naknada</NazivN>
                                        <IznosN>0</IznosN>
                                    </Naknada>
                                </Naknade>
                                <IznosUkupno>${req.body.price}</IznosUkupno>
                                <NacinPlac>C</NacinPlac>
                                <OibOper>01234567890</OibOper>
                                <ZastKod>${ZKI}</ZastKod>
                                <NakDost>false</NakDost>
                                <ParagonBrRac></ParagonBrRac>
                                <SpecNamj>Navedeno kao primjer</SpecNamj>
                            </Racun>`;
                const command = `curl -X POST --data '${xmlData}' ${process.env
                  .FISCAL_BASE_URL + "xml/racun"}`;

                const output = execSync(command, {
                  encoding: "utf-8",
                  stdio: "pipe",
                });
                if (output.length > 0 && output.indexOf("<Jir>") !== -1) {
                  JIR = output.split("<Jir>")[1].split("</Jir>")[0];
                }
              }
            } catch (error) {
              console.log("fiscal errro", error);
            }
            const address = `${
              session.user.street ? session.user.street + ", " : ""
            }${session.user.postcode ? session.user.postcode + " " : ""}${
              session.user.city ? session.user.city : ""
            } ${session.user.country ? session.user.country : ""}`;
            const invoice_number =0
            const pdfFilename = await generatePDF({
              merchant_name: session.user.name,
              merchant_address: address,
              merchant_pin: "",
              pdf_name: "",
              planName: req.body.selectedPlan.name,
              price: req.body.base_price,
              vatPercentage: req.body.vat,
              billingModel: req.body.billingModel,
              ZKI,
              JIR,
              orby_oib: OIB ?? " ",
              invoice_number: invoice_number,
              isDemo: false,
            });
            const InvoiceHtml = InvoiceEmail({
              merchant_name: session.user.name,
              merchant_address: address,
              merchant_pin: "",
              pdf_name: pdfFilename,
              planName: req.body.selectedPlan.name,
              price: req.body.base_price,
              vatPercentage: req.body.vat,
              billingModel: req.body.billingModel,
              ZKI: ZKI || "",
              JIR: JIR || "",
              orby_oib: OIB ?? "",
              invoice_number: invoice_number,
              isDemo: false,
            });

            sendEmail(
              session.user.email,
              "Invoice - Orby Plan",
              InvoiceHtml,
              ""
            );
          } catch (error) {
            console.log(error, "error in pdf");
          }

          res.status(StatusCodes.OK);
          res.json({ success: "1" });
        } else {
          res.status(StatusCodes.BAD_REQUEST);
          return res.json({ message: "Adyen Response is not completed" });
        }
      } catch (error) {
        res.status(StatusCodes.BAD_REQUEST);
        return res.json({ message: "Adyen Response is not completed" });
      }
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
