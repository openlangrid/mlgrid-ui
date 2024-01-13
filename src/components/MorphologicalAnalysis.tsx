import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, GpuInfo, Morpheme, ServiceInvoker } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    language: string;
    text: string;
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    gpuInfos: GpuInfo[];
    result: Morpheme[] | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function MorphologicalAnalysis({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "text": "貴社の記者が汽車で帰社した。",
        "language": "en"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("MorphologicalAnalysisService") || [];
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            id: invId++, input: input, results: []
        };
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId,
                result: null, error: null, ellapsedMs: 0, gpuInfos: []});
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
                <TextField label="textLanguage" size="small" type="text" style={{width: "6em"}} {...register("language")} />
                <Button type="submit" variant="contained" >送信</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><Invocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const Invocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    text: {input.text.split("\n").map(s=><>{s}<br/></>)}
    language: {input.language}<br/>
    results:<br/>
    {results.map((r, i)=><InvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const InvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.morphologicalAnalysis(result.serviceId).analyze(input.language, input.text)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                result.gpuInfos = si.lastGpuInfos();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        {r.serviceId}{ (r.result != null) || r.error ?
        <>({r.ellapsedMs.toLocaleString()}ms{
            r.gpuInfos.length > 0 ?
                `, gpu: ${r.gpuInfos.map(i=>`${i.usedMemoryMB.toLocaleString()}MB/${i.totalMemoryMB.toLocaleString()}MB`)}` :
                ""
            }):<br/> { r.result != null ?
            <table border={1}>
                <thead>
                    <tr><th>単語</th><th>語幹</th><th>品詞</th></tr>
                </thead>
                <tbody>{
                r.result.map(r=>
                    <tr><td>{r.word}</td><td>{r.lemma}</td><td>{r.partOfSpeech}</td></tr>)
                }</tbody>
            </table> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
