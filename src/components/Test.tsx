import { Button, TextField } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Error, ServiceInvoker } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";

export interface Input {
    arg: any;
}
export interface Result{
    serviceId: string;
    result: any | null;
    error: Error | null;
    ellapsedMs: number;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
export function Test({services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "arg": ""
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    if(services.size === 0) return (<div />);
    const scs = services.get("TestService") || [];
    const onSubmit: SubmitHandler<Input> = (input)=>{
        const inv: Invocation = {
            id: invId++, input: input, results: []
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
                <TextField label="arg" size="small" type="text" style={{width: "24em"}} {...register("arg")} />
                <Button type="submit" variant="contained" >実行</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><TestInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>
    );
}

const TestInvocation = memo(({si, inv: {input, results}}: {si: ServiceInvoker; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    arg: {input.arg}<br/>
    results:<br/>
    {results.map((r, i)=><TestResult key={i} input={input} result={r} si={si} />)}
    </div>);

const TestResult = ({si, input, result}: {si: ServiceInvoker; input: Input; result: Result})=>{
    console.log("InvocationRequest");
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result != null) return;

        si.test(result.serviceId).test(input.arg)
            .then(r=>{
                result.result = r;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            })
            .catch(e=>{
                result.error = e;
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
                console.error(e);
            });
    }, []);
    const r = res.value;

    return <div>{r.serviceId}
        {r.result || r.error ?
            <>({r.ellapsedMs}ms): { r.result ?
                <>{r.result}.</> :
                <>{JSON.stringify(r.error)}.</>
            }</> :
            <>: <span className="loader" /></>
        }</div>;
};
