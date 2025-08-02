import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { t } from '../../../lib/translationHelper';

interface Customer {
  name: string;
  email: string;
  phone: string;
  existingCustomer: boolean;
}

interface Props {
  onCustomerChange: (customer: Customer, isValid: boolean) => void;
  keys: any;
}

const CustomerDetailsSection: React.FC<Props> = ({ onCustomerChange, keys }) => {
  const [existingCustomer, setExistingCustomer] = useState(true);
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    existingCustomer: true,
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const validate = (updated: Customer) => {
    const tempErrors: typeof errors = {};

    if (!updated.email) {
      tempErrors.email = 'email_is_required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email)) {
      tempErrors.email = 'invalid_email';
    }

    if (!updated.existingCustomer) {
      if (!updated.name) tempErrors.name = 'name_is_required';
      if (!updated.phone) tempErrors.phone = 'phone_is_required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...customer, [name]: value };
    setCustomer(updated);
    const isValid = validate(updated);
    onCustomerChange(updated, isValid);
  };

  const handleCustomerTypeToggle = () => {
    const updated = {
      ...customer,
      existingCustomer: !existingCustomer,
    };
    setExistingCustomer(!existingCustomer);
    setCustomer(updated);
    const isValid = validate(updated);
    onCustomerChange(updated, isValid);
  };

  return (
    <Box my={2}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            {t("customer_details", keys)}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Checkbox checked={existingCustomer} onChange={handleCustomerTypeToggle} />}
              label={t("existing_customer", keys)}
            />

            <TextField
              label={t("email", keys)}
              name="email"
              value={customer.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email && t(errors.email, keys)}
              fullWidth
              required
            />

            {!existingCustomer && (
              <>
                <TextField
                  label={t("name", keys)}
                  name="name"
                  value={customer.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={(errors.name && t(errors.name, keys))}
                  fullWidth
                  required
                />
                <TextField
                  label={t("phone", keys)}
                  name="phone"
                  value={customer.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                  helperText={errors.phone && t(errors.phone, keys)}
                  fullWidth
                  required
                />
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CustomerDetailsSection;
