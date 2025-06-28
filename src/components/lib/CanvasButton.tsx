import { DragEvent, EventHandler, useEffect, useRef } from "react";
import { CanvasDrawer } from "./CanvasDrawer";
import { Button } from "@mui/material";


interface Props{
    onImageUpdated?: (data: ArrayBuffer)=>void;
}
export function CanvasButton({onImageUpdated = ()=>{}} : Props){
    const canvas = useRef<HTMLCanvasElement>(null!);
    const sizeInput = useRef<HTMLInputElement>(null!);
    const colorInput = useRef<HTMLInputElement>(null!);
    const fireUpdate = ()=>{
        canvas.current.toBlob(blob=>{
            if(blob === null) return;
            const reader = new FileReader();
            reader.readAsArrayBuffer(blob);
            reader.onload = ()=>{
                onImageUpdated(reader.result as ArrayBuffer);
            };
        }, "image/png");
    };
    const onDragOver: EventHandler<DragEvent> = e=>{
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
    };
    const onDrop: EventHandler<DragEvent> = e=>{
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = ()=>{
            if(reader.result === null) return;
            const image = new Image();
            image.src = reader.result as string;
            image.onload = () => {
                canvas.current.getContext("2d")?.drawImage(image, 0, 0);
                fireUpdate();
            };
        };
        reader.readAsDataURL(e.dataTransfer.files[0]);
    };
    const onClearButtonClick: EventHandler<React.MouseEvent> = e=>{
        e.preventDefault();
        const ctx = canvas.current.getContext("2d");
        if(ctx === null) return;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
        fireUpdate();
    };
    useEffect(()=>{
        const drawer = new CanvasDrawer();
        drawer.addEventListener("updated", ()=>{
            fireUpdate();
        });
        drawer.attach(canvas.current, sizeInput.current, colorInput.current);
        const ctx = canvas.current.getContext("2d");
        if(ctx === null) return;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
        return ()=>{
            drawer.detach();
        };
    }, []);
    return <div>
        <div>
            Size:  <input ref={sizeInput} type="number" defaultValue={2} min={1} max={10} step={1} required></input>
            Color: <input ref={colorInput} type="color"></input>
            <Button onClick={onClearButtonClick} variant="contained" color="error">Clear</Button>
        </div>
        <canvas ref={canvas} width="512" height="512" style={{borderRadius: "4px", border: "solid 1px"}}
            onDragOver={onDragOver} onDrop={onDrop}
        ></canvas>
    </div>;
}
