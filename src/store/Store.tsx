import { configureStore } from "@reduxjs/toolkit";
import CustomizerReducer from "./customizer/CustomizerSlice";
import notifyReducer from "./NotifySlice";
import languageReducer from "./LanguageSlice";
import selectedLocationReducer from "./SelectedLocationSlice";
import reservationReducer from "./ReservationSlice";
import { combineReducers } from "redux";
import { loadReservationState, saveReservationState } from "../../lib/reservationLocalStorage"; 

import {
  useDispatch as useAppDispatch,
  useSelector as useAppSelector,
  TypedUseSelectorHook,
} from "react-redux";


const isBrowser = typeof window !== "undefined";

export const store = configureStore({
  reducer: {
    customizer: CustomizerReducer,
    notify: notifyReducer,
    language: languageReducer,
    selectedLocation: selectedLocationReducer,
    reservation: reservationReducer,
  },
  preloadedState: isBrowser
    ? { reservation: loadReservationState() || undefined }
    : undefined,
});

store.subscribe(() => {
  const { reservation } = store.getState();
  saveReservationState(reservation);
});

const rootReducer = combineReducers({
  customizer: CustomizerReducer,
  notify: notifyReducer,
  language: languageReducer,
  selectedLocation: selectedLocationReducer,
  reservation: reservationReducer,
});

export type AppState = ReturnType<typeof rootReducer>;

export type AppDispatch = typeof store.dispatch;
export const { dispatch } = store;
export const useDispatch = () => useAppDispatch<AppDispatch>();
export const useSelector: TypedUseSelectorHook<AppState> = useAppSelector;

export default store;
