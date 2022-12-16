import { DragEvent, EventHandler, useState } from "react";
import { downsampleBuffer, Recorder } from "../../mlgrid/recorder";
import { WavWriter } from "../../mlgrid/wavWriter";

class Context {
    recorder: Recorder;
    wavWriter: WavWriter;
    constructor(){
        this.recorder = new Recorder();
        this.wavWriter = new WavWriter();
        const targetSampleRate = 16000;
        this.recorder.onProcessRecording = channelData=>{
            const uint8buff = downsampleBuffer(channelData,
                this.recorder.getAudioContext()!.sampleRate,
                targetSampleRate);
                this.wavWriter.addData(uint8buff);
        };
        this.recorder.onStopRecording = ()=>{
            const wavFile = this.wavWriter.getWavFile();
            this.onAudio(wavFile);
        };
        this.recorder.start(targetSampleRate);
    }

    finish(){
        this.recorder.stop();
    }

    onAudio(content: ArrayBuffer){
    }
}

export function AudioDropButton({onAudio, recordingEnabled} :
        {onAudio: (data: ArrayBuffer)=>void, recordingEnabled: boolean}){
    const [audio, setAudio] = useState<ArrayBuffer | null>(null);
    const [context, setContext] = useState<Context | null>(null);
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
            console.log(`audio ${content.byteLength} bytes.`)
        };
        fr.readAsArrayBuffer(e.dataTransfer.files[0]);   
    }

    const onRecordingClick = ()=>{
        if(context){
            context.finish();
            setContext(null);
        } else{
			const ctx = new Context();
            ctx.onAudio = content =>{
                onAudio(content);
                setAudio(content);
            }
            setContext(ctx);
        }
    }

    return <div style={{"minHeight": "4em", border: "solid 1pt", borderRadius: "4px", backgroundColor: "#2b70e229"}}
            onClick={e=>e.preventDefault()} onDragOver={onDragOver} onDrop={onDrop}
        className={"btn btn-outline-success form-control"}>
        ここに音声ファイルをドロップしてください。{ recordingEnabled ?
            <span>または録音<a href="#" onClick={onRecordingClick}>{context ? "終了" : "開始"}</a></span> :
            ""}<br/>
        {audio ?
            <audio controls style={{"maxHeight": "256px", "maxWidth": "256px"}} src={URL.createObjectURL(new Blob([audio]))} /> :
            ""}
        </div>;
}
