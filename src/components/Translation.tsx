import React, { ChangeEventHandler, FormEventHandler } from "react";
import * as ReactDOM from "react-dom/client";
import { ServiceInvoker } from "../mlgrid/serviceInvoker";

const ServiceComponent = ({serviceId, checked}: {serviceId: string; checked: Set<string>}) =>{
    const onChange: ChangeEventHandler<HTMLInputElement> = e=>{
        if(e.target.checked) checked.add(serviceId);
        else checked.delete(serviceId);
    };
    return (
        <div>
            <label><input onChange={onChange} type="checkbox" defaultChecked />&nbsp;
            <span>{serviceId}</span></label>
        </div>
    );
}
const TransResult = ({sourceLang, targetLang, source, invocations}:
        {sourceLang: string; targetLang: string; source: string; invocations: {serviceId: string}[]})=>{
    return (
        <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
            input:<br/>
	    	sourceLang: {sourceLang}&nbsp;, targetLang: {targetLang}&nbsp;, soruce: {source}<br/>
            results:<br/>
            {invocations.map(i=><div key={i.serviceId}>{i.serviceId}(<span data-id={i.serviceId + "Time"}></span>):
                <span data-id={i.serviceId + "Result"}>processing..</span></div>)}
        </div>
    );
};
export function Translation({si, services}: {si: ServiceInvoker, services: Map<string, string[]>}){
    const sourceLang = React.useRef<HTMLInputElement>(null);
    const targetLang = React.useRef<HTMLInputElement>(null);
    const source = React.useRef<HTMLInputElement>(null);
    const results = React.useRef<HTMLDivElement>(null);
    if(services.size === 0) return (<div />);
    const sids = services.get("TranslationService") || [];
    const validServices = new Set(sids);
    const onSubmit: FormEventHandler = (e)=>{
        e.preventDefault();
        const sl = sourceLang.current!.value;
        const tl = targetLang.current!.value;
        const s = source.current!.value;
        const invocations = [];
        const invocation = document.createElement("div");
        let start = new Date().getTime();
        for(const sid of validServices){
            si.translation(sid).translate(sl, tl, s)
                .then(r=>{
                    invocation.querySelector(`[data-id='${sid}Time']`)!.textContent = ((new Date().getTime()) - start) + "ms";
                    invocation.querySelector(`[data-id='${sid}Result']`)!.textContent = r;
                    start = new Date().getTime();
                })
                .catch(e=>{ console.error(e); invocation.querySelector(`[data-id='${sid}Result']`)!.textContent = e.error; });
            invocations.push({serviceId: sid});
        }
        ReactDOM.createRoot(invocation).render(<TransResult sourceLang={sl} targetLang={tl} source={s} invocations={invocations} />);
        results.current!.append(invocation);
    };
    return (
    <div className="tab-pane fade show active" id="trans" role="tabpanel" aria-labelledby="transTab">
		<label>inputs:</label><br/>
		<div data-id="inputs">
            <form onSubmit={onSubmit}>
                <label>sourceLang: <input ref={sourceLang} className="form-control" size={10} type="text" defaultValue={"en"} /></label>
                <label>targetLang: <input ref={targetLang} className="form-control" size={10} type="text" defaultValue={"ja"} /></label>
                <label>source: <input ref={source} className="form-control" size={80} type="text" defaultValue={"hello"} /></label>
                <button className="btn btn-success">翻訳</button>
            </form>
		</div>
		<label>services:</label>
        {sids.map(s => <ServiceComponent key={s} serviceId={s} checked={validServices} />)}
        <label>results:</label>
		<div ref={results}>
		</div>
		<a href="https://langrid.org">Language Grid</a>&nbsp;
		<a href="https://huggingface.co/Helsinki-NLP">Helsinki-NLP</a>
    </div>
    );
}
