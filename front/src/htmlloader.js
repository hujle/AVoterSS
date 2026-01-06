function numberLines(text, padd) 
{
	let res = '';
	let line = 1;
	res += ' '.repeat(padd-`${line}`.length) + `${line}:`
	for(let ci = 0; ci < text.length; ci++) 
	{
		const c = text[ci];
		res += c;
		if(c == '\n') 
		{
			line++;
			res += ' '.repeat(padd-`${line}`.length) + `${line}:`
		}
	}
	return res;
}

class HTMLLoader extends HTMLElement 
{
	static #parser = new DOMParser();
	constructor() 
	{
		super();
		const self = this;
		fetch(this.attributes.path.value).then((res)=>
		{
			res.text().then(async (text)=>{
				const dom = HTMLLoader.#parser.parseFromString(text, 'text/html');
				//remove own children
				while(self.firstChild) self.firstChild.remove();
				const scriptTagsA = dom.getElementsByTagName("script");
				const scriptTags = [];
				const styleTags = [];
				for(let i = 0; i < scriptTagsA.length; i++) scriptTags.push(scriptTagsA[i]);
				//steal children
				while(dom.body.firstChild) self.append(dom.body.firstChild);
				for(const tag of scriptTags) 
				{
					if(tag.attributes.src) 
					{
						console.log(tag.attributes.src.value);
						tag.innerHTML = await ((await fetch('/'+tag.attributes.src.value)).text());
					}
					if(tag.attributes.append) 
					{
						let appendValue = null;
						try 
						{
							appendValue = eval(tag.innerHTML)();
						}
						catch(err) 
						{
							console.info(numberLines(tag.innerHTML, 8));
							console.error(err);
						}
						const appendBeforeTag = async (val)=>
						{
							if(val instanceof Promise) val = await val;
							if(Array.isArray(val)) 
							{
								val.forEach((el)=>{ appendBeforeTag(el); });
							}
							else
							if(val instanceof HTMLCollection) 
							{
								for(const el of val) 
								{
									tag.parentElement.insertBefore(el, tag);
								}
							}
							else 
							{
								console.log(tag);
								tag.parentElement.insertBefore(document.createTextNode(val.toString()), tag);
							}
						}
						appendBeforeTag(appendValue);
					}
					else 
					{
						try 
						{
							eval(tag.innerHTML);
						} catch (err) 
						{
							console.info(numberLines(tag.innerHTML, 8));
							console.error(err);
						}
					}
					//tag.remove();
				}
			});
		});
	}

	connectedCallback() 
	{
	}
}

customElements.define("html-loader", HTMLLoader);