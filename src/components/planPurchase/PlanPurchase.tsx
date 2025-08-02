import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

const PlanPurchase: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'starter' | 'ultimate'>('premium');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleBillingCycleChange = (
    event: React.MouseEvent<HTMLElement>,
    newBillingCycle: 'monthly' | 'yearly' | null
  ) => {
    if (newBillingCycle !== null) {
      setBillingCycle(newBillingCycle);
    }
  };

  const handlePlanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPlan(event.target.value as 'premium' | 'starter' | 'ultimate');
  };

  const includedFeatures: string[] = [
    "Admin Dashboard",
    "QR Menu",
    "Menu Editing",
    "Restaurant Website",
    "Kitchen Display System",
    "Takeaway & Delivery",
    "Stock Management",
    "Contactless Payment",
    "Mobile App (iOS & Android)",
  ];

  const notIncludedFeatures: string[] = [
    "Multiple Restaurants",
    "Unlimited Waiter App Users",
    "24/7 Support",
    "Dedicated Account Manager",
  ];

  return (
    <Grid container justifyContent="center">
      <Grid item xs={12} md={10} lg={8}>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              color="primary"
              value={billingCycle}
              exclusive
              onChange={handleBillingCycleChange}
              aria-label="billing cycle"
              fullWidth
            >
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="yearly">Yearly</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <RadioGroup
            aria-label="pricing plan"
            name="pricing-plan"
            value={selectedPlan}
            onChange={handlePlanChange}
          >
            {['premium', 'starter', 'ultimate'].map((plan) => (
              <Box
                key={plan}
                sx={{
                  mb: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'primary.light',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <FormControlLabel
                  value={plan}
                  control={<Radio />}
                  label={
                    <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', ml: 1 }}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </Typography>
                  }
                />
                <Box sx={{ display: 'flex', alignItems: 'center', mt: { xs: 1, sm: 0 } }}>
                  {plan === 'premium' && (
                    <Chip
                      label="Popular"
                      size="small"
                      sx={{
                        bgcolor: '#2276FF33',
                        color: 'primary.main',
                        fontWeight: 'medium',
                        borderRadius: '6px',
                        mr: 2,
                      }}
                    />
                  )}
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                      {plan === 'premium' ? '99€' : plan === 'starter' ? '19€' : '199€'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
                      /{billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </RadioGroup>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>What's included</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {includedFeatures.map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>What's not included</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {notIncludedFeatures.map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CancelOutlinedIcon color="error" fontSize="small" />
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Sub Total</Typography>
              <Typography>79.20€</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>VAT (25%)</Typography>
              <Typography>19.80€</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6">99.00€</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PlanPurchase;
