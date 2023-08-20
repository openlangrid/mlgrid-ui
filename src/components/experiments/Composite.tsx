import { SubmitHandler, useForm } from "react-hook-form";
import { ServiceBindings, ServiceInvocation, ServiceInvoker } from "../../mlgrid/serviceInvoker";
import { ServiceCheck, Services } from "../lib/Services";
import { ChangeEvent, ChangeEventHandler, ReactNode, memo, useEffect, useRef, useState } from "react";
import { Holder } from "../../util/Holder";
import { Button, TextField } from "@mui/material";
import Select, { SingleValue } from "react-select";


export interface Input {
    text: string;
    textLanguage: string;
    generationLanguage: string;
}
export interface Result{
    serviceId: string;
    ellapsedMs: number;
    result: string | null;
    error: Error | null;
}
export interface Invocation{
    id: number;
    input: Input;
    results: Result[];
}
let invId = 0;
let count = 0;
export function TextGenerationWithTranslation(
    {services, si, invocations}:
    {services: Map<string, ServiceCheck[]>; si: ServiceInvoker; invocations: Invocation[]})
{
    console.log(`render${count++}`);
    const [state1, setState1] = useState<number>(1);
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "text": "アルパカについて教えてください。",
        "textLanguage": "ja",
        "generationLanguage": "en"
    }});
    console.log(`state1: ${state1}`);
    const [invState, setInvState] = useState(new Holder(invocations));
    const [serviceInvocations, setServiceInvocations] = useState<ServiceInvocation[]>([]);
    const bindings = useRef<ServiceBindings>({});
    const refFirst = useRef(true);

    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(serviceInvocations.length > 0) return;
        si.serviceManagement().getServiceInvocations("TextGenerationWithTranslation").then(invs=>{
            setServiceInvocations(invs);
            setState1(state1 + 1);
        });
    }, []);

    if(services.size === 0) return (<div />);

    const scs = services.get("TextGenerationWithTranslationService") || [];
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
    const onSelect = (invocationName: string, serviceId: string | null)=>{
        if(serviceId == null){
            delete bindings.current[invocationName];
        } else{
            bindings.current[invocationName] = serviceId;
        }
        console.log(`${invocationName} -> ${serviceId}`);
    };

    return (<>
    <div>
        <label>bindings:</label><br/><br/>
        <div>
            {serviceInvocations.map((svi, i)=><>
                <label>{svi.invocationName}</label>
                <ServiceSelect key={i}
                    si={si} invocationName={svi.invocationName} serviceType={svi.serviceType}
                    onSelect={onSelect} />
            </>)}
        </div>
    </div>
    <br/>
    <div>
		<label>inputs:</label><br/><br/>
		<div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="text" size="small" type="text" style={{width: "24em"}} {...register("text")} />
                <TextField label="textLanguage" size="small" type="text" style={{width: "6em"}} {...register("textLanguage")} />
                <TextField label="generateLanguage" size="small" type="text" style={{width: "6em"}} {...register("generationLanguage")} />
                <Button type="submit" variant="contained" >生成</Button>
            </form>
		</div>
        <br/>
		<Services serviceChecks={scs} />
        <br/> <br/>
        <label>invocation histories:</label>
        <div>
        {invState.value.map(inv=><TextGenerationWithTranslationInvocation
            key={inv.id} si={si} bindings={bindings.current} inv={inv} />)}
        </div>
    </div>
    </>);
}

const ServiceSelect = (
    {si, invocationName, serviceType, onSelect}:
    {si: ServiceInvoker, invocationName: string, serviceType: string,
    onSelect: (invocationName: string, serviceId: string | null)=>void}) =>{

    const [options, setOptions] = useState<{label: string, value: string}[]>([]);
    const onChange = (e: SingleValue<{label: string, value: string}>)=>{
        onSelect(invocationName, e ? e.value : null);
    }

    const refFirst = useRef(true);
    useEffect(()=>{
      if (process.env.NODE_ENV === "development" && refFirst.current) {
        refFirst.current = false;
        return;
      }
      si.serviceManagement().searchServices(0, 100,
        [{fieldName: "serviceType", matchingValue: serviceType, matchingMethod: "COMPLETE"}],
        [{fieldName: "serviceId", direction: "ASCENDANT"}])
        .then(result=>{
            setOptions(result.entries.map(e=>{return {label: e.serviceId, value: e.serviceId}}));
        });
    }, []);

    return <Select options={options} onChange={onChange}></Select>
}

const TextGenerationWithTranslationInvocation = memo((
    {si, bindings, inv: {input, results}}: {si: ServiceInvoker; bindings: ServiceBindings; inv: Invocation})=>
    <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
    input:<br/>
    text: {input.text}<br/>
    textLanguage: {input.textLanguage}<br/>
    results:<br/>
    {results.map((r, i)=><TextGenerationWithTranslationInvocationResult
        key={i} si={si} bindings={bindings} input={input} result={r} />)}
    </div>);

const TextGenerationWithTranslationInvocationResult = (
    {si, bindings, input, result}:
    {si: ServiceInvoker; bindings: ServiceBindings; input: Input; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.result || res.value.error) return;

        si.textGenerationWithTranslation(result.serviceId)
            .setBindings(bindings)
            .generate(input.text, input.textLanguage, input.generationLanguage)
            .then(r=>result.result=r)
            .catch(e=>result.error=e)
            .finally(()=>{
                result.ellapsedMs = si.lastMillis();
                setRes(res.clone());
            });
    }, []);

    const r = res.value;
    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        {r.serviceId}{ r.result || r.error ?
        <>({r.ellapsedMs}ms):<br/> { r.result ?
            <>{r.result.split("\n").map((s, i)=><span key={i}>{s}<br/></span>)}</> :
            <>{JSON.stringify(r.error)}</> }</> :
        <>: <span className="loader" /></>
        }</div>;
};
