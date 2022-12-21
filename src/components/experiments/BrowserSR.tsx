import { Button } from "@mui/material";
import { MouseEvent, useState } from "react";
import { Holder } from "../../util/Holder";

class ASRResult{
    finals: string[] = [];
    interims: string[] = [];
}
export function BrowserSR(){
    console.log("render");
    const [sr, setSr] = useState<SpeechRecognition | null>(null);
    const [result, setResult] = useState(new Holder<ASRResult[]>([]));
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const handleClick = (e: MouseEvent)=>{
        console.log("try to start");
        if(sr != null){
            sr.stop();
            return;
        }
        if(SpeechRecognition){
            console.log("start");
            result.value.push(new ASRResult());
            const sr = new SpeechRecognition();
            sr.continuous = true;
            sr.lang = 'ja-JP';
            sr.interimResults = true;
            sr.maxAlternatives = 1;
            sr.onresult = e=>{
                const finals: string[] = [];
                const interims: string[] = [];
                for(let r of e.results){
                    if(r.isFinal){
                        finals.push(r[0].transcript);
                    } else{
                        interims.push(r[0].transcript);
                    }
                }
                result.value[result.value.length - 1].finals = finals;
                result.value[result.value.length - 1].interims = interims;
                setResult(result.clone());
            };
            sr.onend = e=>{
                console.log("asr stopped.")
                sr.stop();
                setSr(null);
            }
            sr.start();
            setSr(sr);
        }
    };
    return <>
        <Button type="submit" variant="contained" onClick={handleClick}>
            {sr != null ? "停止" : "開始"}</Button>
        <br/>
        {result.value.map((r, i) => <div key={i}>
            {r.finals.map((f, i) => <p key={i}>{f}</p>)}
            {r.interims.map((inte, i) => <p key={i + r.finals.length}>{inte}(認識中...)</p>)}
            </div>)}
        </>;
}
