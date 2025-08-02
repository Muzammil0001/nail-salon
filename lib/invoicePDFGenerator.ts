import jsPDF from "jspdf";
import { fromByteArray } from "base64-js";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

interface Props {
  merchant_name: string;
  merchant_address: string;
  merchant_pin?: string;
  pdf_name?: string;
  price: number;
  vatPercentage: number;
  planName: string;
  billingModel: string;
  ZKI: string;
  JIR: string;
  orby_oib: string;
  invoice_number: number;
  isDemo: boolean;
}

function calculateVAT(netPrice: number, vatPercentage: string) {
  const numericNetPrice = Number(netPrice);
  const numericVATPercentage = parseFloat(vatPercentage);

  const vatRate = numericVATPercentage / 100;

  const vatAmount = numericNetPrice * vatRate;

  const totalPrice = numericNetPrice + vatAmount;

  return {
    netPrice: numericNetPrice,
    vatAmount: vatAmount,
    totalPrice: totalPrice,
  };
}

const generatePDF = async ({
  merchant_name,
  merchant_address,
  merchant_pin,
  pdf_name,
  price,
  vatPercentage,
  planName,
  billingModel,
  ZKI,
  JIR,
  orby_oib,
  invoice_number,
  isDemo,
}: Props) => {
  try {
    const doc: any = new jsPDF("portrait");
    const result = calculateVAT(price, vatPercentage as any);
    const fontFilePath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Poppins",
      "Poppins-Regular.ttf"
    );
    const customFont = fs.readFileSync(fontFilePath);
    const fontData = new Uint8Array(customFont).buffer;
    const base64FontData = fromByteArray(new Uint8Array(fontData));
    doc.addFileToVFS("Poppins-Regular.ttf", base64FontData);
    doc.addFont("Poppins-Regular.ttf", "Poppins-Regular", "normal");
    doc.setFont("Poppins-Regular");
    const imagePath = "/var/www/public/images/logos/orby-logo-blue.png";
    const getImageAsBase64 = (filePath:string) => {
      const fileData = fs.readFileSync(filePath);
      return Buffer.from(fileData).toString("base64");
    };
    const base64Image = getImageAsBase64(imagePath);
    const imageFormat = "PNG";
    doc.addImage(
      `data:image/png;base64,${base64Image}`,
      imageFormat,
      10,
      10,
      40,
      20
    );
    let startY = 32;

    const textContent = [
      {
        left: ``,
        right: "Orby POS d.o.o.",
      },
      {
        left: ``,
        right: `Poljička cesta 28A 21000 Split`,
      },
      {
        left: ``,

        right: `OIB: ${orby_oib}`,
      },
      {
        left: ``,

        right: `IBAN: HR9524020061100772654`,
      },
    ];
    const textContent2 = [
      {
        left: `Customer: ${merchant_name}`,
        right: `Date and time of invoice: ${new Date()
          .toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Paris",
          })
          .replace(/\//g, ".")
          .replace(",", " ")}`,
      },
      {
        left: `Address: ${merchant_address}`,

        right: `Delivery date: ${new Date()
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, ".")}`,
      },
      {
        left: `OIB: ${merchant_pin}`,

        right: ``,
      },
    ];

    const tablesData: Record<string, any>[] = [
      [
        `Orby POS – ${planName} Plan`,
        "1",
        `${isDemo ? "Demo" : billingModel === "MONTHLY" ? "monthly" : "yearly"}`,
        `${price.toFixed(2)} EUR`,
      ],
      [`VAT ${vatPercentage}%`, "", "", `${result.vatAmount.toFixed(2)} EUR`],
      [`Total`, "", "", `${result.totalPrice.toFixed(2)} EUR`],
    ];

    let lineHeight = 6;

    doc.setFontSize(10);
    let leftY = startY;
    let rightY = 18;
    textContent.forEach((item) => {
      const leftLines = splitText(item.left);
      const rightLines = splitText(item?.right);

      const maxLines = Math.max(leftLines.length, rightLines.length);

      for (let i = 0; i < maxLines; i++) {
        const leftText = leftLines[i] || "";
        const rightText = rightLines[i] || "";

        if (leftText) {
          doc.text(leftText, 10, leftY);
          leftY += lineHeight;
          startY += lineHeight;
        }

        if (rightText) {
          doc.text(rightText, 120, rightY);
          rightY += lineHeight;
        }
      }
    });
    doc.setLineWidth(0.1);
    startY += 8;
    doc.line(10, startY, 200, startY);
    startY += 10;
    textContent2.forEach((item) => {
      const leftLines = splitText(item.left);
      const rightLines = splitText(item?.right);

      const maxLines = Math.max(leftLines.length, rightLines.length);

      for (let i = 0; i < maxLines; i++) {
        const leftText = leftLines[i] || "";
        const rightText = rightLines[i] || "";

        if (leftText) {
          doc.text(leftText, 10, startY);
        }

        if (rightText) {
          doc.text(rightText, 120, startY);
        }
        if (leftText || rightText) {
          startY += lineHeight;
        }
      }
    });
    startY += 8;
    doc.setFontSize(10);
    doc.text(
      `R-1 Invoice number: ${String(invoice_number).padStart(2, "0")}/POS/01`,
      95,
      startY,
      {
        align: "center",
      }
    );
    startY += 4;
    doc.setLineWidth(0.1);
    doc.line(10, startY, 200, startY);
    startY += 4;
    doc.setFontSize(10);

    autoTable(doc, {
      startY: startY,
      head: [["Item", "Quantity", "Unit", "Price"]],
      body: tablesData,
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        font: "Poppins-Regular",
        fontSize: 10,
      },
      styles: {
        font: "Poppins-Regular",
        overflow: "hidden",
        textColor: [0, 0, 0],
        fontSize: 10,
      },
    });

    startY = doc.autoTable.previous.finalY + 8;
    doc.text("Operator: 1", 153, startY);
    startY += lineHeight;
    startY += lineHeight;
    doc.text(`ZKI: ${ZKI}`, 10, startY);
    startY += lineHeight;
    doc.text(`JIR: ${JIR}`, 10, startY);
    const totalPages = doc.internal.getNumberOfPages();

    const footerY = doc.internal.pageSize.height - 20;
    doc.setLineWidth(0.05);
    doc.line(10, footerY - 14, 200, footerY - 14);
    doc.text(
      `Orby POS d.o.o. • Trgovački sud u Splitu • MBS: 060313848 • Temeljni kapital: 20.000 € `,
      30,
      footerY - lineHeight,
      {
        align: "left",
      }
    );
    doc.text(
      `Direktor: Dorotea Arlov • www.orbypos.com • info@orbyposl.com`,
      50,
      footerY,
      {
        align: "left",
      }
    );

    const pdfFilename = (Math.random() * 1000000000).toString() + ".pdf";
    const directory =
      process.env.NEXT_PUBLIC_SHARED_IMG_DIR + "/images/clients";

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    const pdfPath = `${directory}/${pdfFilename}`;

    doc.save(pdfPath);

    return pdfFilename;
  } catch (error) {
    console.log(error, "error generating pdf");
  }
};

function splitText(content: any) {
  const lines: string[] = [];
  let currentIndex = 0;
  const maxCharactersPerLine = 50;
  if (content?.length > maxCharactersPerLine) {
    while (currentIndex < content.length) {
      const substring = content.substr(currentIndex, maxCharactersPerLine);
      const spaceIndex = substring.lastIndexOf(" ");

      if (
        spaceIndex !== -1 &&
        currentIndex + spaceIndex <= currentIndex + maxCharactersPerLine
      ) {
        lines.push(substring.substr(0, spaceIndex));
        currentIndex += spaceIndex + 1;
      } else {
        lines.push(substring);
        currentIndex += maxCharactersPerLine;
      }
    }
  } else {
    lines.push(content);
  }

  return lines;
}

export { generatePDF };
