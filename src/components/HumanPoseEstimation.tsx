import { Button } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { HumanPoseEstimationResult, Point3d, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./HumanPoseEstimation.css"
import { ImageDropButton } from "./lib/ImageDropButton";
import { calcAspectRatioAwareSacle } from "../mlgrid/drawUtil";
import { RawResult } from "./lib/RawResult";

export interface Input {
    image: ArrayBuffer;
    format: string;
}

export interface Result{
    serviceId: string;
    result: HumanPoseEstimationResult | null;
    ellapsedMs: number;
    scale: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function HumanPoseEstimation({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "format": "image/jpeg"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("HumanPoseEstimation3dService") || [];
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
                <Button type="submit" variant="contained" >推定</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <br/>
        <a href="https://github.com/CMU-Perceptual-Computing-Lab/openpose">OpenPose</a> &nbsp;
        <br/>
        <label>results:</label>
        <div>
        {invState.value.map(inv=><HumanPoseEstimationInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>;
}

const HumanPoseEstimationInvocation = ({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
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
        results:<br/>
        {results.map((r, i)=><HumanPoseEstimationInvocationResult key={i} input={input} result={r} si={si} />)}
        </div>;
};

let rectKey = 0;
const HumanPoseEstimationInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result != null) return;

        si.humanPoseEstimation(result.serviceId).estimate(input.image, input.format)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                result.scale = calcAspectRatioAwareSacle(r.width, r.height, 512, 512);
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    const Pose = ({className, pose, scale}: {className: string; pose: {[key: string]: Point3d}; scale: number})=>{
        const valid = (p: Point3d)=>{
            return p.x != 0 && p.y != 0;
        };
        const colors = [
            [255,   0,  85], [255,   0,   0], [255,  85,   0], [255, 170,   0], [255, 255,   0],
            [170, 255,   0], [ 85, 255,   0], [  0, 255,   0], [255,   0,   0], [  0, 255,  85],
            [  0, 255, 170], [  0, 255, 255], [  0, 170, 255], [  0,  85, 255], [  0,   0, 255],
            [255,   0, 170], [170,   0, 255], [255,   0, 255], [ 85,   0, 255], [  0,   0, 255],
            [  0,   0, 255], [  0,   0, 255], [  0, 255, 255], [  0, 255, 255], [  0, 255, 255]];
        const names = [
            "Nose", "Neck",
            "RShoulder", "RElbow", "RWrist",
            "LShoulder", "LElbow", "LWrist",
            "MHip",
            "RHip", "RKnee", "RAnkle",
            "LHip", "LKnee", "LAnkle",
            "REye", "LEye", "REar", "LEar",
            "LBigToe", "LSmallToe", "LHeel",
            "RBigToe", "RSmallToe", "RHeel"];
        const drawPairs = [
            [1,8], [1,2], [1,5], [2,3], [3,4],
            [5,6], [6,7], [8,9], [9,10], [10,11],
            [8,12], [12,13], [13,14], [1,0], [0,15],
            [15,17], [0,16], [16,18], [14,19], [19,20],
            [14,21], [11,22], [22,23], [11,24]
        ];
        return <g>
            <>{drawPairs.map(dp => {
                const i1 = dp[0];
                const i2 = dp[1];
                const p1 = pose[names[i1]];
                const p2 = pose[names[i2]];
                const c = colors[i2];
                if(valid(p1) && valid(p2)){
                    return <line style={{}} className={className} x1={p1.x * scale} y1={p1.y * scale}
                        x2={p2.x * scale} y2={p2.y * scale}
                        stroke={`rgba(${c[0]}, ${c[1]}, ${c[2]})`}
                        strokeWidth={4}><title>{names[i1]} to {names[i2]}</title></line>;
                } else{
                    return <></>;
                }
            })}</>
            <>{names.map((name, i)=>{
                const p = pose[name];
                const c = colors[i];
                if(valid(p)){
                    return <circle className={className} cx={p.x * scale} cy={p.y * scale}
                        r={3 * p.z}
                        fill={`rgba(${c[0]}, ${c[1]}, ${c[2]})`}>
                            <title>{name}</title></circle>;
                } else{
                    return <></>;
                }
            })}</>
            </g>;
    };

    return <div>{res.value.serviceId}
        { res.value.result ?
            <>
                ({res.value.ellapsedMs}ms): {res.value.result.poses.length} humans.<br/>
                <div style={{position: "relative"}}>
                    <img style={{maxWidth: 512, maxHeight: 512}} src={URL.createObjectURL(new Blob([input.image]))} />
                    <svg style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%"}}>
                        {res.value.result.poses.map(v =>
                            <Pose key={rectKey++} className="hpe" pose={v} scale={res.value.scale} />)}
                    </svg>
                </div>
                <RawResult result={res.value.result} />
                <br/>
            </> :
            <>: processing...<span className="loader" /></>
        }
        </div>;
};
