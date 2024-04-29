import { Button } from "@mui/material";
import { DragEvent, EventHandler, useState } from "react";

export function ImageDropButton({onImage} : {onImage: (data: ArrayBuffer)=>void}){
    const [image, setImage] = useState<ArrayBuffer | null>(null);
    const onDragOver: EventHandler<DragEvent> = e=>{
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
    };
    const onDrop: EventHandler<DragEvent> = e=>{
        e.preventDefault();
        const fr = new FileReader();
        fr.onload = ()=>{
            const img = fr.result as ArrayBuffer;
            onImage(img);
            setImage(img);
        };
        fr.readAsArrayBuffer(e.dataTransfer.files[0]);   
    }

    return <Button variant="contained" style={{"minHeight": "4em"}}
        onClick={e=>e.preventDefault()} onDragOver={onDragOver} onDrop={onDrop}
        className={"btn btn-outline-success form-control"}>
        ここに画像をドロップしてください<br/>
        {image ?
            <img alt="" style={{"maxHeight": "256px", "maxWidth": "256px"}} src={URL.createObjectURL(new Blob([image]))} /> :
            ""}
        </Button>;
}
