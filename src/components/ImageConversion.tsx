import { Button } from "@mui/material";
import { memo, useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Image, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./TextGuidedImageManipulation.css"
import { ImageDropButton } from "./lib/ImageDropButton";

export interface Input {
    image: ArrayBuffer;
    imageFormat: string;
}

export interface Result{
    serviceId: string;
    image: Image | null;
    ellapsedMs: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function ImageConversion({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "imageFormat": "image/png",
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const scs = services.get("ImageConversionService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onImage: (data: ArrayBuffer)=>void = data=>{
        setValue("image", data);
    };

    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = { id: invId++, input: input, results: []};
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId, image: null, ellapsedMs: 0});
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
                <Button type="submit" variant="contained" >変換</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <br/>
        <a href="https://github.com/sczhou/CodeFormer">CodeFormer</a>&nbsp;
        <a href="https://github.com/xinntao/Real-ESRGAN">RealESRGAN</a>
        <br/>
        <br/>
        <label>results:</label>
        <div>
        {invState.value.map(inv=><ICInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>;
}
const ICInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
    const url = URL.createObjectURL(new Blob([input.image]));
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
            image: <img src={url} style={{maxWidth: 512, maxHeight: 512, objectFit: "scale-down"}} /><br/>
            <br/>
            results:<br/>
            {results.map((r, i)=><ICInvocationResult key={i} si={si} input={input} result={r} />)}
        </div>
    );
});

const ICInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.image != null) return;
        si.imageConversion(result.serviceId)
            .convert(input.image, input.imageFormat)
            .then(r =>{
                result.image = r;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
    });
    return <div>{res.value.serviceId}{res.value.image != null ?
        <>
            ({res.value.ellapsedMs.toLocaleString()}ms): done.<br/>
            <img alt="" className="tgigResultImage"
                src={URL.createObjectURL(new Blob([res.value.image!.image]))} />
        </>:
        <>: <span className="loader" /></>}<br/>
        </div>;
}
