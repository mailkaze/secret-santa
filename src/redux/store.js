import { configureStore } from '@reduxjs/toolkit'
import reducer, { initialState } from './reducers'

export function createAppStore(preloadedState = initialState) {
  return configureStore({ reducer, preloadedState })
}

export default createAppStore()
