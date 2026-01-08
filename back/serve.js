const express = require('express');
const path = require('path');
const fs = require('fs');
const { exit } = require('process');
const crypto = require('crypto')

const salt = "4401";


if(!fs.existsSync('../front/media/chars')) 
{
	fs.mkdirSync('../front/media/chars');
}
if(!fs.existsSync('./votes')) 
{
	fs.mkdirSync('./votes');
}

const charDirs = fs.readdirSync("../front/media/chars", { withFileTypes: true })
.filter(dirent => dirent.isDirectory())
.map(dirent => dirent.name);

const app = express();
app.use(express.json());


app.get('{*any}', (req, res, next)=>{
	if(req.path.startsWith('/favicon.ico') || req.path.startsWith('/media') || req.path.startsWith('/src') || req.path.startsWith('/styles') || req.path.startsWith('/html') || req.path.startsWith('/api')) 
	{
		return next(); 
	}
	
	res.sendFile(path.join(__dirname, "/../front/index.html"));
});
app.use('/', express.static('../front/'));

function generateId(req) 
{
	const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	const userAgent = req.headers['user-agent'];
	const generatedId = crypto.createHash('sha256').update(ip).update(userAgent).update(salt).digest('hex');
	return generatedId;
}

function connectIpIdToCookieId(ipId, cookieId) 
{
	fs.writeFileSync(`./votes/${ipId}.json`, JSON.stringify({cookieId: cookieId}));
}

function getUserId(req) 
{
	//generated ip id
	const ipId = generateId(req);
	//saved cookie id
	//only one cookie must be present
	//if anything here breaks that means cookieId has been tampered with
	const idpair = req.headers.cookie ? req.headers.cookie.split('=') : null;
	if(idpair && idpair.length != 2) return null;
	const cookieId = idpair ? idpair[1] : null;

	//we have a generated ip id entry
	if(fs.existsSync(`./votes/${ipId}.json`)) 
	{
		const voterData = JSON.parse(fs.readFileSync(`./votes/${ipId}.json`));
		//entry points to another entry, that means a user had changed their ip or useragent
		if(voterData.cookieId) 
		{
			//return the id that the entry is pointing to
			return voterData.cookieId;	
		}	
	}
	//We have no saved ip id entry and the user has no cookie, assume that's a new unique user
	//generate empty json object where votes will be added to and return ip id
	if(!cookieId) 
	{
		fs.writeFileSync(`./votes/${ipId}.json`, "{}");
		return ipId;
	}

	//either an ip id has been changed or cookie id has been tampered with
	if(cookieId && ipId != cookieId) 
	{
		//if cookieId has been tampered with there must be no saved entry
		if(!fs.existsSync(`./votes/${cookieId}.json`)) 
		{
			//here we know for sure that cookie was tampered with
			return null;
		}
		else 
		{
			const voterData = JSON.parse(fs.readFileSync(`./votes/${cookieId}.json`));
			if(voterData.cookieId) 
			{
				//cookie id has been tampered with
				return null;	
			}
		}
		//if cookie id has not been tampered with we save new ip id
		connectIpIdToCookieId(ipId, cookieId);
	}
	//return cookie id if it has not been tampered with and ip id has changed
	return cookieId;
}

function voteValue(val) 
{
	const minVal = 0;
	const maxVal = 100;
	const valN = parseInt(val);
	if(typeof valN === "number") 
	{
		if(valN > maxVal) return NaN;
		if(valN < minVal) return NaN;
		return valN;
	}
	return NaN;
}

app.post('/api/v', async(req,res)=>{
	const userId = getUserId(req);
	if(!userId) 
	{
		//tamper detected
		res.send("ok");
		return;	
	}
	const voterDataFilepath = `./votes/${userId}.json`;
	const voterData = JSON.parse(fs.readFileSync(voterDataFilepath));
	
	const colorVal = voteValue(req.body.color);
	const hairVal = voteValue(req.body.hair);
	const tightVal = voteValue(req.body.tight);

	if(isNaN(colorVal) || isNaN(hairVal) || isNaN(tightVal)) 
	{
		res.send("ok");
		return;
	}

	voterData[req.body.char] = {color: colorVal, hair: hairVal, tight: tightVal};

	fs.writeFileSync(voterDataFilepath, JSON.stringify(voterData));
	res.send("ok");
});

app.get('/api/r', async (req,res)=>{
	const userId = getUserId(req);
	if(!userId) 
	{
		//tamper detected
		res.send("TheVoteIsDone");
		return;	
	}
	let charDirsCopy = [];
	const voterDataFilepath = `./votes/${userId}.json`;
	const voterData = fs.existsSync(voterDataFilepath) ? 
	JSON.parse(fs.readFileSync(voterDataFilepath)) : {};

	for(let charDir of charDirs) charDirsCopy.push(charDir);
	
	for(let votedChar in voterData) 
	{
		charDirsCopy = charDirsCopy.filter((c)=>{return c != votedChar});
	}
	if(charDirsCopy.length == 0) 
	{
		res.send("TheVoteIsDone");
		return;
	}
	const char = charDirsCopy[parseInt(Math.random() * charDirsCopy.length)];
	res.send(char);
});

//user saves the id to cookies
app.get('/api/i', (req,res)=>{
	res.send(getUserId(req));
});

function collectVotesCount() 
{
	const voteStats = {};
	const maxVoteValue = 100;

	for(const char of charDirs) 
	{
		voteStats[char]	= 
		{
			hair: [],
			color: [],
			tight: []
		};
		const voteCharStat = voteStats[char];
		for(let i = 0; i <= maxVoteValue; i++) 
		{
			voteCharStat.hair.push(0);
			voteCharStat.color.push(0);
			voteCharStat.tight.push(0);
		}
	}
	
	const voteEntries = fs.readdirSync("./votes/", { withFileTypes: true });

	for(const voteEntryPath of voteEntries) 
	{
		const voteData = JSON.parse(fs.readFileSync(`./votes/${voteEntryPath.name}`)) 
		if(voteData.cookieId) continue;
		for(const voteChar in voteData) 
		{
			voteStats[voteChar].hair[voteData[voteChar].hair]++;
			voteStats[voteChar].color[voteData[voteChar].color]++;
			voteStats[voteChar].tight[voteData[voteChar].tight]++;
		}
	}
	return voteStats;
}

const statsSaveFile = "./statscache.json";

const statsCollected = collectVotesCount();
fs.writeFileSync(statsSaveFile, JSON.stringify(statsCollected));

setInterval(()=>{
	const statsCollected = collectVotesCount();
	fs.writeFileSync(statsSaveFile, JSON.stringify(statsCollected));
}, 1000 * 60 * 10); 

app.get('/api/stats', (req, res)=>
{
	const stats = JSON.parse(fs.readFileSync(statsSaveFile));
	res.json(stats);
});

app.listen(3301);