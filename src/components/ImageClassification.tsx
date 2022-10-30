import { Button, TextField, Input } from "@mui/material";
import { DragEvent, EventHandler, memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { round } from "../mlgrid/formatUtil";
import { ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { Service, ServiceCheck } from "./Service";

export interface Input {
    format: string;
    image: ArrayBuffer;
    labelLang: string;
    maxResults: number;
}
export interface Result{
    serviceId: string;
    result: {label: string; accuracy: number}[] | null;
    ellapsedMs: number;
}
export interface Invocation{
    input: Input;
    results: Result[];
}
export function ImageClassification({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit, setValue, trigger } = useForm<Input>({defaultValues: {
        "format": "image/jpeg",
        "labelLang": "en",
        "maxResults": 1
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const [image, setImage] = useState<ArrayBuffer | null>(null);
    if(services.size === 0) return (<div />);
    const scs = services.get("ImageClassificationService") || [];
    const onDragOver: EventHandler<DragEvent> = e=>{
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
    };
    const onDrop: EventHandler<DragEvent> = e=>{
        e.preventDefault();
        console.log("dropped");
        const fr = new FileReader();
        fr.onload = ()=>{
            const img = fr.result as ArrayBuffer;
            setImage(img);
            setValue("image", img);
        };
        fr.readAsArrayBuffer(e.dataTransfer.files[0]);   
    }
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            input: input, results: []
        };
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId, result: null, ellapsedMs: 0});
        }
        invocations.push(inv);
        setInvState(invState.clone());
    };
    return (
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <button id={"icButton"} onClick={e=>e.preventDefault()} onDragOver={onDragOver} onDrop={onDrop}
                    className={"btn btn-outline-success form-control"}>
                    {image ? <img style={{"maxHeight": "256px", "maxWidth": "256px"}} src={URL.createObjectURL(new Blob([image]))} /> : "ここに画像をドロップしてください"}</button>
                <br/>
                <br/>
                <TextField label="labelLang" size="small" type="text" style={{width: "6em"}} {...register("labelLang")} />
                <TextField label="maxResults" size="small" type="number" style={{width: "6em"}} {...register("maxResults")} />
                <Button type="submit" variant="contained" >識別</Button>
            </form>
		</div>
        <br/>
		<label>services:</label>
        {scs.map((sc, i) => <Service key={i} sc={sc} />)}
        <a href="https://www.tensorflow.org/api_docs/python/tf/keras">tf.keras</a>
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map((inv, i)=><ImageClassificationInvocation key={i} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const ImageClassificationInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
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
        image: <img style={{"maxWidth": "256px", "maxHeight": "256px"}} src={URL.createObjectURL(new Blob([input.image]))} /><br/>
        labelLang: {input.labelLang}, maxResults: {input.maxResults}<br/>
        results:<br/>
        {results.map((r, i)=><ImageClassificationInvocationResult key={i} input={input} result={r} si={si} />)}
        </div>;
    });

const ImageClassificationInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    console.log("ImageClassificationInvocationRequest");
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result != null) return;

        si.imageClassification(result.serviceId).classify(input.format, input.image, input.labelLang, input.maxResults)
            .then(r=>{
                result.result = r;
                const hs = si.lastResponse()?.headers;
                if(hs && "ellapsedMs" in hs){
                    result.ellapsedMs = parseInt(hs["ellapsedMs"]);
                }
                console.log("call setRes");
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    return <div>{res.value.serviceId}
        { res.value.result ? `(${res.value.ellapsedMs}ms)` : ""}
         :
        { res.value.result ?
            res.value.result.map((v: any, i)=> <><span key={i}>{v.label}({round(v.accuracy, 2)})</span>&nbsp;</>) :
            "processing..."
        }
        </div>;
};
