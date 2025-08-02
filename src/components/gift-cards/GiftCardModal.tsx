import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  Card,
  CardContent,
  InputAdornment,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  IconX,
  IconCreditCard,
  IconCalendar,
  IconCurrencyDollar,
  IconReload,
} from "@tabler/icons-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { useSelector } from "@/store/Store";
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from "@/components/common/ToastMessages";
import { t } from "../../../lib/translationHelper";

interface GiftCardModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  giftCard?: any;
  onSuccess: () => void;
}

const initialForm = {
  name: "",
  description: "",
  amount: "",
  number_of_times: 1,
  expiry_date: null,
  is_percentage: false,
  gift_code: "",
}

const GiftCardModal: React.FC<GiftCardModalProps> = ({
  open,
  onClose,
  mode,
  giftCard,
  onSuccess,
}) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    number_of_times: "" as number | "",
    expiry_date: null as Date | null,
    is_percentage: false,
    gift_code: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    amount: "",
    gift_code: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "gift_cards" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      }
    })();
  }, [languageUpdate]);

  useEffect(() => {
    if (giftCard && mode !== "create") {
      setFormData({
        name: giftCard.name || "",
        description: giftCard.description || "",
        amount: giftCard.amount?.toString() || "",
        number_of_times: giftCard.number_of_times || 1,
        expiry_date: giftCard.expiry_date ? new Date(giftCard.expiry_date) : null,
        is_percentage: giftCard.is_percentage || false,
        gift_code: giftCard.card_code || "",
      });
    } else {
      // Set default expiry date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999); // Set to end of day

      setFormData({
        name: "",
        description: "",
        amount: "",
        number_of_times: 1,
        expiry_date: tomorrow,
        is_percentage: false,
        gift_code: generateRandomGiftCode(),
      });
    }
    setErrors({ name: "", amount: "", gift_code: "" });
  }, [giftCard, mode]);

  const validateForm = () => {
    const newErrors = { name: "", amount: "", gift_code: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = t("name_required", keys);
      isValid = false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t("amount_required", keys);
      isValid = false;
    }

    if (formData.is_percentage && parseFloat(formData.amount) > 100) {
      newErrors.amount = t("percentage_cannot_exceed_100", keys);
      isValid = false;
    }

    if (!formData.gift_code || !/^[A-Z0-9]{4}$/.test(formData.gift_code)) {
      newErrors.gift_code = t("gift_code_invalid", keys);
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        number_of_times: formData.number_of_times,
        expiry_date: formData.expiry_date?.toISOString(),
        is_percentage: formData.is_percentage,
        gift_code: formData.gift_code,
      };

      let response;
      if (mode === "create") {
        response = await axios.post("/api/gift-cards/creategiftcard", payload);
      } else {
        response = await axios.post("/api/gift-cards/updategiftcard", {
          id: giftCard?.id,
          ...payload,
        });
      }

      if (response.data.success) {
        // Close modal and reset form
        onClose();
        setFormData(initialForm);
        setErrors({ name: "", amount: "", gift_code: "" });

        // Call success callback to refresh the listing
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving gift card:", error);
      // Handle error (you might want to show a toast message here)
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAmount = (amount: number, isPercentage: boolean) => {
    if (isPercentage) {
      return `${amount.toFixed(2)}%`;
    } else {
      return formatCurrency(amount);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString();
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return date < new Date();
  };

  const getStatusColor = (status: boolean) => {
    return status ? "success" : "error";
  };

  const getStatusText = (status: boolean) => {
    return status ? "active" : "inactive";
  };

  const generateRandomGiftCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handlePercentageToggle = (isPercentage: boolean) => {
    if (isPercentage && !formData.gift_code) {
      setFormData({ ...formData, is_percentage: isPercentage, gift_code: generateRandomGiftCode() });
    } else if (!formData.gift_code) {
      // Generate gift code for fixed amount if not already present
      setFormData({ ...formData, is_percentage: isPercentage, gift_code: generateRandomGiftCode() });
    } else {
      setFormData({ ...formData, is_percentage: isPercentage });
    }
  };

  const handleGiftCodeChange = (value: string) => {
    // Only allow uppercase letters and numbers, max 4 characters
    const sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setFormData({ ...formData, gift_code: sanitizedValue });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold" color="primary">
            {mode === "create" && t("create_gift_card", keys)}
            {mode === "edit" && t("edit_gift_card", keys)}
            {mode === "view" && t("gift_card_details", keys)}
          </Typography>
          <IconButton
            onClick={() => {
              onClose();
              if (mode === "create") {
                setFormData(initialForm);
                setErrors({ name: "", amount: "", gift_code: "" });
              }
            }} size="small">
            <IconX size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Grid container spacing={3}>
          {/* Credit Card Display */}
          <Grid item xs={12}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                borderRadius: 3,
                position: "relative",
                overflow: "hidden",
                minHeight: 200,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -30,
                  left: -30,
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                  <IconCreditCard size={40} />
                  {giftCard && (
                    <Chip
                      label={t(getStatusText(giftCard.active_status), keys)}
                      color={getStatusColor(giftCard.active_status) as any}
                      size="small"
                      sx={{ color: "white" }}
                    />
                  )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h3">
                      {t("card_name", keys)}
                    </Typography>
                    <Typography variant="h1">
                      {giftCard?.name || formData.name || ""}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h3">
                      {t("expires", keys)}
                    </Typography>
                    <Typography variant="h2">
                      {giftCard?.expiry_date ? formatDate(new Date(giftCard.expiry_date)) : formatDate(formData.expiry_date)}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3">
                      {t("gift_code", keys)}
                    </Typography>
                    <Typography variant="h2">
                      {formData.gift_code || "••••"}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h3">
                      {formData.is_percentage ? t("discount", keys) : t("amount", keys)}
                    </Typography>
                    <Typography variant="h2">
                      {giftCard
                        ? formatAmount(giftCard.amount, giftCard.is_percentage)
                        : formatAmount(parseFloat(formData.amount) || 0, formData.is_percentage)
                      }
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Form Fields */}
          {mode !== "view" && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t("name", keys)}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={!!errors.name}
                    helperText={errors.name}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconCreditCard size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_percentage}
                        onChange={(e) => handlePercentageToggle(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" color="textSecondary">
                        {formData.is_percentage ? t("percentage_discount", keys) : t("fixed_amount", keys)}
                      </Typography>
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={
                      formData.is_percentage
                        ? t("discount_percentage", keys)
                        : t("amount", keys)
                    }
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    error={!!errors.amount}
                    helperText={errors.amount}
                    disabled={loading}
                    inputProps={{
                      min: 0,
                      max: formData.is_percentage ? 100 : undefined,
                      step: formData.is_percentage ? 0.01 : 0.01
                    }}
                    InputProps={{
                      startAdornment: formData.is_percentage ? undefined : (
                        <InputAdornment position="start">
                          <IconCurrencyDollar size={20} />
                        </InputAdornment>
                      ),
                      endAdornment: formData.is_percentage ? (
                        <InputAdornment position="end">
                          <Typography variant="body2" color="textSecondary">
                            %
                          </Typography>
                        </InputAdornment>
                      ) : undefined,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t("number_of_times", keys)}
                    type="number"
                    value={formData.number_of_times}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        number_of_times: val === "" ? "" : parseInt(val),
                      });
                    }}
                    disabled={loading}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box position="relative">
                    <DatePicker
                      selected={formData.expiry_date}
                      onChange={(date) => setFormData({ ...formData, expiry_date: date })}
                      disabled={loading}
                      dateFormat="MM/dd/yyyy"
                      placeholderText={t("expiry_date", keys)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      wrapperClassName="w-full"
                    />
                    <IconCalendar
                      size={20}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t("gift_code", keys)}
                    value={formData.gift_code}
                    onChange={(e) => handleGiftCodeChange(e.target.value)}
                    error={!!errors.gift_code}
                    helperText={errors.gift_code || t("", keys)}
                    disabled={loading}
                    inputProps={{
                      maxLength: 4,
                      style: { textTransform: 'uppercase' }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconCreditCard size={20} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setFormData({ ...formData, gift_code: generateRandomGiftCode() })}
                            disabled={loading}
                          >
                            <IconReload size={16} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t("description", keys)}
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* View Mode Details */}
          {mode === "view" && giftCard && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t("gift_code", keys)}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {giftCard.card_code}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t("name", keys)}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {giftCard.name}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {giftCard.is_percentage ? t("discount_percentage", keys) : t("amount", keys)}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatAmount(giftCard.amount, giftCard.is_percentage)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t("discount_type", keys)}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {giftCard.is_percentage ? t("percentage_discount", keys) : t("fixed_amount", keys)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t("number_of_times", keys)}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {giftCard.number_of_times}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t("times_used", keys)}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {giftCard.times_used}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t("remaining_uses", keys)}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color={giftCard.number_of_times - giftCard.times_used <= 0 ? "error" : "success"}>
                    {giftCard.number_of_times - giftCard.times_used}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t("expiry_date", keys)}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(new Date(giftCard.expiry_date))}
                    {isExpired(new Date(giftCard.expiry_date)) && (
                      <Chip
                        label={t("expired", keys)}
                        color="error"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Grid>

                {giftCard.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t("description", keys)}
                    </Typography>
                    <Typography variant="body1">
                      {giftCard.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          {mode === "view" ? t("close", keys) : t("cancel", keys)}
        </Button>
        {mode !== "view" && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={<IconCreditCard size={20} />}
          >
            {loading
              ? t("saving", keys)
              : mode === "create"
                ? t("create", keys)
                : t("update", keys)}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GiftCardModal; 