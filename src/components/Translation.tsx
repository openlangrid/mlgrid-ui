import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, ServiceInvoker } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    sourceLang: string;
    targetLang: string;
    source: string;
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
export function Translation({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "sourceLang": "en",
        "targetLang": "ja",
        "source": "hello world"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("TranslationService") || [];
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
                <TextField label="sourceLang" size="small" type="text" style={{width: "6em"}} {...register("sourceLang")} />
                <TextField label="targetLang" size="small" type="text" style={{width: "6em"}} {...register("targetLang")} />
                <TextField label="source" size="small" type="text" style={{width: "32em"}} {...register("source")} />
                <Button type="submit" variant="contained" >翻訳</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <a href="https://langrid.org">Language Grid</a>&nbsp;
		<a href="https://huggingface.co/Helsinki-NLP">Helsinki-NLP</a>
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><TranslationInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const TranslationInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    sourceLang: {input.sourceLang}, targetLang: {input.targetLang},
    source: {input.source}<br/>
    results:<br/>
    {results.map((r, i)=><TranslationInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const TranslationInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    console.log("InvocationRequest");
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.translation(result.serviceId).translate(input.source, input.sourceLang, input.targetLang)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div>{r.serviceId}{ (r.result != null) || r.error ?
        <>({r.ellapsedMs}ms): { (r.result != null) ?
            <>{r.result}.</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
