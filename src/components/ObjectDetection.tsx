import { Button, TextField } from "@mui/material";
import { useEffect, useState, useRef, PropsWithChildren, ReactNode } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Box2d, ObjectDetectionResult, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./ObjectDetection.css"
import { ImageDropButton } from "./lib/ImageDropButton";
import { round, roundBox } from "../mlgrid/formatUtil";
import { calcAspectRatioAwareSacle } from "../mlgrid/drawUtil";
import { RawResult } from "./lib/RawResult";

export interface Input {
    format: string;
    image: ArrayBuffer;
    labelLang: string;
    maxResults: number;
}

export interface Result{
    serviceId: string;
    result: ObjectDetectionResult[] | null;
    ellapsedMs: number;
    scale: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function ObjectDetection({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "format": "image/jpeg",
        "labelLang": "en",
        "maxResults": 1
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("ObjectDetectionService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onImage: (data: ArrayBuffer)=>void = data=>{
        setValue("image", data);
    };
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = { id: invId++, input: input, results: []};
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId, result: null,
                ellapsedMs: 0, scale: 1});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };

    return <div>
		<label>inputs:</label><br/><br/>
		<div data-id="inputs">
            <form onSubmit={handleSubmit(onSubmit)}>
                <ImageDropButton onImage={onImage} />
                <br/>
                <br/>
                <TextField label="labelLang" size="small" type="text" style={{width: "6em"}} {...register("labelLang")} />
                <TextField label="maxResults" size="small" type="number" style={{width: "6em"}} {...register("maxResults")} />
                <Button type="submit" variant="contained" >検出</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <label>results:</label>
        <div>
        {invState.value.map(inv=><ObjectDetectionInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
        <a href="https://github.com/ultralytics/yolov5">YoloV5</a> &nbsp;
        <a href="https://github.com/WongKinYiu/yolov7">YoloV7</a>
    </div>;
}

const ObjectDetectionInvocation = ({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
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
        image: <img alt="" style={{maxWidth: "256px", maxHeight: "256px", objectFit: "scale-down"}} src={URL.createObjectURL(new Blob([input.image]))} /><br/>
        labelLang: {input.labelLang}, maxResults: {input.maxResults}<br/>
        results:<br/>
        {results.map((r, i)=><ObjectDetectionInvocationResult key={i} input={input} result={r} si={si} />)}
        </div>;
};

let rectKey = 0;
const ObjectDetectionInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result != null) return;

        const img = new Image();
        img.onload = () => {
            si.objectDetection(result.serviceId).detect(input.format, input.image, input.labelLang, input.maxResults)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                result.scale = calcAspectRatioAwareSacle(img.width, img.height, 512, 512);
                setRes(res.clone());
            })
            .catch(console.error);
        };
        img.src = URL.createObjectURL(new Blob([input.image]));
    }, []);

    const Rect = ({result, scale}: {result: ObjectDetectionResult; scale: number})=>{
        const b = result.boundingBox;
        return <rect x={b.x * scale} y={b.y * scale} width={b.width * scale} height={b.height * scale}
            ><title>{`${result.label}(${round(result.accuracy, 2)})`}</title></rect>
    };

    return <div>{res.value.serviceId}
        { res.value.result ?
            <>
                ({res.value.ellapsedMs}ms): {res.value.result.length} objects.<br/>
                <div style={{position: "relative"}}>
                    <img style={{maxWidth: 512, maxHeight: 512}} src={URL.createObjectURL(new Blob([input.image]))} />
                    <svg style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%"}}>
                        {res.value.result.map(v =>
                            <Rect key={rectKey++} result={v} scale={res.value.scale} />)}
                    </svg>
                </div>
                <RawResult result={res.value.result} />
                <br/>
            </> :
            ": processing..."
        }
        </div>;
};
