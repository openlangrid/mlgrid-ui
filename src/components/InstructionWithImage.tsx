import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import { ImageDropButton } from "./lib/ImageDropButton";

export interface Input {
    text: string;
    textLanguage: string;
    files: {content: ArrayBuffer, format: string}[];
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
export function InstructionWithImage({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "text": "これは何をしているところですか？",
        "textLanguage": "en"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("InstructionWithImageService") || [];
    const onImage: (data: ArrayBuffer)=>void = data=>{
        setValue("files", [{content: data, format: ""}]);
    };
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
                <TextField label="text" multiline size="small" type="text" style={{width: "70%"}} {...register("text")} />
                <TextField label="textLanguage" size="small" type="text" style={{width: "6em"}} {...register("textLanguage")} />
                <ImageDropButton onImage={onImage} />
                <Button type="submit" variant="contained" >送信</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/>
        <a href="https://huggingface.co/rinna/bilingual-gpt-neox-4b-minigpt4">Rinna GPT Neox MiniGPT4</a><br/>
        <a href="https://huggingface.co/stabilityai/japanese-instructblip-alpha">StabilityAI Japanese InstructBLIP Alpha</a><br/>


        <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><InstructionWithImageInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const InstructionWithImageInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    text: {input.text.split("\n").map(s=><>{s}<br/></>)}
    textLanguage: {input.textLanguage}<br/>
    image: <img alt="" style={{"maxWidth": "256px", "maxHeight": "256px"}}
        src={URL.createObjectURL(new Blob([input.files[0].content]))} /><br/>
    results:<br/>
    {results.map((r, i)=><InstructionWithImageInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const InstructionWithImageInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.instructionWithImage(result.serviceId).instruct(
                input.text, input.textLanguage, input.files[0].content, "image/jpeg")
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        {r.serviceId}{ (r.result != null) || r.error ?
        <>({r.ellapsedMs}ms):<br/> { r.result != null ?
            <>{r.result.split("\n").map(s=><>{s}<br/></>)}</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
