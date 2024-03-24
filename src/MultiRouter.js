// MultiRouter produces a new synthetic router from a list of routers
// when "a.b.c.d.e" is resolved against the /${slug} endpoint
// it searches for the first router that matches a label in the name
// if a router is found, it will remove the basename
// and forward the remainder to the router
// the original name is put in the context as "multi"

// example: 
// slugs = [multi, chonk]
// [/multi] "a.b.chonk.d.e" => [/chonk] "a.b" 

export class MultiRouter {
	constructor(slug, routers) {
		this.slug = slug;
		this.routers = new Map(routers.map(x => [x.slug, x]));
	}
	resolve(name, context, history) {
		let labels = name.split('.');
		for (let i = labels.length-1; i >= 0; i--) {
			let router = this.routers.get(labels[i]); 
			if (router) {
				context.multi = name; // remember original name
				let rest = labels.slice(0, i).join('.'); // "a.b" in "a.b.$router.c.d" 
				history.show = [`${name} => ${router.slug}:${rest}`];
				return router.resolve(rest, context, history);
			}
		}
	}
}
