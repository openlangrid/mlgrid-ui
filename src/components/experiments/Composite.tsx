import { SubmitHandler, useForm } from "react-hook-form";
import { ServiceInvoker } from "../../mlgrid/serviceInvoker";
import { ServiceCheck, Services } from "../lib/Services";
import { memo, useEffect, useRef, useState } from "react";
import { Holder } from "../../util/Holder";
import { Button, TextField } from "@mui/material";


export interface Input {
    text: string;
    textLanguage: string;
    generationLanguage: string;
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
export function TextGenerationWithTranslation({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "text": "アルパカについて教えてください。",
        "textLanguage": "ja",
        "generationLanguage": "en"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("TextGenerationWithTranslationService") || [];
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
                <TextField label="text" size="small" type="text" style={{width: "24em"}} {...register("text")} />
                <TextField label="textLanguage" size="small" type="text" style={{width: "6em"}} {...register("textLanguage")} />
                <TextField label="generateLanguage" size="small" type="text" style={{width: "6em"}} {...register("generationLanguage")} />
                <Button type="submit" variant="contained" >生成</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><TextGenerationWithTranslationInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const TextGenerationWithTranslationInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    text: {input.text}<br/>
    textLanguage: {input.textLanguage}<br/>
    results:<br/>
    {results.map((r, i)=><TextGenerationWithTranslationInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const TextGenerationWithTranslationInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.textGenerationWithTranslation(result.serviceId)
            .setBindings({
                "Pretranslation": {
                    "serviceId": "FuguMT",
                    "bindings": {}
                },
                "TextGeneration": "Cerebras-GPT2.7B",
                "Posttranslation": "FuguMT"})
            .generate(input.text, input.textLanguage, input.generationLanguage)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        {r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs}ms):<br/> { r.result ?
            <>{r.result.split("\n").map(s=><>{s}<br/></>)}</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
