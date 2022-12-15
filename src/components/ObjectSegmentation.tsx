import { Button, TextField } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ObjectSegmentation as Segmentation, ObjectSegmentationResult, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./ObjectSegmentation.css"
import { ImageDropButton } from "./lib/ImageDropButton";
import { round } from "../mlgrid/formatUtil";
import { calcAspectRatioAwareSacle } from "../mlgrid/drawUtil";
import { RawResult } from "./lib/RawResult";

export interface Input {
    format: string;
    image: ArrayBuffer;
    labelLang: string;
}

export interface Result{
    serviceId: string;
    result: ObjectSegmentationResult | null;
    ellapsedMs: number;
    scale: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function ObjectSegmentation({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "format": "image/jpeg",
        "labelLang": "en"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("ObjectSegmentationService") || [];
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
                <Button type="submit" variant="contained" >検出</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <label>results:</label>
        <div>
        {invState.value.map(inv=><ObjectSegmentationInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
        <a href="https://github.com/facebookresearch/detectron2">Detectron2</a> &nbsp;
    </div>;
}

const ObjectSegmentationInvocation = ({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
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
        {results.map((r, i)=><ObjectSegmentationInvocationResult key={i} input={input} result={r} si={si} />)}
        </div>;
};

let rectKey = 0;
const ObjectSegmentationInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result != null) return;

        si.objectSegmentation(result.serviceId).segment(input.image, input.format, input.labelLang)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                result.scale = calcAspectRatioAwareSacle(r.width, r.height, 512, 512);
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    const Rect = ({className, result, scale}: {className: string; result: Segmentation; scale: number})=>{
        const b = result.box;
        return <rect className={className} x={b.x * scale} y={b.y * scale} width={b.width * scale} height={b.height * scale}
            ><title>{`${result.label}(${round(result.accuracy, 2)})`}</title></rect>
    };
    const Mask = ({index, className, result, scale}: {index: number; className: string; result: Segmentation; scale: number})=>{
        const b = result.box;
        const url = URL.createObjectURL(new Blob([result.maskImage]));
        const filters = [
            // 赤
            "sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)",
            // 緑
            "sepia(91%) saturate(7085%) hue-rotate(128deg) brightness(100%) contrast(106%)",
            // 青
            "sepia(99%) saturate(7044%) hue-rotate(247deg) brightness(100%) contrast(145%)",
            // 黄色
            "sepia(81%) saturate(633%) hue-rotate(359deg) brightness(106%) contrast(105%)",
            // オレンジ
            "sepia(26%) saturate(6428%) hue-rotate(1deg) brightness(105%) contrast(102%)",
            // 水色
            "sepia(100%) saturate(2929%) hue-rotate(104deg) brightness(99%) contrast(104%)",
            // 紫
            "sepia(71%) saturate(5170%) hue-rotate(293deg) brightness(87%) contrast(111%)",
        ];
        return <image style={{filter: filters[index % filters.length]}} className={className} href={url} x={b.x * scale} y={b.y * scale} width={b.width * scale} height={b.height * scale}
            ><title>{`${result.label}(${round(result.accuracy, 2)})`}</title></image>;
    };

    return <div>{res.value.serviceId}
        { res.value.result ?
            <>
                ({res.value.ellapsedMs}ms): {res.value.result.segmentations.length} objects.<br/>
                <div style={{position: "relative"}}>
                    <img style={{maxWidth: 512, maxHeight: 512}} src={URL.createObjectURL(new Blob([input.image]))} />
                    <svg style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%"}}>
                        {res.value.result.segmentations.map(v =>
                            <g key={rectKey++}><Rect className="os" result={v} scale={res.value.scale} />
                            <Mask className="os" index={rectKey} result={v} scale={res.value.scale} /></g>)}
                    </svg>
                </div>
                <RawResult result={res.value.result} />
                <br/>
            </> :
            ": processing..."
        }
        </div>;
};
