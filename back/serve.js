const express = require('express');
const path = require('path');
const fs = require('fs');
const { exit } = require('process');
const crypto = require('crypto')


const charDirs = fs.readdirSync("../front/media/chars", { withFileTypes: true })
.filter(dirent => dirent.isDirectory())
.map(dirent => dirent.name);

const app = express();
app.use(express.json());

app.get('{*any}', (req, res, next)=>{
	if(req.path.startsWith('/media') || req.path.startsWith('/src') || req.path.startsWith('/styles') || req.path.startsWith('/html') || req.path.startsWith('/api')) 
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
	const generatedId = crypto.createHash('md5').update(ip).update(userAgent).digest('hex');
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
	
	voterData[req.body.char] = {color: req.body.color, hair: req.body.hair, tight: req.body.tight};

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

app.listen(3301);