import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Location {
  id: string;
  client_id: string;
  location_currency: string;
  location_name: string;
  location_timezone: string;
  location_24_hours: boolean;
  location_number: string;
  language_id: string;
  country: string;
  street: string;
  city: string;
  postcode: string;
  state: string;
  latitude: string;
  longitude: string;
  send_activation_email: boolean;
  location_email: string;
  location_phone: string;
  tip_enabled: boolean;
  deleted_status: boolean;
  active_status: boolean;
  created_at: string;
  updated_at: string;
  languagesId: string | null;
  location_schedule: any[];
}

interface SelectedLocationState {
  selectedLocation: Location | null;
}

const initialState: SelectedLocationState = {
  selectedLocation: null,
};

const selectedLocationSlice = createSlice({
  name: "selectedLocation",
  initialState,
  reducers: {
    setSelectedLocation: (state, action: PayloadAction<Location>) => {
      state.selectedLocation = action.payload;
    },
    clearSelectedLocation: (state) => {
      state.selectedLocation = null;
    },
  },
});

export const { setSelectedLocation, clearSelectedLocation } = selectedLocationSlice.actions;
export default selectedLocationSlice.reducer;
