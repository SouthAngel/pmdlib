import { Dialog, DialogContent, Menu, MenuItem, SvgIcon, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import React, { ReactElement, ReactEventHandler, useMemo, useReducer } from "react";
import { useState } from "react";
import {Folder,ImageSharp} from "@mui/icons-material";
import { convertFileSrc } from "./utils";
import { ipcRenderer } from "electron";

interface State{
  isPlaying:boolean
  isLoadEnd:boolean
  isSelected:boolean
  name:string
  path:string
  thumb:string
  hname:string
  itemIndex:number
  changeSelectedCb:(_index:number)=>void
}

export default function ViewItem(props:any){
  const isSelected = useMemo(()=>props.selectedIndex==props.itemIndex,[props.selectedIndex]);
  const [contextMenuAnchorEl, setContextMenuAnchorEl] = useState<null|HTMLElement>(null);
  const [infoDlgOpen, setInfoDlgOpen] = useState(false);
  // const [gstate, dispatch] = useReducer(reducer, undefined);
  async function doubleClick(e:any){
    if (props.ftype!=="d"){
      await openFile();
      return;
    }
    await props.setRootPathByIndex(props.itemIndex);
  }
  function click(e:any){
    // dispatch({type:"test"});
    props.setSelectedIndex(props.itemIndex);
    console.log(props);
  }
  function mouseEnter(e:any){
    e.target.play();
    e.target.loop = true;
  }
  function mouseLeave(e:any){
    e.target.pause();
  }
  const rClick = (e:any)=>{
    e.preventDefault();
    setContextMenuAnchorEl(e.currentTarget);
  };
  const openFile = async ()=>{
    await ipcRenderer.invoke("open_file", props.orgFile);
  };
  const openPDir = async ()=>{
    await ipcRenderer.invoke("open_parent_dir", props.orgFile);
  };
  const minfoDialog = ()=>{};
  return <div
    style={{
      width:"128px",
      height:"128px",
      margin:"2px",
      display:"block",
      position:"relative",
      overflow:"clip",
      border:"2px solid #b2b2b2",
      borderColor:isSelected?"#42b2e9":"#b2b2b2",
      borderRadius:2}}
    onContextMenu={rClick}
    onClick={click}
    onDoubleClick={doubleClick}
    onDragStartCapture={async (e:any)=>{
      e.preventDefault();
      if (props.ftype === "d"){return;}
      await ipcRenderer.invoke("start_drag", props.orgFile);
    }}
    draggable={true}
  >
      <Menu
        open={Boolean(contextMenuAnchorEl)}
        anchorEl={contextMenuAnchorEl}
        anchorOrigin={{vertical:"center",horizontal:"center"}}
        onClose={()=>setContextMenuAnchorEl(null)}
        onMouseLeave={()=>setContextMenuAnchorEl(null)}
      >
        <MenuItem onClick={openFile}>打开文件</MenuItem>
        <MenuItem onClick={openPDir}>打开文件夹</MenuItem>
        <MenuItem onClick={()=>{setInfoDlgOpen(true);}}>更多信息</MenuItem>
      </Menu>
      <Dialog
        open={infoDlgOpen}
        onClose={()=>setInfoDlgOpen(false)}
      >
        <DialogContent>
          {props.thumb}<br/>
          {props.orgFile}
        </DialogContent>
      </Dialog>
    {/* <img src={convertFileSrc(this.state.currentImagePath)} height={128} width={128} onMouseOver={mouseOver}></img> */}
    {props.ftype==="d"&&props.thumb===""&&<Box height="80%" m={0} alignContent="center" textAlign="center">
      <Folder color="primary" sx={{scale:4}}></Folder>
    </Box>
    }
    {props.ftype!=="d"&&props.thumb===""&&<Box height="80%" m={0} alignContent="center" textAlign="center">
      <ImageSharp color="primary" sx={{scale:4}}></ImageSharp>
    </Box>
    }
    {props.thumb===""&&<Tooltip title={props.name}>
      <Typography
        textAlign="center"
        align="center"
        height="20%"
      >{props.name}</Typography>
      </Tooltip>
    }
    {props.thumb!==""&&props.vtype==="m"&&
      <video 
        style={{margin:4,borderRadius:4,width:"94%",height:"94%"}}
        muted
        onMouseEnter={mouseEnter}
        onMouseLeave={mouseLeave}
        src={props.thumb?convertFileSrc(props.thumb):""}
      ></video>
    }
    {props.thumb!==""&&props.vtype==="p"&&
      <img 
        style={{margin:4,borderRadius:4,width:"94%",height:"94%"}}
        src={props.thumb?convertFileSrc(props.thumb):""}
      ></img>
    }
    {props.ftype==="f"&&<div
     style={{
      position:"absolute",
      right:0,
      top:0,
      color:"#fefefe",
      backgroundColor:"#e2b221",
      borderRadius:4,
      padding:2,
      width:48,
      overflow:"clip",
     }}
    >
      {((props.name.toString()).match(/\.[^\.]+$/)||[""])[0]}
    </div>

    }
  </div>
}
