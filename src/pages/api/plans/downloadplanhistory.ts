import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import PDFDocument from "pdfkit-table";
import ExcelJS from "exceljs";
import { StatusCodes } from "http-status-codes";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== "POST") {
            return res
                .status(StatusCodes.METHOD_NOT_ALLOWED)
                .json({ message: `method_not_allowed` });
        }

        const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
        if (!session) return;

        const client_id = session?.user?.roles?.includes("Owner")
            ? session.user.id
            : session.user.client_id;

        const { columns, downloadFormat, filters, page, rowsPerPage } = req.body;

        const filtersQuery: any = {
            client_id,
            deleted_status: false,
            created_at: {
                gte: filters?.from ? new Date(filters.from) : undefined,
                lte: filters?.to ? new Date(filters.to) : undefined,
            },
        };

        const pageNumber = Math.max(Number(page), 1);
        const rowsPerPageNumber = Math.max(Number(rowsPerPage), 1);
        const skip = (pageNumber - 1) * rowsPerPageNumber;
        const take = rowsPerPageNumber;

        const history = await prisma.transaction_details.findMany({
            where: { ...filtersQuery },
            take,
            skip,
        });

        if (!history.length) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: "no_transactions_found" });
        }

        const transformedData = history.map((item:any) => ({
            status: item.success ? "Active" : "Ianctive",
            amount: item.value ? `€${item.value.toFixed(2)}` : "€0.00",
            date: item.eventDate.toISOString().split('T')[0],
            name: item.card_holder_name || "--",
        }));

        const formattedHeaders = columns.map((col: string) =>
            col.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
        );

        if (downloadFormat === "pdf") {
            const doc = new PDFDocument({ margin: 30 });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=transaction_details.pdf`);
            doc.pipe(res);
            doc.fontSize(18).text(`Transaction Details`, { align: "center", underline: true });
            doc.moveDown(2);

            const tableData = {
                headers: formattedHeaders,
                rows: transformedData.map((row:any) =>
                    columns.map((col: string) => (row as any)[col] || "--")
                ),
            };

            await doc.table(tableData, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
                prepareRow: (row, index) => doc.font("Helvetica").fontSize(8),
                columnSpacing: 15,
                padding: [5],
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
            });

            doc.end();
        } else if (downloadFormat === "excel") {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Transaction Details");

            sheet.columns = columns.map((col: string) => ({
                header: formattedHeaders[columns.indexOf(col)],
                key: col,
                width: 20,
            }));

            transformedData.forEach((row:any) =>
                sheet.addRow(columns.map((col: string) => (row as any)[col] || "--"))
            );

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename=transaction_details.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "invalid_download_format_specified" });
        }
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
    }
}
