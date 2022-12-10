import { ReactNode, useState } from "react";

export const ToggleDisplay = ({defaultVisible = true, header, children}:
        {defaultVisible?: boolean; header: ReactNode; children?: ReactNode | undefined})=>{
    const [visible, setVisible] = useState(defaultVisible);
    const handleClick = ()=>{
        setVisible(!visible);
    };
    return <div onClick={handleClick}>
        {header}<br/>
        <div style={{display: visible ? "block" : "none"}}>{children}</div>
        </div>
}
