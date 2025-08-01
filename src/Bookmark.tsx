import { Box, Button, Dialog, DialogContent, Stack, SxProps, TextField, Tooltip } from "@mui/material";
import { actions } from "./store";
import { MouseEventHandler, useEffect, useState } from "react";
import { Code, DragIndicator, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";


export const bookmarkData:{data:{name:string,path:string}[],nindex:any,pindex:{[key:string]:any},dataChangeCall:()=>void,rebuild:()=>void} = {
  data : [
      {name:"Y资产目录",path:"Y:\\ALL\\Database\\My Collections"}
  ],
  nindex:{},
  pindex:{},
  dataChangeCall:()=>{},
  rebuild:()=>{},
};

function rebuildBookmarkDataIndex(){
  bookmarkData.nindex = {};
  bookmarkData.pindex = {};
  let ct = 0;
  for (const element of bookmarkData.data) {
    bookmarkData.nindex[element.name] = element;
    bookmarkData.pindex[element.path] = element;
    ct+=1;
  }
  localStorage.setItem("bookmarks",JSON.stringify(bookmarkData.data))
}
function restoreBookmarkData(){
  let gets = localStorage.getItem("bookmarks")||"";
  if (gets){
    bookmarkData.data = JSON.parse(gets);
  }
}
restoreBookmarkData();
rebuildBookmarkDataIndex();
bookmarkData.rebuild = rebuildBookmarkDataIndex;

function Bookmark({text,index,textBtCb,closeBtCb,data}:any){
  const mbuttond = (rect:DOMRectList,mx:number,my:number)=>{
    let mn = (rect[0].bottom+rect[0].top)*0.5;
    if (bookmarkData.data.length<2){return;}
    if (my>mn){ // move down
      if (index>bookmarkData.data.length-1){return;}
      let data = bookmarkData.data.splice(index,1);
      bookmarkData.data.splice(index+1,0,data[0]);
      bookmarkData.rebuild();
      bookmarkData.dataChangeCall();
    }else{ // move up
      if (index<2){return;}
      let data = bookmarkData.data.splice(index,1);
      bookmarkData.data.splice(index-1,0,data[0]);
      bookmarkData.rebuild();
      bookmarkData.dataChangeCall();
    }
  };
  return <div style={{
      display:"flex",
      alignItems:"center",
      cursor:"pointer"}}>
    <span onClick={(e)=>{mbuttond(e.currentTarget.getClientRects(),e.clientX,e.clientY)}}>
      <Code sx={{color:"#888888",rotate:"90deg"}}/>
    </span>
    <span style={{
      color:"#e6e6e6ff" }}
      onClick={()=>textBtCb(data.path)}
      >{text}</span>
    <Tooltip title="删除">
    <span style={{
      backgroundColor:"#d42727ff",
      marginLeft:"8px",
      textAlign:"center",
      width:"11px", 
      height:"100%", 
      fontSize:"8px",
      padding:"2px",
      top:"0px"}}
      onClick={closeBtCb}
      >X</span></Tooltip>
  </div>
}

export default function BookmarkContainer(
  {
    sx,
    changeRootCb
  }:{
    sx:SxProps,
    changeRootCb:(v:string)=>Promise<void>
  }
){
  const [reRenderState, setRenderState] = useState(Date.now());
  bookmarkData.dataChangeCall = ()=>{setRenderState(Date.now());};
  const deleteItem = (_i:number)=>{
    bookmarkData.data.splice(_i,1);
    rebuildBookmarkDataIndex();
    bookmarkData.dataChangeCall();
  };
  return <Box sx={sx}>
    <Box>
      {bookmarkData.data.map((x,_i)=><Bookmark key={_i} index={_i} text={x.name} data={x} textBtCb={changeRootCb} closeBtCb={()=>deleteItem(_i)}/>)}
    </Box>
  </Box>
}

export function AddBookmarkDialog({
  open,
  initPath,
  closeCb,
  addCb,
}:{
  open:boolean,
  initPath:string,
  closeCb:()=>void,
  addCb:()=>void,
}){
  const [name,setName] = useState((initPath.match(/[^\/\\]+$/)||[""])[0]);
  const [path,setPath] = useState(initPath);
  useEffect(()=>{
    if (!open&&path!=initPath){
      setPath(initPath);
      setName((initPath.match(/[^\/\\]+$/)||[""])[0]);
    }
  });
  return <Dialog open={open} onClose={closeCb}>
    <DialogContent dividers={true} style={{margin:"8px"}}>
      <Stack spacing={2}>
        <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)}/>
        <TextField label="Path" value={path} onChange={(e)=>setPath(e.target.value)}/>
        <br/>
        <Button variant="contained" sx={{width:"100%"}} onClick={()=>{bookmarkData.data.push({"name":name,"path":path});bookmarkData.rebuild();bookmarkData.dataChangeCall();closeCb();}}>添加书签</Button>
      </Stack>
    </DialogContent>
  </Dialog>
}


