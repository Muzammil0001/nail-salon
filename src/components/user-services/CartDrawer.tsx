import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    IconButton,
    Button,
    Divider,
    Stack,
    Grid,
    TextField,
} from '@mui/material';
import type { PaymentIntent } from '@stripe/stripe-js';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TipDialog from './TipDialog';
import ExtraChargesDialog from './ExtraChargesDialog';
import axios from 'axios';
import { ToastErrorMessage, ToastSuccessMessage } from '../common/ToastMessages';
import Loader from '../loader/Loader';
import CheckoutFormDialog from "@/components/stripe/checkoutDialog";
import OrderPaymentQrDialog from "./OrderPaymentQrDialog";
import { t } from "../../../lib/translationHelper";
import { printViaUSB } from '../../../lib/printViaUSB';
import moment from 'moment';
import { checkAccess } from '../../../lib/clientExtras';
import { AccessRights2 } from '@/types/admin/types';
import CustomerDetailsSection from './CustomerDetailsForm';
interface ServiceItem {
    id: string;
    name: string;
    price: number;
}

interface ExtraCharge {
    name: string;
    amount: number;
}

interface Customer {
    name: string;
    email: string;
    phone: string;
    existingCustomer: boolean;
}

interface Props {
    cartItems: ServiceItem[];
    setCartItems: (items: ServiceItem[]) => void;
    onAddService: (item: ServiceItem) => void;
    onRemoveService: (item: ServiceItem) => void;
    onRemoveAllServices: (item: ServiceItem) => void;
    tipAmount: number;
    setTipAmount: (amount: number) => void;
    extraCharges: ExtraCharge[];
    setExtraCharges: (charges: ExtraCharge[]) => void;
    session: any;
    keys: any;
    selectedStaff: any;
    onOrderComplete: () => void;
    activeCartNumber:string;
}

const CartDrawer: React.FC<Props> = ({
    cartItems,
    setCartItems,
    onAddService,
    onRemoveService,
    onRemoveAllServices,
    tipAmount,
    setTipAmount,
    extraCharges,
    setExtraCharges,
    session,
    keys,
    selectedStaff,
    onOrderComplete,
    activeCartNumber
}) => {
    const [discount, setDiscount] = useState<number>(0);
    const [tipDialogOpen, setTipDialogOpen] = useState(false);
    const [extraDialogOpen, setExtraDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paymentType, setPaymentType] = useState("cash");
    const [cartData, setCartData] = useState<null | any>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [customerData, setCustomerData] = useState<Customer>({
        name: '',
        email: '',
        phone: '',
        existingCustomer: false,
    });

    const handleClear = () => {
        setCartItems([]);
        setTipAmount(0);
        setExtraCharges([]);
        localStorage.removeItem('pos_cart_data');
        localStorage.removeItem('pos_selected_staff');
    };

    const grouped = cartItems.reduce(
        (acc: Record<string, { item: ServiceItem; quantity: number }>, item) => {
            if (!acc[item.id]) {
                acc[item.id] = { item, quantity: 1 };
            } else {
                acc[item.id].quantity += 1;
            }
            return acc;
        },
        {}
    );

    const hasItems = Object.keys(grouped).length > 0;
    const subtotal = Object.values(grouped).reduce(
        (acc, { item, quantity }) => acc + item.price * quantity,
        0
    );

    const discountAmount = (subtotal * discount) / 100;
    const extraTotal = extraCharges.reduce((acc, curr) => acc + curr.amount, 0);
    const total = subtotal - discountAmount + tipAmount + extraTotal;


    const onSubmit = async (payload: any) => {
        try {
            setLoading(true)
            if (payload?.paymentMethod === "card" && !payload?.paymentIntent) {
                ToastErrorMessage("unable to save order due to card payment issue")
                return;
            }
            const response = await axios.post('/api/orders/createorder', payload);
            ToastSuccessMessage(response?.data?.message)
            handleClear();
            onOrderComplete();
        } catch (error: any) {
            console.error('Checkout error:', error);
            ToastErrorMessage(error)
        } finally {
            setLoading(false)
        }
    };

    const transformCartToReceiptData = (cart: any) => {
        const services = cart?.services.map((item: any) => ({
            service_name: item.name,
            price: item.price,
            quantity: item.quantity,
        }));

        const extra_charges = cart?.extraCharges?.length > 0 ? cart?.extraCharges?.map((charge: any) => ({
            name: charge.name,
            amount: charge.amount,
        })) : [];

        return {
            order_number: "DRAFT",
            services,
            extra_charges: extra_charges.length ? extra_charges : [],
            tip: cart?.tip || 0,
            total: cart?.total,
            header: '*** JT NAIL SALON ***',
            footer: 'Thank you! See you soon!',
            date: moment(cart?.timestamp).format("DD/MM/YYYY"),
            staff_name: `${selectedStaff?.first_name} ${selectedStaff?.last_name}` || "",
        };
    };


    const handlePrint = async (data: any) => {
        try {
            if (data) {
                const formatedData = transformCartToReceiptData(data)
                await printViaUSB({
                    data: formatedData,
                    printType: "order_receipt",
                });
            }
        } catch (error) {
            ToastErrorMessage(error);
        }
    };

    const handleCheckout = (paymentMethod: 'card' | 'qr' | 'cash' | 'darft') => {
        setPaymentType(paymentMethod)

        if (!selectedStaff) {
            ToastErrorMessage("please_select_staff_first")
            return;
        }

        if (customerData?.existingCustomer) {
            if (!customerData?.email) {
                ToastErrorMessage("please_enter_email_for_customer");
                return;
            }
        } else {
            if (!customerData?.email || !customerData?.phone || !customerData?.name) {
                ToastErrorMessage("please_enter_customer_details");
                return;
            }
        }

        const payload = {
            staff_id: selectedStaff.id,
            userId: session?.user?.roles?.includes("Owner")
                ? session?.user?.id
                : session?.user?.client_id,
            services: Object.values(grouped).map(({ item, quantity }) => ({
                serviceId: item.id,
                name: item.name,
                price: item.price,
                quantity,
            })),
            subtotal,
            discount: discountAmount,
            tip: tipAmount,
            extraCharges,
            total,
            paymentMethod,
            location_id: session?.user?.selected_location_id,
            timestamp: new Date().toISOString(),
            customer: customerData
        };

        setCartData(payload)
        if (paymentMethod === "cash") { onSubmit(payload) }
        else if (paymentMethod === 'darft') { handlePrint(payload) }
    }

    const handleStripeSuccess = ({ paymentIntent }: { paymentIntent: PaymentIntent | null }) => {
        if (paymentIntent?.id) {
            const payload = cartData;
            payload.paymentIntent = paymentIntent;
            onSubmit(payload);
        }
    };

    useEffect(() => {
        if (paymentSuccess) {
            ToastSuccessMessage("payment_sccuess_and_order_done")
            handleClear();
        }
    }, [paymentSuccess])

    return (
        <>
            <Loader loading={loading} />
            <Box
                p={2}
                sx={{
                    height: '100%',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#ccc',
                        borderRadius: '4px',
                    },
                }}
            >
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    mb={2}
                    p={2}
                    sx={{
                        backgroundColor: '#f5f5f5',
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{ fontWeight: 600 }}
                    >
                        <ShoppingCartIcon sx={{ fontSize: '28px', color: 'primary.main' }} /> {`${t("cart", keys)} #${activeCartNumber.slice(-4)}`}
                    </Typography>
                </Box>

                {hasItems ? (
                    <>
                        <List>
                            {Object.values(grouped).map(({ item, quantity }) => (
                                <ListItem
                                    key={item.id}
                                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <Box>
                                        <Typography fontWeight={600}>{item.name}</Typography>
                                        <Typography variant="body2">
                                            ${item.price.toFixed(2)} x {quantity}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <IconButton onClick={() => onRemoveService(item)} size="small">
                                            <RemoveIcon fontSize="small" />
                                        </IconButton>
                                        <Typography>{quantity}</Typography>
                                        <IconButton onClick={() => onAddService(item)} size="small">
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => onRemoveAllServices(item)}
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>

                        <Divider sx={{ my: 2 }} />
                        <CustomerDetailsSection keys={keys} onCustomerChange={(customer) => setCustomerData(customer)} />
                        <Divider sx={{ my: 2 }} />
                        <TextField
                            label={t("discount_percentage", keys)}
                            type="number"
                            size="small"
                            value={discount}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setDiscount(isNaN(val) ? 0 : Math.min(Math.max(val, 0), 100));
                            }}
                            fullWidth
                            InputProps={{ inputProps: { min: 0, max: 100 } }}
                            sx={{ mb: 2 }}
                        />

                        <Stack spacing={1} mb={2}>
                            <Button
                                startIcon={<AttachMoneyIcon />}
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => setTipDialogOpen(true)}
                            >
                                {t("add_tip", keys)}
                            </Button>
                            <Button
                                startIcon={<PaymentsIcon />}
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => setExtraDialogOpen(true)}
                            >
                                {t("add_extra_charges", keys)}
                            </Button>
                            <Button
                                startIcon={<ReceiptIcon />}
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => handleCheckout("darft")}
                            >
                                {t("print_card_receipt", keys)}
                            </Button>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Box
                            mb={2}
                            p={2}
                            sx={{
                                bgcolor: '#f9f9f9',
                                borderRadius: 2,
                                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                                {t("summary", keys)}
                            </Typography>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography>{t("staff", keys)}</Typography>
                                <Typography>{selectedStaff && `${selectedStaff?.first_name} ${selectedStaff?.last_name}`}</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography>{t("subtotal", keys)}</Typography>
                                <Typography>${subtotal.toFixed(2)}</Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography>{t("discount", keys)}</Typography>
                                <Typography sx={{ color: 'error.main' }}>-${discountAmount.toFixed(2)}</Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography>{t("tip", keys)}</Typography>
                                <Typography>${tipAmount.toFixed(2)}</Typography>
                            </Box>

                            {extraCharges?.length > 0 && (
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                                    {t("extras", keys)}
                                </Typography>
                            )}

                            {extraCharges.map((charge, i) => (
                                <Box key={i} display="flex" justifyContent="space-between" mb={0.5}>
                                    <Typography>{charge.name}</Typography>
                                    <Typography>${charge.amount.toFixed(2)}</Typography>
                                </Box>
                            ))}

                            <Divider sx={{ my: 1 }} />

                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{
                                    bgcolor: '#e3f2fd',
                                    p: 1,
                                    borderRadius: 1,
                                }}
                            >
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {t("total", keys)}
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                    ${total.toFixed(2)}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <Button variant="contained" color="error" onClick={handleClear} fullWidth>
                            {t("clear_all", keys)}
                        </Button>

                        <Divider sx={{ my: 2 }} />
                        {(((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/user-services")) ||
                            (session?.user?.roles?.includes("BackOfficeUser") &&
                                checkAccess(
                                    (session.user as any).accessrights
                                        ?.controls as AccessRights2,
                                    "/admin/user-services",
                                    "add"
                                ))) && ((session?.user?.roles?.includes("Owner") && session.user.navigation?.includes("/admin/user-services")) ||
                                    (session?.user?.roles?.includes("BackOfficeUser") &&
                                        checkAccess(
                                            (session.user as any).accessrights
                                                ?.controls as AccessRights2,
                                            "/admin/user-services",
                                            "edit"
                                        )))) ? (
                            <>
                                {(selectedStaff?.id && hasItems && (customerData?.existingCustomer && customerData?.email) || (!customerData?.existingCustomer && customerData?.email && customerData?.phone && customerData?.name)) &&
                                    <Box sx={{ p: 2, backgroundColor: '#fff', position: 'sticky', bottom: 0, zIndex: 100 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" textAlign="center" bgcolor="#f5f5f5" py={1} borderRadius={1} mb={1}>
                                            {t("checkout_by", keys)}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={4}><Button startIcon={<CreditCardIcon />} variant="contained" fullWidth onClick={() => handleCheckout('card')}>{t("card", keys)}</Button></Grid>
                                            <Grid item xs={4}><Button startIcon={<QrCodeScannerIcon />} variant="contained" fullWidth onClick={() => handleCheckout('qr')}>{t("qr", keys)}</Button></Grid>
                                            <Grid item xs={4}><Button startIcon={<PaymentsIcon />} variant="contained" fullWidth onClick={() => handleCheckout('cash')}>{t("cash", keys)}</Button></Grid>
                                        </Grid>
                                    </Box>}
                            </>
                        ) : (<Typography variant="body2" color="text.secondary" mt={4} textAlign="center">
                            No
                            Add/Edit Access rights.
                        </Typography>)}
                    </>
                ) : (
                    <Typography variant="body2" color="text.secondary" mt={4} textAlign="center">
                        {t("add_items_to_see_details_here", keys)}
                    </Typography>
                )}
            </Box>

            <TipDialog
                keys={keys}
                open={tipDialogOpen}
                onClose={() => setTipDialogOpen(false)}
                onSave={(amount) => {
                    setTipAmount(amount);
                    const saved = localStorage.getItem('pos_cart_data');
                    const parsed = saved ? JSON.parse(saved) : {};
                    parsed.tipAmount = amount;
                    localStorage.setItem('pos_cart_data', JSON.stringify(parsed));
                }}
                initialTip={tipAmount}
            />

            <ExtraChargesDialog
                keys={keys}
                open={extraDialogOpen}
                onClose={() => setExtraDialogOpen(false)}
                onSave={(charges) => {
                    setExtraCharges(charges);
                    const saved = localStorage.getItem('pos_cart_data');
                    const parsed = saved ? JSON.parse(saved) : {};
                    parsed.extraCharges = charges;
                    localStorage.setItem('pos_cart_data', JSON.stringify(parsed));
                }}
                initialCharges={extraCharges}
            />
            <CheckoutFormDialog
                open={paymentType === "card"}
                onClose={() => { setPaymentType("cash") }}
                amount={cartData?.total}
                onPaymentSuccess={handleStripeSuccess}
            />
            <OrderPaymentQrDialog
                open={paymentType === "qr"}
                onClose={() => { setPaymentType("cash") }}
                order={cartData}
                setPaymentSuccessCheck={setPaymentSuccess}
            />
        </>
    );
};

export default CartDrawer;
