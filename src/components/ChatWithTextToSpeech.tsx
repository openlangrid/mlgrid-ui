import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Audio, Error, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    utterance: string;
    utteranceLanguage: string;
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
export function ChatWithTextToSpeech({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "utterance": "アルパカについて教えてください。",
        "utteranceLanguage": "ja"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("ChatWithTextToSpeechService") || [];
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            id: invId++, input: input, results: []
        };
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId,
                result: null, error: null, ellapsedMs: 0});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };
    return (
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="utterance" size="small" type="text" style={{width: "24em"}} {...register("utterance")} />
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register("utteranceLanguage")} />
                <Button type="submit" variant="contained" >生成</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><ChatWithTextToSpeechInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const ChatWithTextToSpeechInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    utterance: {input.utterance}<br/>
    utteranceLanguage: {input.utteranceLanguage}<br/>
    results:<br/>
    {results.map((r, i)=><ChatWithTextToSpeechInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const ChatWithTextToSpeechInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.chatWithTextToSpeech(result.serviceId).chat(input.utterance, input.utteranceLanguage)
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
            <>done.<br/>
                <audio controls src={URL.createObjectURL(new Blob([r.result.audio]))} /><br/>
                <span>format: {r.result.format}</span>
            </> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};