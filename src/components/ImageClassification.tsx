import { Button, TextField, Input } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { round } from "../mlgrid/formatUtil";
import { Error, ServiceInvoker } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ImageDropButton } from "./lib/ImageDropButton";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    image: ArrayBuffer;
    format: string;
    labelLang: string;
    maxResults: number;
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: {label: string; accuracy: number}[] | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function ImageClassification({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "format": "image/jpeg",
        "labelLang": "en",
        "maxResults": 1
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("ImageClassificationService") || [];
    const onImage: (data: ArrayBuffer)=>void = data=>{
        setValue("image", data);
    };
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            id: invId++,
            input: {...input}, results: []
        };
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId, result: null, error: null, ellapsedMs: 0});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };
    return (
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <ImageDropButton onImage={onImage} />
                <br/>
                <br/>
                <TextField label="labelLang" size="small" type="text" style={{width: "6em"}} {...register("labelLang")} />
                <TextField label="maxResults" size="small" type="number" style={{width: "6em"}} {...register("maxResults")} />
                <Button type="submit" variant="contained" >識別</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <a href="https://www.tensorflow.org/api_docs/python/tf/keras">tf.keras</a>
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><ImageClassificationInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const ImageClassificationInvocation = ({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(input.image != null) return;
    });

    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        input:<br/>
        image: <img alt="" style={{"maxWidth": "256px", "maxHeight": "256px"}} src={URL.createObjectURL(new Blob([input.image]))} /><br/>
        labelLang: {input.labelLang}, maxResults: {input.maxResults}<br/>
        results:<br/>
        {results.map((r, i)=><ImageClassificationInvocationResult key={i} input={input} result={r} si={si} />)}
        </div>;
};

const ImageClassificationInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.imageClassification(result.serviceId).classify(input.image, input.format, input.labelLang, input.maxResults)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    const r = res.value;
    return <div>{r.serviceId}{ r.result || r.error ?
        <span>({r.ellapsedMs.toLocaleString()}ms):
        { r.result ? 
            r.result.map((v: any, i)=> <span key={i}>{v.label}({round(v.accuracy, 2)})&nbsp; </span>) :
            JSON.stringify(r.error)}
        </span> :
        <>: <span className="loader" /></>
        }</div>;
};
