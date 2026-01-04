const express = require('express');
const path = require('path');
const fs = require('fs');
const { exit } = require('process');

let data = {};
const savePath = "./data.json";

function saveData() 
{
	console.log("\nSaving...\n");
	fs.writeFileSync(savePath, JSON.stringify(data));
} 
function loadData() 
{
	if(fs.existsSync(savePath)) 
	{
		const jsonStr = fs.readFileSync(savePath);
		data = JSON.parse(jsonStr);
	} 
}

loadData();
process.on('exit', ()=>{ process.emit("cleanup"); });
process.on('cleanup', saveData);
process.on('SIGINT', ()=>{ exit(2); });

const charDirs = fs.readdirSync("../front/media/chars", { withFileTypes: true })
.filter(dirent => dirent.isDirectory())
.map(dirent => dirent.name);

console.log(charDirs);

const app = express();
app.use('/', express.static('../front/'));

app.post('/api/v', (req,res)=>{
});

app.get('/api/r', (req,res)=>{
	const char = charDirs[parseInt(Math.random() * charDirs.length)];
	res.send(char);
});

app.listen(3301);