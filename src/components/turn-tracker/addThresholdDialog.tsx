import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import axios from "axios";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/components/forms/theme-elements/CustomTextField";
import Loader from "../loader/Loader";
import { ToastSuccessMessage, ToastErrorMessage } from "../common/ToastMessages";

interface ThresholdDialogProps {
  open: boolean;
  onClose: () => void;
  t: (key: string, keys?: any) => string;
  keys?: any;
}

const ThresholdDialog: React.FC<ThresholdDialogProps> = ({
  open,
  onClose,
  t,
  keys,
}) => {
  const [threshold, setThreshold] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setThreshold("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  const handleSave = async () => {
    const value = Number(threshold);
    if (isNaN(value) || value <= 0) {
      setError(t("please_enter_a_valid_number_greater_than_0", keys));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/turntracker/addrotationthreshold", {
        threshold: value,
      });

      if (response.status === 200) {
        ToastSuccessMessage(t("threshold_saved_successfully", keys));
        onClose();
      } else {
        ToastErrorMessage(t("failed_to_save_threshold", keys));
      }
    } catch (err: any) {
      ToastErrorMessage(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchThresholdValue = async () => {
      try {
        const response = await axios.post("/api/turntracker/fetchrotationthreshold", {});
        if (response.status === 200) {
          setThreshold(response?.data?.data?.reservation_threshold || 0);
        } else {
          ToastErrorMessage(t("failed_to_fetch_reservation_threshold_value", keys));
        }
      } catch (error) {
        ToastErrorMessage(error);
        console.error("~ error while fetching reservation threshold value:", error);
      }
    };
    fetchThresholdValue();
  }, [open]);

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="xs" fullWidth>
      <Loader loading={loading} />
      <DialogTitle sx={{ textTransform: "capitalize", lineHeight:"25px" }}>
        {t("set_appointment_threshold_value_for_turn_tracking", keys)}
      </DialogTitle>
      <DialogContent>
        <Box mt={1.5}>
          <CustomFormLabel required>
            {t("appointment_threshold_value", keys)}
          </CustomFormLabel>
          <CustomTextField
            fullWidth
            value={threshold}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setThreshold(e.target.value)
            }
            type="number"
            placeholder={t("enter_threshold_value", keys)}
            disabled={loading}
            inputProps={{ min: 0, step: "any" }}
          />
          {error && <p className="text-red-500 mt-2 text-xs">{t(error as string, keys)}</p>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {t("cancel", keys)}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? t("saving", keys) : t("save", keys)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThresholdDialog;
