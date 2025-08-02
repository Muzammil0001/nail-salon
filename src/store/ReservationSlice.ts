// reservationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadReservationState, saveReservationState } from "../../lib/reservationLocalStorage";

type ReservationItem = {
  category_id: string;
  service_id: string;
  quantity: number;
  price: number;
};

type ReservationState = {
  items: ReservationItem[];
  location_id: string | null;
  total_price: number;
};

const defaultState: ReservationState = {
  items: [],
  location_id: null,
  total_price: 0,
};

const initialState: ReservationState = typeof window !== 'undefined'
  ? loadReservationState() || defaultState
  : defaultState;

export const reservationSlice = createSlice({
  name: 'reservation',
  initialState,
  reducers: {
    setLocationId: (state, action: PayloadAction<string>) => {
      state.location_id = action.payload;
      state.items = [];
      state.total_price = 0;
    },

    addOrUpdateItem: (state, action: PayloadAction<ReservationItem>) => {
      const { service_id, quantity, price } = action.payload;
      const existingItem = state.items.find((item) => item.service_id === service_id);

      if (existingItem) {
        state.total_price -= existingItem.price * existingItem.quantity;
        existingItem.quantity = quantity;
        existingItem.price = price;
      } else {
        state.items.push(action.payload);
      }

      state.total_price += price * quantity;
    },

    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.service_id !== action.payload);

      state.total_price = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
    },
    
    clearReservation: (state) => {
      Object.assign(state, defaultState);
    },
  },
});

export const {
  setLocationId,
  addOrUpdateItem,
  removeItem,
  clearReservation,
} = reservationSlice.actions;

export default reservationSlice.reducer;
