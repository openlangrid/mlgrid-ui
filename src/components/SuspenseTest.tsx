import { Suspense } from "react";
import { AsyncProcessWrapper } from "../util/AsyncProcessWrapper";

function sleep(ms: number): Promise<void>{
    return new Promise(resolve=>{
        setTimeout(resolve, ms);
    });
}

export function SuspenseTest(){
    const process = new AsyncProcessWrapper(async ()=>{
        return sleep(3000)
            .then(()=>{
                // Reactの仕様上ここは2回呼ばれる(renderWithHooksから呼ばれ、
                // レンダリング中にそれをupdateFunctionComponent内の2ヶ所から呼んでいる)
                console.trace("render");
                return <>hello</>;
            });
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
