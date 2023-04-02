import { Button, TextField } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ObjectDetection as Detection, Error, ObjectDetectionResult, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./ObjectDetection.css"
import { ImageDropButton } from "./lib/ImageDropButton";
import { round } from "../mlgrid/formatUtil";
import { calcAspectRatioAwareDownSacle } from "../mlgrid/drawUtil";
import { RawResult } from "./lib/RawResult";

export interface Input {
    format: string;
    image: ArrayBuffer;
    labelLang: string;
}

export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: ObjectDetectionResult | null;
    error: Error | null;
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
        "labelLang": "en"
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
            inv.results.push({serviceId: sc.serviceId,
                result: null, error: null,
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
        labelLang: {input.labelLang}<br/>
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
        if(res.value.result || res.value.error) return;

        si.objectDetection(result.serviceId).detect(input.image, input.format, input.labelLang)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                result.scale = calcAspectRatioAwareDownSacle(r.width, r.height, 512, 512);
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    const Rect = ({className, result, scale}: {className: string; result: Detection; scale: number})=>{
        const b = result.box;
        return <rect className={className} x={b.x * scale} y={b.y * scale}
                width={b.width * scale} height={b.height * scale}
            ><title>{`${result.label}(${round(result.accuracy, 2)})`}</title></rect>
    };

    const r = res.value;
    const s = r.scale;
    return <div>{r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs}ms): { r.result ?
            <>{r.result.detections.length} objects.<br/>
                <div style={{position: "relative"}}>
                    <img style={{maxWidth: 512, maxHeight: 512}} src={URL.createObjectURL(new Blob([input.image]))} />
                    <svg style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%"}}>
                        {r.result.detections.map(v =>
                            <g key={rectKey++}>
                                <text x={v.box.x * s} y={(v.box.y - 6) * s}
                                    fontSize={8} fill="red">{v.label}({round(v.accuracy, 2)})
                                </text>
                                <Rect key={rectKey++} className="od" result={v} scale={s} />
                            </g>)}
                    </svg>
                </div>
                <RawResult result={r.result} />
                <br/>
            </> :
        <>{JSON.stringify(r.error)}</>}</> :
        <>: processing...<span className="loader" /></>
        }</div>;
};
