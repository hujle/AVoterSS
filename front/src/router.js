
class Router extends HTMLElement 
{
	constructor() 
	{
		super();
	}

	connectedCallback() 
	{

	}
}


window.history.pushState = new Proxy(window.history.pushState, {
	apply: (target, thisArg, argArray) => {
		target.apply(thisArg, argArray);
		window.dispatchEvent(new Event('pushstate'));
	},
});

class Route extends HTMLElement 
{
	constructor() 
	{
		super();
		this.initialHTML = [];
		for(let c of this.childNodes) this.initialHTML.push(c);
		while(this.firstChild) this.firstChild.remove();
		this.uniqueRoutes = {};
		this.perPath = this.attributes.perPath ? this.attributes.perPath.value : false;
		this.perSearch = this.attributes.perSearch ? this.attributes.perSearch.value : false;
		this.elementsStore;
		this.activeRoute = false;
		this.activeRouteKey = "";
		this.updateRoute();
		const route = this;
		window.addEventListener('pushstate', (e)=>{
			route.updateRoute();
		});
		window.addEventListener('popstate', (e)=>{
			route.updateRoute();
		});
	}

	hide() 
	{
		this.childNodes.forEach((el)=>{this.elementsStore.push(el)});
		while(this.firstChild) 
		{
			this.firstChild.remove();
		}
		this.activeRoute = false;
	}
	show() 
	{
		const route = this;
		this.elementsStore.forEach((el)=>{
			route.append(el);
		});
		while(this.elementsStore.length) this.elementsStore.pop();
	}

	updateRoute() 
	{
		let nameMatch = (window.location.pathname+window.location.search).match(new RegExp(this.attributes.path.value));
		const routeKey = (this.perPath ? window.location.pathname : "") + (this.perSearch ? window.location.search : "");
		//currently hidden should be hidden
		/* Do nothing */

		//currently hidden, should be shown
		if(!this.activeRoute && nameMatch) 
		{
			//route hasn't been created
			if(!this.uniqueRoutes[routeKey]) 
			{
				this.uniqueRoutes[routeKey] = [];
				//clone initial nodes
				for(let c of this.initialHTML) { this.uniqueRoutes[routeKey].push(c.cloneNode()); }
			}
			this.elementsStore = this.uniqueRoutes[routeKey];
			this.show();
		}
		//currently shown, should be hidden
		if(this.activeRoute && !nameMatch) 
		{
			this.hide();	
		}
		
		//currently shown should be shown
		if(this.activeRoute && nameMatch) 
		{
			//different route
			if(routeKey != this.activeRouteKey) 
			{
				this.hide();

				//route hasn't been created
				if(!this.uniqueRoutes[routeKey]) 
				{
					this.uniqueRoutes[routeKey] = [];
					//clone initial nodes
					for(let c of this.initialHTML) { this.uniqueRoutes[routeKey].push(c.cloneNode()); }
				}
				this.elementsStore = this.uniqueRoutes[routeKey];
				this.show();
			}	
		}

		this.activeRouteKey = routeKey;
		this.activeRoute = nameMatch;
	}

	connectedCallback() 
	{
	}
}

class Redirect extends HTMLElement 
{
	constructor() 
	{
		super();
	}

	connectedCallback() 
	{
		setTimeout(()=>{ if(document.body.contains(this)) window.history.pushState(null, null, this.attributes.path.value); }, 100);
	}
}

class ClickLink extends HTMLElement 
{
	constructor() 
	{
		super();
	}

	connectedCallback() 
	{
		if(this.initialised) return;
		this.initialised = true;

		const anchor = document.createElement("a");
		anchor.style.display = "contents";
		anchor.setAttribute("href", this.attributes.href.value);
		while(this.firstChild) 
		{
			anchor.append(this.firstChild);
		}
		this.append(anchor);
		this.tabIndex = 0;
		const self = this;
		anchor.addEventListener('click', (e)=>
		{
			e.preventDefault();
			if(window.location.pathname == self.attributes.href.value) return;
			window.history.pushState(null, null, self.attributes.href.value)
		});
		anchor.addEventListener('keypress', (e)=> {
			e.preventDefault();
			if(e.key !== "Enter") return;
			if(window.location.pathname == self.attributes.href.value) return;
			window.history.pushState(null, null, self.attributes.href.value)
		});
	}
}

customElements.define('click-link', ClickLink);
customElements.define('router-', Router);
customElements.define('route-', Route);
customElements.define('redirect-', Redirect);