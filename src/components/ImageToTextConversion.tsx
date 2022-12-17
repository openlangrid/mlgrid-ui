import { Button, TextField, Input } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ImageDropButton } from "./lib/ImageDropButton";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    image: ArrayBuffer;
    imageFormat: string;
    textLang: string;
}
export interface Result{
    serviceId: string;
    result: string | null;
    ellapsedMs: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function ImageToTextConversion({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "imageFormat": "image/jpeg",
        "textLang": "en"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("ImageToTextConversionService") || [];
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
                <ImageDropButton onImage={onImage} />
                <br/>
                <br/>
                <TextField label="textLang" size="small" type="text" style={{width: "6em"}}
                    {...register("textLang")} />
                <Button type="submit" variant="contained" >変換</Button>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <a href="https://github.com/pharmapsychotic/clip-interrogator">CLIP Interrogator</a>
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><ITTCInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const ITTCInvocation = ({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>{
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
        textLang: {input.textLang}
        <br/>
        results:<br/>
        {results.map((r, i)=><ITTCInvocationResult key={i} input={input} result={r} si={si} />)}
        </div>;
};

const ITTCInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result != null) return;

        si.imageToTextConversion(result.serviceId)
            .convert(input.image, input.imageFormat, input.textLang)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            })
            .catch(console.error);
    }, []);

    return <div>{res.value.serviceId}
        { res.value.result ?
            <>({res.value.ellapsedMs.toLocaleString()}ms): {res.value.result}</> :
            <>: <span className="loader" /></>
        }
        </div>;
};
