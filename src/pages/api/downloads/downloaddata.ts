import { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit-table";
import ExcelJS from "exceljs";
import { StatusCodes } from "http-status-codes";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { tableData, rows, sheetColumns, filename, downloadFormat, extraData, extraDataBeforeTable = true } = req.body;
    const encodedFilename = encodeURIComponent(filename);

    if (downloadFormat === "pdf") {
      if (!tableData || !tableData.headers || tableData.headers.length === 0) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "no_fields_found_to_export_report" });
      }

      const doc = new PDFDocument({ margin: 30 });


      res.setHeader("Content-Type", "application/pdf; charset=UTF-8");
      res.setHeader("Content-Disposition", `attachment; filename=${encodedFilename}.pdf`);
      doc.pipe(res);

      if (extraData) {
        if (extraDataBeforeTable) {
          Object.entries(extraData).forEach(([key, value]) => {
            doc.fontSize(14).text(`${key}: ${value || "N/A"}`, { align: "left" });
          });
          doc.moveDown(2);
        }
      }

      doc.fontSize(18).text(`${filename} Data`, { align: "center", underline: true });
      doc.moveDown(2);

      await doc.table(tableData, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
        prepareRow: (row, index) => doc.font("Helvetica").fontSize(10),
        columnSpacing: 10,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });

      if (extraData && !extraDataBeforeTable) {
        doc.moveDown(2);
        Object.entries(extraData).forEach(([key, value]) => {
          doc.fontSize(14).text(`${key}: ${value || "N/A"}`, { align: "left" });
        });
      }

      doc.end();
    } else if (downloadFormat === "excel") {
      if (!rows || rows.length === 0) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "no_fields_found_to_export_report" });
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(filename);

      sheet.columns = sheetColumns;
      rows.forEach((row: any) => sheet.addRow(row));

      if (extraData) {
        sheet.addRow([]);
        Object.entries(extraData).forEach(([key, value]) => {
          sheet.addRow([key, value || "N/A"]);
        });
      }

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8");
      res.setHeader("Content-Disposition", `attachment; filename=${encodedFilename}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "invalid_download_format_specified" });
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
