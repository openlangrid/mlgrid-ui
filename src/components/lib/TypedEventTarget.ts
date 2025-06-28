export interface TypedCustomEvent<T extends EventTarget, D> extends CustomEvent<D>{
	currentTarget: T;
	detail: D;
}
export interface TypedEventListener<T extends EventTarget, D>{
    (this: T, evt: TypedCustomEvent<T, D>): void;
}
export interface TypedEventListenerObject<T extends EventTarget, D>{
    handleEvent(evt: TypedCustomEvent<T, D>): void;
}
export type TypedEventListenerOrEventListenerObject<T extends EventTarget, D> =
	TypedEventListener<T, D> | TypedEventListenerObject<T, D>;
export class TypedEventTarget<T extends TypedEventTarget<T, Events>, Events extends Record<string, any>>
extends EventTarget {
    addEventListener<K extends keyof Events>(
        type: K, listener: TypedEventListenerOrEventListenerObject<T, Events[K]> | null,
        options?: AddEventListenerOptions | boolean): void;
  	addEventListener(...args: Parameters<EventTarget["addEventListener"]>){
		super.addEventListener(...args);
	}
  	removeEventListener<K extends keyof Events>(
        type: K, listener: TypedEventListenerOrEventListenerObject<T, Events[K]> | null,
        options?: EventListenerOptions | boolean): void;
    removeEventListener(...args: Parameters<EventTarget["removeEventListener"]>){
		super.removeEventListener(...args);
	}
    dispatchCustomEvent<K extends keyof Events>(
        type: K,  detail?: Events[K]): boolean;
	dispatchCustomEvent(type: string, detail: any){
		return super.dispatchEvent(new CustomEvent(type, {detail}));
	}
}
