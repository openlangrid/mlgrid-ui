import { Button, TextField } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { SpeechEmotionRecognitionResult, ServiceInvoker } from "../mlgrid/serviceInvoker";
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
    results: SpeechEmotionRecognitionResult[];
    ellapsedMs: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function SpeechEmotionRecognition({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "format": "audio/x-wav",
        "language": "ja"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("SpeechEmotionRecognitionService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onAudio: (data: ArrayBuffer)=>void = data=>{
        console.log(`audio: ${data.byteLength} bytes.`);
        setValue("audio", data);
    };
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = { id: invId++, input: input, results: []};
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId, results: [],
                ellapsedMs: 0});
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
        <a href="https://webempath.net/lp-jpn/">Empath</a>(11025Hz) &nbsp;
        <a href="https://github.com/speechbrain/speechbrain">SpeechBrain</a>(16000Hz) &nbsp;
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
        if(res.value.results.length > 0) return;

        si.speechEmotionRecognition(result.serviceId).recognize(input.audio, input.format, input.language)
            .then(r=>{
                result.results.push(...r);
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    return <div>{res.value.serviceId}
        { res.value.results.length > 0 ?
            <>
                ({res.value.ellapsedMs}ms): {res.value.results.length} detections.<br/>
                <div>
                    {res.value.results.map(v =>
                        <span key={key++}><span>
                            {v.label}({v.degree})
                        </span><br/></span>
                    )}
                </div>
                <RawResult result={res.value.results} />
                <br/>
            </> :
            <>: processing...<span className="loader" /></>
        }
        </div>;
};
