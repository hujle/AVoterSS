const r = ()=>
{
	const l = localStorage.i ? window.history.pushState(null, null, '/vote') : null;
}
async function InitialiseId() 
{
	let savedUid;
	let savedUid2;
	let savedUid3;

	const cookies = document.cookie.split(';');
	let cookieId;
	for(const cookiePair of cookies) 
	{
		const cookieSplit = cookiePair.split('=');
		if(cookieSplit[0].trim() == 'i') cookieId = cookieSplit[1];
	}
	
	if(!localStorage.i && !cookieId) 
	{
		//get new id from server
		savedUid = await (await fetch('api/i')).text();
		localStorage.i = savedUid;
	}

	if(!cookieId && localStorage.i) document.cookie = `i=${localStorage.i}`;
	if(!localStorage.i && cookieId) localStorage.i = cookieId;
	
	savedUid = localStorage.i;
	savedUid2 = localStorage.i;
	savedUid3 = localStorage.i;

	const refreshId = ()=>{
	if(savedUid != savedUid2 && savedUid2 == savedUid3) 
	{
		savedUid = savedUid2;
	}
	if(savedUid2 != savedUid && savedUid == savedUid3) 
	{
		savedUid2 = savedUid;
	}
	if(savedUid3 != savedUid && savedUid == savedUid2) 
	{
		savedUid3 = savedUid;
	}
	localStorage.i = savedUid;
	document.cookie = `i=${savedUid}`;
	}
	const shiftIntervalId = ()=>
	{
		const c = parseInt(Math.random() * 1000);
		for(let i = 0; i < c; i++)   
		{
			const i = setInterval(()=>{});
			clearInterval(i);
		}
	}
	shiftIntervalId();
	setInterval(refreshId,100);
	shiftIntervalId();
	setInterval(refreshId,77);
	shiftIntervalId();
	setInterval(refreshId,43);
}


InitialiseId();