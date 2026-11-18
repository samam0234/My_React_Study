import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import auth from './authSlice'

export const makeStore = () => configureStore({ reducer: { auth } })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

// 타입이 붙은 훅 (useDispatch/useSelector 를 그대로 쓰면 타입이 unknown 이 된다)
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
