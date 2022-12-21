import { Button } from "@mui/material";
import { MouseEvent, useState } from "react";

export function AudioRecordButton(){
    const [recording, setRecording] = useState(false);

    const handleClick = (e: MouseEvent)=>{
        if(recording){
            setRecording(false);
        } else{
            setRecording(true);
        }
     };

    return <Button type="submit" variant="contained" onClick={handleClick}>{recording ? "停止" : "開始"}</Button>;
}
