import React, { Suspense } from "react";

class AsyncProcessWrapper{
    private result_: JSX.Element | undefined;
    private resolve: ((value: any)=>void) | null = null;
    private i: number = 0;
    constructor(process: ()=>Promise<JSX.Element>){
        console.log(`LongProcess.constructor(${this.i++})`);
        process().then(result=>{
            this.result_ = result;
            console.error(`process().then. resolve: ${this.resolve}. result: ${result}`);
            if(this.resolve != null) this.resolve(null);
        });
    }
    result(){
        console.log(`pollRequest`);
        if(this.result_) return this.result_;
        console.log("throw Promise");
        throw new Promise(resolve=>{
            console.log("promise body called.");
            this.resolve = resolve;
        });
    }
}

function sleep(ms: number): Promise<void>{
    return new Promise(resolve=>{
        setTimeout(resolve, ms);
    });
}

export function SuspenceTest(){
    const process = new AsyncProcessWrapper(async ()=>{
        await sleep(3000);
        return <>hello</>;
    });
    const Message = ()=>{
        return process.result();
    };
    return <div>
        <Suspense fallback={"loading..."}>
            <Message />
        </Suspense>
    </div>;
}
