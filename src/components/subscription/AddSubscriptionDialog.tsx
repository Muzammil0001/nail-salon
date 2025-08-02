import { Dialog, DialogContent, Typography, Button } from "@mui/material";
import "react-phone-number-input/style.css";
import CustomTextField from "../forms/theme-elements/CustomTextField";
import Grid from "@mui/material/Grid2";
import CustomFormLabel from "../forms/theme-elements/CustomFormLabel";
import CustomSelectCheckbox from "../forms/MultiSelect/CustomSelectCheckbox";
import { t } from "../../../lib/translationHelper"
import { useSelector } from "@/store/Store";
import { useState, useEffect } from "react"
import axios from "axios";

interface Props {
  open: boolean;
  features: any;
  action: string;
  formik: any;
  handleClose: any;
}

const AddSubscriptionDialog = ({
  open,
  features,
  formik,
  action,
  handleClose,
}: Props) => {

  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "subscriptions" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      } 
    })();
  }, [languageUpdate]);

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs"
      BackdropProps={{
        style: {
          backdropFilter: "blur(5px)",
        },
      }}
    >
      <DialogContent>
        <form encType="multipart/form-data" onSubmit={formik.handleSubmit}>
          <Typography variant="h3" style={{ fontWeight: "bold" }}>
            {action === "create"
              ? t("add_subscription", keys)
              : t("edit_subscription", keys)}
          </Typography>

          <CustomFormLabel required>{t("name", keys)}</CustomFormLabel>
          <CustomTextField
            fullWidth
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && t(formik.errors.name, keys)}
          />

          <CustomFormLabel required>{t("description", keys)}</CustomFormLabel>
          <CustomTextField
            fullWidth
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && t(formik.errors.description, keys)}
          />

          <CustomFormLabel required>{t("price", keys)}</CustomFormLabel>
          <CustomTextField
            fullWidth
            name="price"
            value={formik.values.price}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.price && Boolean(formik.errors.price)}
            helperText={formik.touched.price && t(formik.errors.price, keys)}
            InputProps={{
              startAdornment: <span>&euro;</span>,
            }}
          />

          <CustomFormLabel required>{t("yearly_price", keys)}</CustomFormLabel>
          <CustomTextField
            fullWidth
            name="yearly_price"
            value={formik.values.yearly_price}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.yearly_price && Boolean(formik.errors.yearly_price)}
            helperText={formik.touched.yearly_price && t(formik.errors.yearly_price, keys)}
            InputProps={{
              startAdornment: <span>&euro;</span>,
            }}
          />

          <CustomFormLabel required>{t("max_devices", keys)}</CustomFormLabel>
          <CustomTextField
            fullWidth
            name="max_devices"
            value={formik.values.max_devices}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.max_devices && Boolean(formik.errors.max_devices)}
            helperText={formik.touched.max_devices && t(formik.errors.max_devices, keys)}
          />
          
          <CustomFormLabel required>{t("max_locations", keys)}</CustomFormLabel>
          <CustomTextField
            fullWidth
            name="max_locations"
            value={formik.values.max_locations}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.max_locations && Boolean(formik.errors.max_locations)}
            helperText={formik.touched.max_locations && t(formik.errors.max_locations, keys)}
          />

          <CustomFormLabel>{t("features", keys)}</CustomFormLabel>

          <CustomSelectCheckbox
            label={t("select_options", keys)}
            options={features?.map((feature: any) => ({
              label: feature.name,
              value: feature.id,
            }))}
            value={formik.values.subscription_feature}
            onChange={(value: any) =>
              formik.setFieldValue("subscription_feature", value)
            }
          />

          <div className="flex justify-end items-center gap-1 mt-4">
            <Button
              sx={{ marginX: "10px" }}
              variant="outlined"
              type="button"
              onClick={() => {
                handleClose();
              }}
            >
              {t("close", keys)}
            </Button>
            <Button color="primary" variant="contained" type="submit">
              {action === "create" ? t("create", keys) : t("update", keys)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubscriptionDialog;
