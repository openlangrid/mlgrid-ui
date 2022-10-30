export function round(v: number, n: number){
	const s = Math.pow(10, n);
	return Math.round(v * s) / s;
}

export function roundBox(v: {x: number; y: number; width: number; height: number}, n: number){
	return {x: round(v.x, n), y: round(v.y, n),
		width: round(v.width, n), height: round(v.height, n)};
}

export function msToMsms(ms: number){
	return `${Math.floor(ms / 1000 / 60)}:${ms / 1000 % 60}.${ms % 1000}`;
}
