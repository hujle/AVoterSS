class AutoTitle extends HTMLElement 
{
	constructor() 
	{
		super();
	}
	connectedCallback() 
	{
		document.title = this.attributes.title.value;
	}
}

customElements.define('auto-title', AutoTitle)