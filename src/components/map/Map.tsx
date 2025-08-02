import { GoogleMap, StandaloneSearchBox, Marker } from "@react-google-maps/api";
import axios from "axios";
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  ForwardedRef,
} from "react";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  IconButton,
  Toolbar,
  Typography,
  Slide,
  SlideProps,
} from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { LatLng, MapProps } from "../../types/admin/types";
import { useRouter } from "next/router";
import { t } from "../../../lib/translationHelper";
import { ToastErrorMessage } from "../common/ToastMessages";
import { useSelector } from "@/store/Store";
const Transition = React.forwardRef(function Transition(
  props: React.PropsWithChildren<SlideProps>,
  ref: ForwardedRef<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Map = ({
  initialValue,
  open,
  setMapCoordinates,
  handleClose,
}: MapProps) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const router = useRouter();
  const [center, setCenter] = useState<LatLng>({
    lat: 39.8283,
    lng: -98.5795,
  });
  const [marker, setMarker] = useState<LatLng | null>(null);
  const [markedPlace, setPlace] = useState<any>(null);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "locations_manage" }
        );
        setKeys(response.data);
      } catch (error) {
        ToastErrorMessage(error);
      }
    })();
  }, [languageUpdate]);

  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const onSearchBoxLoaded = useCallback((ref: google.maps.places.SearchBox) => {
    if (searchBoxRef.current !== ref) {
      searchBoxRef.current = ref; // This should be safe now.
    }
  }, []);

  useEffect(() => {
    if (initialValue) {
      setMarker(initialValue);
      setCenter(initialValue);
    }
  }, [router, initialValue]);

  const onPlacesChanged = useCallback(() => {
    const places = searchBoxRef.current?.getPlaces();

    if (places?.length) {
      const place = places[0];
      if (place.geometry?.location) {
        const nextMarker = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setMarker(nextMarker);
        setCenter(nextMarker);
        setPlace(place);
      }
    }
  }, []);

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newMarker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setMarker(newMarker);

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: newMarker }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setPlace(results[0]);
        }
      });
    }
  }, []);

  const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newMarker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setMarker(newMarker);

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: newMarker }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setPlace(results[0]);
        }
      });
    }
  }, []);

  const saveLocation = () => {
    if (marker) {
      setMapCoordinates(marker, markedPlace);
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose}>
            <IconX width={24} height={24} />
          </IconButton>
          <Typography ml={2} flex={1} variant="h6" component="div">
            {t("select_location", keys)}
          </Typography>
          <Button autoFocus color="inherit" onClick={saveLocation}>
            {t("save", keys)}
          </Button>
        </Toolbar>
      </AppBar>
      <Box>
        <GoogleMap
          id="map"
          mapContainerStyle={{ height: "100vh", width: "100%" }}
          center={center}
          zoom={15}
          onClick={onMapClick}
        >
          <StandaloneSearchBox
            onLoad={onSearchBoxLoaded}
            onPlacesChanged={onPlacesChanged}
          >
            <input
              type="text"
              placeholder={t("search_place", keys)}
              style={{
                position: "absolute",
                top: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "300px",
                padding: "8px 16px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                zIndex: 1000,
              }}
            />
          </StandaloneSearchBox>

          {marker && (
            <Marker position={marker} draggable onDragEnd={onMarkerDragEnd} />
          )}
        </GoogleMap>
      </Box>
    </Dialog>
  );
};

export default Map;
