import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generatePDFBuffer(
  data: Record<string, any>
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 12;
  let y = height - 50;

  const writeLine = (text: string) => {
    page.drawText(text, {
      x: 50,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    y -= fontSize + 4;
  };

  writeLine("Scheduled Report");
  y -= 10;

  for (const [key, value] of Object.entries(data)) {
    writeLine(`• ${key}:`);
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 3)) {
        // limit to 3 rows per section
        writeLine(`   - ${JSON.stringify(item)}`);
      }
    } else if (typeof value === "object") {
      writeLine(`   ${JSON.stringify(value, null, 2)}`);
    } else {
      writeLine(`   ${value}`);
    }

    y -= 10;
    if (y < 50) {
      page.drawText("-- continued on next page --", {
        x: 50,
        y,
        size: 10,
        font,
      });
      const newPage = pdfDoc.addPage();
      y = newPage.getSize().height - 50;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
