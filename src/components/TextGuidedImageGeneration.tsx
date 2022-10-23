import { Button, TextField } from "@mui/material";
import React, { ChangeEventHandler } from "react";
import { memo } from "react";
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
const Invocation = memo(({inv: {value: {input, results}}}: {inv: Holder<TextGuidedImageGenerationInvocation>})=>{
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
            language: {input.language}, prompt: {input.prompt}, numOfGeneration: {input.numOfGenerations}<br/>
            results:<br/>
            {results.map((ir, i)=>
                <div key={i}>{ir.serviceId}{ir.images.length > 0 ? `(${ir.ellapsedMs}ms): done.` : ": processing..."}<br/>
                    {ir.images.map((r, i) =>
                        <img key={i} src={URL.createObjectURL(new Blob([r.image.buffer]))}></img>
                    )}
                </div>
            )}
        </div>
    );
});
export function TextGuidedImageGeneration({si, services, state}:
        {si: ServiceInvoker; services: Map<string, string[]>;
        state: [Holder<Holder<TextGuidedImageGenerationInvocation>[]>,
            React.Dispatch<React.SetStateAction<Holder<Holder<TextGuidedImageGenerationInvocation>[]>>>]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "language": "en",
        "prompt": "sunset over a lake in the mountains",
        "numOfGenerations": 2
    }});
    const [invocations, setInvocations] = state;
    const sids = services.get("TextGuidedImageGenerationService") || [];
    const validServices = new Set(sids);
    if(services.size === 0) return (<div />);

    const onSubmit: SubmitHandler<Input> = (data)=>{
        console.log("onsubmit");
        const lang = data.language;
        const ppt = data.prompt;
        const n = data.numOfGenerations;
        const results = [];
        let start = new Date().getTime();
        const serviceResults : Result[] = [];
        const length = invocations.value.push(new Holder<TextGuidedImageGenerationInvocation>({
            input: {
                language: lang,
                prompt: ppt,
                numOfGenerations: n
            }, results: serviceResults
        }));
        for(const sid of validServices){
            results.push({serviceId: sid});
            const result: Result = {serviceId: sid, images: [], ellapsedMs: 0};
            si.textGuidedImageGeneration(sid).generateMultiTimes(lang, ppt, n)
                .then(r =>{
                    result.images.push(...r);
                    invocations.value[length - 1] = invocations.value[length - 1].clone();
                    setInvocations(invocations.clone());
                });
            serviceResults.push(result);
        }
        setInvocations(invocations.clone());
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
        {invocations.value.map((inv, i)=><Invocation key={i} inv={inv} />)}
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
