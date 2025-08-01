import { configureStore, createSlice } from "@reduxjs/toolkit";
import {useDispatch, useSelector} from "react-redux"

const gdataSlice = createSlice(
    {
        name:"gdata",
        initialState:{
            value:false,
            bookmark_data : [
                {name:"Y资产目录",path:"Y:\\ALL\\Database\\My Collections"},
                {name:"AE_Render",path:"Y:\\ALL\\Database\\My Collections\\AE_Render\\AE_Render"}
            ]
            // value:{
            //     loadChildren:false,
            //     disableAll:false,
            // }
        },
        reducers:{
            offLoadChildren:state=>{
                state.value = true
            },
            onLoadChildren:state=>{
                state.value = true
            },
            switchLoadChildren:state=>{
                state.value = !state.value
            },
            resetBookmarkData:(state,action)=>{
                state.bookmark_data = action.payload;
            },
            removeBookmarkData:(state,action)=>{
                state.bookmark_data.splice(action.payload,1);
            },
            appendBookmarkData:(state,action)=>{
                state.bookmark_data.push(action.payload);
            },
        }
    }
);

const _store = configureStore({reducer:gdataSlice.reducer});
// _store.subscribe(()=>{console.log(store.getState())})
export type GData = ReturnType<typeof _store.getState>
export const useAppSelector = useSelector.withTypes<GData>()
export const useAppDispatch = useDispatch.withTypes<typeof _store.dispatch>()
export const store=_store;
export const actions=gdataSlice.actions;