import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { Controller, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { ChatMessage, Error, GpuInfo, ServiceInvoker } from "../mlgrid/ServiceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    messages: ChatMessage[]
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    gpuInfos: GpuInfo[];
    result: string | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}

let invId = 0;
export function Chat({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit, control } = useForm<Input>({defaultValues: {
        "messages": [{
            "role": "user", "content": "Tell me about alpacas.",
            "contentLanguage": "en"}]}});
    const { fields, append, remove } = useFieldArray({
        name: "messages", control });
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("ChatService") || [];
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            id: invId++, input: input, results: []
        };
        for(const sc of scs){
            if(!sc.checked) continue;
            inv.results.push({serviceId: sc.serviceId,
                result: null, error: null, ellapsedMs: 0, gpuInfos: []});
        }
        invocations.unshift(inv);
        setInvState(invState.clone());
    };
    const role ="user";
    return (
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                {fields.map((m, index)=><div key={index}>
                <FormControl>
                    <InputLabel htmlFor="">role</InputLabel>
                    <Controller
                        control={control}
                        name={`messages.${index}.role`}
                        render={(field)=>
                            <Select size="small" defaultValue={"user"} style={{width: "8em"}}
                              onChange={(newValue) => {
                                field.field.onChange(newValue);
                              }}
                            >
                                <MenuItem value="system">system</MenuItem>
                                <MenuItem value="user">user</MenuItem>
                                <MenuItem value="assistant">assistant</MenuItem>
                            </Select>
                        } />
                </FormControl>
                <TextField label="content" size="small" type="text" style={{width: "70%"}} {...register(`messages.${index}.content`)} />
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register(`messages.${index}.contentLanguage`)} />
                <Button type="button" onClick={() => remove(index)}>削除</Button>
                <br/>
                </div>)}
                <br/>
                <Button type="button" onClick={() => append({ role: "user", content: "", contentLanguage: "en" })}>追加</Button><br/>
                <Button type="submit" variant="contained" >チャット</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><ChatInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const ChatInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    {input.messages.map(m=><>
    {m.role}: {m.content}({m.contentLanguage})<br/>
    </>)}
    results:<br/>
    {results.map((r, i)=><ChatInvocationResult key={i} input={input} result={r} si={si} />)}
    </div>);

const ChatInvocationResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    console.log("InvocationRequest");
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.chat(result.serviceId).generate(input.messages)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                result.gpuInfos = si.lastGpuInfos();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        {r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs.toLocaleString()}ms{
            r.gpuInfos.length > 0 ?
                `, gpu: ${r.gpuInfos.map(i=>`${i.usedMemoryMB.toLocaleString()}MB/${i.totalMemoryMB.toLocaleString()}MB`)}` :
                ""
            }):<br/> { r.result != null ?
            <>{r.result.split("\n").map(s=><>{s}<br/></>)}</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
