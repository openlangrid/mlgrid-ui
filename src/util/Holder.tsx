export class Holder<T>{
    constructor(public value: T){}
    clone(){
        return new Holder<T>(this.value);
    }
}
