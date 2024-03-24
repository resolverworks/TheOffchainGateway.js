
export function data_url_short_cps(cps) {
	return `data:image/svg+xml;base64,${Buffer.from(create_text_svg(cps.map(x => `&#${x};`).join(''))).toString('base64')}`;
}

function create_text_svg(s) {
	return `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg" style="background: #ffc">
<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="360">${s}</text>
</svg>`;
}
