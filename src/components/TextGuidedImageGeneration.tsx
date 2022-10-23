import { Button, TextField } from "@mui/material";
import React, { ChangeEventHandler } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Image, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";

const ServiceComponent = ({serviceId, checked}: {serviceId: string; checked: Set<string>}) =>{
    const onChange: ChangeEventHandler<HTMLInputElement> = e=>{
        if(e.target.checked) checked.add(serviceId);
        else checked.delete(serviceId);
    };
    return (
        <div>
            <label><input onChange={onChange} type="checkbox" defaultChecked />&nbsp;
            <span>{serviceId}</span></label>
        </div>
    );
}
const ServiceResultTag = ({sr}: {sr: TextGuidedImageGenerationResult})=>{
    let i = 0;
    return <div>{sr.serviceId}: {sr.images.length > 0 ? "done." : "processing..."}<br/>
            {sr.images.map(r => {
            const src = URL.createObjectURL(new Blob([r.image.buffer]));
            return <img key={"img" + (i++)} src={src}></img>;
        })}
    </div>;
};
const ServiceInvocationTag = ({sis}: {sis: TextGuidedImageGenerationInvocation})=>{
    let i = 0;
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
	    	language: {sis.language}&nbsp;, prompt: {sis.prompt}&nbsp;, numOfGeneration: {sis.numOfGeneration}<br/>
            results:<br/>
            {sis.results.map(sr=>{
                return <ServiceResultTag key={"si" + (i++)} sr={sr} />
            })}
        </div>
    );
};
export interface TextGuidedImageGenerationResult{
    serviceId: string;
    images: Image[];
}
export interface TextGuidedImageGenerationInvocation{
    language: string;
    prompt: string;
    numOfGeneration: number;
    results: TextGuidedImageGenerationResult[];
}
interface  FormInput {
    language: string;
    prompt: string;
    numOfGenerations: number;
}
export function TextGuidedImageGeneration({si, services, results, setResults}:
        {si: ServiceInvoker; services: Map<string, string[]>;
        results: Holder<TextGuidedImageGenerationInvocation[]>;
        setResults: React.Dispatch<React.SetStateAction<Holder<TextGuidedImageGenerationInvocation[]>>>}){
    const { register, handleSubmit } = useForm<FormInput>({defaultValues: {
        "language": "en",
        "prompt": "sunset over a lake in the mountains",
        "numOfGenerations": 2
    }});
    const sids = services.get("TextGuidedImageGenerationService") || [];
    const validServices = new Set(sids);
    if(services.size === 0) return (<div />);

    const onSubmit: SubmitHandler<FormInput> = (data)=>{
        console.log("onsubmit");
        const lang = data.language;
        const ppt = data.prompt;
        const n = data.numOfGenerations;
        const invocations = [];
        let start = new Date().getTime();
        const serviceResults : TextGuidedImageGenerationResult[] = [];
        for(const sid of validServices){
            invocations.push({serviceId: sid});
            const result: TextGuidedImageGenerationResult = {serviceId: sid, images: []};
            si.textGuidedImageGeneration(sid).generateMultiTimes(lang, ppt, n)
                .then(r =>{
                    result.images.push(...r);
                    setResults(results.clone());
                });
            serviceResults.push(result);
        }
        const svi: TextGuidedImageGenerationInvocation = {
            language: lang,
            prompt: ppt,
            numOfGeneration: n,
            results: serviceResults
        }
        results.value.push(svi);
        setResults(results.clone());
    };
    return (<div className="tab-pane fade show active" id="trans" role="tabpanel" aria-labelledby="transTab">
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
        {sids.map(s => <ServiceComponent key={s} serviceId={s} checked={validServices} />)}
        <label>results:</label>
        <div>
        {results.value.map((sis, i)=><ServiceInvocationTag key={i} sis={sis} />)}
        </div>
        <a href="https://github.com/borisdayma/dalle-mini">Dalle Mini</a> &nbsp;
        <a href="https://github.com/CompVis/stable-diffusion">Stable Diffusion</a> &nbsp;
        <a href="https://github.com/harubaru/waifu-diffusion">Waifu Diffusion</a> &nbsp;
		<a href="https://github.com/rinnakk/japanese-stable-diffusion">Rinna Japanese Stable Diffusion</a> &nbsp;
		<a href="https://huggingface.co/naclbit/trinart_stable_diffusion_v2">trinart_stable_diffusion_v2</a> &nbsp;
		<a href="https://huggingface.co/sd-dreambooth-library/disco-diffusion-style">disco-diffusion-style</a> &nbsp;
		<a href="https://huggingface.co/doohickey/trinart-waifu-diffusion-50-50">trinart-waifu-diffusion-50-50</a>
    </div>
    );
}
