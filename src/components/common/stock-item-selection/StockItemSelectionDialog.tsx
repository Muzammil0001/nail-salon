import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Grid,
  FormControl,
  Box,
} from "@mui/material";
import { t } from "../../../../lib/translationHelper";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import CustomSelectCheckbox from "@/components/forms/MultiSelect/AdvanceSelectCheckbox";
import Loader from "@/components/loader/Loader";
import axios from "axios";
import { useSelector } from "@/store/Store";

interface StockItemSelectDialogProps {
  open: boolean;
  onClose: () => void;
  data: any[];
  selectedItems: string[];
  setSelectedItems: (products: string[]) => void;
  onSave: () => void;
}

const StockItemSelectDialog: React.FC<StockItemSelectDialogProps> = ({
  open,
  onClose,
  data,
  selectedItems,
  setSelectedItems,
  onSave,
}) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "item_selection_dialog" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  const handleDiscard = () => {
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          width: "30%",
          height: "50%",
        },
      }}
    >
      <Loader loading={loading} />
      <DialogContent sx={{ height: "100%", overflowY: "auto" }}>
        <Box>
          <FormControl fullWidth>
            <CustomFormLabel required>{t("items", keys)}</CustomFormLabel>
            <CustomSelectCheckbox
              placeholder={t("select_items", keys)}
              sx={{ height: "56px" }}
              label={t("items", keys)}
              options={data?.map((item: any) => ({
                label: item?.item_name,
                value: String(item?.id),
              }))}
              value={selectedItems.map(String)}
              onChange={(value: string[]) => setSelectedItems(value)}
            />
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          sx={{ width: "100%", height: "56px", fontSize: "16px" }}
          onClick={handleDiscard}
          variant="outlined"
          color="primary"
        >
          {t("close", keys)}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            onSave();
            onClose();
          }}
          sx={{ width: "100%", height: "56px", fontSize: "16px" }}
        >
          {t("save", keys)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockItemSelectDialog;
