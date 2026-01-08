function newGraph(values, width, height, bgColor, lineColor, title) 
{
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	const blurPasses = 3;
	const blurFactor = 0.9;

	let buffer1 = [];
	let buffer2 = [];

	for(let v of values) 
	{
		buffer1.push(v);
		buffer2.push(v);	
	}

	for(let b = 0; b < blurPasses; b++) 
	{
		buffer2[0] = (buffer1[0] + buffer1[1] * blurFactor) / (1.0 + blurFactor);
		buffer2[values.length - 1] = (buffer1[values.length - 1] + buffer1[values.length - 2] * blurFactor) / (1.0 + blurFactor);
		for(let i = 1; i < values.length - 1; i++) 
		{
			console.log(buffer1[i]);
			buffer2[i] = (buffer1[i] + (buffer1[i+1]+buffer1[i-1]) * blurFactor) / (1.0 + blurFactor * 2.0);
		}
		let temp = buffer1;
		buffer1 = buffer2;
		buffer2 = temp;
	}

	let maxValue = 0;
	let minValue = 100;

	for(let v of buffer1) 
	{
		maxValue = Math.max(maxValue, v);
		minValue = Math.min(minValue, v);
	}

	for(let i = 0; i < buffer1.length; i++) 
	{
		buffer1[i] -= minValue;
		buffer1[i] /= (maxValue - minValue);
		buffer1[i] *= 0.9;
		buffer1[i] += 0.05;
	}

	canvas.width = width;
	canvas.height = height;
	ctx.fillStyle = bgColor;
	ctx.fillRect(0,0,width,height);
	ctx.beginPath();
	ctx.moveTo(0, height - buffer1[0] * height);
	for(let i = 1; i < buffer1.length; i++)
	{
		ctx.lineTo(i / buffer1.length * width, height - buffer1[i] * height);
	}
	ctx.strokeStyle = lineColor;
	ctx.lineWidth = 4;
	ctx.stroke();

	const container = document.createElement("div");
	container.classList.add("GraphContainer");
	const titleEl = document.createElement("div");
	titleEl.classList.add("GraphTitle");
	titleEl.innerText = title;
	container.append(titleEl, canvas);

	return container;
}

class CharStatCard extends HTMLElement 
{
	constructor() 
	{
		super();
		this.titleContainer = document.createElement("div");
		this.imageContainer = document.createElement("div");
		this.textContainer = document.createElement("div");
		this.image = document.createElement("img");
		this.titleContainer.classList.add("CharCardTitleContainer");
		this.imageContainer.classList.add("CharCardImageContainer");
		this.textContainer.classList.add("CharCardTextContainer");
		this.classList.add("CharCard");
		this.image.classList.add("CharImage");

		
		this.imageContainer.append(this.image);
		this.append(this.titleContainer, this.imageContainer, this.textContainer);
		
		this.character = this.attributes.character.value;
		this.image.src = `/media/chars/${this.character}/pic.png`;
		this.image.classList.add("CharImg");

		(async()=>{
			const info = JSON.parse(await (await fetch(`/media/chars/${this.character}/info.json`)).text());
			this.titleContainer.innerText = info.title;
			this.textContainer.innerText = info.description;
		})();

		const charStats = cachedStats[this.character];
		console.log(charStats);
		this.colorGraph = newGraph(charStats.color, 320, 240, "black", "#881144", "Color graph");
		this.hairGraph = newGraph(charStats.hair, 320, 240, "black", "#881144", "Hair graph");
		this.tightGraph = newGraph(charStats.tight, 320, 240, "black", "#881144", "Tightness graph");
		this.append(this.colorGraph, this.hairGraph, this.tightGraph);
	}
}

customElements.define("char-stat-card", CharStatCard);