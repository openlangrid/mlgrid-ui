import { Stream } from "stream";

export class Recorder{
    private sampleRate: number;
    private recording = false;
    private audioContext: AudioContext | null = null;
    private stream: MediaStream | null = null;

	constructor(){
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
                this.onStartRecording(stream, this.audioContext);
				const sp = this.audioContext.createScriptProcessor(1024, 1, 1);
				sp.onaudioprocess = e=>{
					if(this.recording) this.onProcessRecording(e.inputBuffer.getChannelData(0));
				};
				this.audioContext.createMediaStreamSource(stream).connect(sp);
				sp.connect(this.audioContext.destination);
				console.debug(`recording started. required sample rate: ${sampleRate ? sampleRate : "none"}, `
					+ `actual sample rate: ${this.audioContext.sampleRate}`);
/*
				window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
				if(window.SpeechRecognition){
					this.sr = new window.SpeechRecognition();
					this.sr.continuous = true;
					this.sr.lang = 'ja-JP';
					this.sr.interimResults = false;
					this.sr.maxAlternatives = 1;
					this.sr.onresult = e=>{
						this.ws.send(JSON.stringify({
							"type": "asrResult",
							"body": e.results[e.results.length - 1][0].transcript
						}));
					};
					this.sr.onend = e=>{
						console.log("asr stopped.")
						this.sr = null;
						if(this.recording){
							this.finish();
						} else{
							this.startClosing();
						}
					}
					this.sr.start();
				}
*/
			});
	}
	stop() {
		if(!this.recording) return;
		this.recording = false;
		if(this.stream){
			this.stream.getTracks().forEach(t=>t.stop());
		}
		console.debug("recording stopped.");
        this.onStopRecording();
/*		if(this.sr){
			this.sr.stop();
		} else{
			this.startClosing();
		}
*/
    }
	startClosing(){
/*		if(this.onending) this.onending();
		this.ws.send(JSON.stringify({"type": "recordingFinished"}));
		if(this.audioContext){
			this.audioContext.close().then(()=>{
				console.log("audioContext closed.");
				this.audioContext = null;
			});
		}
*/
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
