import { Button, TextField } from "@mui/material";
import { memo, useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, GpuInfo, Video, ServiceInvoker } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./TextGuidedVideoGeneration.css"

export interface Input {
    language: string;
    prompt: string;
}

export interface Result{
    serviceId: string;
    ellapsedMs: number;
    gpuInfos: GpuInfo[];
    result: Video | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function TextGuidedVideoGeneration({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "language": "en",
        "prompt": "A bustling city street at night, filled with the glow of car headlights and the ambient light of streetlights. The scene is a blur of motion, with cars speeding by and pedestrians navigating the crosswalks. The cityscape is a mix of towering buildings and illuminated signs, creating a vibrant and dynamic atmosphere. The perspective of the video is from a high angle, providing a bird's eye view of the street and its surroundings. The overall style of the video is dynamic and energetic, capturing the essence of urban life at night.",
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("TextGuidedVideoGenerationService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = { id: invId++, input: input, results: []};
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId,
                result: null, error: null, ellapsedMs: 0, gpuInfos: []});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };

    return <div>
		<label>inputs:</label><br/><br/>
		<div data-id="inputs">
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register("language")} />
                <TextField label="prompt" size="small" type="text" style={{width: "32em"}}  {...register("prompt")} />
                <Button type="submit" variant="contained" >生成</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <label>results:</label>
        <div>
        {invState.value.map(inv=><Invocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>;
}
const Invocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
            language: {input.language}, prompt: {input.prompt}<br/>
            results:<br/>
            {results.map((r, i)=><InvocationResult key={i} si={si} input={input} result={r} />)}
        </div>
    );
});

const InvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;
        si.textGuidedVideoGeneration(result.serviceId)
            .generate(input.prompt, input.language)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                result.gpuInfos = si.lastGpuInfos();
                setRes(res.clone());
            });
    });

    const r = res.value;
    console.log(r.gpuInfos);
    return <div>{r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs.toLocaleString()}ms{
            r.gpuInfos.length > 0 ?
                `, gpu: ${r.gpuInfos.map(i=>`${i.usedMemoryMB.toLocaleString()}MB/${i.totalMemoryMB.toLocaleString()}MB`)}` :
                ""
            }):<br/> { r.result != null ?
            <>done.<br/>
                <div style={{display: "inline-block", resize: "both", overflow: "hidden", verticalAlign: "top"}}>
                    <video style={{width: "100%", height: "100%", objectFit: "contain"}}
                        className="tgvgResultVideo" controls
                        src={URL.createObjectURL(new Blob([r.result.video]))}></video>
                </div>
            </> :
            <>{JSON.stringify(r.error)}</>}</> :
        <>: <span className="loader" /></>
        }</div>;
}
