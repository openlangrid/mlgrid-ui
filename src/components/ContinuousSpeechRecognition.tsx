import { TextField } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ServiceInvoker, ContinuousSpeechRecognitionTranscript } from "../mlgrid/serviceInvoker";
import { Holder } from "../util/Holder";
import { ServiceCheck, Services } from "./lib/Services";
import "./common.css"
import "./ObjectDetection.css"
import { RawResult } from "./lib/RawResult";
import { AudioRecordButton } from "./lib/AudioRecordButton";
import { downsampleBuffer, Recorder } from "../mlgrid/recorder";
import { round } from "../mlgrid/formatUtil";
import { WavWriter } from "../mlgrid/wavWriter";

export interface Input {
    format: string;
    language: string;
}
export interface Invocation{
    id: number;
    input: Input;
    recorder: Recorder | null;
    writer: WavWriter;
    results: Result[];
}
export interface Result{
    serviceId: string;
    sessionId: string | null;
    interims: ContinuousSpeechRecognitionTranscript[];
    fixes: ContinuousSpeechRecognitionTranscript[];
    ellapsedMs: number;
}

let invId = 0;
export function ContinuousSpeechRecognition({si, services, invocations}:
        {si: ServiceInvoker; services: Map<string, ServiceCheck[]>; invocations: Invocation[]}){
    const { register, handleSubmit } = useForm<Input>({defaultValues: {
        "language": "ja"
    }});
    const [invState, setInvState] = useState(new Holder(invocations));
    const recorder = useRef<Recorder | null>(null);
    const scs = services.get("ContinuousSpeechRecognitionService") || [];
    if(services.size === 0) return <div>no services found</div>;

    const onSubmit: SubmitHandler<Input> = (input)=>{
        if(recorder.current == null){
            console.log("add invocation");
            // start rec
            const rec = new Recorder();
            const writer = new WavWriter({channels: 1, sampleSizeInBits: 16, sampleRate: 16000})
            rec.on("processRecording", (data: Float32Array)=>{
                writer.addData(downsampleBuffer(
                    data, rec.getAudioContext()!.sampleRate, 16000));
            })
            rec.start(16000);
            const inv: Invocation = { id: invId++, input: input, recorder: rec, writer: writer,results: []};
            for(const sc of scs){
                if(!sc.checked) continue;
                inv.results.push({serviceId: sc.serviceId, 
                    sessionId: null, fixes: [], interims: [], ellapsedMs: 0});
            }
            invocations.unshift(inv);
            recorder.current = rec;
        } else{
            recorder.current.stop();
            recorder.current = null;
        }
        setInvState(invState.clone());
    };

    return <div>
		<label>inputs:</label><br/><br/>
		<div data-id="inputs">
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField label="language" size="small" type="text" style={{width: "6em"}} {...register("language")} />
                <AudioRecordButton />
                <br/>
            </form>
		</div>
        <br/>
        <Services serviceChecks={scs} />
        <br/>
        <a href="https://alphacephei.com/vosk/server">VOSK Server</a>
        <br/>
        <label>results:</label>
        <div>
        {invState.value.map(inv=><CSRInvocation key={inv.id} si={si} inv={inv} />)}
        </div>
    </div>;
}

const CSRInvocation = ({si, inv}: {si: ServiceInvoker; inv: Invocation})=>{
    const refFirst = useRef(true);
    const [audio, setAudio] = useState<ArrayBuffer | null>(null);
    const {id, input, results} = inv;
    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(audio != null) return;
    });
    inv.recorder?.on("stopRecording", ()=>{
        setAudio(inv.writer.getWavFile());
    });

    return <div style={{border: "1px solid", borderRadius: "4px", padding: "4px"}}>
        -- invocation:{id} --<br/>
        input:<br/>
        audio: {audio != null ?
            <audio controls style={{maxWidth: "256px", maxHeight: "256px", objectFit: "scale-down"}}
            src={URL.createObjectURL(new Blob([audio]))} /> :
            "recording..."}
            <br/>
        language: {input.language}<br/>
        <br/>
        results:<br/>
        {results.map((r, i)=><CSRInvocationResult key={i} invocation={inv} result={r} si={si} />)}
        </div>;
};

const CSRInvocationResult = ({si, invocation, result}: {si: ServiceInvoker; invocation: Invocation; result: Result})=>{
    const [res, setRes] = useState(new Holder(result));
    const refFirst = useRef(true);

    let sessionId: string | null = null;
    const receiver = (results: ContinuousSpeechRecognitionTranscript[])=>{
        const interims = [];
        for(let r of results){
            if(r.sentence === "") continue;
            if(r.fixed){
                res.value.fixes.unshift(r);
            } else{
                interims.unshift(r);
            }
        }
        res.value.interims = interims;
        setRes(res.clone());
    };
    const handleProcessRecording = (channelData: Float32Array)=>{
        const ac = invocation.recorder?.getAudioContext();
        if(sessionId && ac != null){
            const data = downsampleBuffer(
                channelData, ac.sampleRate, 16000);
            si.continuousSpeechRecognition(result.serviceId)
                .processRecognition(sessionId,  data)
                .then(receiver);
        }
    };
    const handleStopRecording = ()=>{
        console.log("handleStopRecording");
        invocation.recorder?.removeListener("processRecording", handleProcessRecording);
        invocation.recorder?.removeListener("stopRecording", handleStopRecording);
        invocation.recorder = null;
        if(sessionId){
            si.continuousSpeechRecognition(result.serviceId)
                .stopRecognition(sessionId)
                .then(r => receiver(r));
        }
        setRes(res.clone());
    };

    useEffect(()=>{
        if (process.env.NODE_ENV === "development" && refFirst.current) {
            refFirst.current = false;
            return;
        }
        if(res.value.sessionId != null || invocation.recorder == null) return;
        invocation.recorder.on("processRecording", handleProcessRecording);
        invocation.recorder.on("stopRecording", handleStopRecording);
//*
        si.continuousSpeechRecognition(result.serviceId).startRecognition(
                invocation.input.language, {channels: 1, sampleSizeInBits: 16, sampleRate: 16000})
            .then(r=>{
            res.value.sessionId = r;
            sessionId = r;
            res.value.ellapsedMs = si.lastMillis();
            console.log(`csr started sessionId: ${sessionId}`)
        })
        .catch(console.error);
//*/

        return ()=>{
            // unmount
            if(res.value && invocation.recorder){
                invocation.recorder.removeListener("processRecording", handleProcessRecording);
                invocation.recorder.removeListener("stopRecording", handleStopRecording);
                console.log("unmount");
            }
        };
    }, []);

    return <div>{res.value.serviceId}
        { res.value.fixes.length > 0 || res.value.interims.length > 0 || invocation.recorder == null ?
            <>
                : {res.value.fixes.length} transcripts.<br/>
                <div>
                    {res.value.interims.map(v =>
                        <span key={v.sentenceId}><span>
                            [認識中...] {v.sentence})
                        </span><br/></span>
                    )}
                    {res.value.fixes.map(v =>
                        <span key={v.sentenceId}><span>
                            [{v.startMillis}-{v.endMillis}] {v.sentence}({round(v.accuracy, 2)})
                        </span><br/></span>
                    )}
                </div>
                <br/>
                <RawResult result={[...res.value.interims, ...res.value.fixes]} />
                <br/>
            </> :
            <>: processing...<span className="loader" /></>
        }
        </div>;
};
