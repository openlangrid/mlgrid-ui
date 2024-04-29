import { Button, FormControl, FormLabel, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Error, Image, ServiceInvoker } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import { ImageDropButton } from "./lib/ImageDropButton";

export interface Input {
    humanImage: {content: ArrayBuffer, format: string};
    humanPrompt: string;
    garmentImage: {content: ArrayBuffer, format: string};
    garmentPrompt: string;
    garmentCategory: "UPPER_BODY" | "LOWER_BODY" | "DRESSES"
    promptLanguage: string;
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: Image | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function VirtualTryOn({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { control, register, handleSubmit, setValue } = useForm<Input>({defaultValues: {
        "humanPrompt": "model is wearing ",
        "garmentPrompt": "a photo of ",
        "garmentCategory": "UPPER_BODY",
        "promptLanguage": "en"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("VirtualTryOnService") || [];
    const onHumanImage: (data: ArrayBuffer)=>void = data=>{
        setValue("humanImage", {content: data, format: ""});
    };
    const onGarmentImage: (data: ArrayBuffer)=>void = data=>{
        setValue("garmentImage", {content: data, format: ""});
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
                <FormLabel>人物画像</FormLabel>
                <ImageDropButton onImage={onHumanImage} />
                <br/><br/>
                <TextField label="humanPrompt" multiline size="small" type="text" style={{width: "70%"}} {...register("humanPrompt")} />
                <br/><br/>
                <FormLabel>衣服画像</FormLabel>
                <ImageDropButton onImage={onGarmentImage} />
                <br/><br/>
                <TextField label="garmentPrompt" size="small" type="text" style={{width: "70%"}} {...register("garmentPrompt")} />
                <br/><br/>
                <FormControl>
                    <InputLabel id="garmentCategoryLabel">garmentCategory</InputLabel>
                    <Controller
                        {...register("garmentCategory")}
                        control={control}
                        render={(field)=>
                            <Select labelId="garmentCategoryLabel" size="small" defaultValue={"UPPER_BODY"} style={{width: "8em"}}
                                onChange={(newValue) => {
                                    field.field.onChange(newValue);
                                }}>
                                <MenuItem value="UPPER_BODY">upper body</MenuItem>
                                <MenuItem value="LOWER_BODY">lower body</MenuItem>
                                <MenuItem value="DRESSES">dresses</MenuItem>
                            </Select>
                        } />
                </FormControl>
                <br/><br/>
                <TextField label="promptLanguage" size="small" type="text" style={{width: "6em"}} {...register("promptLanguage")} />
                <Button type="submit" variant="contained" >送信</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />

        <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><InvocationLog key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const InvocationLog = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    humanImage: <img alt="" style={{"maxWidth": "256px", "maxHeight": "256px"}}
        src={URL.createObjectURL(new Blob([input.humanImage.content]))} /><br/>
    humanPrompt: {input.humanPrompt.split("\n").map(s=><>{s}<br/></>)}
    garmentImage: <img alt="" style={{"maxWidth": "256px", "maxHeight": "256px"}}
        src={URL.createObjectURL(new Blob([input.garmentImage.content]))} /><br/>
    garmentPrompt: {input.garmentPrompt.split("\n").map(s=><>{s}<br/></>)}
    garmentCategory: {input.garmentCategory}<br/>
    promptLanguage: {input.promptLanguage}<br/>
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

        si.virtualTryOn(result.serviceId).tryOn(
                input.humanImage.content, "image/jpeg", input.humanPrompt,
                input.garmentImage.content, "image/jpeg", input.garmentPrompt,
                input.garmentCategory, input.promptLanguage)
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
            <img style={{width: "100%", height: "100%", objectFit: "contain"}}
                    alt="" className="tgigResultImage"
                    src={URL.createObjectURL(new Blob([r.result.image]))}></img> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
