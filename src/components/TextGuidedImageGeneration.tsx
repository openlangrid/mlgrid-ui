import React, { ChangeEventHandler, FormEventHandler } from "react";
import { Image, ServiceInvoker } from "../mlgrid/serviceInvoker";

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
const ServiceResultTag = ({sr}: {sr: ServiceResult})=>{
    let i = 0;
    return <div>{sr.serviceId}: {sr.images.length > 0 ? "done." : "processing"}<br/>
            {sr.images.map(r => {
            const src = URL.createObjectURL(new Blob([r.image.buffer]));
            return <img key={"img" + (i++)} src={src}></img>;
        })}
    </div>;
};
const ServiceInvocationTag = ({sis}: {sis: ServiceInvocation})=>{
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
interface ServiceResult{
    serviceId: string;
    images: Image[];
}
interface ServiceInvocation{
    language: string;
    prompt: string;
    numOfGeneration: number;
    results: ServiceResult[];
}
export function TextGuidedImageGeneration({si, services}: {si: ServiceInvoker, services: Map<string, string[]>}){
    const language = React.useRef<HTMLInputElement>(null);
    const prompt = React.useRef<HTMLInputElement>(null);
    const numOfGenerations = React.useRef<HTMLInputElement>(null);
    const sids = services.get("TextGuidedImageGenerationService") || [];
    const validServices = new Set(sids);
    const [serviceInvocations, setServiceInvocations] = React.useState(new Array<ServiceInvocation>());
    let i = 0;
    if(services.size === 0) return (<div />);

    const onSubmit: FormEventHandler = (e)=>{
        e.preventDefault();
        console.log("onsubmit");
        const lang = language.current!.value;
        const ppt = prompt.current!.value;
        const n = parseInt(numOfGenerations.current!.value);
        const invocations = [];
        let start = new Date().getTime();
        const serviceResults : ServiceResult[] = [];
        for(const sid of validServices){
            invocations.push({serviceId: sid});
            const result: ServiceResult = {serviceId: sid, images: []};
            si.textGuidedImageGeneration(sid).generateMultiTimes(lang, ppt, n)
                .then(r =>{
                    console.log("generated.");
                    result.images.push(...r);
                    console.log(serviceInvocations);
                    setServiceInvocations(serviceInvocations);
                });
            serviceResults.push(result);
        }
        const svi: ServiceInvocation = {
            language: lang,
            prompt: ppt,
            numOfGeneration: n,
            results: serviceResults
        }
        serviceInvocations.push(svi);
        setServiceInvocations(serviceInvocations);
    };
    return (<div className="tab-pane fade show active" id="trans" role="tabpanel" aria-labelledby="transTab">
		<label>inputs:</label><br/>
		<div data-id="inputs">
            <form onSubmit={onSubmit}>
                <label>language: <input ref={language} className="form-control" size={4} type="text" defaultValue={"en"} /></label>
                <label>prompt: <input ref={prompt} className="form-control" size={80} type="text" defaultValue={"sunset over a lake in the mountains"} /></label>
                <label>samples: <input ref={numOfGenerations} className="form-control" size={2} type="number" defaultValue={2} /></label>
                <button className="btn btn-success">生成</button>
            </form>
		</div>
		<label>services:</label>
        {sids.map(s => <ServiceComponent key={s} serviceId={s} checked={validServices} />)}
        <label>results:</label>
        <div>
        {serviceInvocations.map(sis=><ServiceInvocationTag key={"si" + (i++)} sis={sis} />)}
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
