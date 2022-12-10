import { ToggleDisplay } from "./ToggleDisplay";

export const RawResult = (result: any) =>
    <ToggleDisplay defaultVisible={false} header={<span>Raw result</span>}>
        <pre style={{border: "solid 1px", maxHeight: "256px", overflow: "auto"}} >
            {JSON.stringify(result, null, 2)}
        </pre>
    </ToggleDisplay>;
