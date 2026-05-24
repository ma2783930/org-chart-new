/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { orgChartApi } from './api';

export const store = configureStore({
  reducer: {
    [orgChartApi.reducerPath]: orgChartApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(orgChartApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
