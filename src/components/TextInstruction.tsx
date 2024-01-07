import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, GpuInfo, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    systemPrompt: string;
    userPrompt: string;
    promptLanguage: string;
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    gpuInfos: GpuInfo[];
    result: string | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function TextInstruction({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "systemPrompt": "あなたは誠実で優秀な日本人のアシスタントです。",
        "userPrompt":"最も一般的な挨拶を教えてください。",
        "promptLanguage": "ja"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("TextInstructionService") || [];
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            id: invId++, input: input, results: []
        };
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId,
                result: null, error: null, ellapsedMs: 0, gpuInfos: []});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };
    return (
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="systemPrompt" multiline size="small" type="text" style={{width: "70%"}} {...register("systemPrompt")} />
                <br/>
                <TextField label="userPrompt" multiline size="small" type="text" style={{width: "70%"}} {...register("userPrompt")} />
                <br/>
                <TextField label="promptLanguage" size="small" type="text" style={{width: "6em"}} {...register("promptLanguage")} />
                <Button type="submit" variant="contained" >送信</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />

        <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><InvocationLog key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const InvocationLog = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    systemPrompt: {input.systemPrompt.split("\n").map(s=><>{s}<br/></>)}
    userPrompt: {input.userPrompt.split("\n").map(s=><>{s}<br/></>)}
    promptLanguage: {input.promptLanguage}<br/>
    results:<br/>
    {results.map((r, i)=><InvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const InvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.textInstruction(result.serviceId)
            .generate(input.systemPrompt, input.userPrompt, input.promptLanguage)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        {r.serviceId}{ (r.result != null) || r.error ?
        <>({r.ellapsedMs.toLocaleString()}ms{
            r.gpuInfos.length > 0 ?
                `, gpu: ${r.gpuInfos.map(i=>`${i.usedMemoryMB.toLocaleString()}MB/${i.totalMemoryMB.toLocaleString()}MB`)}` :
                ""
            }):<br/> { r.result != null ?
            <>{r.result.split("\n").map((s, i)=><span key={i}>{s}<br/></span>)}</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
