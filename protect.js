(function(window, document) {
	/* Protect.js by PY-DNG */
	/* !IMPORTANT! MAKE SURE THIS CODE IS EXECUTED BEFORE WINDOW ONLOAD !IMPORTANT! */

	try {
		// Unpolluted resources
		const iframe = document.createElement('iframe');
		iframe.srcdoc = '<html></html>';
		iframe.style.position = 'fixed';
		iframe.style.width = iframe.style.height = '0';
		(document.body ? document.body : document.head).appendChild(iframe);
		const UNPOLLUTED = new Proxy({}, {
			get: function(target, property, receiver) {
				switch (property) {
					case 'iframe': return iframe;
					default: {
						let value = iframe;
						for (const prop of property.split(/[\.\/]/)) {
							value = value[prop];
						}
						return value;
					}
				}
			}
		});

		// Protect addEventListener & removeEventListener
		defineProperty(Node.prototype, 'addEventListener', addEventListener);
		for (const func of ['createElement', 'createElementNS', 'querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName', 'getElementsByName', 'getElementsByTagName', 'getElementsByTagNameNS']) {
			hookAPIFunc(func);
		}

		// Protect root & root-like elements
		for (const elm of [document.querySelector('#g-body'), document.documentElement, document, window]) {
			const addEventListener = UNPOLLUTED['contentWindow.EventTarget.prototype.addEventListener'];
			typeof elm === 'object' && elm !== null && hookElm(elm);
		}

		function hookAPIFunc(funcName) {
			for (const api of ['Document', 'Element']) {
				const API = window[api];
				const proto = API.prototype;
				proto.hasOwnProperty(funcName) && defineProperty(proto, funcName, function() {
					let value = UNPOLLUTED['contentWindow.'+api+'.prototype.'+funcName].apply(this, Array.from(arguments));

					if (value instanceof NodeList) {
						value = Array.prototype.map.call(value, (elm) => (hookElm(elm)));
						value.item = (i) => (i < value.length ? value[i] : null);
					} else if (value instanceof EventTarget) {
						value = hookElm(value);
					}
					return value;
				});
			}
		}

		function hookElm(elm) {
			if (elm._protected && toString(elm.addEventListener) === toString(addEventListener)) {
				return elm;
			}

			defineProperty(elm, 'addEventListener', addEventListener);
			defineProperty(elm, 'removeEventListener', UNPOLLUTED['contentWindow.EventTarget.prototype.removeEventListener']);
			defineProperty(elm, '_protected', true);
			return elm;
		}

		function defineProperty(obj, prop, value) {
			Object.defineProperty(obj, prop, {
				value: value,
				writable: false,
				configurable: false,
				enumerable: true
			});
		}

		function addEventListener(type, listener) {
			const banlist = ['function(a5){if(', 'function(a6){a6'];
			for (const bancode of banlist) {
				if (type === 'click' && listener.toString().startsWith(bancode)) {
					return;
				}
			}
			return UNPOLLUTED['contentWindow.EventTarget.prototype.addEventListener'].apply(this, Array.from(arguments));
		}

		function toString(o) {
			return UNPOLLUTED['contentWindow.Object.prototype.toString'].call(o);
		}
	} catch (err) {
		throw err;
		debugger;
	}
}).apply(null, typeof unsafeWindow === 'object' ? [unsafeWindow, unsafeWindow.document] : [window, document]);