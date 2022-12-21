import EventEmitter from "events";
import { Stream } from "stream";

export class Recorder extends EventEmitter{
    private sampleRate: number;
    private recording = false;
    private audioContext: AudioContext | null = null;
    private stream: MediaStream | null = null;

	constructor(){
		super();
		this.sampleRate = 16000;
	}
	getAudioContext(){
		return this.audioContext;
	}

	isRecording(){
		return this.recording;
	}

	onStartRecording(stream: MediaStream, autioContext: AudioContext){}
	/**
	 * 
	 * @param {Float32Array} channelData 
	 */
    onProcessRecording(channelData: Float32Array){}
	onStopRecording(){}

	start(sampleRate: number = 16000){
		this.sampleRate = sampleRate;
		this.recording = true;
		navigator.mediaDevices
			.getUserMedia({audio: true, video: false})
			.then(stream => {
				window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
				this.audioContext = new window.AudioContext({
					sampleRate: this.sampleRate,
				});
				this.stream = stream;
				this.fireStart(stream, this.audioContext);
				const sp = this.audioContext.createScriptProcessor(1024, 1, 1);
				sp.onaudioprocess = e=>{
					if(!this.recording) return;
					const data = e.inputBuffer.getChannelData(0);
					this.fireProcess(data);
				};
				this.audioContext.createMediaStreamSource(stream).connect(sp);
				sp.connect(this.audioContext.destination);
				console.debug(`recording started. required sample rate: ${sampleRate ? sampleRate : "none"}, `
					+ `actual sample rate: ${this.audioContext.sampleRate}`);
			});
	}
	stop() {
		if(!this.recording) return;
		this.recording = false;
		if(this.stream){
			this.stream.getTracks().forEach(t=>t.stop());
		}
		console.log("recording stopped.");
		this.fireStop();
	}

	private fireStart(stream: MediaStream, context: AudioContext){
		this.onStartRecording(stream, context);
		this.emit("startRecording", stream, context);
	}

	private fireProcess(data: Float32Array){
		this.onProcessRecording(data);
		this.emit("processRecording", data);
	}

	private fireStop(){
        this.onStopRecording();
		this.emit("stopRecording");
	}
}

/**
 * @param {Float32Array} buffer
 * @param {number} sampleRate
 * @param {number} outSampleRate
 * @return {ArrayBuffer}
 */
export function downsampleBuffer(buffer: Float32Array, sampleRate: number, outSampleRate: number): ArrayBuffer{
	if (outSampleRate > sampleRate) {
		throw new Error('down-sampling rate should be smaller than the original one');
	}
	const scale = sampleRate / outSampleRate;
	const newLength = Math.round(buffer.length / scale);
    const buff = new ArrayBuffer(newLength * 2);
    const view = new DataView(buff);
	let offsetResult = 0;
	let offsetBuffer = 0;
	while (offsetResult < newLength) {
		const nextOffsetBuffer = Math.round((offsetResult + 1) * scale);
		let accum = 0;
		let count = 0;
		for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i ++) {
			accum += buffer[i];
			count += 1;
		}
		let v = accum / count;
		v = v < 0 ? v * 0x8000 : v * 0x7fff;
        view.setUint16(offsetResult * 2, v, true);
		offsetResult++;
		offsetBuffer = nextOffsetBuffer;
	}
	return buff;
}
