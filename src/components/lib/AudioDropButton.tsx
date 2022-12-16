import { DragEvent, EventHandler, useState } from "react";

export function AudioDropButton({onAudio} : {onAudio: (data: ArrayBuffer)=>void}){
    const [audio, setAudio] = useState<ArrayBuffer | null>(null);
    const onDragOver: EventHandler<DragEvent> = e=>{
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
    };
    const onDrop: EventHandler<DragEvent> = e=>{
        e.preventDefault();
        const fr = new FileReader();
        fr.onload = ()=>{
            const content = fr.result as ArrayBuffer;
            onAudio(content);
            setAudio(content);
        };
        fr.readAsArrayBuffer(e.dataTransfer.files[0]);   
    }

    return <button style={{"minHeight": "4em"}} onClick={e=>e.preventDefault()} onDragOver={onDragOver} onDrop={onDrop}
        className={"btn btn-outline-success form-control"}>
        ここに音声ファイルをドロップしてください<br/>
        {audio ?
            <audio style={{"maxHeight": "256px", "maxWidth": "256px"}} src={URL.createObjectURL(new Blob([audio]))} /> :
            ""}
        </button>;
}
