import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import Loader from '../loader/Loader';
import { ToastErrorMessage } from '../common/ToastMessages';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { t } from "../../../lib/translationHelper";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface ServiceItemsProps {
  selectedCategory: string | null;
  onAddService: (item: Service) => void;
  onRemoveAllServices: (item: Service) => void;
  cartItems: Service[];
  keys: any;
}

const ServiceItems = ({
  selectedCategory,
  onAddService,
  onRemoveAllServices,
  cartItems = [],
  keys,
}: ServiceItemsProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  const getServiceQuantity = (serviceId: string) =>
    cartItems.filter((item) => item.id === serviceId).length;

  useEffect(() => {
    const fetchServices = async () => {
      const location_id = session?.user?.selected_location_id;
      if (!location_id || !selectedCategory) return;

      try {
        setLoading(true);
        const payload = {
          category_id: selectedCategory,
          location_id,
          fetchAll: true,
        };
        const response = await axios.post("/api/services/fetchservicesbycategory", payload);
        const fetchedServices = response.data.services || [];
        setServices(fetchedServices);

        // ✅ Remove any services from localStorage not in the current fetched list
        const savedCart = localStorage.getItem("pos_cart_data");
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          const validServiceIds = new Set(fetchedServices.map((s: Service) => s.id));
          const filteredCartItems = parsed.cartItems?.filter((item: Service) =>
            validServiceIds.has(item.id)
          );

          if (filteredCartItems.length !== parsed.cartItems.length) {
            const newCart = {
              ...parsed,
              cartItems: filteredCartItems,
            };
            localStorage.setItem("pos_cart_data", JSON.stringify(newCart));
          }
        }
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedCategory, session]);

  if (!selectedCategory) return null;

  return (
    <Box sx={{ flex: 1, p: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <Loader loading={loading} />
      {services.map((item) => {
        const quantity = getServiceQuantity(item.id);

        return (
          <Box
            key={item.id}
            onClick={() => onAddService(item)}
            sx={{
              width: 200,
              height: 160,
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 2,
              boxShadow: 2,
              bgcolor: 'primary.main',
              color: 'white',
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                flex: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={600}
                title={item.name}
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word',
                  maxHeight: '3.5em',
                }}
              >
                {item.name}
              </Typography>
              <Typography variant="body2" fontWeight={500} marginTop={1}>
                ${item.price.toFixed(2)}
              </Typography>
            </Box>

            {quantity > 0 && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                sx={{ mt: 1 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 1,
                    py: 0.5,
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <ShoppingCartIcon sx={{ fontSize: 16 }} />
                  {quantity}
                </Box>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAllServices(item);
                  }}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': { bgcolor: '#fce4e4' },
                    width: 26,
                    height: 26,
                  }}
                >
                  <RemoveShoppingCartIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default ServiceItems;
