type PrintableInput =
  | Record<string, any>
  | Record<string, any>[]
  | {
    header?: string;
    footer?: string;
    data: Record<string, any> | Record<string, any>[];
  };

type ReceiptItem = Record<string, string | number>;

type ReceiptInput =
  | ReceiptItem[]
  | {
    header?: string;
    footer?: string;
    items: ReceiptItem[];
  };

type SalaryReceiptItem = {
  date: string;
  staff_name: string;
  tip: number | string;
  salary: number | string;
};

type SalaryReceiptInput =
  | SalaryReceiptItem[]
  | {
    header?: string;
    footer?: string;
    items: SalaryReceiptItem[];
  };

  interface OrderService {
    service_name: string;
    price: number;
    quantity: number;
  }
  
  interface ExtraCharge {
    name: string;
    amount: number;
  }
  
  interface OrderReceiptData {
    order_number: number;
    services: OrderService[];
    staff_name:string;
    date:string;
    extra_charges?: ExtraCharge[];
    tip?: number;
    total: number;
    header?: string;
    footer?: string;
  }

export const generateReceipt = (data: ReceiptInput): string => {
  if (!data || (Array.isArray(data) && data.length === 0)) return "";

  const ESC = '\x1B';
  const GS = '\x1D';
  const LEFT_ALIGN = ESC + 'a' + '\x00';
  const CENTER_ALIGN = ESC + 'a' + '\x01';
  const LINE_WIDTH = 40;
  const MARGIN = '  ';

  const lines: string[] = [];
  lines.push(ESC + '@');

  const isArrayInput = Array.isArray(data);
  const items: ReceiptItem[] = isArrayInput ? data : data.items || [];
  const header = isArrayInput ? "JT NAIL SALON" : data.header || "JT NAIL SALON";
  const footer = isArrayInput ? "Thank you! See you soon!" : data.footer || "Thank you! See you soon!";

  lines.push(CENTER_ALIGN + `*** ${header} ***`);
  lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));

  if (items.length > 0) {
    const keys = Object.keys(items[0]);
    const colCount = keys.length;
    const colWidth = Math.floor(LINE_WIDTH / colCount);

    const headerLine = keys
      .map(key => key.toUpperCase().padEnd(colWidth).slice(0, colWidth))
      .join('');
    lines.push(LEFT_ALIGN + MARGIN + headerLine);
    lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));

    items.forEach(item => {
      const row = keys
        .map(key => {
          const val = String(item[key] ?? '');
          return val.length > colWidth
            ? val.slice(0, colWidth - 1) + '…'
            : val.padEnd(colWidth);
        })
        .join('');
      lines.push(LEFT_ALIGN + MARGIN + row);
    });

    const totalKey = keys.find(k => ['price', 'amount'].includes(k.toLowerCase()));
    if (totalKey) {
      const total = items.reduce((sum, i) => {
        const val = parseFloat(String(i[totalKey]));
        return isNaN(val) ? sum : sum + val;
      }, 0);

      lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));

      const totalLabel = 'TOTAL:';
      const totalValue = `$${total.toFixed(2)}`;
      const spacing = LINE_WIDTH - totalLabel.length - totalValue.length;
      const totalLine = totalLabel + ' '.repeat(spacing) + totalValue;

      lines.push(LEFT_ALIGN + MARGIN + totalLine);
    }
  } else {
    lines.push(LEFT_ALIGN + MARGIN + 'No items found.');
  }

  lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));
  lines.push(CENTER_ALIGN + footer);
  lines.push('\n\n\n');
  lines.push(GS + 'V' + 'A' + '\x10');

  return lines.join('\n');
};

export const generateOrderReceipt = (data: OrderReceiptData): string => {
  const ESC = '\x1B';
  const GS = '\x1D';
  const LEFT_ALIGN = ESC + 'a' + '\x00';
  const CENTER_ALIGN = ESC + 'a' + '\x01';
  const LINE_WIDTH = 40;
  const MARGIN = '  ';
  const lines: string[] = [];

  const SERVICE_COL_WIDTH = 20;
  const QTY_COL_WIDTH = 5;
  const PRICE_COL_WIDTH = 13;

  lines.push(ESC + '@'); 
  lines.push(CENTER_ALIGN + (data.header || `*** JT NAIL SALON ***`));
  lines.push(LEFT_ALIGN + MARGIN + '='.repeat(LINE_WIDTH));
  lines.push(LEFT_ALIGN + MARGIN + `Order #${data.order_number}`);

  const orderDate = data.date || 'Unknown';
  const staffName = data.staff_name || 'Unknown';
  lines.push(LEFT_ALIGN + MARGIN + `Date: ${orderDate}`);
  lines.push(LEFT_ALIGN + MARGIN + `Staff: ${staffName}`);

  lines.push(LEFT_ALIGN + MARGIN + '='.repeat(LINE_WIDTH));
  lines.push(
    LEFT_ALIGN + MARGIN +
    'SERVICE'.padEnd(SERVICE_COL_WIDTH) +
    'QTY'.padStart(Math.floor((QTY_COL_WIDTH + 3) / 2)).padEnd(QTY_COL_WIDTH) +
    'PRICE'.padStart(PRICE_COL_WIDTH)
  );
  lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));

  data.services.forEach(service => {
    const name = service.service_name.slice(0, SERVICE_COL_WIDTH).padEnd(SERVICE_COL_WIDTH);
    const qty = String(service.quantity).padStart(Math.floor((QTY_COL_WIDTH + String(service.quantity).length) / 2)).padEnd(QTY_COL_WIDTH);
    const price = `$${service.price.toFixed(2)}`.padStart(PRICE_COL_WIDTH);
    lines.push(LEFT_ALIGN + MARGIN + `${name}${qty}${price}`);
  });

  lines.push(LEFT_ALIGN + MARGIN + '='.repeat(LINE_WIDTH));

  if (data.extra_charges?.length) {
    lines.push(LEFT_ALIGN + MARGIN + `Extra Charges:`);
    data.extra_charges.forEach(charge => {
      const name = charge.name.slice(0, LINE_WIDTH - 12).padEnd(LINE_WIDTH - 12); // reserve 10+2 space for amount
      const amount = `$${charge.amount.toFixed(2)}`.padStart(10);
      lines.push(LEFT_ALIGN + MARGIN + `${name}${amount}`);
    });
    lines.push(LEFT_ALIGN + MARGIN + '='.repeat(LINE_WIDTH));
  }

  if (data.tip && data.tip > 0) {
    const tipLabel = 'Tip:';
    const tipValue = `$${data.tip.toFixed(2)}`;
    const spacing = LINE_WIDTH - tipLabel.length - tipValue.length;
    lines.push(LEFT_ALIGN + MARGIN + tipLabel + ' '.repeat(spacing) + tipValue);
    lines.push(LEFT_ALIGN + MARGIN + '='.repeat(LINE_WIDTH));
  }

  const totalLabel = 'TOTAL:';
  const totalValue = `$${data.total.toFixed(2)}`;
  const spacing = LINE_WIDTH - totalLabel.length - totalValue.length;
  lines.push(LEFT_ALIGN + MARGIN + totalLabel + ' '.repeat(spacing) + totalValue);

  lines.push(LEFT_ALIGN + MARGIN + '='.repeat(LINE_WIDTH));
  lines.push(CENTER_ALIGN + (data.footer || 'Thank you! See you soon!'));
  lines.push('\n\n\n'); 
  lines.push(GS + 'V' + 'A' + '\x10'); 

  return lines.join('\n');
};

export const generatePrintableData = (input: PrintableInput): string => {
  if (!input || (Array.isArray(input) && input.length === 0)) return "";

  const ESC = '\x1B';
  const GS = '\x1D';
  const LEFT_ALIGN = ESC + 'a' + '\x00';
  const CENTER_ALIGN = ESC + 'a' + '\x01';
  const LINE_WIDTH = 40;
  const MARGIN = '  ';

  const lines: string[] = [];
  lines.push(ESC + '@');

  const isArrayInput = Array.isArray(input);
  const isWrapped = !isArrayInput && typeof input === 'object' && 'data' in input;

  const data: Record<string, any>[] = isWrapped
    ? Array.isArray(input.data)
      ? input.data
      : [input.data]
    : isArrayInput
      ? input
      : [input];

  const header = isWrapped ? input.header || 'PRINT DATA' : 'PRINT DATA';
  const footer = isWrapped ? input.footer || 'Thank you!' : 'Thank you!';

  lines.push(CENTER_ALIGN + `*** ${header} ***`);
  lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));

  data.forEach((entry, index) => {
    if (data.length > 1) {
      lines.push(LEFT_ALIGN + MARGIN + `#${index + 1}`);
    }

    Object.entries(entry).forEach(([key, value]) => {
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      const line = `${formattedKey}: ${value ?? ''}`;
      lines.push(LEFT_ALIGN + MARGIN + line);
    });

    lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));
  });

  lines.push(CENTER_ALIGN + footer);
  lines.push('\n\n\n');

  lines.push(GS + 'V' + 'A' + '\x10');

  return lines.join('\n');
};


export const generateSalaryReceipt = (data: SalaryReceiptInput): string[] => {
  const ESC = '\x1B';
  const GS = '\x1D';
  const LEFT_ALIGN = ESC + 'a' + '\x00';
  const CENTER_ALIGN = ESC + 'a' + '\x01';
  const LINE_WIDTH = 40;
  const MARGIN = '  ';
  const CUT = GS + 'V' + '\x41' + '\x10';

  const isArrayInput = Array.isArray(data);
  const items: SalaryReceiptItem[] = isArrayInput ? data : data.items || [];
  const header = isArrayInput ? "SALARY RECEIPT" : data.header || "SALARY RECEIPT";
  const footer = isArrayInput ? "Thank you!" : data.footer || "Thank you!";

  if (!items.length) {
    return [ESC + '@' + CENTER_ALIGN + "No salary records found." + '\n\n' + CUT];
  }

  const chunkSize = 10;
  const chunks: SalaryReceiptItem[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return chunks.map((chunk) => {
    const lines: string[] = [];
    lines.push(ESC + '@');
    lines.push(CENTER_ALIGN + `*** ${header} ***`);
    lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));

    const colWidths = [12, 15, 5, 6]; 
    const headerRow = [
      'Date'.padEnd(colWidths[0]),
      'Staff'.padEnd(colWidths[1]),
      'Tip'.padEnd(colWidths[2]),
      'Salary'.padEnd(colWidths[3]),
    ].join('');
    lines.push(LEFT_ALIGN + MARGIN + headerRow);
    lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));

    chunk.forEach((item) => {
      const row = [
        String(item.date).padEnd(colWidths[0]).slice(0, colWidths[0]),
        String(item.staff_name).padEnd(colWidths[1]).slice(0, colWidths[1]),
        String(item.tip).toString().padEnd(colWidths[2]).slice(0, colWidths[2]),
        String(item.salary).toString().padEnd(colWidths[3]).slice(0, colWidths[3]),
      ].join('');
      lines.push(LEFT_ALIGN + MARGIN + row);
    });

    lines.push(LEFT_ALIGN + MARGIN + '-'.repeat(LINE_WIDTH));
    lines.push(CENTER_ALIGN + footer);
    lines.push('\n\n');
    lines.push(CUT);

    return lines.join('\n');
  });
};



