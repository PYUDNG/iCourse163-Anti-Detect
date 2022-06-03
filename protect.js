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
		for (const func of ['createElement', 'createElementNS', 'querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName', 'getElementsByName', 'getElementsByTagName', 'getElementsByTagNameNS']) {
			hookDocFunc(func);
		}

		// Protect root & root-like elements
		for (const elm of [document.querySelector('#g-body'), document.documentElement, document, window]) {
			const addEventListener = UNPOLLUTED['contentWindow.EventTarget.prototype.addEventListener'];
			typeof elm === 'object' && elm !== null && hookElm(elm);
		}

		function hookDocFunc(funcName) {
			defineProperty(document, funcName, function() {
				let value = UNPOLLUTED['contentDocument.'+funcName].apply(document, Array.from(arguments));

				if (value instanceof NodeList) {
					value = Array.prototype.map.call(value, (elm) => (hookElm(elm)));
					value.item = (i) => (i < value.length ? value[i] : null);
				} else if (value instanceof EventTarget) {
					value = hookElm(value);
				}
				return value;
			});
		}

		function hookElm(elm) {
			if (elm._protected && toString(elm.addEventListener) === toString(addEventListener)) {
				return elm;
			}

			const ETPtt = UNPOLLUTED['contentWindow.EventTarget.prototype'];
			defineProperty(elm, 'addEventListener', addEventListener);
			defineProperty(elm, 'removeEventListener', ETPtt.removeEventListener);
			defineProperty(elm, '_protected', true);
			return elm;

			function addEventListener(type, listener) {
				const banlist = ['function(a5){if(', 'function(a6){a6'];
				for (const bancode of banlist) {
					if (type === 'click' && listener.toString().startsWith(bancode)) {
						return;
					}
				}
				return ETPtt.addEventListener.apply(elm, Array.from(arguments));
			}

			function toString(o) {
				return UNPOLLUTED['contentWindow.Object.prototype.toString'].call(o);
			}
		}

		function defineProperty(obj, prop, value) {
			Object.defineProperty(obj, prop, {
				value: value,
				writable: false,
				configurable: false,
				enumerable: true
			});
		}
	} catch (err) {
		throw err;
		debugger;
	}
}).apply(null, typeof unsafeWindow === 'object' ? [unsafeWindow, unsafeWindow.document] : [window, document]);