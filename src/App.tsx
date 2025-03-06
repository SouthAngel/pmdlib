import { useCallback, useEffect, useState } from "react";
import "./App.css";
import PrimaryAppBar from "./AppBar";
import { createTheme, styled, ThemeProvider } from "@mui/material/styles";
import Fab from "@mui/material/Fab";
import ViewItem from "./ViewItem";
import { Container, CssBaseline, Menu, MenuItem, Snackbar } from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import { Sort } from "@mui/icons-material";
import { store } from "./store";
import { ipcMain, ipcRenderer } from "electron";

const darkTheme = createTheme({
  palette:{
    mode:"dark"
  }
});

const SidePanel = styled("div")(({theme})=>({
  marginTop:8,
  display:"block",
  borderRadius:4,
  width:132,
  height:224,
  boxShadow:theme.shadows
}));

interface SourceData{
  sourceViewBs:string[][]
  bindThumbs:string[]
  appPath:string
  appThumbPath:string
  needLoadedOnce:boolean
  viewId:number
}

const testRootPath = "Y:\\ALL\\Database\\My Collections"
const sourceData:SourceData = {sourceViewBs:[],bindThumbs:[],appPath:"",appThumbPath:"",needLoadedOnce:true,viewId:122.101};


function App() {
  const loadChildren = useSelector((state:any)=>state.value);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [bBarMessage, setBBarMessage] = useState("");
  const [contextMenuAnchorEl, setContextMenuAnchorEl] = useState<null|HTMLElement>(null);
  const [thumbPaths, setThumbPaths] = useState<string[]>([]);
  const [rootPath, setRootPath] = useState(testRootPath);
  useEffect(()=>{
    if (sourceData.appPath===""){
      const afn = async ()=>{
        sourceData.appPath = await ipcRenderer.invoke("get_temp_app_dir");
      };
      afn();
    }
    if (sourceData.appThumbPath===""){
      const afn = async ()=>{
        sourceData.appThumbPath = await ipcRenderer.invoke("get_temp_app_thumbs_dir");
      };
      afn();
    }
    if (sourceData.needLoadedOnce){
      sourceData.needLoadedOnce= false;
      updateViewFromInputPath(rootPath);
    }
    return ()=>{
    };
  });

  async function loadImgs() {
    const outs : string[][] = []; //await invoke("list_dir", {path:"D:/001M/Temp/pic"});
    console.log(outs);
    // setImgs(outs.filter(x=>x.endsWith(".jpg")||x.endsWith(".jpeg")||x.endsWith(".png")).map(x=>x.replace(/\\/g,"/")));
    const vdouts: string[] = []; // await invoke("read_filepath_from_txt", {path:"V:/Letang/pengcheng/lib_test/lib_pm/amp4.txt"});
    const cabd = {count:0};
    function tout(){
      if (cabd.count<vdouts.length){
        // setTestVdPaths(vdouts.slice(0, cabd.count))
        setTimeout(tout,40);
        cabd.count += 1;
      }
    }
    tout();
  }
  function setNeedLoadOnce(){
    sourceData.needLoadedOnce = true;
  };
  const updateViewFromInputPath = useCallback(
  async (path:string) => {
    const viewid = (new Date().getTime())+Math.random();
    sourceData.viewId = viewid;
    let ldfs:string[][] = await ipcRenderer.invoke("list_dir",path);
    console.log(ldfs);
    if (sourceData.viewId != viewid){console.log("viewid break");return;}
    const lenldfs = ldfs.length;
    let extfs:string[][] = [];
    {
      let dir_td_list = ldfs.filter(x=>x[1]==="d").map(x=>x[0]);
      while (1){
        if (!loadChildren){break;}
        if ((ldfs.length + extfs.length) > 800){break;}
        if (dir_td_list.length < 1){break;}
        let nld:string[][] = await ipcRenderer.invoke("list_dir", dir_td_list[0]); //await invoke("list_dir", {path:dir_td_list[0]});
        if (sourceData.viewId != viewid){console.log("viewid break");return;}
        for (const element of nld) {
          if (element[1]==="d"){
            dir_td_list.push(element[0]);
          }else{
            extfs.push(element);
            if ((ldfs.length + extfs.length) > 800){break;}
          }
        }
        dir_td_list = dir_td_list.slice(1);
      }
    }
    // path file_dir mtime size hash
    // path file_dir mtime size hash mov_pic isgrandchildren
    // 0ath 1ile_dir 2time 3ize 4ash 5ov_pic 6sgrandchildren
    setThumbPaths([]);
    sourceData["sourceViewBs"] = ldfs.concat(extfs).map((x,index)=>{
      let exd = "n";
      if (x[0].match(/\.(jpg)|(png)|(pic)|(tga)|(tif)|(exr)$/i)){exd = "p";}
      else if (x[0].match(/\.(mov)|(mkv)|(avi)|(mp4)$/i)){exd = "m";}
      return [...x,exd,index>=lenldfs?"1":"0"];
    });
    console.log(sourceData.sourceViewBs.slice(0,8));
    console.log(sourceData.sourceViewBs.slice(-8));
    sourceData["bindThumbs"] = sourceData.sourceViewBs.map(element=>{
      if (element[5]==="n"){return "";}
      let tn = element[4];
      if (tn.length < 3){tn="0"+tn;}
      tn = sourceData.appThumbPath + "\\"+tn.slice(0,2) + "\\" + tn.slice(2) + (element[5]==="m"?".mp4":".jpg");
      return tn;
    });
    for (let i=0;i<sourceData.bindThumbs.length;i++) {
      if (sourceData.bindThumbs[i]!==""){
        if (await ipcRenderer.invoke("convert_thumb", sourceData.sourceViewBs[i][0],sourceData.bindThumbs[i])){
          setBBarMessage(`${((sourceData.sourceViewBs[i]||[""])[0].match(/[^\/\\]+$/)||[""])[0]}缩略图转换完成`);
        }
        if (sourceData.viewId != viewid){console.log("viewid break");return;}
      }
      setThumbPaths(sourceData.bindThumbs.slice(0,i+1));
      console.log("update view once");
    }
    console.log(sourceData);
  }, [loadChildren]);

  async function testBfn() {
    const testin = "Y:/ALL/Database/My Collections/qianghuo/7265290_c8ccbf7d4df26b405652618a65bcb025.avi";
    const testout = "Y:/ALL/Database/My Collections/qianghuo/testout.mp4";
    // console.log("convert_thumb", {inputPath:testin,outputPath:testout});
    // await invoke("convert_thumb", {inputPath:testin,outputPath:testout});
    // await invoke("test_cmd");
    updateViewFromInputPath(rootPath);
  }
  async function changeRootPathCb(v:string){
    console.log([v]);
    if (v===rootPath){return;}
    setRootPath(v);
    await updateViewFromInputPath(v);
  }
  async function rClickCb(e:any) {
    e.preventDefault();
    setContextMenuAnchorEl(e.currentTarget);
  }

  return (
    <ThemeProvider theme={darkTheme} >
      <CssBaseline></CssBaseline>
      <PrimaryAppBar 
        loadImgs={loadImgs}
        rootPath={rootPath}
        changeRootPath={changeRootPathCb}
        setNeedLoadOnce={setNeedLoadOnce}
      ></PrimaryAppBar>
      <Snackbar
        open={Boolean(bBarMessage)}
        autoHideDuration={6000}
        message={bBarMessage}
        onClose={()=>setBBarMessage("")}
      ></Snackbar>
      {0&&<Fab  onClick={testBfn} sx={{m:1,mt:8,float:"left",position:"fixed"}}>TEST</Fab>}
      <div style={{margin:"124px",display:"flex",flexWrap:"wrap"}}>
      {
        thumbPaths.map((_path,_index)=>sourceData.sourceViewBs[_index]?<ViewItem
          thumb={_path}
          orgFile={sourceData.sourceViewBs[_index][0]}
          ftype={sourceData.sourceViewBs[_index][1]}
          vtype={sourceData.sourceViewBs[_index][5]}
          name={(sourceData.sourceViewBs[_index][0].match(/[^\/\\]+$/)||[""])[0]}
          itemIndex={_index}
          selectedIndex={selectedIndex}
          setSelectedIndex={(_index:number)=>{setSelectedIndex(_index);console.log(sourceData.sourceViewBs[_index]);}}
          setRootPathByIndex={async (_index:number)=>await changeRootPathCb(sourceData.sourceViewBs[_index][0])}
          rClickCb={rClickCb}
          key={_index}
        ></ViewItem>:"")
      }
      </div>
    </ThemeProvider>
  );
}

export default App;
