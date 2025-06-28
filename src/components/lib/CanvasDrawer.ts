import { TypedEventTarget } from "./TypedEventTarget";

export class CanvasDrawer extends TypedEventTarget<CanvasDrawer, {
    updated: void;
}> {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private colorInput: HTMLInputElement | null = null;
    private sizeInput: HTMLInputElement | null = null;
    private drawing: boolean = false;
    private button: number = 0;
    private prevPos = { x: 0, y: 0 };

    private canvasMouseDown(e: MouseEvent){
        if(this.ctx === null) return;
        this.drawing = true;
        this.button = e.button;
        this.prevPos.x = e.offsetX;
        this.prevPos.y = e.offsetY;
        this.ctx.lineCap = 'round';
        e.preventDefault();
    }

    private canvasMouseUp(e: MouseEvent){
        this.drawing = false;
        e.preventDefault();
        this.dispatchCustomEvent("updated");
    }

    private canvasMouseMove(e: MouseEvent){
        if (!this.drawing || this.ctx === null || this.sizeInput === null || this.colorInput === null) return;
        let c = "#FFFFFF";
        let size = parseInt(this.sizeInput.value);
        if (this.button === 0) {
            c = this.colorInput.value;
        } else{
            size += 4;
        }
        this.draw(this.prevPos.x, this.prevPos.y, e.offsetX, e.offsetY, size, c);
        this.prevPos = {x: e.offsetX, y: e.offsetY};
    }

    private canvasMouseDownListener = (e: MouseEvent)=>this.canvasMouseDown(e);
    private canvasMouseUpListener = (e: MouseEvent)=>this.canvasMouseUp(e);
    private canvasMouseMoveListener = (e: MouseEvent)=>this.canvasMouseMove(e);
    attach(canvas: HTMLCanvasElement, sizeInput: HTMLInputElement, colorInput: HTMLInputElement) : ()=>void{
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx?.drawImage(this.canvas, 0, 0);

        this.canvas.addEventListener("mousedown", this.canvasMouseDownListener);
        this.canvas.addEventListener("mousemove", this.canvasMouseMoveListener);
        this.canvas.addEventListener("mouseup", this.canvasMouseUpListener);
        this.canvas.oncontextmenu = () => false;
        this.sizeInput = sizeInput;
        this.colorInput = colorInput;

        return ()=>{
            this.detach();
        }
    }

    detach(){
        this.sizeInput = null;
        this.colorInput = null;
        this.canvas?.removeEventListener("mousedown", this.canvasMouseDownListener);
        this.canvas?.removeEventListener("mousemove", this.canvasMouseMoveListener);
        this.canvas?.removeEventListener("mouseup", this.canvasMouseUpListener);
        this.canvas = null;
        this.ctx = null;
    }

    draw(prevX: number, prevY: number, x: number, y: number, size: number, color: string) {
        if(!this.ctx) return;
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size;
        this.ctx.moveTo(prevX, prevY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
  
    getImageDataUrl(): string {
        return this.canvas?.toDataURL("image/png") || "";
    }
}
