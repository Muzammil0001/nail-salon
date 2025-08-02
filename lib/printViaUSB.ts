import {
  ToastErrorMessage,
  ToastSuccessMessage
} from "@/components/common/ToastMessages";

import {
  generateReceipt,
  generatePrintableData,
  generateSalaryReceipt,
  generateOrderReceipt
} from "./printableTemplates";

export async function printViaUSB({
  data,
  printType = "payment_receipt",
  openDrawer = false
}: {
  data: any;
  printType?: "payment_receipt" | "data" | "salary_receipt" | "order_receipt";
  openDrawer?: boolean;
}) {
  try {
    const filters: USBDeviceFilter[] = [];

    const device = await navigator.usb.requestDevice({ filters });

    await device.open();

    if (!device.configuration) await device.selectConfiguration(1);
    if (!device.configuration) {
      ToastErrorMessage("an_unknown_error_occurred");
      throw new Error("Failed to set printer configuration.");
    }

    const iface = device.configuration.interfaces.find((i) =>
      i.alternate.endpoints.some((e) => e.direction === "out")
    );
    if (!iface) {
      ToastErrorMessage("an_unknown_error_occurred");
      throw new Error("No valid OUT interface found.");
    }

    await device.claimInterface(iface.interfaceNumber);

    const endpointOut = iface.alternate.endpoints.find(
      (e) => e.direction === "out"
    );
    if (!endpointOut) {
      ToastErrorMessage("an_unknown_error_occurred");
      throw new Error("No OUT endpoint.");
    }

    const getPrintableContent = (
      type: "payment_receipt" | "salary_receipt" | "order_receipt" | "data",
      data: any
    ): string => {
      switch (type) {
        case "payment_receipt":
          return generateReceipt(data);
        case "order_receipt":
          return generateOrderReceipt(data);
        default:
          return generatePrintableData(data);
      }
    };

    const encoder = new TextEncoder();
    const drawer = "\x1B\x70\x00\x19\xFA";

    if (printType === "salary_receipt") {
      const chunks = generateSalaryReceipt(data);
      for (const chunk of chunks) {
        await device.transferOut(
          endpointOut.endpointNumber,
          encoder.encode(chunk)
        );
      }
    } else {
      const receipt = getPrintableContent(printType, data);
      await device.transferOut(endpointOut.endpointNumber, encoder.encode(receipt));
    }

    if (openDrawer) {
      await device.transferOut(endpointOut.endpointNumber, encoder.encode(drawer));
    }

    ToastSuccessMessage("printed_successfully");
    return true;
  } catch (err) {
    console.error("USB print failed:", err);
    ToastErrorMessage("print_failed");
    return false;
  }
}
