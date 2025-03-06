export function convertFileSrc(path:string){
    return "file:///"+path.replace(/\\/g, "/");
}