import React, { useState, useEffect } from 'react';
import { IconButton, Button, Tooltip } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { generateReceipt,generatePrintableData } from '../../../lib/printableTemplates';
import { ToastErrorMessage, ToastSuccessMessage } from '../common/ToastMessages';
import { t } from "../../../lib/translationHelper"
import { useSelector } from "@/store/Store";
import Loader from "@/components/loader/Loader"
import axios from 'axios';

interface UsbPrintButtonProps {
  printType?:"payment_receipt"|"data";
  component?: 'icon' | 'button';
  data: any;
  onClick?: () => void;
  label?: string;
}

const UsbPrintButton: React.FC<UsbPrintButtonProps> = ({
  printType="payment_receipt",
  component = 'icon',
  data,
  onClick,
  label = 'print',
}) => {
  const [printing, setPrinting] = useState(false);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
const [loading , setLoading]= useState(false)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "printer_setting" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const handlePrint = async () => {
    setPrinting(true);
    if (onClick) onClick();

    try {
      const filters: USBDeviceFilter[] = [];

      const device = await navigator.usb.requestDevice({ filters });

      // if (!device.productName?.toLowerCase().includes('pos')) {
      //   ToastErrorMessage('Please select a POS printer.');
      //   setPrinting(false);
      //   return;
      // }

      await device.open();

      if (!device.configuration) await device.selectConfiguration(1);
      if (!device.configuration) {
        ToastErrorMessage("an_unknown_error_occurred");
        throw new Error('Failed to set printer configuration.')
      };

      const iface = device.configuration.interfaces.find((i) =>
        i.alternate.endpoints.some((e) => e.direction === 'out')
      );
      if (!iface){ToastErrorMessage("an_unknown_error_occurred"); throw new Error('No valid OUT interface found.')};

      await device.claimInterface(iface.interfaceNumber);

      const endpointOut = iface.alternate.endpoints.find((e) => e.direction === 'out');
      if (!endpointOut){ToastErrorMessage("an_unknown_error_occurred"); throw new Error('No OUT endpoint.');}

      const encoder = new TextEncoder();
      const receipt = printType==="payment_receipt" ? generateReceipt(data) :generatePrintableData(data);
      const drawer = '\x1B\x70\x00\x19\xFA';

      await device.transferOut(endpointOut.endpointNumber, encoder.encode(receipt));
      await device.transferOut(endpointOut.endpointNumber, encoder.encode(drawer));

      ToastSuccessMessage('printed_successfully');
    } catch (err) {
      console.error('Print failed:', err);
      ToastErrorMessage('print_failed');
    } finally {
      setPrinting(false);
    }
  };

  if (component === 'button') {
    return (
      <>
      <Loader loading={loading}/> <Button
        variant="contained"
        onClick={handlePrint}
        disabled={printing}
        startIcon={<PrintIcon />}
      >
        {printing ? t('printing',keys) : t(label, keys)}
      </Button>
      </>
     
    );
  }

  return (
    <>
    <Loader loading={loading}/>
    <Tooltip title={t("print", keys)}>
    <IconButton  onClick={handlePrint} disabled={printing} color="primary">
      <PrintIcon className="size-[20px] text-blue-600" />
    </IconButton>
    </Tooltip>
    </>
  );
};

export default UsbPrintButton;
