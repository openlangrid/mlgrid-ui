import { Button, TextField } from "@mui/material";
import React, { memo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Image, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { Service, ServiceCheck } from "./Service";

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
export interface TextGuidedImageGenerationInvocation{
    input: Input;
    results: Result[];
}
export function TextGuidedImageGeneration({si, services, state}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>;
        state: [Holder<Holder<TextGuidedImageGenerationInvocation>[]>,
            React.Dispatch<React.SetStateAction<Holder<Holder<TextGuidedImageGenerationInvocation>[]>>>]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "language": "en",
        "prompt": "sunset over a lake in the mountains",
        "numOfGenerations": 2
    }});
    const [invocations, setInvocations] = state;
    const scs = services.get("TextGuidedImageGenerationService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onSubmit: SubmitHandler<Input> = (input)=>{
        const lang = input.language;
        const ppt = input.prompt;
        const n = input.numOfGenerations;
        let start = new Date().getTime();
        const serviceResults : Result[] = [];
        const length = invocations.value.push(new Holder<TextGuidedImageGenerationInvocation>({
            input: input, results: serviceResults
        }));
        for(const sc of scs){
            if(!sc.checked) continue;
            const result: Result = {serviceId: sc.serviceId, images: [], ellapsedMs: 0};
            si.textGuidedImageGeneration(sc.serviceId).generateMultiTimes(lang, ppt, n)
                .then(r =>{
                    result.images.push(...r);
                    result.ellapsedMs = (new Date().getTime()) - start; // si.lastResponse()?.headers["ellapsedMillis"];
                    invocations.value[length - 1] = invocations.value[length - 1].clone();
                    setInvocations(invocations.clone());
                    start = new Date().getTime();
                });
            serviceResults.push(result);
        }
        setInvocations(invocations.clone());
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
		<label>services:</label>
        {scs.map((sc, i) => <Service key={i} sc={sc} />)}
        <label>results:</label>
        <div>
        {invocations.value.map((inv, i)=><Invocation key={i} inv={inv} />)}
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
const Invocation = memo(({inv: {value: {input, results}}}: {inv: Holder<TextGuidedImageGenerationInvocation>})=>{
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
            language: {input.language}, prompt: {input.prompt}, numOfGeneration: {input.numOfGenerations}<br/>
            results:<br/>
            {results.map((ir, i)=>
                <div key={i}>{ir.serviceId}{ir.images.length > 0 ? `(${ir.ellapsedMs}ms): done.` : ": processing..."}<br/>
                    {ir.images.map((r, i) =>
                        <img alt="" key={i} src={URL.createObjectURL(new Blob([r.image.buffer]))}></img>
                    )}
                </div>
            )}
        </div>
    );
});
