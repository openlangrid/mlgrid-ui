import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { round } from "../mlgrid/formatUtil";
import { Error, ServiceInvoker, TextSentimentAnalysisResult } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    text1: string;
    text1Language: string;
    text2: string;
    text2Language: string;
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: number | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}

let invId = 0;
export function TextSimilarityCalculation({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "text1": "今日のお昼はオムライスでした",
        "text1Language": "ja",
        "text2": "Today's lunch was omelet rise.",
        "text2Language": "en"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("TextSimilarityCalculationService") || [];
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
                <TextField label="text1" size="small" type="text" style={{width: "32em"}} {...register("text1")} />
                <TextField label="text1Language" size="small" type="text" style={{width: "6em"}} {...register("text1Language")} />
                <br/>
                <br/>
                <TextField label="text2" size="small" type="text" style={{width: "32em"}} {...register("text2")} />
                <TextField label="text2Language" size="small" type="text" style={{width: "6em"}} {...register("text2Language")} />
                <br/>
                <br/>
                <Button type="submit" variant="contained" >計算</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/>
        <a href="https://tfhub.dev/google/universal-sentence-encoder-multilingual/3">Universal Sentence Encoder</a>&nbsp;
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><TSCInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const TSCInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    text1: {input.text1}, language: {input.text1Language}<br/>
    text2: {input.text2}, language: {input.text2Language}<br/>
    results:<br/>
    {results.map((r, i)=><TSCInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const TSCInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.textSimilarityCalculation(result.serviceId).calculate(
                input.text1, input.text1Language, input.text2, input.text2Language)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    const r = res.value;
    return <div>{r.serviceId}{r.result || r.error ?
        <>({r.ellapsedMs}ms): { r.result ?
            <>{round(r.result, 2)}.</> :
            <>{JSON.stringify(r.error)}</>}</> :
        <>: <span className="loader" /></>
        }</div>;
};
