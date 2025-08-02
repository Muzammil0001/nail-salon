/**
 * ---> DeleteConfirmationDialog Component
 *
 * ---> A reusable dialog to confirm delete actions. Displays the item name and options
 * to confirm or cancel the operation.
 *
 * Usage:
 * ```tsx
 * <DeleteConfirmationDialog
 *   open={isDialogOpen}
 *   itemName="Sample Item"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 *
 * @param {boolean} open ---> Whether the dialog is visible.
 * @param {string} itemName ---> The name of the item to delete.
 * @param {function} onConfirm ---> Called when the user confirms the delete.
 * @param {function} onCancel ---> Called when the user cancels the action.
 */

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
  Box,
  Typography,
} from "@mui/material";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import axios from "axios";
import { ToastErrorMessage } from "./ToastMessages";
import { t } from "../../../lib/translationHelper";
import { useSelector } from "@/store/Store";
interface DeleteConfirmationDialogProps {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  itemName,
  onConfirm,
  onCancel,
}) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "confirm_delete_modal" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      }
    })();
  }, [languageUpdate]);
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(5px)",
        },
      }}
    >
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          backgroundColor: "#fef3f2",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 2,
          }}
        >
          <WarningRoundedIcon
            sx={{
              fontSize: 50,
              color: "#d32f2f",
              backgroundColor: "#fdecea",
              borderRadius: "50%",
              padding: "8px",
            }}
          />
        </Box>
        <DialogTitle sx={{ p: 0, mb: 2 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#2276FF", mb: 1 }}
          >
            {t("are_you_sure", keys)}
          </Typography>
          <Typography>
            {t("do_you_want_to_delete", keys)}{" "}
            <b className="capitalize">{itemName}</b>?
          </Typography>
        </DialogTitle>
        <DialogActions
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            mt: 3,
          }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              fontWeight: "bold",
              width: "100%",
              height: "45px",
            }}
          >
            {t("no", keys)}
          </Button>

          <Button
            variant="contained"
            onClick={onConfirm}
            sx={{
              fontWeight: "bold",
              width: "100%",
              height: "45px",
            }}
          >
            {t("yes", keys)}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
