
export class AsyncProcessWrapper{
    private result_: JSX.Element | undefined;
    private resolve: ((value: any)=>void) | undefined;
    private promise;
    constructor(process: ()=>Promise<JSX.Element>){
        this.promise = new Promise(resolve=>{
            this.resolve = resolve;
        });
        process().then(result=>{
            // Reactの仕様上ここは常に2回呼ばれる
            this.result_ = result;
            this.resolve!(null);
        });
    }
    result(){
        if(this.result_) return this.result_;
        throw this.promise;
    }
}

