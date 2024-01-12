import { Button, TextField } from "@mui/material";
import { memo, useEffect, useState, useRef, MouseEventHandler } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, Image, ServiceInvoker } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./TextGuidedImageManipulation.css"
import { ImageDropButton } from "./lib/ImageDropButton";

export interface Input {
    image: ArrayBuffer;
    imageFormat: string;
    language: string;
    prompt: string;
    numOfGenerations: number;
}

export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: Image[] | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function TextGuidedImageManipulation({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "imageFormat": "image/png",
        "language": "en",
        "prompt": "A fantasy landscape, trending on artstation",
        "numOfGenerations": 2
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("TextGuidedImageManipulationService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onImage: (data: ArrayBuffer)=>void = data=>{
        setValue("image", data);
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
                <ImageDropButton onImage={onImage} />
                <br/>
                <br/>
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register("language")} />
                <TextField label="prompt" size="small" type="text" style={{width: "32em"}}  {...register("prompt")} />
                <TextField label="numOfGenerations" size="small" type="number" style={{width: "8em"}}  {...register("numOfGenerations")} />
                <Button type="submit" variant="contained" >生成</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <br/>
        <a href="https://github.com/CompVis/stable-diffusion">Stable Diffusion</a> &nbsp;
        <a href="https://github.com/harubaru/waifu-diffusion">Waifu Diffusion</a> &nbsp;
		<a href="https://huggingface.co/naclbit/trinart_stable_diffusion_v2">trinart_stable_diffusion_v2</a> &nbsp;
		<a href="https://huggingface.co/sd-dreambooth-library/disco-diffusion-style">disco-diffusion-style</a> &nbsp;
		<a href="https://huggingface.co/doohickey/trinart-waifu-diffusion-50-50">trinart-waifu-diffusion-50-50</a> &nbsp;
        <br/>
        <br/>
        <label>results:</label>
        <div>
        {invState.value.map(inv=><TGIMInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>;
}
const TGIMInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
    const url = URL.createObjectURL(new Blob([input.image]));
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
            image: <img src={url} style={{maxWidth: 512, maxHeight: 512, objectFit: "scale-down"}} /><br/>
            language: {input.language}, prompt: {input.prompt}, numOfGeneration: {input.numOfGenerations}<br/>
            results:<br/>
            {results.map((r, i)=><TGIMInvocationResult key={i} si={si} input={input} result={r} />)}
        </div>
    );
});

const TGIMInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;
        si.textGuidedImageManipulation(result.serviceId)
            .manipulate(input.image, input.imageFormat, input.prompt, input.language, input.numOfGenerations)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
    });

    const r = res.value;
    return <div>{r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs.toLocaleString()}ms): { r.result ?
            <>done. : {r.result.map((r, i) =>
                <img alt="" className="tgigResultImage" key={i} src={URL.createObjectURL(new Blob([r.image]))}></img>
            )}</> :
            <>{JSON.stringify(r.error)}</>}</> :
        <>: <span className="loader" /></>
        }</div>;
}
