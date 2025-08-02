import {
    Box,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    TextField,
    InputAdornment,
  } from "@mui/material";
  import NavBar from "@/components/storeapp/components/NavBar";
  import { useRouter } from "next/router";
  import SearchIcon from "@mui/icons-material/Search";
  import { useState, useEffect, useCallback, useMemo } from "react";
  import axios from "axios";
  import { debounce } from "lodash";
  import { ToastErrorMessage } from "@/components/common/ToastMessages";
  import { useSelector } from "@/store/Store";
  import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
  import {
    setLocationId,
    addOrUpdateItem,
    removeItem,
    clearReservation,
  } from "@/store/ReservationSlice";
  import { useDispatch } from "react-redux";
  import { t } from "../../../../lib/translationHelper";
  import Loader from "@/components/loader/Loader";
  
  interface Service {
    id: string;
    name: string;
    image: string;
    price: number;
    description: string;
    category_id: string;
    duration_minutes: number;
    deleted_status: boolean;
    active_status: boolean;
    location_id: string;
    client_id: string;
    created_at: string;
    updated_at: string;
    categories: {
      id: string;
      name: string;
      description: string;
      deleted_status: boolean;
      active_status: boolean;
      location_id: string;
      client_id: string;
      created_at: string;
      updated_at: string;
    };
  }
  
  const CategoryServices = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const selectedLocation: any = useSelector((state) => state.selectedLocation).selectedLocation;
    const reservationItems = useSelector((state) => state.reservation.items);
    const reservationLocationId = useSelector((state) => state.reservation.location_id);
  
    const [visibleCount, setVisibleCount] = useState(8);
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const languageUpdate = useSelector((state) => state.language.languageUpdate);
    const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  
    useEffect(() => {
      const fetchTranslations = async () => {
        try {
          const language_id = localStorage.getItem("language_id");
          const response = await axios.post("/api/app-translation/fetchbypagename", {
            language_id,
            page_name: "landingpage",
          });
          setKeys(response.data);
        } catch (error) {
          console.error("Error fetching translations:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchTranslations();
    }, [languageUpdate]);
  

    useEffect(() => {
      if (selectedLocation?.id !== reservationLocationId) {
        dispatch(clearReservation());
        if (selectedLocation?.id) {
          dispatch(setLocationId(selectedLocation.id));
        }
      }
    }, [selectedLocation, reservationLocationId, dispatch]);
  
    const fetchServices = useCallback(async () => {
      try {
        if (selectedLocation && router.query?.id) {
          setLoading(true);
          const payload = {
            category_id: router.query?.id,
            location_id: selectedLocation?.id,
            fetchAll: true,
            search: searchTerm,
          };
          const response = await axios.post("/api/services/fetchservicesbycategory", payload);
          setServices(response.data.services);
        }
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    }, [selectedLocation, router.query?.id, searchTerm]);
  
    useEffect(() => {
      fetchServices();
    }, [fetchServices]);
  
    const debouncedSearch = useMemo(
      () =>
        debounce((value: string) => {
          setSearchTerm(value);
        }, 300),
      []
    );
  
    const isServiceBooked = (serviceId: string) =>
      reservationItems.some((item: { service_id: string }) => item.service_id === serviceId);
  
    const handleBookNow = (service: Service) => {
      if (!selectedLocation?.id) {
        ToastErrorMessage("Please select a branch before booking a service.");
        return;
      }
      dispatch(
        addOrUpdateItem({
          category_id: service.category_id,
          service_id: service.id,
          quantity: 1,
          price: service.price,
        })
      );
    };
  
    const handleRemoveFromReservation = (serviceId: string) => {
      dispatch(removeItem(serviceId));
    };
  
    return (
      <section className="snap-start my-12 p-4 lg:p-6 bg-white">
        <NavBar keys={keys}/>
        <Loader loading={loading} />
        <Button
            onClick={() => router.push("/julietnails")}
            className="flex items-center text-[#6E082F] my-2 hover:text-white font-medium cursor-pointer transition-all duration-200"
          >
            <KeyboardBackspaceIcon className="mr-1 size-4"/>
            {t("back_to_home", keys)}
          </Button>
        <Box sx={{ margin: { lg: "60px", xs: "10px" } }}>
          <h2 className="text-3xl font-bold mb-8 text-center text-slate-800">
            {t("our_services", keys)}
          </h2>
  
          <div className="w-full max-w-lg mx-auto mb-16">
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder={t("search_by_name_or_description", keys)}
              onChange={(e) => debouncedSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </div>
  
          {services.length === 0 ? (
            <Typography variant="h6" color="text.secondary" className="text-center mt-12">
              {t("no_services_found", keys)}
            </Typography>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.slice(0, visibleCount).map((service) => {
                  const booked = isServiceBooked(service.id);
                  return (
                    <Card
                      key={service.id}
                      sx={{
                        width: "100%",
                        borderRadius: 1,
                        boxShadow: 3,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "0.2s",
                        "&:hover": {
                          boxShadow: 6,
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, flexGrow: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            color="primary"
                            noWrap
                            sx={{ fontSize: "1rem" }}
                          >
                            {service.name}
                          </Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                            ${parseFloat(String(service.price)).toFixed(2)}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "0.85rem",
                          }}
                        >
                          {service.description}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button
                          size="small"
                          variant={booked ? "contained" : "outlined"}
                          color={booked ? "secondary" : "primary"}
                          fullWidth
                          onClick={() =>
                            booked
                              ? handleRemoveFromReservation(service.id)
                              : handleBookNow(service)
                          }
                          sx={{ borderRadius: 0, fontWeight: 500 }}
                        >
                          {booked
                            ? t("remove_from_booking", keys)
                            : t("book_now", keys)}
                        </Button>
                      </CardActions>
                    </Card>
                  );
                })}
              </div>
  
              {(visibleCount < services.length || visibleCount > 8) && (
                <div className="text-center mt-8 flex flex-col sm:flex-row justify-center gap-4">
                  {visibleCount < services.length && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setVisibleCount((prev) => prev + 4)}
                      sx={{ borderRadius: 0, px: 4, py: 1.5, textTransform: "none" }}
                    >
                      {t("view_more", keys)}
                    </Button>
                  )}
                  {visibleCount > 8 && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => setVisibleCount(8)}
                      sx={{
                        borderRadius: 0,
                        px: 4,
                        py: 1.5,
                        fontWeight: "bold",
                        textTransform: "none",
                      }}
                    >
                      {t("view_less", keys)}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </Box>
      </section>
    );
  };
  
  CategoryServices.layout = "Blank";
  export default CategoryServices;
  