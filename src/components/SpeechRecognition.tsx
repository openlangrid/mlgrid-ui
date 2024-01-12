import { Button, TextField } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { SpeechRecognitionResult, ServiceInvoker, Error } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./ObjectDetection.css"
import { AudioDropButton } from "./lib/AudioDropButton";
import { RawResult } from "./lib/RawResult";

export interface Input {
    audio: ArrayBuffer;
    format: string;
    language: string;
}

export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: SpeechRecognitionResult[] | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function SpeechRecognition({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "format": "audio/x-wav",
        "language": "ja"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("SpeechRecognitionService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onAudio: (data: ArrayBuffer)=>void = data=>{
        console.log(`audio: ${data.byteLength} bytes.`);
        setValue("audio", data);
    };
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = { id: invId++, input: input, results: []};
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId,
                result: null, error: null, ellapsedMs: 0});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };

    return <div>
		<label>inputs:</label><br/><br/>
		<div data-id="inputs">
            <form onSubmit={handleSubmit(onSubmit)}>
                <AudioDropButton onAudio={onAudio} recordingEnabled={true} />
                <br/>
                <br/>
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register("language")} />
                <Button type="submit" variant="contained" >認識</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <br/>
        <a href="https://github.com/openai/whisper">Whisper</a>
        <br/>
        <label>results:</label>
        <div>
        {invState.value.map(inv=><SpeechRecognitionInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>;
}

const SpeechRecognitionInvocation = ({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(input.audio != null) return;
    });

    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        input:<br/>
        audio: <audio controls style={{maxWidth: "256px", maxHeight: "256px", objectFit: "scale-down"}}
            src={URL.createObjectURL(new Blob([input.audio]))} /><br/>
        language: {input.language}<br/>
        <br/>
        results:<br/>
        {results.map((r, i)=><SpeechRecognitionInvocationResult key={i} input={input} result={r} si={si} />)}
        </div>;
};

let key = 0;
const SpeechRecognitionInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.speechRecognition(result.serviceId).recognize(input.audio, input.format, input.language)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div>{r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs}ms): { r.result ?
            <>{r.result.length} transcripts.<br/>
                <div>{r.result.map(v =>
                    <span key={key++}><span>
                        [{v.startMillis}-{v.endMillis}] {v.transcript}
                    </span><br/></span>
                )}</div>
                <RawResult result={r.result} />
                <br/>
            </> :
        <>{JSON.stringify(r.error)}</> }</> :
        <>: processing...<span className="loader" /></>
        }</div>;
};
