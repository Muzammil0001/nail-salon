import React, { useState, useEffect } from 'react';
import StaffGrid from './StaffGrid';
import CategorySidebar from './CategorySidebar';
import AddIcon from '@mui/icons-material/Add';
import ServiceItems from './ServiceItems';
import CartDrawer from './CartDrawer';
import ClearIcon from '@mui/icons-material/Clear';
import {
  Box,
  Drawer,
  IconButton,
  Button,
  Stack,
  Divider,
  Fab,
  Tooltip,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useSelector } from "@/store/Store";
import axios from 'axios';
import { t } from "../../../lib/translationHelper";
import { checkAccess } from '../../../lib/clientExtras';
import { AccessRights2 } from '@/types/admin/types';
import AccessDenied from '../NoAccessPage';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  display_color?: string;
}

interface ExtraCharge {
  name: string;
  amount: number;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
  existingCustomer?: boolean;
}

interface CartData {
  id: string;
  customer: Customer;
  selectedStaff: Staff | null;
  cartItems: ServiceItem[];
  tipAmount: number;
  extraCharges: ExtraCharge[];
}

const POSPage = ({ session }: any) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  const [carts, setCarts] = useState<CartData[]>([]);
  const [activeCartId, setActiveCartId] = useState<string>("");

  const activeCart = carts.find((cart) => cart.id === activeCartId);
  const selectedStaff = activeCart?.selectedStaff || null;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/app-translation/fetchbypagename", {
          page_name: "user_services",
        });
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);

  useEffect(() => {
    const saved = localStorage.getItem("pos_carts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCarts(parsed.carts || []);
        setActiveCartId(parsed.activeCartId || parsed.carts[0]?.id);
      } catch (err) {
        console.error("Failed to load carts");
      }
    } else {
      createNewCart();
    }
  }, []);

  const persistCarts = (updatedCarts: CartData[], selectedId: string) => {
    localStorage.setItem("pos_carts", JSON.stringify({ carts: updatedCarts, activeCartId: selectedId }));
  };

  const createNewCart = () => {
    const newCart: CartData = {
      id: Date.now().toString(),
      customer: { name: "", email: "", phone: "" },
      selectedStaff: null,
      cartItems: [],
      tipAmount: 0,
      extraCharges: [],
    };
    const updated = [...carts, newCart];
    setCarts(updated);
    setActiveCartId(newCart.id);
    persistCarts(updated, newCart.id);
  };

  const selectCart = (id: string) => {
    setActiveCartId(id);
    persistCarts(carts, id);
  };

  const updateActiveCart = (updates: Partial<CartData>) => {
    const updatedCarts = carts.map((cart) =>
      cart.id === activeCartId ? { ...cart, ...updates } : cart
    );
    setCarts(updatedCarts);
    persistCarts(updatedCarts, activeCartId);
  };

  const handleStaffSelect = (staff: Staff) => {
    updateActiveCart({ selectedStaff: staff });
  };

  const handleResetStaff = () => {
    updateActiveCart({ selectedStaff: null });
    setSelectedCategory(null);
  };

  const handleAddToCart = (service: ServiceItem) => {
    if (!activeCart) return;
    const updatedCartItems = [...activeCart.cartItems, service];
    updateActiveCart({ cartItems: updatedCartItems });
    setCartOpen(true);
  };

  const handleRemoveFromCart = (service: ServiceItem) => {
    if (!activeCart) return;
    const updatedCartItems = activeCart.cartItems.filter(item => item.id !== service.id);
    updateActiveCart({ cartItems: updatedCartItems });
  };

  const handleRemoveAllServices = (item: ServiceItem) => {
    if (!activeCart) return;
    const updatedCart = activeCart.cartItems.filter(service => service.id !== item.id);
    updateActiveCart({ cartItems: updatedCart });
  };

  const removeActiveCart = () => {
    const updated = carts.filter(cart => cart.id !== activeCartId);
    let newCart: CartData;

    if (updated.length > 0) {
      setCarts(updated);
      setActiveCartId(updated[0].id);
      persistCarts(updated, updated[0].id);
    } else {
      newCart = {
        id: Date.now().toString(),
        customer: { name: "", email: "", phone: "", existingCustomer: false },
        selectedStaff: null,
        cartItems: [],
        tipAmount: 0,
        extraCharges: [],
      };
      setCarts([newCart]);
      setActiveCartId(newCart.id);
      persistCarts([newCart], newCart.id);
    }
  };

  return (
    <>
      {((session?.user?.roles?.includes("Owner") &&
        session.user.navigation?.includes("/admin/user-services")) ||
        (session?.user?.roles?.includes("BackOfficeUser") &&
          checkAccess(
            (session.user as any).accessrights?.controls as AccessRights2,
            "/admin/user-services",
            "view"
          ))) ? (
        <Box display="flex" minHeight="100vh" position="relative" pb={8}>
          {!selectedStaff ? (
            <StaffGrid keys={keys} onSelect={handleStaffSelect} />
          ) : (
            <>
              <Box
                sx={{
                  width: 220,
                  minHeight: "100vh",
                  borderRight: "1px solid #ddd",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  bgcolor: "#fafafa",
                }}
              >
                <Stack spacing={2} p={2}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleResetStaff}
                    fullWidth
                  >
                    {t("change_staff", keys)}
                  </Button>
                  <Divider />
                  <CategorySidebar keys={keys} onSelectCategory={setSelectedCategory} />
                </Stack>
              </Box>

              <ServiceItems
                keys={keys}
                selectedCategory={selectedCategory}
                onAddService={handleAddToCart}
                cartItems={activeCart?.cartItems || []}
                onRemoveAllServices={handleRemoveAllServices}
              />
            </>
          )}

          {selectedStaff && (
            <Fab
              size="medium"
              color="primary"
              onClick={() => setCartOpen(true)}
              sx={{
                height: "40px",
                width: "40px",
                position: "fixed",
                top: 50,
                right: 12,
                zIndex: 1300,
                bgcolor: "white",
                color: "primary.main",
                boxShadow: 3,
                "&:hover": {
                  bgcolor: "#f5f5f5",
                },
              }}
              aria-label={t("open_cart", keys)}
            >
              <ChevronLeftIcon />
            </Fab>
          )}

          <Drawer
            anchor="right"
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            PaperProps={{ sx: { width: 400 } }}
          >
            <Box p={1}>
              <IconButton
                onClick={() => setCartOpen(false)}
                sx={{
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                  bgcolor: "white",
                  "&:hover": {
                    boxShadow: "0 3px 8px rgba(0, 0, 0, 0.25)",
                    bgcolor: "#f9f9f9",
                  },
                }}
                aria-label={t("close_cart", keys)}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
            <CartDrawer
              activeCartNumber={activeCart?.id || ""}
              cartItems={activeCart?.cartItems || []}
              setCartItems={(items) => updateActiveCart({ cartItems: items })}
              onAddService={handleAddToCart}
              onRemoveService={handleRemoveFromCart}
              onRemoveAllServices={handleRemoveAllServices}
              tipAmount={activeCart?.tipAmount || 0}
              setTipAmount={(value) => updateActiveCart({ tipAmount: value })}
              extraCharges={activeCart?.extraCharges || []}
              setExtraCharges={(charges) => updateActiveCart({ extraCharges: charges })}
              session={session}
              keys={keys}
              selectedStaff={activeCart?.selectedStaff || null}
              onOrderComplete={removeActiveCart}
            />
          </Drawer>

          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              width: "100%",
              borderRadius:"0px",
              bgcolor: "#fff",
              borderTop: "1px solid #ddd",
              p: 1,
              display: "flex",
              alignItems: "center",
              zIndex: 1200,
              overflow: "hidden",
            }}
          >
            {/* Plus button: always visible, outside scroll */}
            <Box sx={{ flexShrink: 0, mr: "10px" }}>
              <Tooltip title={t("open_cart", keys)}>
                <IconButton
                  className="flex justify-center items-center bg-slate-100"
                  onClick={createNewCart}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Scrollable container */}
            <Box
              sx={{
                width: "72vw", // only this part scrolls
                overflowX: "auto",
                display: "flex",
                alignItems: "center",
                gap: 1,
                pr: 1,
                pb: 1,
              }}
            >
              {carts?.map((cart) => (
                <Box
                  key={cart.id}
                  sx={{ display: "flex", alignItems: "center", position: "relative" }}
                >
                  <Button
                    variant={cart.id === activeCartId ? "contained" : "outlined"}
                    onClick={() => selectCart(cart.id)}
                    sx={{ pr: 4, width: "130px", whiteSpace: "nowrap" }}
                  >
                    {cart.customer.name || `Cart ${cart.id.slice(-4)}`}
                  </Button>

                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cart.id === activeCartId) {
                        removeActiveCart();
                      } else {
                        const updated = carts.filter((c) => c.id !== cart.id);
                        setCarts(updated);
                        persistCarts(updated, activeCartId);
                      }
                    }}
                    sx={{
                      position: "absolute",
                      right: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      bgcolor: "#f1f5f9",
                      "&:hover": { bgcolor: "#f8bbd0" },
                      p: "2px",
                    }}
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>

        </Box>
      ) : (
        <AccessDenied />
      )}
    </>
  );
};

export default POSPage;
