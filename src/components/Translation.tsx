import { Button, TextField } from "@mui/material";
import React, { ChangeEventHandler, memo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ServiceInvoker } from "../mlgrid/serviceInvoker";
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
};

export interface Input {
    sourceLang: string;
    targetLang: string;
    source: string;
}
export interface Result{
    serviceId: string;
    result: string | null;
    ellapsedMs: number;
}
export interface TranslationInvocation{
    input: Input;
    results: Result[];
}
const Invocation = memo(({inv: {value: {input, results}}}: {inv: Holder<TranslationInvocation>})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    sourceLang: {input.sourceLang}, targetLang: {input.targetLang},
    source: {input.source}<br/>
    results:<br/>
    {results.map((ir, i)=>
        <div key={i} >{ir.serviceId}{ir.result ? `(${ir.ellapsedMs}ms)` : ""}:
            {ir.result ? ir.result : "processing..."}</div>
    )}
    </div>);
export function Translation({services, si, state}:
    {services: Map<string, string[]>; si: ServiceInvoker;
        state: [Holder<Holder<TranslationInvocation>[]>, React.Dispatch<React.SetStateAction<Holder<Holder<TranslationInvocation>[]>>>]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "sourceLang": "en",
        "targetLang": "ja",
        "source": "hello world"
    }});
    if(services.size === 0) return (<div />);
    const [invocations, setInvocations] = state;
    const sids = services.get("TranslationService") || [];
    const validServices = new Set(sids);
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const sl = input.sourceLang;
        const tl = input.targetLang;
        const s = input.source;
        let start = new Date().getTime();
        const results : Result[] = [];
        const length = invocations.value.push(new Holder<TranslationInvocation>({
            input: input, results: results
        }));
        for(const sid of validServices){
            const result: Result = {serviceId: sid, result: null, ellapsedMs: 0};
            si.translation(sid).translate(sl, tl, s)
                .then(r=>{
                    result.result = r;
                    result.ellapsedMs = (new Date().getTime()) - start
                    invocations.value[length - 1] = invocations.value[length - 1].clone();
                    setInvocations(invocations.clone());
                    start = new Date().getTime();
                })
                .catch(console.error);
            results.push(result);
        }
        setInvocations(invocations.clone());
    };
    return (
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="sourceLang" size="small" type="text" style={{width: "6em"}} {...register("sourceLang")} />
                <TextField label="targetLang" size="small" type="text" style={{width: "6em"}} {...register("targetLang")} />
                <TextField label="source" size="small" type="text" style={{width: "32em"}} {...register("source")} />
                <Button type="submit" variant="contained" >翻訳</Button>
            </form>
		</div>
        <br/>
		<label>services:</label>
        {sids.map(s => <ServiceComponent key={s} serviceId={s} checked={validServices} />)}
        <a href="https://langrid.org">Language Grid</a>&nbsp;
		<a href="https://huggingface.co/Helsinki-NLP">Helsinki-NLP</a>
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invocations.value.map((inv, i)=><Invocation key={i} inv={inv} />)}
        </div>
    </div>
    );
}
