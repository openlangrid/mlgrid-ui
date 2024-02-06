// 各サービス呼び出しクラス用のベースクラス
// サービス呼び出し自体はServiceInvokerクラスのinvokeメソッドでも行えるが、
// どんなサービスがあるか、そのサービスにどんなメソッドがあるかを明示するために、

import { deserialize, serialize } from "bson";
import { Buffer } from "buffer";

export interface Error{
	code: string;
	message: string;
}

export interface Box2d{ x: number, y: number, width: number, height: number}


export interface ServiceBindings{
    [key: string]: string | {serviceId: string; bindings: ServiceBindings}
}

// このクラスと各サービス呼び出し用のクラスを作っている。
export class Service{
	private bindings = {};
    constructor(private serviceInvoker: ServiceInvoker, private serviceId: string){
    }
	setBindings(bindings: ServiceBindings){
		this.bindings = bindings;
		return this;
	}
    protected invoke(methodName: string, args: any[]): any{
        return this.serviceInvoker.invoke(
            this.serviceId, methodName, args, this.bindings);
    }
}

// 各サービス呼び出しクラス。サービスの種類毎に用意する。
// サービス毎にどんなメソッド名があるかを明示するために設けている。
export interface ChatMessage{
	role: string;
	content: string;
	contentLanguage: string;
}
export class ChatService extends Service{
    generate(messages: ChatMessage[]): Promise<string>{
        return this.invoke("generate", Array.prototype.slice.call(arguments));
    }
}
export class ContextualQuestionAnsweringService extends Service{
	ask(context: string, question: string, language: string): Promise<string>{
		return this.invoke("ask", Array.prototype.slice.call(arguments));
	}
}
export interface ContinuousSpeechRecognitionStartRecognitionConfig{
	channels: number;
	sampleSizeInBits: number;
	sampleRate: number;  // hertz. 8000, 16000, 44100.
}
export interface ContinuousSpeechRecognitionTranscript{
	sentenceId: number;
	startMillis: number;
	endMillis: number;
	sentence: string;
	fixed: boolean;
	accuracy: number;
}
export class ContinuousSpeechRecognitionService extends Service{
    /**
     * @param {string} language 
     * @param {{channels: number; sampleSizeInBits: number, frameRate: number}} config 
     * @returns {Promise<{sentenceId: number; sentence: string; fixed: boolean; accuracy: number}[]>}
     */
	startRecognition(language: string,
		config: {channels: number; sampleSizeInBits: number; sampleRate: number}): Promise<string>{
        return this.invoke("startRecognition", Array.prototype.slice.call(arguments));
    }
	processRecognition(sessionId: string, audio: ArrayBuffer): Promise<ContinuousSpeechRecognitionTranscript[]>{
        return this.invoke("processRecognition", Array.prototype.slice.call(arguments));
    }
	stopRecognition(sessionId: string): Promise<ContinuousSpeechRecognitionTranscript[]>{
        return this.invoke("stopRecognition", Array.prototype.slice.call(arguments));
    }
}
export interface SpeechRecognitionResult{
	startMillis: number;
	endMillis: number;
	transcript: string;
}
export class SpeechRecognition extends Service{
	recognize(audio: ArrayBuffer, audioFormat: string, audioLanguage: string): Promise<SpeechRecognitionResult[]>{
		return this.invoke("recognize", Array.prototype.slice.call(arguments));
	}
}
export class ImageClassificationService extends Service{
    classify(image: ArrayBuffer, imageFormat: string, labelLang: string, maxResults: number):
		Promise<{label: string; accuracy: number}[]>{
		return this.invoke("classify", Array.prototype.slice.call(arguments));
	}
}

export interface Morpheme{
	word: string;
	lemma: string;
	partOfSpeech: string;
}
export class MorphologicalAnalysisService extends Service{
	analyze(language: string, text: string): Promise<Morpheme[]>{
		return this.invoke("analyze", Array.prototype.slice.call(arguments));
	}
}
export interface ObjectDetection{
	label: string;
	accuracy: number;
	box: Box2d;
}
export interface ObjectDetectionResult{
	width: number;
	height: number;
	detections: ObjectDetection[];
}
export class ObjectDetectionService extends Service{
    detect(image: ArrayBufferLike, imageFormat: string, labelLang: string):
		Promise<ObjectDetectionResult>{
		return this.invoke("detect", Array.prototype.slice.call(arguments));
	}
}
export interface ObjectSegmentation{
	label: string;
	accuracy: number;
	box: Box2d;
	maskImage: Buffer;
	maskImageFormat: string;
}
export interface ObjectSegmentationResult{
	width: number;
	height: number;
	segmentations: ObjectSegmentation[];
}
export class ObjectSegmentationService extends Service{
    segment(image: ArrayBufferLike, imageFormat: string, labelLang: string):
		Promise<ObjectSegmentationResult>{
		return this.invoke("segment", Array.prototype.slice.call(arguments));
	}
}

export interface Point3d{
	x: number;
	y: number;
	z: number;
}
export interface HumanPoseEstimationResult{
	width: number;
	height: number;
	poses: {[key: string]: Point3d}[];
}
export class HumanPoseEstimationService extends Service{
	estimate(image: ArrayBuffer, imageFormat: string): Promise<HumanPoseEstimationResult>{
		return this.invoke("estimate", Array.prototype.slice.call(arguments));
	}
}
export class ImageConversionService extends Service{
	convert(image: ArrayBuffer, imageFormat: string): Promise<Image>{
		return this.invoke("convert", Array.prototype.slice.call(arguments));
	}
}
export class ImageToTextConversionService extends Service{
	convert(image: ArrayBuffer, imageFormat: string, textLang: string): Promise<string>{
		return this.invoke("convert", Array.prototype.slice.call(arguments));
	}
}
export interface SpeechEmotionRecognitionResult{
	label: string;
	degree: number;
}
export class SpeechEmotionRecognition extends Service{
	recognize(audio: ArrayBuffer, audioFormat: string, audioLanguage: string):
		Promise<SpeechEmotionRecognitionResult[]>{
		return this.invoke("recognize", Array.prototype.slice.call(arguments));
	}
}
export interface Image{
	image: ArrayBuffer;
	format: string;
}
export class TestService extends Service{
    test(arg: any): Promise<any>{
        return this.invoke("test", Array.prototype.slice.call(arguments));
    }
}
export class TextGuidedImageGenerationService extends Service{
    generate(text: string, textLanguage: string): Promise<Image>{
        return this.invoke("generate", Array.prototype.slice.call(arguments));
    }
    generateMultiTimes(text: string, textLanguage: string, numberOfTimes: number): Promise<Image[]>{
        return this.invoke("generateMultiTimes", Array.prototype.slice.call(arguments));
    }
}
export class TextGuidedImageManipulationService extends Service{
	manipulate(
		image: ArrayBuffer, imageFormat: string,
		text: string, textLanguage: string,
		numOfTimes: number): Promise<Image[]>{
		return this.invoke("manipulate", Array.prototype.slice.call(arguments));
	}
}
export class TextGenerationService extends Service{
	generate(text: string, textLanguage: string): Promise<string>{
		return this.invoke("generate", Array.prototype.slice.call(arguments));
	}
}
export class TextInstructionService extends Service{
	generate(systemPrompt: string, userPrompt: string, promptLanguage: string): Promise<string>{
		return this.invoke("generate", Array.prototype.slice.call(arguments));
	}
}
export class MultimodalTextGenerationService extends Service{
	generate(text: string, textLanguage: string,
			files: {content: ArrayBuffer, format: string}[]): Promise<string>{
		return this.invoke("generate", Array.prototype.slice.call(arguments));
	}
}
export class TextGenerationWithTextToSpeechService extends Service{
    generate(text: string, textLanguage: string): Promise<Audio>{
        return this.invoke("generate", Array.prototype.slice.call(arguments));
    }
}
export interface TextSentimentAnalysisResult{
	label: string;
	accuracy: number;
}
export class TextSentimentAnalysisService extends Service{
	analyze(text: string, textLanguage: string): Promise<TextSentimentAnalysisResult>{
		return this.invoke("analyze", Array.prototype.slice.call(arguments));
	}
}

export class TextSimilarityCalculationService extends Service{
	calculate(text1: string, text1Language: string, text2: string, text2Language: string): Promise<number>{
		return this.invoke("calculate", Array.prototype.slice.call(arguments));
	}
}

export interface Audio {
	audio: ArrayBuffer;
	format: string;
}
export class TextToSpeechService extends Service{
	speak(text: string, textLanguage: string): Promise<Audio>{
        return this.invoke("speak", Array.prototype.slice.call(arguments));
	}
}
export interface LGSpeech{
	audio: ArrayBuffer;
	voiceType: string;
	audioType: string;
}
export class LGTextToSpeechService extends Service{
	speak(text: string, voiceType: string, audioType: string): Promise<LGSpeech>{
        return this.invoke("speak", Array.prototype.slice.call(arguments));
	}
}
export class TranslationService extends Service{
	translate(text: string, textLanguage: string, targetLanguage: string): Promise<string>{
        return this.invoke("translate", Array.prototype.slice.call(arguments));
    }
}
export class TextGenerationWithTranslationService extends Service{
	generate(text: string, textLanguage: string, generationLanguage: string): Promise<string>{
        return this.invoke("generate", Array.prototype.slice.call(arguments));
	}
}
export class VisualQuestionAnsweringService extends Service{
	generate(prompt: string, promptLanguage: string,
			image: ArrayBuffer, imageFormat: string): Promise<string>{
		return this.invoke("generate", Array.prototype.slice.call(arguments));
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
		compositionType: "ATOMIC" | "COMPOSITE";
		description: string | null;
		license: string | null;
		url: string | null;
    }[];
	totalCount: number;
	totalCountFixed: boolean;
}
export interface ServiceInvocation{
	invocationName: string;
	serviceType: string;
}
export class ServiceManagementService extends Service{
	searchServices(
		startIndex: number, maxCount: number,
		conditions: MatchingCondition[], orders: Order[]): Promise<SearchServicesResult>{
            return this.invoke("searchServices", Array.prototype.slice.call(arguments));
    }
	getServiceInvocations(
		serviceId: string): Promise<ServiceInvocation[]>{
			return this.invoke("getServiceInvocations", Array.prototype.slice.call(arguments));
	}
}

export interface GpuInfo{
	timestamp: string;
	gpuName: string;
	index: number;
	totalMemoryMB: number;
	usedMemoryMB: number;
	freeMemoryMB: number;
	gpuUtilizationPercentage: number;
	memoryUtilizationPercentage: number;
}
export interface Response{
	headers: {
		trace: {ellapsedMillis: number | undefined} | undefined;
		gpuInfos: GpuInfo[] | undefined;
		[key: string]: any;
	};
	result: any;
	error: {code: number; message: string};
}
export interface WSResponse extends Response{
	reqId: number;
}
// Service呼び出しに使用するクラスのベースクラス。派生クラスで実装するinvokeメソッドと、
// 各サービスクラスを返すメソッドだけを用意する。
export abstract class ServiceInvoker{
    abstract invoke(serviceId: string, methodName: string, args: any[], bindings: {}): Promise<any>;
	abstract lastResponse(): Response | null;
	abstract lastMillis(): number;
	abstract lastGpuInfos(): GpuInfo[];

    /** return {ContinuousSpeechRecognitionService} */
	chat(serviceId: string){
		return new ChatService(this, serviceId);
	}
	contextualQuestionAnswering(serviceId: string){
		return new ContextualQuestionAnsweringService(this, serviceId);
	}
    continuousSpeechRecognition(serviceId: string){
        return new ContinuousSpeechRecognitionService(this, serviceId);
    }
	humanPoseEstimation(serviceId: string){
		return new HumanPoseEstimationService(this, serviceId);
	}
    imageClassification(serviceId: string){
        return new ImageClassificationService(this, serviceId);
    }
	imageConversion(serviceId: string){
		return new ImageConversionService(this, serviceId);
	}
	imageToTextConversion(serviceId: string){
		return new ImageToTextConversionService(this, serviceId);
	}
	morphologicalAnalysis(serviceId: string){
		return new MorphologicalAnalysisService(this, serviceId);
	}
	multimodalTextGeneration(serviceId: string){
		return new MultimodalTextGenerationService(this, serviceId);
	}
    objectDetection(serviceId: string){
        return new ObjectDetectionService(this, serviceId);
    }
	objectSegmentation(serviceId: string){
		return new ObjectSegmentationService(this, serviceId);
	}
	speechEmotionRecognition(serviceId: string){
		return new SpeechEmotionRecognition(this, serviceId);
	}
	speechRecognition(serviceId: string){
		return new SpeechRecognition(this, serviceId);
	}
	translation(serviceId: string){
		return new TranslationService(this, serviceId);
	}
	test(serviceId: string){
		return new TestService(this, serviceId);
	}
	textGenerationWithTranslation(serviceId: string){
		return new TextGenerationWithTranslationService(this, serviceId);
	}
	textGuidedImageGeneration(serviceId: string){
		return new TextGuidedImageGenerationService(this, serviceId);
	}
	textGuidedImageManipulation(serviceId: string){
		return new TextGuidedImageManipulationService(this, serviceId);
	}
    textGeneration(serviceId: string){
        return new TextGenerationService(this, serviceId);
    }
	textGenerationWithTextToSpeech(serviceId: string){
		return new TextGenerationWithTextToSpeechService(this, serviceId);
	}
    textInstruction(serviceId: string){
        return new TextInstructionService(this, serviceId);
    }
    textSentimentAnalysis(serviceId: string){
        return new TextSentimentAnalysisService(this, serviceId);
    }
    textSimilarityCalculation(serviceId: string){
        return new TextSimilarityCalculationService(this, serviceId);
    }
	textToSpeech(serviceId: string){
		return new TextToSpeechService(this, serviceId);
	}
	visualQuestionAnswering(serviceId: string){
		return new VisualQuestionAnsweringService(this, serviceId);
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
	private lastResponse_: WSResponse | null = null;
	private url: string;
	private keepAliveTimer = -1;

    constructor(url: string | undefined){
        super();
		if(url){
			this.url = url;
		} else{
			const l = document.location;
			const p = l.pathname.lastIndexOf("/");
			const path = p === -1 ? l.pathname : l.pathname.substring(0, p + 1);
			this.url = `wss://${l.hostname}${l.port ? ":" + l.port : ""}${path}ws`;
			console.log(this.url);
		}
	}

	nextRequestId(){
		return this.rid;
	}

	lastResponse(): WSResponse | null {
		return this.lastResponse_;
	}

	lastMillis(): number {
		return this.lastResponse()?.headers?.trace?.ellapsedMillis || 0;
	}

	lastGpuInfos(): GpuInfo[]{
		return this.lastResponse()?.headers?.gpuInfos || [];
	}

	private unboxBuffer<T>(value: T): T{
		if(Array.isArray(value)){
			let array = value as T[];
			for(let i = 0; i < array.length; i++){
				array[i] = this.unboxBuffer(array[i]);
			}
		} else if(typeof value === "object"){
			let obj = value as {[key: string]: any};
			if(Object.hasOwn(obj, "buffer") && Object.hasOwn(obj, "position") &&
				Object.hasOwn(obj, "sub_type")){
				return obj.buffer;
			}
			for(let key of Object.keys(obj)){
				if(obj[key] != null)
					obj[key] = this.unboxBuffer(obj[key]);
			}
		}
		return value;
	}

	invoke(serviceId: string, method: string, args: any[], bindings: {} = {}){
		this.lastResponse_ = null;
		return new Promise((resolve, reject)=>{
			const rid = this.rid++;
			const msg = {
				reqId: rid, serviceId: serviceId,
				headers: {bindings: bindings},
				method: method, args: args
			};
			msg.args = wrapBuffer(msg.args);
			console.debug("req:", msg);
			const data = serialize(msg);
			this.send(data);
			this.handlers[rid] = r=>{
				if(r.result !== null){
					r.result = this.unboxBuffer(r.result);
				}
				this.lastResponse_ = r;
				if(r.result !== null){
					resolve(r.result);
				} else if(r.error !== null){
					reject(r.error);
				}
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
			this.keepAliveTimer = window.setInterval(()=>{
				const rid = this.rid++;
				const msg = {
					reqId: rid, serviceId: "__PingService",
					headers: {},
					method: "ping", args: []
				};
				this.handlers[rid] = ()=>{};
				this.ws?.send(JSON.stringify(msg));
			}, 30 * 1000);
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
			if(this.keepAliveTimer !== -1){
				window.clearInterval(this.keepAliveTimer);
				this.keepAliveTimer = -1;
			}
		});
		this.ws.addEventListener("message", e=>{
			let r: any = null;
			if(e.data instanceof ArrayBuffer) {
				// binary
				r = deserialize(new Uint8Array(e.data));
			} else {
				// text
				r = JSON.parse(e.data);
			}
			console.debug("res(decoded):", r);
			if(r.reqId in this.handlers){
				this.handlers[r.reqId](r);
				delete this.handlers[r.reqId];
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

	lastMillis() {
		return -1;
	}

	lastGpuInfos() {
		return [];
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

function wrapBuffer(arg: any): any{
	if(Array.isArray(arg)){
		return arg.map(v=>wrapBuffer(v))
	}
	if(arg instanceof ArrayBuffer){
		return Buffer.from(arg);
	}
	if(typeof arg === 'object') {
		for(const k of Object.keys(arg)){
			arg[k] = wrapBuffer(arg[k])
		}
		return arg;
	}
	return arg;
}
