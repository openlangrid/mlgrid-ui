import { Button, TextField } from "@mui/material";
import { memo, useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Audio, Error, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./TextGuidedImageGeneration.css"

export interface Input {
    text: string;
    textLanguage: string;
}

export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: Audio | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function TextToSpeech({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "text": "今日もいい天気ですね",
        "textLanguage": "ja",
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("TextToSpeechService") || [];
    if(services.size === 0) return <div>no services found</div>;

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
                <TextField label="text" size="small" type="text" style={{width: "32em"}}  {...register("text")} />
                <TextField label="textLanguage" size="small" type="text" style={{width: "6em"}} {...register("textLanguage")} />
                <Button type="submit" variant="contained" >合成</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <br/>
        <a href="https://cloud.google.com/text-to-speech">Google Cloud Text-to-Speech</a> &nbsp;
        <a href="https://github.com/VOICEVOX/voicevox_core/">VoiceVox</a> &nbsp;
        <br/>
        <br/>
        <label>results:</label>
        <div>
        {invState.value.map(inv=><TTSInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>;
}
const TTSInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
            text: {input.text}, textLanguage: {input.textLanguage}<br/>
            results:<br/>
            {results.map((r, i)=><TTSInvocationResult key={i} si={si} input={input} result={r} />)}
        </div>
    );
});

const TTSInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;
        si.textToSpeech(result.serviceId)
            .speak(input.text, input.textLanguage)
            .then(r =>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
        });

    const r = res.value;
    return <div>{r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs.toLocaleString()}ms): { r.result ?
            <>done.<br/>
                <audio controls src={URL.createObjectURL(new Blob([r.result.audio]))} /><br/>
                <span>format: {r.result.format}</span>
            </> :
            <>{JSON.stringify(r.error)}</>}</> :
        <>: <span className="loader" /></>
        }</div>;
}
