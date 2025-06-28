import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, ServiceInvoker } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import { CanvasButton } from "./lib/CanvasButton";

export interface Input {
    systemPrompt: string;
    systemPromptLanguage: string;
    userPrompt: string;
    userPromptLanguage: string;
    files: {content: ArrayBuffer, format: string}[];
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: string | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function TextInstructionWithImage({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "systemPrompt": "",
        "systemPromptLanguage": "ja",
        "userPrompt": "明るく親しげな口調で、具体的に絵を褒めて、上達のアドバイスをしてください。",
        "userPromptLanguage": "ja"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("TextInstructionWithImageService") || [];
    const onImageUpdated: (data: ArrayBuffer)=>void = data=>{
        setValue("files", [{content: data, format: "image/png"}]);
    };
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
                <TextField label="systemPrompt" multiline size="small" type="text" style={{width: "70%"}} {...register("systemPrompt")} />
                <TextField label="systemPromptLanguage" size="small" type="text" style={{width: "6em"}} {...register("systemPromptLanguage")} />
                <TextField label="userPrompt" multiline size="small" type="text" style={{width: "70%"}} {...register("userPrompt")} />
                <TextField label="userPromptLanguage" size="small" type="text" style={{width: "6em"}} {...register("userPromptLanguage")} />
                <CanvasButton onImageUpdated={onImageUpdated} />
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
    systemPromptLanguage: {input.systemPromptLanguage}<br/>
    userPrompt: {input.userPrompt.split("\n").map(s=><>{s}<br/></>)}
    userPromptLanguage: {input.userPromptLanguage}<br/>
    image: <img alt="" style={{"maxWidth": "256px", "maxHeight": "256px"}}
        src={URL.createObjectURL(new Blob([input.files[0].content]))} /><br/>
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

        si.textInstructionWithImage(result.serviceId).generate(
                input.systemPrompt, input.systemPromptLanguage,
                input.userPrompt, input.userPromptLanguage,
                input.files[0].content, "image/png")
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
        <>({r.ellapsedMs}ms):<br/> { r.result != null ?
            <>{r.result.split("\n").map(s=><>{s}<br/></>)}</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
