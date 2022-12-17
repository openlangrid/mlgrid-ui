import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { round } from "../mlgrid/formatUtil";
import { ServiceInvoker, TextSentimentAnalysisResult } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    language: string;
    text: string;
}
export interface Result{
    serviceId: string;
    result: TextSentimentAnalysisResult | null;
    ellapsedMs: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}

let invId = 0;
export function TextSentimentAnalysis({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "language": "ja",
        "text": "昨日の大雨が嘘のような快晴だ"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("TextSentimentAnalysisService") || [];
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            id: invId++, input: input, results: []
        };
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId, result: null, ellapsedMs: 0});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };
    return (
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register("language")} />
                <TextField label="text" size="small" type="text" style={{width: "32em"}} {...register("text")} />
                <Button type="submit" variant="contained" >推定</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/>
        <a href="https://github.com/cl-tohoku/bert-japanese/tree/v1.0">BERT Models for Japanese NLP</a>&nbsp;
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><TSAInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const TSAInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    language: {input.language}, text: {input.text}<br/>
    results:<br/>
    {results.map((r, i)=><TSAInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const TSAInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    console.log("InvocationRequest");
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result != null) return;

        si.textSentimentAnalysis(result.serviceId).analyze(input.language, input.text)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    const {label, accuracy} = res.value.result!;
    return <div>{res.value.serviceId}{res.value.result ?
        <>({res.value.ellapsedMs}ms): {label}({round(accuracy, 2)}).</> :
        <>: <span className="loader" /></>
        }</div>;
};
