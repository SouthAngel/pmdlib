import { configureStore, createSlice } from "@reduxjs/toolkit";

const gdataSlice = createSlice(
    {
        name:"gdata",
        initialState:{
            value:false
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
        }
    }
);

const _store = configureStore({reducer:gdataSlice.reducer});
// _store.subscribe(()=>{console.log(store.getState())})
export const store=_store;
export const actions=gdataSlice.actions;