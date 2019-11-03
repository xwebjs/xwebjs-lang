importScripts("/libs/dexie.js","/libs/q.js","/config/conf.js");var Conf,systemDB,CACHE_NAME="xwebjs_cache",cachedCoreFiles=["/","/index.html","/boot.js","/libs/q.js","/libs/xwebjs.js","/config/conf.js"],enableCoreFileCache=!1;function enableDB(){var e=Q.defer();try{return(systemDB=new Dexie("xwebjs_system")).version(1).stores({moduleCodes:"moduleId,[contextId+modulePath]"}),systemDB.open(),e.promise}catch(e){console.error("Failed to setup the system index DB because:"+e.oetMessage())}}function generateModuleFileCode(e){var o,n,t=/https?:\/\/[\w|.|\d|:]+\/xwebjs_module\/(.+)\/(.+)/.exec(e.url),s="xwebjs."+(o=t[1])+"."+(n=t[2]).replace("/",".");return getContextModuleCodes(o,n).then(function(e){var o,n="_x.exportModule(";if((e=e[0].content).substr(0,n.length)===n)return o=n+"'"+s+"',"+e.slice(n.length),new Response(o);throw Error("Invalid module content")},function(){return console.warn("Logically, this case should not happen as module resource should have been cached in the indexDB for the first time loading"),e.url=n.replace(".","/"),fetch(e).then(function(e){return console.log("Response from network is:",e),e}).catch(function(e){throw console.error("Fetching failed:",e),e})})}function getContextModuleCodes(t,s){return Q.promise(function(e,o,n){systemDB.on("ready",function(){e(systemDB.moduleCodes.where("[contextId+modulePath]").equals([t,s]).toArray())})})}Conf.cache&&"boolean"==typeof Conf.cache.core&&(enableCoreFileCache=Conf.cache.core),enableCoreFileCache||(cachedCoreFiles=[]),enableDB(),self.addEventListener("install",function(e){console.log("Service worker is installed"),console.log("Caching files"),self.skipWaiting(),e.waitUntil(caches.open(CACHE_NAME).then(function(e){console.log("Opened cache, and caching files"),e.addAll(cachedCoreFiles)}))}),self.addEventListener("activate",function(e){console.log("Service worker is activated"),self.clients.claim()}),self.addEventListener("fetch",function(o){"only-if-cached"===o.request.cache&&"same-origin"!==o.request.mode||o.respondWith(caches.match(o.request).then(function(e){return e||(-1!==o.request.url.indexOf("/xwebjs_module")?(console.log("Fetching module content from index DB:"+o.request.url),generateModuleFileCode(o.request)):fetch(o.request).then(function(e){return console.log("Response from network is:",e),e}).catch(function(e){throw console.error("Fetching failed:",e),e}))}))});