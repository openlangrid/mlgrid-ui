import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    instruction: string;
    input: string;
    language: string;
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
export function TextGeneration({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "instruction": "",
        "input": "Tell me about alpacas.",
        "language": "en"
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
                <TextField label="instruction" size="small" type="text" style={{width: "24em"}} {...register("instruction")} />
                <TextField label="input" size="small" type="text" style={{width: "24em"}} {...register("input")} />
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register("language")} />
                <Button type="submit" variant="contained" >生成</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <a href="https://github.com/kunishou/Japanese-Alpaca-LoRA">Japalese Alpaca LoRA</a>
        <br/> <br/>
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
    instruction: <pre>{input.instruction}</pre><br/>
    input: <pre>{input.input}</pre><br/>
    language: {input.language}<br/>
    results:<br/>
    {results.map((r, i)=><TextGenerationInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const TextGenerationInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    console.log("InvocationRequest");
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.textGeneration(result.serviceId).generate(input.instruction, input.input, input.language)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    const r = res.value;
    return <div>{r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs}ms): { r.result ?
            <>{r.result}.</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
