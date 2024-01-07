import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    text: string;
    textLanguage: string;
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    usedGpuMegas: number[];
    result: string | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function TextGeneration({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "text": "Tell me about alpacas.",
        "textLanguage": "en"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("TextGenerationService") || [];
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            id: invId++, input: input, results: []
        };
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId,
                result: null, error: null, ellapsedMs: 0, usedGpuMegas: []});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };
    return (
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="text" multiline size="small" type="text" style={{width: "70%"}} {...register("text")} />
                <TextField label="textLanguage" size="small" type="text" style={{width: "6em"}} {...register("textLanguage")} />
                <Button type="submit" variant="contained" >送信</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/>
        <a href="https://huggingface.co/cerebras">Cerebras</a><br/>
        <a href="https://huggingface.co/cyberagent/open-calm-small">CyberAgent OpenCalm</a><br/>
        <a href="https://github.com/kunishou/Japanese-Alpaca-LoRA">Japalese Alpaca LoRA</a><br/>
        <a href="https://huggingface.co/lightblue/japanese-mpt-7b">Lightblue Japanese MPT</a><br/>
        <a href="https://huggingface.co/line-corporation/japanese-large-lm-1.7b">LINE Japanese Large LM</a><br/>
        <a href="https://huggingface.co/lmsys/vicuna-7b-v1.5">LMSYS Vicuna</a><br/>
        <a href="https://huggingface.co/meta-llama/Llama-2-7b">Meta Llama2</a><br/>
        <a href="https://huggingface.co/mosaicml/mpt-7b">MosaicML MPT</a><br/>
        <a href="https://huggingface.co/rinna/bilingual-gpt-neox-4b">Rinna GPT Neox</a><br/>
        <a href="https://huggingface.co/BlinkDL/rwkv-4-pile-14b">RWKV</a>(+ <a href="https://huggingface.co/shi3z/RWKV-LM-LoRA-Alpaca-Cleaned-Japan">LoRA-Alpaca-Cleaned-Japan</a>)<br/>
        <a href="https://huggingface.co/stabilityai/japanese-stablelm-base-alpha-7b">StabilityAI Japanese StableLM Alpha</a><br/>
        <a href="https://huggingface.co/stockmark/gpt-neox-japanese-1.4b">Stockmark GPT-NeoX Japanese</a><br/>


        <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><TextGenerationInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const TextGenerationInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    text: {input.text.split("\n").map(s=><>{s}<br/></>)}
    textLanguage: {input.textLanguage}<br/>
    results:<br/>
    {results.map((r, i)=><TextGenerationInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const TextGenerationInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.textGeneration(result.serviceId).generate(input.text, input.textLanguage)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                result.usedGpuMegas = si.lastUsedGpuMegas();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        {r.serviceId}{ (r.result != null) || r.error ?
        <>({r.ellapsedMs.toLocaleString()}ms{r.usedGpuMegas.length > 0 ? `, gpu: ${r.usedGpuMegas.map(v=>v.toLocaleString() + "MB")}`: ""}):<br/> { r.result != null ?
            <>{r.result.split("\n").map((s, i)=><span key={i}>{s}<br/></span>)}</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
