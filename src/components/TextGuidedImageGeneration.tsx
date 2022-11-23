import { Button, TextField } from "@mui/material";
import { memo, useEffect, useState, useRef, MouseEventHandler } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Image, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    language: string;
    prompt: string;
    numOfGenerations: number;
}

export interface Result{
    serviceId: string;
    images: Image[];
    ellapsedMs: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function TextGuidedImageGeneration({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "language": "en",
        "prompt": "sunset over a lake in the mountains",
        "numOfGenerations": 2
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("TextGuidedImageGenerationService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = { id: invId++, input: input, results: []};
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId, images: [], ellapsedMs: 0});
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
                <TextField label="numOfGenerations" size="small" type="number" style={{width: "8em"}}  {...register("numOfGenerations")} />
                <Button type="submit" variant="contained" >生成</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <label>results:</label>
        <div>
        {invState.value.map(inv=><TGIGInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
        <a href="https://github.com/borisdayma/dalle-mini">Dalle Mini</a> &nbsp;
        <a href="https://github.com/CompVis/stable-diffusion">Stable Diffusion</a> &nbsp;
        <a href="https://github.com/harubaru/waifu-diffusion">Waifu Diffusion</a> &nbsp;
		<a href="https://github.com/rinnakk/japanese-stable-diffusion">Rinna Japanese Stable Diffusion</a> &nbsp;
		<a href="https://huggingface.co/naclbit/trinart_stable_diffusion_v2">trinart_stable_diffusion_v2</a> &nbsp;
		<a href="https://huggingface.co/sd-dreambooth-library/disco-diffusion-style">disco-diffusion-style</a> &nbsp;
		<a href="https://huggingface.co/doohickey/trinart-waifu-diffusion-50-50">trinart-waifu-diffusion-50-50</a>
    </div>;
}
const TGIGInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
            language: {input.language}, prompt: {input.prompt}, numOfGeneration: {input.numOfGenerations}<br/>
            results:<br/>
            {results.map((r, i)=><TGIGInvocationResult key={i} si={si} input={input} result={r} />)}
        </div>
    );
});

const TGIGInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.images.length > 0) return;
        si.textGuidedImageGeneration(result.serviceId)
            .generateMultiTimes(input.language, input.prompt, input.numOfGenerations)
            .then(r =>{
            result.images.push(...r);
            const hs = si.lastResponse()?.headers;
            if(hs && "ellapsedMs" in hs){
                result.ellapsedMs = parseInt(hs["ellapsedMs"]);
            }
            setRes(res.clone());
        });
    });
    return <div>{res.value.serviceId}{res.value.images.length > 0 ?
        `(${res.value.ellapsedMs}ms): done.` :
        ": processing..."}<br/>
            {res.value.images.map((r, i) =>
                <img alt="" key={i} src={URL.createObjectURL(new Blob([r.image.buffer]))}></img>
            )}
        </div>;
}