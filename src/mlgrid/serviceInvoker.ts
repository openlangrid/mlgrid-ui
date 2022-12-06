// 各サービス呼び出しクラス用のベースクラス
// サービス呼び出し自体はServiceInvokerクラスのinvokeメソッドでも行えるが、
// どんなサービスがあるか、そのサービスにどんなメソッドがあるかを明示するために、

import { deserialize, serialize } from "bson";
import { Buffer } from "buffer";

// このクラスと各サービス呼び出し用のクラスを作っている。
export class Service{
    constructor(private serviceInvoker: ServiceInvoker, private serviceId: string){
    }
    invoke(methodName: string, args: any[]): any{
        return this.serviceInvoker.invoke(
            this.serviceId, methodName, args);
    }
}

// 各サービス呼び出しクラス。サービスの種類毎に用意する。
// サービス毎にどんなメソッド名があるかを明示するために設けている。
export class ContinuousSpeechRecognitionService extends Service{
    /**
     * @param {string} language 
     * @param {{channels: number; sampleSizeInBits: number, frameRate: number}} config 
     * @returns {Promise<{sentenceId: number; sentence: string; fixed: boolean; accuracy: number}[]>}
     */
	startRecognition(language: string, config: {[key: string]: any}){
        return this.invoke("startRecognition", Array.prototype.slice.call(arguments));
    }
	processRecognition(sessionId: string, audio: Buffer){
        return this.invoke("processRecognition", Array.prototype.slice.call(arguments));
    }
	stopRecognition(sessionId: string){
        return this.invoke("stopRecognition", Array.prototype.slice.call(arguments));
    }
}
export class SpeechRecognition extends Service{
	recognize(language: string, format: string, audio: Buffer){
		return this.invoke("recognize", Array.prototype.slice.call(arguments));
	}
}
export class ImageClassificationService extends Service{
    classify(format: string, image: ArrayBufferLike, labelLang: string, maxResults: number): Promise<{label: string; accuracy: number}[]>{
		return this.invoke("classify", Array.prototype.slice.call(arguments));
	}
}
export class ObjectDetectionService extends Service{
    detect(format: string, image: Buffer, labelLang: string, maxResults: number){
		return this.invoke("detect", Array.prototype.slice.call(arguments));
	}
}
export class HumanPoseEstimationService extends Service{
	estimate(format: string, image: Buffer, maxResults: number){
		return this.invoke("estimate", Array.prototype.slice.call(arguments));
	}
}
export class ImageToImageConversionService extends Service{
	convert(format: string, image: Buffer){
		return this.invoke("convert", Array.prototype.slice.call(arguments));
	}
}
export class ImageToTextGenerationService extends Service{
	generate(format: string, image: Buffer){
		return this.invoke("generate", Array.prototype.slice.call(arguments));
	}
}
export class SpeechEmotionRecognition extends Service{
	recognize(language: string, audioFormat: string, audio: Buffer){
		return this.invoke("recognize", Array.prototype.slice.call(arguments));
	}
}
export interface Image{
	format: string;
	image: Buffer;
}
export class TextGuidedImageGenerationService extends Service{
    generate(language: string, text: string): Image{
        return this.invoke("generate", Array.prototype.slice.call(arguments));
    }
    generateMultiTimes(language: string, text: string, numberOfTimes: number): Promise<Image[]>{
        return this.invoke("generateMultiTimes", Array.prototype.slice.call(arguments));
    }
}
export class TextGuidedImageManipulationService extends Service{
	manipulate(language: string, prompt: string, format: string, image: Buffer){
		return this.invoke("manipulate", Array.prototype.slice.call(arguments));
	}
}
export class TextSentimentAnalysisService extends Service{
	analyze(language: string, text: string){
		return this.invoke("analyze", Array.prototype.slice.call(arguments));
	}
}
export class TextToSpeechService extends Service{
	speak(language: string, text: string, voiceType: string, audioType: string){
        return this.invoke("speak", Array.prototype.slice.call(arguments));
	}
}
export class TranslationService extends Service{
	translate(sourceLang: string, targetLang: string, source: string): Promise<string>{
        return this.invoke("translate", Array.prototype.slice.call(arguments));
    }
}

export interface MatchingCondition{
    fieldName: string;
	matchingValue: string;
	matchingMethod: "COMPLETE" | "PARTIAL" | "PREFIX" | "SUFFIX" | "REGEX" |
        "LANGUAGEPATH" | "IN" | "EQ" | "GT" | "GE" | "LT" | "LE";
}
export interface Order{
    fieldName: string;
    direction: "ASCENDANT" | "DESCENDANT";
}
export interface SearchServicesResult{
	entries: {
        serviceId: string;
        serviceType: string;
    }[];
	totalCount: number;
	totalCountFixed: boolean;
}
export class ServiceManagementService extends Service{
	searchServices(
		startIndex: number, maxCount: number,
		conditions: MatchingCondition[], orders: Order[]): Promise<SearchServicesResult>{
            return this.invoke("searchServices", Array.prototype.slice.call(arguments));
    }
}

export interface Response{
	headers: {[key: string]: any};
	result: any;
	error: {code: number; message: string};
}
// Service呼び出しに使用するクラスのベースクラス。派生クラスで実装するinvokeメソッドと、
// 各サービスクラスを返すメソッドだけを用意する。
export abstract class ServiceInvoker{
    abstract invoke(serviceId: string, methodName: string, args: any[]): Promise<any>;
	abstract lastResponse(): Response | null;
	abstract lastMillis(): number;

    /** return {ContinuousSpeechRecognitionService} */
    continuousSpeechRecognition(serviceId: string){
        return new ContinuousSpeechRecognitionService(this, serviceId);
    }
	speechRecognition(serviceId: string){
		return new SpeechEmotionRecognition(this, serviceId);
	}
    imageClassification(serviceId: string){
        return new ImageClassificationService(this, serviceId);
    }
    objectDetection(serviceId: string){
        return new ObjectDetectionService(this, serviceId);
    }
	humanPoseEstimation(serviceId: string){
		return new HumanPoseEstimationService(this, serviceId);
	}
	imageToImageConversion(serviceId: string){
		return new ImageToImageConversionService(this, serviceId);
	}
	imageToTextGeneration(serviceId: string){
		return new ImageToTextGenerationService(this, serviceId);
	}
	speechEmotionRecognition(serviceId: string){
		return new SpeechEmotionRecognition(this, serviceId);
	}
	translation(serviceId: string){
		return new TranslationService(this, serviceId);
	}
	textGuidedImageGeneration(serviceId: string){
		return new TextGuidedImageGenerationService(this, serviceId);
	}
	textGuidedImageManipulation(serviceId: string){
		return new TextGuidedImageManipulationService(this, serviceId);
	}
    textSentimentAnalysis(serviceId: string){
        return new TextSentimentAnalysisService(this, serviceId);
    }
	textToSpeech(serviceId: string){
		return new TextToSpeechService(this, serviceId);
	}
    serviceManagement(){
        return new ServiceManagementService(this, "ServiceManagement");
    }
} 

// Websocketを使ってサービス呼び出しを行うクラス
export class WSServiceInvoker extends ServiceInvoker{
    private ws: WebSocket | null = null;
    private sendbuf: (string | ArrayBufferLike | Blob | ArrayBufferView)[] = [];
    private rid = 0;
    private handlers: {[key: number]: (r: any)=>void} = {};
	private lastResponse_: Response | null = null;

    constructor(private url: string){
        super();
	}

	lastResponse(): Response | null {
		return this.lastResponse_;
	}

	lastMillis(): number {
		const hs = this.lastResponse()?.headers;
		if(hs && "timer" in hs){
			return hs["timer"]["children"][0]["millis"];
		}
		return 0;
	}

	invoke(serviceId: string, method: string, args: any[]){
		this.lastResponse_ = null;
		return new Promise((resolve, reject)=>{
			const rid = this.rid++;
			const msg = {
				reqId: rid, serviceId: serviceId,
				method: method, args: args
			};
			console.debug("req:", msg);
			msg.args = msg.args.map(v=>
				v instanceof ArrayBuffer ? Buffer.from(v) : v
			);
			const data = serialize(msg);
			this.send(data);
			this.handlers[rid] = r=>{
				resolve(r.result);
				this.lastResponse_ = r;
				delete this.handlers[rid];
			};
		});
	}

	send(data: string | ArrayBufferLike | Blob | ArrayBufferView){
		this.prepareWs();
		if(this.ws!.readyState === 0){
			this.sendbuf.push(data);
		} else if(this.ws!.readyState === 1){
			this.ws!.send(data);
		} else{
			console.error("websocket connection closing.");
		}
	}

	prepareWs(){
		if(this.ws != null) return;
		this.ws = new WebSocket(this.url);
		this.ws.binaryType = "arraybuffer";
		this.ws.addEventListener('open', e=>{
			console.debug("websocket connection opened.");
			for(let b of this.sendbuf){
				this.ws!.send(b);
			}
			this.sendbuf = [];
		});
		this.ws.addEventListener('close', e=>{
			console.debug("websocket connection closed.");
			this.ws = null;
			this.rid = 0;
			this.handlers = {};
		});
		this.ws.addEventListener("message", e=>{
			if(e.data instanceof ArrayBuffer) {
				// binary
//				console.debug("res:", e.data);
				const r = deserialize(e.data);
				console.debug("res(decoded):", r);
				this.handlers[r.reqId](r);
			} else {
				// text
//				console.debug("res:", e.data);
				const r = JSON.parse(e.data);
				console.debug("res(decoded):", r);
				this.handlers[r.reqId](r);
			}
		});
	}
}

export class HTTPServiceInvoker extends ServiceInvoker{
	constructor(private baseUrl: string){
        super();
	}

	lastResponse(): Response | null {
		return null;
	}

	lastMillis(): number {
		return -1;
	}

	invoke(serviceId: string, method: string, args: any[]){
		args = args.map(v=>v instanceof ArrayBuffer ? Buffer.from(v).toString('base64') : v);
		const body = JSON.stringify({
			method: method,
			args: args
		});
		console.debug("req:", body);
		return new Promise((resolve, reject)=>{
			fetch(`${this.baseUrl}/${serviceId}`, {
				method: "POST", mode: 'cors',
				headers: {'Content-Type': 'application/json'},
				body: body
			})
			.then(r=>{
				const ret = r.json();
				console.debug("res(decoded):", ret);
				resolve(ret);
			})
			.catch(e=>reject(e));
		});
	}	
}
