
function getRandomNumber(range) { 'use strict'; return Math.floor(Math.random() * range); }
function getRandomChar() { 'use strict'; var chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ"; return chars.substr(getRandomNumber(62), 1); }
function randomID(size) {'use strict'; var str = "", i = 0; for (i = 0; i < size; i += 1) { str += getRandomChar(); } return str; }
function getID(c) { 'use strict';  return randomID(c || 70); };

var substringMatcher=function(b){return function(e,f){var a,c;a=[];c=new RegExp(e,"i");$.each(b,function(b,d){c.test(d)&&a.push({value:d})});f(a)}};
(function(){var b={};this.tmpl=function e(a,c){var d=/\W/.test(a)?new Function("obj","var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('"+a.replace(/[\r\t\n]/g," ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g,"$1\r").replace(/\t=(.*?)%>/g,"',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'")+"');}return p.join('');"):b[a]=b[a]||e(document.getElementById(a).innerHTML);return c?d(c):d}})();
(function(a){var e=a.fn.attr;a.fn.attr=function(){var b,a,c,d;if(this[0]&&0===arguments.length){d={};c=this[0].attributes;a=c.length;for(b=0;b<a;b++)d[c[b].name.toLowerCase()]=c[b].value;return d}return e.apply(this,arguments)}})(jQuery);
(function(e){e.fn.shuffle=function(a){for(var b=a.length,d,c;0<b;)c=Math.floor(Math.random()*b),b--,d=a[b],a[b]=a[c],a[c]=d;return a}})(jQuery,window);
function strip_tags(a,b){b=(((b||"")+"").toLowerCase().match(/<[a-z][a-z0-9]*>/g)||[]).join("");return a.replace(/\x3c!--[\s\S]*?--\x3e|<\?(?:php)?[\s\S]*?\?>/gi,"").replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,function(a,c){return-1<b.indexOf("<"+c.toLowerCase()+">")?a:""})};
var showModal=function(a){a=$(a);var b=$(".modal.in");0<b.length?b.one("hidden",function(){a.modal("show");a.one("hidden",function(){b.modal("show");});}).modal("hide"):a.modal("show");};
$.urlDeParam=function(n,a){var c,b,d,e={};a=(a||window.location.href);a=a.slice(a.indexOf('?')+1);if(""!==a)for(a=a.split("&"),c=0;c<a.length;c+=1)b=a[c].split("="),d=decodeURIComponent(b[0]),b=1<b.length?decodeURIComponent(b[1]):void 0,e[d]=b;return (n!=undefined&&e[n])?e[n]:e};

MC = {};

MC.EventManager = (function() {
	var defaults = {
		'debug' : false,
		listeners : []
	};

	function notify(event, data) {
		data = data ? [ data ] : [];
		if (defaults.debug) console.log("app-notify: " + event, data);
		var n = 0;
		
		if (event && event in defaults.listeners) {
			for ( var id in defaults.listeners[event]) {
				var l = defaults.listeners[event][id];
				try {
					if (defaults.debug) console.log(l);

					setTimeout((function(l, data) {
						l.func.apply(l.context, data);
					})(l, data), 100);

					n++;
				} catch (e) {
					if ("console" in window && "error" in console) {
					}
				}

			}
		}

		return n;
	}

	function addListener(event, func, context, id) {

		context = context || window;
		id = id || "listener_" + getID(16);
		if (defaults.debug) console.log("app-event-id: " + id);

		if (event && context && func) {
			if (!defaults.listeners[event]) {
				defaults.listeners[event] = {};
			}
			defaults.listeners[event][id] = {
				context : context,
				func : func
			};
			if (defaults.debug) {
				console.log("app-add: " + event, context, func, id);
				console.info(defaults.listeners);
			}

			return id;
		}
		return false;
	}

	function remListener(event, id) {
		if (event in defaults.listeners) {
			delete defaults.listeners[event][id];
			return true;
		}
		return false;
	}

	function jsonresponse(r) {
		if(defaults.debug) console.log("app-notify: jsonresponse:", r);

		for ( var a in r) {
			var b = r[a];
			if (b.type == undefined) continue;
			switch (b.type) {
				case 'replace':
					$(a).replaceWith(b.content);
					break;
				case 'update':
					$(a).empty().append(b.content);
					break;
				case 'append':
					$(a).append(b.content);
					break;
				case 'prepend':
					$(a).prepend(b.content);
					break;
			}
		}
	}

	function jsonload(options) {
		options.selector = options.selector != undefined ? options.selector : '[data-toggle="jsonload"],.jsonload';
		
		$(options.selector).each(function() {
			if(defaults.debug) console.log("app-notify: jsonload - this:", this);
			if(defaults.debug) console.log("app-notify: jsonload - options:", options);
			if(this.jload != undefined) return;
			this.jload=options;
			$(this).attr('data-jsonload-selector', options.selector);

			$(this).on("click", function(e) {
				e.preventDefault();
				that=this;

				var href=that.href?that.href:($(that).data('href')?$(that).data('href'):false);
				if($(that).data('target') != undefined) $($(that).data('target')).empty().append($spinner);

				$.get(href, $(that).data(), function(data) {
					if(defaults.debug) console.log("app-notify: jsonload-get-request:", data);
					if(that.jload.callbackBefore != undefined) that.jload.callbackBefore(that, data);
					if($(that).data('target') != undefined && typeof data == 'String') {
						$($(that).data('target')).empty().append(data);
					}
					else {
						$.fn.eventManager.notify("mc.jsonresponse", data);
					}
					if(that.jload.callbackAfter != undefined) that.jload.callbackAfter(that, data);
				}, 'json');

				return false;
			});
		});
	}

	function selection(o) {
		var selector = o.selector != undefined ? o.selector : document;
		$(selector).disableSelection(o.attribute);
	}

	return {
		'notify' : notify,
		'addListener' : addListener,
		'remListener' : remListener,
		'jsonload' : jsonload,
		'selection' : selection,
		'jsonresponse' : jsonresponse
	};
})(window);

(function($, MC){
	
	$.fn.eventManager = MC.EventManager;
	$.fn.eventManager.listener = function() {

		MC.EventManager.addListener('mc.jsonresponse', MC.EventManager.jsonresponse);
		MC.EventManager.addListener('mc.jsonload', MC.EventManager.jsonload);
		MC.EventManager.addListener('mc.selection', MC.EventManager.selection);

		MC.EventManager.addListener('mc.autocomplete', function(o) {
			
			var selector = o.selector != undefined ? o.selector : 'body input.typeahead';
			
			$(selector).each(function(){
				var that = this;
				this.id = this.id ? this.id : getID(9);

				$.fn.typeahead.opt = {
					'id': that.id,
					'target': $(that).closest('[data-toggle="autocomplete"]').data('target')
				};

				var engine = new Bloodhound({
						name: 'users',
						remote: {
							wildcard: '%QUERY',
							url: $.fn.typeahead.opt.target + '?q=%QUERY',
							filter: function(engine) {
								return $.map(engine, function (user) {
									return {
										value: user.token,
										nickname: user.nickname + ', ' + user.fullname,
										token: user.token,
										data: user
									};
								});
							},
						},
						datumTokenizer: function(d) {
							return Bloodhound.tokenizers.whitespace(d.val);
						},
						queryTokenizer: Bloodhound.tokenizers.whitespace,
				});
				engine.initialize();

				$(this).typeahead(
					{
						minLength: 1,
						highlight: true
					},
					{
						name: 'users',
						displayKey: 'nickname',
						source: engine.ttAdapter(),
						updater:function (item) {
							alert(item)
							return item;
						},
						templates: {
						    empty: ['<div class="empty-message">','keine Ergebnisse gefunden','</div>'].join('\n'),
						    suggestion: function(data) { return '<p><strong>'+data.nickname + '</strong> – '+data.token+'</p>'; }
						}
					}
				);
				$(this).on('typeahead:selected', function(a,b,c){
					var href=a.target.dataset.postdispatch + '/employee/' + b.data.token + '/client/' + a.target.dataset.client;
					$.get(href, {}, function(data){
						$.fn.eventManager.notify('mc.jsonresponse', data);
					},'json');
					
				});
			});
			
		});
		
		MC.EventManager.addListener('mc.searchfield', function(obj){
			switch(obj.type) {
				case 'image':
					$(obj.target).wrap($('<form />', {
						'style':'width:318px;',
						'class':'jqform',
						'method': 'post',
						'action': '/page/ajax/'+obj.type+'/id'
					}));
					break;
				case 'document':
					$(obj.target).wrap($('<form />', {
						'class':'jqform',
						'method': 'post',
						'action': '/page/ajax/'+obj.type+'/id'
					}));
					break;
			}
		});

		MC.EventManager.addListener('mc.scroll', function(o) {

            o = o || {};
			if(o.selector==undefined) o.selector = 'body';
			
			$pselements = false;
			$pselements = $(o.selector).perfectScrollbar({
				wheelSpeed: 5,
				suppressScrollX: true,
				wheelPropagation: false,
				swipePropagation: false,
				includePadding: true
			});
			$(o.selector).on('change', function(e){
				$(this).perfectScrollbar('update');
			});
			$(o.selector).on('load', function(e){
				$(this).perfectScrollbar('update');
			});
			$pselements.data('perfect-scrollbar-update')();
			
		});
		
		MC.EventManager.addListener('mc.jqform', function(o){
			o = o || {};
			if(o.selector == undefined) return;

			$(o.selector).each(function(){
				
				$(this).unbind();
//				if($(this).hasClass('jqFormAttach')) return;
//				$(this).addClass('jqFormAttach');

				$(this).on('submit', function() {

					if($(this).find('.formError').length>0) return false;

					$(this).ajaxSubmit({
						dataType:  'json',
						'success': function(data) {
							if(o.callback != undefined) {
								o.callback(data);
							}
							else
								MC.EventManager.notify('mc.jsonresponse', data);
						}
					});
					return false;
				});
			});
			
		});
		
		MC.EventManager.addListener('mc.postDispatch', function(o) {

			if(o.out == undefined || o.out.scrollbar == undefined || o.out.scrollbar == false) {
				MC.EventManager.notify('mc.scroll', {});
			}

			if(o.out == undefined || o.out.wysihtml5 == undefined || o.out.wysihtml5 == false) {
				$("iframe.wysihtml5-sandbox, input[name='_wysihtml5_mode']").remove();
				$("body").removeClass("wysihtml5-supported");
				$('.wysihtml5, .whtml').wysihtml5({
					'font-styles': false,
					'html': true
				});
			}

			if(o.out != undefined && o.out.tooltip != undefined && o.out.tooltip != false) {
				$(o.out.tooltip.selector).tooltip(o.out.tooltip.options);
			}
			if(o.out == undefined || o.out.popover == undefined || o.out.popover == false) {
				$('[data-toggle="popover"]').popover({html:true});
			}
			if(o.out == undefined || o.out.jsonload == undefined || o.out.jsonload == false) {
				MC.EventManager.notify('mc.jsonload');
			}
			
			$('a:not(:has(img))').each(function() {
				if(this.hostname && this.hostname !== location.hostname) {
					$(this).attr({'target':'_blank'});
					$(this).addClass('external-link');
				}
			});
			$('span.mail').each(function(){
				if($(this).parent()[0].nodeName == 'A' || $(this).html().indexOf('[at]') <= 0) return;
				$(this).replaceWith('<a href="mailto:'+this.innerHTML.replace(/\[at\]/,'@')+'"><span class="'+ $(this).attr('class') +'">'+this.innerHTML.replace(/\[at\]/,'@')+'</span></a>');
			});
			
			window.setTimeout(function(){
				new Blazy({
					'selector': 'img.lazy',
					'src': 'data-original'
				});
			}, 200);

		});
	}

})(jQuery, MC);
$.fn.eventManager.listener()
