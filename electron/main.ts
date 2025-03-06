import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import chp from 'node:child_process'

const fsexists = async (_path:string)=>{try{await fs.stat(_path);return true;}catch{return false;}}

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(__dirname, 'icon.png'),
    title:"PMDLIB",
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation:false,
      nodeIntegration:true,
      webSecurity:false,
    },
  });
  // win.webContents.openDevTools();
  win.setMenuBarVisibility(false);

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(()=>{
  ipcMain.handle("list_dir", async (e,_path)=>{
    const rds = await fs.readdir(_path);
    console.log([rds]);
    const ret:string[][] = [];
    for (let i = 0; i < rds.length; i++) {
      const iname = rds[i];
      const fullPath = path.join(_path, iname);
      const _fstat = await fs.stat(fullPath);
      const xdf = _fstat.isDirectory()?"d":(_fstat.isFile()?"f":"n");
      const mtime = _fstat.mtime.getTime().toString();
      const fsize = (_fstat.isFile()?_fstat.size:0).toString();
      const hh = createHash("sha256");
      hh.update(fullPath+xdf+mtime+fsize);
      const hc = hh.digest("hex").toString()
      ret.push([
        fullPath,
        xdf,
        mtime,
        fsize,
        hc
      ]);
    }
    // path file_dir mtime size hash
    return ret;
  });
  ipcMain.handle("get_temp_dir", async()=>process.env["TEMP"]||"");
  ipcMain.handle("get_temp_app_dir", async()=>{
    const _path = path.join(process.env["TEMP"]||"", "PMDLIB");
    if (!(await fsexists(_path))){
      await fs.mkdir(_path);
    }
    return _path;
  });
  ipcMain.handle("get_temp_app_thumbs_dir", async()=>{
    const _path = path.join(process.env["TEMP"]||"", "PMDLIB", "thumbs");
    if (!(await fsexists(_path))){
      await fs.mkdir(_path);
    }
    return _path;
  });
  ipcMain.handle("open_file", async(e,_path:string)=>{
    chp.spawn("cmd.exe",["/C","start","",_path.replace(/\//g,"\\")]);
  });
  ipcMain.handle("open_parent_dir", async(e,_path)=>{
    chp.spawn("C:\\Windows\\explorer.exe",[path.dirname(_path).replace(/\//g,"\\")]);
  });
  ipcMain.handle("convert_thumb", async(e, _in_path, _out_path)=>{
    const logf = _out_path + ".log";
    let doConvert = false;
    if (await fsexists(logf)){
      try{await fs.rm(logf);await fs.rm(_out_path);}catch{}
    }
    if (await fsexists(_out_path)){return doConvert;}
    const pdir = path.dirname(_out_path);
    if (!(await fsexists(pdir))){console.log(`mkdir ${pdir}`);await fs.mkdir(pdir);}
    console.log([_in_path, _out_path]);
    // const mpath = "D:\\pu\\ffmpeg-7.0.2-full_build\\bin\\ffmpeg.exe";
    const fmp = "ffmpeg.exe";
    // command
    // D:\pu\ffmpeg-7.0.2-full_build\bin\ffmpeg.exe -i "%filein%" -vf scale=128:128 -r 12 -b 48k -frames 24 "%fileout%"
    doConvert = true;
    const _p = chp.spawn(fmp, ["-i",_in_path,"-vf","scale=128:128","-r","12","-b","48k","-frames","24",_out_path]);
    const fh = await fs.open(logf,"w");
    let closeed = false;
    _p.stdout.on("data", data=>{
      // console.log(`stdout: ${data}`);
      fs.writeFile(fh, data);
    });
    _p.stderr.on("data", data=>{
      // console.log(`stderr: ${data}`);
      fs.writeFile(fh, data);
    });
    _p.on("close", async()=>{
      console.log(`process ret ${_p.pid}`);
      closeed = true;
      fs.writeFile(fh, 'end');
      await fh.close();
      await fs.rm(logf);
    });
    let wch = fs.watch(logf);
    for await (const x of wch){
      if (closeed){break;}
    }
    return doConvert;
  });
  ipcMain.handle("start_drag", async(e, _path)=>{
    const icpath = path.join(__dirname,"drag.png");
    if (!_path){return;}
    e.sender.startDrag({file:_path,icon:icpath});
  });
  createWindow();
})
