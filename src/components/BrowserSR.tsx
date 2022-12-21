import { TextField } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ServiceInvoker, ContinuousSpeechRecognitionTranscript } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./ObjectDetection.css"
import { RawResult } from "./lib/RawResult";
import { AudioRecordButton } from "./lib/AudioRecordButton";
import { downsampleBuffer, Recorder } from "../mlgrid/recorder";
import { round } from "../mlgrid/formatUtil";
import { WavWriter } from "../mlgrid/wavWriter";

export interface Input {
    format: string;
    language: string;
}
export interface Invocation{
    id: number;
    input: Input;
    sr: SpeechRecognition | null;
    recorder: Recorder | null;
    writer: WavWriter;
    results: Result[];
}
export interface Result{
    interims: string[];
    fixes: string[];
}

const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
let invId = 0;
export function BrowserSR({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "language": "ja"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const recorder = useRef<Recorder | null>(null);
    const recognizer = useRef<SpeechRecognition | null>(null);

    const onSubmit: SubmitHandler<Input> = (input)=>{
        if(recorder.current == null){
            // start rec
            const rec = new Recorder();
            const writer = new WavWriter({channels: 1, sampleSizeInBits: 16, sampleRate: 16000});
            rec.on("processRecording", (data: Float32Array)=>{
                writer.addData(downsampleBuffer(
                    data, rec.getAudioContext()!.sampleRate, 16000));
            })
            rec.start(16000);
            const sr = new SpeechRecognition();
            sr.continuous = true;
            sr.lang = input.language;
            sr.interimResults = true;
            sr.maxAlternatives = 1;
            sr.start();
            const inv: Invocation = { id: invId++, input: input, sr: sr, recorder: rec, writer: writer,results: []};
            inv.results.push({fixes: [], interims: []});
            invocations.unshift(inv);
            recorder.current = rec;
            recognizer.current = sr;
        } else{
            recorder.current.stop();
            recorder.current = null;
            if(recognizer.current != null){
                recognizer.current.stop();
                recognizer.current = null;
            }
        }
        setInvState(invState.clone());
    };

    return <div>
		<label>inputs:</label><br/><br/>
		<div data-id="inputs">
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register("language")} />
                <AudioRecordButton />
                <br/>
            </form>
		</div>
        <br/>
        <label>results:</label>
        <div>
        {invState.value.map(inv=><CSRInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>;
}

const CSRInvocation = ({si, inv}: {si: ServiceInvoker; inv: Invocation})=>{
    const refFirst = useRef(true);
    const [audio, setAudio] = useState<ArrayBuffer | null>(null);
    const {id, input, results} = inv;
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(audio != null) return;
    });
    inv.recorder?.on("stopRecording", ()=>{
        setAudio(inv.writer.getWavFile());
    });

    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        -- invocation:{id} --<br/>
        input:<br/>
        audio: {audio != null ?
            <audio controls src={URL.createObjectURL(new Blob([audio]))} /> :
            "recording..."}
            <br/>
        language: {input.language}<br/>
        <br/>
        results:<br/>
        {results.map((r, i)=><CSRInvocationResult key={i} invocation={inv} result={r} si={si} />)}
        </div>;
};

const CSRInvocationResult = ({si, invocation, result}: {si: ServiceInvoker; invocation: Invocation; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);

    invocation.sr!.onresult = e=>{
        console.log("onresult");
        const finals: string[] = [];
        const interims: string[] = [];
        for(let r of e.results){
            if(r.isFinal){
                finals.push(r[0].transcript);
            } else{
                interims.push(r[0].transcript);
            }
        }
        result.fixes = finals;
        result.interims = interims;
        setRes(res.clone());
    };

    return <div>BrowserSR
        { res.value.fixes.length > 0 || res.value.interims.length > 0 || invocation.recorder == null ?
            <>
                : {res.value.fixes.length} transcripts.<br/>
                <div>
                    {res.value.interims.map((v, i) =>
                        <span key={i}><span>
                            [認識中...] {v})
                        </span><br/></span>
                    )}
                    {res.value.fixes.map((v, i) =>
                        <span key={res.value.interims.length + i}><span>
                            {v}
                        </span><br/></span>
                    )}
                </div>
                <br/>
                <RawResult result={[...res.value.interims, ...res.value.fixes]} />
                <br/>
            </> :
            <>: processing...<span className="loader" />{res.value.fixes.length}</>
        }
        </div>;
};
