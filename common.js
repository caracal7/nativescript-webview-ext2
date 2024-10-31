var WebViewExtBase_1;
import '@nativescript/core';
import { booleanConverter, ContainerView, CSSType, File, knownFolders, path, Property, Trace } from '@nativescript/core';
import { isEnabledProperty } from '@nativescript/core/ui/core/view';
import { fetchPolyfill, metadataViewPort, promisePolyfill, webViewBridge } from './bridge-loader';
export const autoInjectJSBridgeProperty = new Property({
    name: 'autoInjectJSBridge',
    defaultValue: true,
    valueConverter: booleanConverter,
});
export const builtInZoomControlsProperty = new Property({
    name: 'builtInZoomControls',
    defaultValue: true,
    valueConverter: booleanConverter,
});
export const cacheModeProperty = new Property({
    name: 'cacheMode',
    defaultValue: 'default',
});
export const databaseStorageProperty = new Property({
    name: 'databaseStorage',
    defaultValue: false,
    valueConverter: booleanConverter,
});
export const domStorageProperty = new Property({
    name: 'domStorage',
    defaultValue: false,
    valueConverter: booleanConverter,
});
export const debugModeProperty = new Property({
    name: 'debugMode',
    defaultValue: false,
    valueConverter: booleanConverter,
});
export const displayZoomControlsProperty = new Property({
    name: 'displayZoomControls',
    defaultValue: true,
    valueConverter: booleanConverter,
});
export const supportZoomProperty = new Property({
    name: 'supportZoom',
    defaultValue: false,
    valueConverter: booleanConverter,
});
export const srcProperty = new Property({
    name: 'src',
});
export const scrollBounceProperty = new Property({
    name: 'scrollBounce',
    valueConverter: booleanConverter,
});
export const limitsNavigationsToAppBoundDomainsProperty = new Property({
    name: 'limitsNavigationsToAppBoundDomains',
    valueConverter: booleanConverter,
});
export const viewPortProperty = new Property({
    name: 'viewPortSize',
    defaultValue: false,
    valueConverter(value) {
        const defaultViewPort = {
            initialScale: 1.0,
        };
        const valueLowerCaseStr = `${value || ''}`.toLowerCase();
        if (valueLowerCaseStr === 'false') {
            return false;
        }
        else if (valueLowerCaseStr === 'true' || valueLowerCaseStr === '') {
            return defaultViewPort;
        }
        let viewPortInputValues = { ...defaultViewPort };
        if (typeof value === 'object') {
            viewPortInputValues = { ...value };
        }
        else if (typeof value === 'string') {
            try {
                viewPortInputValues = JSON.parse(value);
            }
            catch (err) {
                for (const part of value.split(',').map((v) => v.trim())) {
                    if (!part) {
                        continue;
                    }
                    const [key, v] = part.split('=').map((v) => v.trim());
                    if (!key || !v) {
                        continue;
                    }
                    const lcValue = `${v}`.toLowerCase();
                    switch (key) {
                        case 'user-scalable':
                        case 'userScalable': {
                            switch (lcValue) {
                                case 'yes':
                                case 'true': {
                                    viewPortInputValues.userScalable = true;
                                    break;
                                }
                                case 'no':
                                case 'false': {
                                    viewPortInputValues.userScalable = false;
                                    break;
                                }
                            }
                            break;
                        }
                        case 'width': {
                            if (lcValue === 'device-width') {
                                viewPortInputValues.width = 'device-width';
                            }
                            else {
                                viewPortInputValues.width = Number(v);
                            }
                            break;
                        }
                        case 'height': {
                            if (lcValue === 'device-height') {
                                viewPortInputValues.height = 'device-height';
                            }
                            else {
                                viewPortInputValues.height = Number(v);
                            }
                            break;
                        }
                        case 'minimumScale':
                        case 'minimum-scale': {
                            viewPortInputValues.minimumScale = Number(v);
                            break;
                        }
                        case 'maximumScale':
                        case 'maximum-scale': {
                            viewPortInputValues.maximumScale = Number(v);
                            break;
                        }
                        case 'initialScale':
                        case 'initial-scale': {
                            viewPortInputValues.initialScale = Number(v);
                            break;
                        }
                    }
                }
            }
        }
        const { initialScale = defaultViewPort.initialScale, width, height, userScalable, minimumScale, maximumScale } = viewPortInputValues;
        return {
            initialScale,
            width,
            height,
            userScalable,
            minimumScale,
            maximumScale,
        };
    },
});
export var EventNames;
(function (EventNames) {
    EventNames["LoadFinished"] = "loadFinished";
    EventNames["LoadProgress"] = "loadProgress";
    EventNames["LoadStarted"] = "loadStarted";
    EventNames["ShouldOverrideUrlLoading"] = "shouldOverrideUrlLoading";
    EventNames["TitleChanged"] = "titleChanged";
    EventNames["WebAlert"] = "webAlert";
    EventNames["WebConfirm"] = "webConfirm";
    EventNames["WebConsole"] = "webConsole";
    EventNames["EnterFullscreen"] = "enterFullscreen";
    EventNames["ExitFullscreen"] = "exitFullscreen";
    EventNames["WebPrompt"] = "webPrompt";
})(EventNames || (EventNames = {}));
export class UnsupportedSDKError extends Error {
    constructor(minSdk) {
        super(`Android API < ${minSdk} not supported`);
        Object.setPrototypeOf(this, UnsupportedSDKError.prototype);
    }
}
let WebViewExtBase = WebViewExtBase_1 = class WebViewExtBase extends ContainerView {
    constructor() {
        super(...arguments);
        /**
         * Auto Inject WebView JavaScript Bridge on load finished? Defaults to true.
         */
        this.autoInjectJSBridge = true;
        /**
         * List of js-files to be auto injected on load finished
         */
        this.autoInjectScriptFiles = [];
        /**
         * List of css-files to be auto injected on load finished
         */
        this.autoInjectStyleSheetFiles = [];
        /**
         * List of code blocks to be executed after JS-files and CSS-files have been loaded.
         */
        this.autoInjectJavaScriptBlocks = [];
        /**
         * Prevent this.src loading changes from the webview's onLoadFinished-event
         */
        this.tempSuspendSrcLoading = false;
    }
    get interceptScheme() {
        return 'x-local';
    }
    /**
     * String value used when hooking to loadStarted event.
     */
    static get loadStartedEvent() {
        return EventNames.LoadStarted;
    }
    /**
     * String value used when hooking to loadFinished event.
     */
    static get loadFinishedEvent() {
        return EventNames.LoadFinished;
    }
    /** String value used when hooking to shouldOverrideUrlLoading event */
    static get shouldOverrideUrlLoadingEvent() {
        return EventNames.ShouldOverrideUrlLoading;
    }
    static get loadProgressEvent() {
        return EventNames.LoadProgress;
    }
    static get titleChangedEvent() {
        return EventNames.TitleChanged;
    }
    static get webAlertEvent() {
        return EventNames.WebAlert;
    }
    static get webConfirmEvent() {
        return EventNames.WebConfirm;
    }
    static get webPromptEvent() {
        return EventNames.WebPrompt;
    }
    static get webConsoleEvent() {
        return EventNames.WebConsole;
    }
    static get enterFullscreenEvent() {
        return EventNames.EnterFullscreen;
    }
    static get exitFullscreenEvent() {
        return EventNames.ExitFullscreen;
    }
    /**
     * Callback for the loadFinished-event. Called from the native-webview
     */
    async _onLoadFinished(url, error) {
        url = this.normalizeURL(url);
        if (!error) {
            // When this is called without an error, update with this.src value without loading the url.
            // This is needed to keep src up-to-date when linked are clicked inside the webview.
            try {
                this.tempSuspendSrcLoading = true;
                this.src = url;
                this.tempSuspendSrcLoading = false;
            }
            finally {
                this.tempSuspendSrcLoading = false;
            }
        }
        let args = {
            error,
            eventName: WebViewExtBase_1.loadFinishedEvent,
            navigationType: undefined,
            object: this,
            url,
        };
        if (error) {
            this.notify(args);
            throw args;
        }
        this.writeTrace(`WebViewExt._onLoadFinished("${url}", ${error || void 0}) - > Injecting webview-bridge JS code`);
        if (!this.autoInjectJSBridge) {
            return args;
        }
        try {
            await this.injectWebViewBridge();
            await this.loadJavaScriptFiles(this.autoInjectScriptFiles);
            await this.loadStyleSheetFiles(this.autoInjectStyleSheetFiles);
            await this.executePromises(this.autoInjectJavaScriptBlocks.map((data) => data.scriptCode), -1);
        }
        catch (error) {
            args.error = error;
        }
        this.notify(args);
        this.getTitle()
            .then((title) => title && this._titleChanged(title))
            .catch(() => void 0);
        return args;
    }
    /**
     * Callback for onLoadStarted-event from the native webview
     *
     * @param url URL being loaded
     * @param navigationType Type of navigation (iOS-only)
     */
    _onLoadStarted(url, navigationType) {
        const args = {
            eventName: WebViewExtBase_1.loadStartedEvent,
            navigationType,
            object: this,
            url,
        };
        this.notify(args);
    }
    /**
     * Callback for should override url loading.
     * Called from the native-webview
     *
     * @param url
     * @param httpMethod GET, POST etc
     * @param navigationType Type of navigation (iOS-only)
     */
    _onShouldOverrideUrlLoading(url, httpMethod, navigationType) {
        const args = {
            eventName: WebViewExtBase_1.shouldOverrideUrlLoadingEvent,
            httpMethod,
            navigationType,
            object: this,
            url,
        };
        this.notify(args);
        const eventNameWithSpellingError = 'shouldOverideUrlLoading';
        if (this.hasListeners(eventNameWithSpellingError)) {
            console.error(`eventName '${eventNameWithSpellingError}' is deprecated due to spelling error:\nPlease use: ${WebViewExtBase_1.shouldOverrideUrlLoadingEvent}`);
            const argsWithSpellingError = {
                ...args,
                eventName: eventNameWithSpellingError,
            };
            this.notify(argsWithSpellingError);
            if (argsWithSpellingError.cancel) {
                return argsWithSpellingError.cancel;
            }
        }
        return args.cancel;
    }
    _loadProgress(progress) {
        const args = {
            eventName: WebViewExtBase_1.loadProgressEvent,
            object: this,
            progress,
            url: this.src,
        };
        this.notify(args);
    }
    _titleChanged(title) {
        const args = {
            eventName: WebViewExtBase_1.titleChangedEvent,
            object: this,
            title,
            url: this.src,
        };
        this.notify(args);
    }
    _webAlert(message, callback) {
        if (!this.hasListeners(WebViewExtBase_1.webAlertEvent)) {
            return false;
        }
        const args = {
            eventName: WebViewExtBase_1.webAlertEvent,
            object: this,
            message,
            url: this.src,
            callback,
        };
        this.notify(args);
        return true;
    }
    _webConfirm(message, callback) {
        if (!this.hasListeners(WebViewExtBase_1.webConfirmEvent)) {
            return false;
        }
        const args = {
            eventName: WebViewExtBase_1.webConfirmEvent,
            object: this,
            message,
            url: this.src,
            callback,
        };
        this.notify(args);
        return true;
    }
    _webPrompt(message, defaultText, callback) {
        if (!this.hasListeners(WebViewExtBase_1.webPromptEvent)) {
            return false;
        }
        const args = {
            eventName: WebViewExtBase_1.webPromptEvent,
            object: this,
            message,
            defaultText,
            url: this.src,
            callback,
        };
        this.notify(args);
        return true;
    }
    _webConsole(message, lineNo, level) {
        if (!this.hasListeners(WebViewExtBase_1.webConsoleEvent)) {
            return false;
        }
        const args = {
            eventName: WebViewExtBase_1.webConsoleEvent,
            object: this,
            data: {
                message,
                lineNo,
                level,
            },
            url: this.src,
        };
        this.notify(args);
        return true;
    }
    _onEnterFullscreen(exitFullscreen) {
        if (!this.hasListeners(WebViewExtBase_1.enterFullscreenEvent)) {
            return false;
        }
        const args = {
            eventName: WebViewExtBase_1.enterFullscreenEvent,
            object: this,
            exitFullscreen,
            url: this.src,
        };
        this.notify(args);
        return true;
    }
    _onExitFullscreen() {
        const args = {
            eventName: WebViewExtBase_1.exitFullscreenEvent,
            object: this,
            url: this.src,
        };
        this.notify(args);
        return true;
    }
    /**
     * Platform specific loadURL-implementation.
     */
    _loadUrl(src) {
        throw new Error('Method not implemented.');
    }
    /**
     * Platform specific loadData-implementation.
     */
    _loadData(src) {
        throw new Error('Method not implemented.');
    }
    /**
     * Stops loading the current content (if any).
     */
    stopLoading() {
        throw new Error('Method not implemented.');
    }
    /**
     * Gets a value indicating whether the WebView can navigate back.
     */
    get canGoBack() {
        throw new Error('This member is abstract.');
    }
    /**
     * Gets a value indicating whether the WebView can navigate forward.
     */
    get canGoForward() {
        throw new Error('This member is abstract.');
    }
    /**
     * Navigates back.
     */
    goBack() {
        throw new Error('Method not implemented.');
    }
    /**
     * Navigates forward.
     */
    goForward() {
        throw new Error('Method not implemented.');
    }
    /**
     * Reloads the current url.
     */
    reload() {
        throw new Error('Method not implemented.');
    }
    [srcProperty.getDefault]() {
        return '';
    }
    [srcProperty.setNative](src) {
        if (!src || this.tempSuspendSrcLoading) {
            return;
        }
        const originSrc = src;
        this.stopLoading();
        // Add file:/// prefix for local files.
        // They should be loaded with _loadUrl() method as it handles query params.
        if (src.startsWith('~/')) {
            src = `file://${knownFolders.currentApp().path}/${src.substr(2)}`;
            this.writeTrace(`WebViewExt.src = "${originSrc}" startsWith ~/ resolved to "${src}"`);
        }
        else if (src.startsWith('/')) {
            src = `file://${src}`;
            this.writeTrace(`WebViewExt.src = "${originSrc}" startsWith "/" resolved to ${src}`);
        }
        const lcSrc = src.toLowerCase();
        // loading local files from paths with spaces may fail
        if (lcSrc.startsWith('file:///')) {
            src = encodeURI(src);
            if (lcSrc !== src) {
                this.writeTrace(`WebViewExt.src = "${originSrc}" escaped to "${src}"`);
            }
        }
        if (lcSrc.startsWith(this.interceptScheme) || lcSrc.startsWith('http://') || lcSrc.startsWith('https://') || lcSrc.startsWith('file:///')) {
            src = this.normalizeURL(src);
            if (originSrc !== src) {
                // Make sure the src-property reflects the actual value.
                try {
                    this.tempSuspendSrcLoading = true;
                    this.src = src;
                }
                catch {
                    // ignore
                }
                finally {
                    this.tempSuspendSrcLoading = false;
                }
            }
            this._loadUrl(src);
            this.writeTrace(`WebViewExt.src = "${originSrc}" - LoadUrl("${src}")`);
        }
        else {
            this._loadData(src);
            this.writeTrace(`WebViewExt.src = "${originSrc}" - LoadData("${src}")`);
        }
    }
    [viewPortProperty.setNative](value) {
        if (this.src) {
            this.injectViewPortMeta();
        }
    }
    resolveLocalResourceFilePath(filepath) {
        if (!filepath) {
            this.writeTrace('WebViewExt.resolveLocalResourceFilePath() no filepath', Trace.messageType.error);
            return;
        }
        if (filepath.startsWith('~')) {
            filepath = path.normalize(knownFolders.currentApp().path + filepath.substr(1));
        }
        if (filepath.startsWith('file://')) {
            filepath = filepath.replace(/^file:\/\//, '');
        }
        if (!File.exists(filepath)) {
            this.writeTrace(`WebViewExt.resolveLocalResourceFilePath("${filepath}") - no such file`, Trace.messageType.error);
            return;
        }
        return filepath;
    }
    /**
     * Register a local resource.
     * This resource can be loaded via "x-local://{name}" inside the webview
     */
    registerLocalResource(name, filepath) {
        throw new Error('Method not implemented.');
    }
    /**
     * Unregister a local resource.
     */
    unregisterLocalResource(name) {
        throw new Error('Method not implemented.');
    }
    /**
     * Resolve a "x-local://{name}" to file-path.
     */
    getRegisteredLocalResource(name) {
        throw new Error('Method not implemented.');
    }
    /**
     * Load URL - Wait for promise
     *
     * @param {string} src
     * @returns {Promise<LoadFinishedEventData>}
     */
    loadUrl(src) {
        if (!src) {
            return this._onLoadFinished(src, 'empty src');
        }
        return new Promise((resolve, reject) => {
            const loadFinishedEvent = (args) => {
                this.off(WebViewExtBase_1.loadFinishedEvent, loadFinishedEvent);
                if (args.error) {
                    reject(args);
                }
                else {
                    resolve(args);
                }
            };
            this.on(WebViewExtBase_1.loadFinishedEvent, loadFinishedEvent);
            this.src = src;
        });
    }
    /**
     * Load a JavaScript file on the current page in the webview.
     */
    loadJavaScriptFile(scriptName, filepath) {
        return this.loadJavaScriptFiles([
            {
                resourceName: scriptName,
                filepath,
            },
        ]);
    }
    /**
     * Load multiple JavaScript-files on the current page in the webview.
     */
    async loadJavaScriptFiles(files) {
        if (!files || !files.length) {
            return;
        }
        const promiseScriptCodes = [];
        for (const { resourceName, filepath } of files) {
            const scriptCode = this.generateLoadJavaScriptFileScriptCode(resourceName, filepath);
            promiseScriptCodes.push(scriptCode);
            this.writeTrace(`WebViewExt.loadJavaScriptFiles() - > Loading javascript file: "${filepath}"`);
        }
        if (promiseScriptCodes.length !== files.length) {
            this.writeTrace(`WebViewExt.loadJavaScriptFiles() - > Num of generated scriptCodes ${promiseScriptCodes.length} differ from num files ${files.length}`, Trace.messageType.error);
        }
        if (!promiseScriptCodes.length) {
            this.writeTrace('WebViewExt.loadJavaScriptFiles() - > No files');
            return;
        }
        if (!promiseScriptCodes.length) {
            return;
        }
        await this.executePromises(await Promise.all(promiseScriptCodes));
    }
    /**
     * Load a stylesheet file on the current page in the webview.
     */
    loadStyleSheetFile(stylesheetName, filepath, insertBefore = true) {
        return this.loadStyleSheetFiles([
            {
                resourceName: stylesheetName,
                filepath,
                insertBefore,
            },
        ]);
    }
    /**
     * Load multiple stylesheet-files on the current page in the webview
     */
    async loadStyleSheetFiles(files) {
        if (!files || !files.length) {
            return;
        }
        const promiseScriptCodes = [];
        for (const { resourceName, filepath, insertBefore } of files) {
            const scriptCode = this.generateLoadCSSFileScriptCode(resourceName, filepath, insertBefore);
            promiseScriptCodes.push(scriptCode);
        }
        if (promiseScriptCodes.length !== files.length) {
            this.writeTrace(`WebViewExt.loadStyleSheetFiles() - > Num of generated scriptCodes ${promiseScriptCodes.length} differ from num files ${files.length}`, Trace.messageType.error);
        }
        if (!promiseScriptCodes.length) {
            this.writeTrace('WebViewExt.loadStyleSheetFiles() - > No files');
            return;
        }
        await this.executePromises(await Promise.all(promiseScriptCodes));
    }
    /**
     * Auto-load a JavaScript-file after the page have been loaded.
     */
    autoLoadJavaScriptFile(resourceName, filepath) {
        if (this.src) {
            this.loadJavaScriptFile(resourceName, filepath).catch(() => void 0);
        }
        this.autoInjectScriptFiles.push({ resourceName, filepath });
    }
    removeAutoLoadJavaScriptFile(resourceName) {
        this.autoInjectScriptFiles = this.autoInjectScriptFiles.filter((data) => data.resourceName !== resourceName);
    }
    /**
     * Auto-load a stylesheet-file after the page have been loaded.
     */
    autoLoadStyleSheetFile(resourceName, filepath, insertBefore) {
        if (this.src) {
            this.loadStyleSheetFile(resourceName, filepath, insertBefore).catch(() => void 0);
        }
        this.autoInjectStyleSheetFiles.push({
            resourceName,
            filepath,
            insertBefore,
        });
    }
    removeAutoLoadStyleSheetFile(resourceName) {
        this.autoInjectStyleSheetFiles = this.autoInjectStyleSheetFiles.filter((data) => data.resourceName !== resourceName);
    }
    autoExecuteJavaScript(scriptCode, name) {
        if (this.src) {
            this.executePromise(scriptCode).catch(() => void 0);
        }
        this.removeAutoExecuteJavaScript(name);
        const fixedCodeBlock = scriptCode.trim();
        this.autoInjectJavaScriptBlocks.push({
            scriptCode: fixedCodeBlock,
            name,
        });
    }
    removeAutoExecuteJavaScript(name) {
        this.autoInjectJavaScriptBlocks = this.autoInjectJavaScriptBlocks.filter((data) => data.name !== name);
    }
    normalizeURL(url) {
        if (!url) {
            return url;
        }
        if (url.startsWith(this.interceptScheme)) {
            return url;
        }
        return new URL(url).href;
    }
    /**
     * Ensure fetch-api is available.
     */
    async ensureFetchSupport() {
        if (WebViewExtBase_1.isFetchSupported) {
            return Promise.resolve();
        }
        if (typeof WebViewExtBase_1.isFetchSupported === 'undefined') {
            this.writeTrace('WebViewExtBase.ensureFetchSupport() - need to check for fetch support.');
            WebViewExtBase_1.isFetchSupported = await this.executeJavaScript("typeof fetch !== 'undefined'");
        }
        if (WebViewExtBase_1.isFetchSupported) {
            this.writeTrace('WebViewExtBase.ensureFetchSupport() - fetch is supported - polyfill not needed.');
            return;
        }
        this.writeTrace('WebViewExtBase.ensureFetchSupport() - fetch is not supported - polyfill needed.');
        return await this.loadFetchPolyfill();
    }
    async loadFetchPolyfill() {
        await this.executeJavaScript(fetchPolyfill, false);
    }
    /**
     * Older Android WebView don't support promises.
     * Inject the promise-polyfill if needed.
     */
    async ensurePromiseSupport() {
        if (WebViewExtBase_1.isPromiseSupported) {
            return;
        }
        if (typeof WebViewExtBase_1.isPromiseSupported === 'undefined') {
            this.writeTrace('WebViewExtBase.ensurePromiseSupport() - need to check for promise support.');
            WebViewExtBase_1.isPromiseSupported = await this.executeJavaScript("typeof Promise !== 'undefined'");
        }
        if (WebViewExtBase_1.isPromiseSupported) {
            this.writeTrace('WebViewExtBase.ensurePromiseSupport() - promise is supported - polyfill not needed.');
            return;
        }
        this.writeTrace('WebViewExtBase.ensurePromiseSupport() - promise is not supported - polyfill needed.');
        await this.loadPromisePolyfill();
    }
    async loadPromisePolyfill() {
        await this.executeJavaScript(promisePolyfill, false);
    }
    async ensurePolyfills() {
        await this.ensurePromiseSupport();
        await this.ensureFetchSupport();
    }
    /**
     * Execute JavaScript inside the webview.
     * The code should be wrapped inside an anonymous-function.
     * Larger scripts should be injected with loadJavaScriptFile.
     * NOTE: stringifyResult only applies on iOS.
     */
    executeJavaScript(scriptCode, stringifyResult) {
        throw new Error('Method not implemented.');
    }
    /**
     * Execute a promise inside the webview and wait for it to resolve.
     * Note: The scriptCode must return a promise.
     */
    async executePromise(scriptCode, timeout = 2000) {
        const results = await this.executePromises([scriptCode], timeout);
        return results && results[0];
    }
    async executePromises(scriptCodes, timeout = 2000) {
        if (scriptCodes.length === 0) {
            return;
        }
        const reqId = `${Math.round(Math.random() * 1000)}`;
        const eventName = `tmp-promise-event-${reqId}`;
        const scriptHeader = `
            var promises = [];
            var p = Promise.resolve();
        `.trim();
        const scriptBody = [];
        for (const scriptCode of scriptCodes) {
            if (!scriptCode) {
                continue;
            }
            if (typeof scriptCode !== 'string') {
                this.writeTrace(`WebViewExt.executePromises() - scriptCode is not a string`);
                continue;
            }
            // Wrapped in a Promise.then to delay executing scriptCode till the previous promise have finished
            scriptBody.push(`
                p = p.then(function() {
                    return ${scriptCode.trim()};
                });

                promises.push(p);
            `.trim());
        }
        const scriptFooter = `
            return Promise.all(promises);
        `.trim();
        const scriptCode = `(function() {
            ${scriptHeader}
            ${scriptBody.join(';')}
            ${scriptFooter}
        })()`.trim();
        const promiseScriptCode = `
            (function() {
                var eventName = ${JSON.stringify(eventName)};
                try {
                    var promise = (function() {return ${scriptCode}})();
                    window.nsWebViewBridge.executePromise(promise, eventName);
                } catch (err) {
                    window.nsWebViewBridge.emitError(err, eventName);
                }
            })();
        `.trim();
        return new Promise((resolve, reject) => {
            let timer;
            const tmpPromiseEvent = (args) => {
                clearTimeout(timer);
                const { data, err } = args.data || {};
                // Was it a success? No 'err' received.
                if (typeof err === 'undefined') {
                    resolve(data);
                    return;
                }
                // Rejected promise.
                if (err && typeof err === 'object') {
                    // err is an object. Might be a serialized Error-object.
                    const error = new Error(err.message || err.name || err);
                    if (err.stack) {
                        // Add the web stack to the Error object.
                        error.webStack = err.stack;
                    }
                    for (const [key, value] of Object.entries(err)) {
                        if (key in error) {
                            continue;
                        }
                        error[key] = value;
                    }
                    reject(error);
                    return;
                }
                reject(new Error(err));
            };
            this.once(eventName, tmpPromiseEvent);
            this.executeJavaScript(promiseScriptCode, false);
            if (timeout > 0) {
                timer = setTimeout(() => {
                    reject(new Error(`Timed out after: ${timeout}`));
                    this.off(eventName);
                }, timeout);
            }
        });
    }
    /**
     * Generate script code for loading javascript-file.
     */
    async generateLoadJavaScriptFileScriptCode(resourceName, path) {
        if (this.supportXLocalScheme) {
            const fixedResourceName = this.fixLocalResourceName(resourceName);
            if (path) {
                this.registerLocalResource(fixedResourceName, path);
            }
            const scriptHref = `${this.interceptScheme}://${fixedResourceName}`;
            return `window.nsWebViewBridge.injectJavaScriptFile(${JSON.stringify(scriptHref)});`;
        }
        else {
            const elId = resourceName.replace(/^[:]*:\/\//, '').replace(/[^a-z0-9]/g, '');
            const scriptCode = await File.fromPath(this.resolveLocalResourceFilePath(path)).readText();
            return `window.nsWebViewBridge.injectJavaScript(${JSON.stringify(elId)}, ${scriptCode});`;
        }
    }
    /**
     * Generate script code for loading CSS-file.generateLoadCSSFileScriptCode
     */
    async generateLoadCSSFileScriptCode(resourceName, path, insertBefore = false) {
        if (this.supportXLocalScheme) {
            resourceName = this.fixLocalResourceName(resourceName);
            if (path) {
                this.registerLocalResource(resourceName, path);
            }
            const stylesheetHref = `${this.interceptScheme}://${resourceName}`;
            return `window.nsWebViewBridge.injectStyleSheetFile(${JSON.stringify(stylesheetHref)}, ${!!insertBefore});`;
        }
        else {
            const elId = resourceName.replace(/^[:]*:\/\//, '').replace(/[^a-z0-9]/g, '');
            const stylesheetCode = await File.fromPath(this.resolveLocalResourceFilePath(path)).readText();
            return `window.nsWebViewBridge.injectStyleSheet(${JSON.stringify(elId)}, ${JSON.stringify(stylesheetCode)}, ${!!insertBefore})`;
        }
    }
    /**
     * Inject WebView JavaScript Bridge.
     */
    async injectWebViewBridge() {
        await this.executeJavaScript(webViewBridge, false);
        await this.ensurePolyfills();
        await this.injectViewPortMeta();
    }
    async injectViewPortMeta() {
        const scriptCode = await this.generateViewPortCode();
        if (!scriptCode) {
            return;
        }
        await this.executeJavaScript(scriptCode, false);
    }
    async generateViewPortCode() {
        if (this.viewPortSize === false) {
            return null;
        }
        const scriptCodeTmpl = metadataViewPort;
        const viewPortCode = JSON.stringify(this.viewPortSize || {});
        return scriptCodeTmpl.replace('"<%= VIEW_PORT %>"', viewPortCode);
    }
    /**
     * Convert response from WebView into usable JS-type.
     */
    parseWebViewJavascriptResult(result) {
        if (result === undefined) {
            return;
        }
        if (typeof result !== 'string') {
            return result;
        }
        try {
            return JSON.parse(result);
        }
        catch (err) {
            return result;
        }
    }
    writeTrace(message, type = Trace.messageType.info) {
        if (Trace.isEnabled()) {
            Trace.write(message, 'NOTA', type);
        }
    }
    /**
     * Emit event into the webview.
     */
    emitToWebView(eventName, data) {
        const scriptCode = `
            window.nsWebViewBridge && nsWebViewBridge.onNativeEvent(${JSON.stringify(eventName)}, ${JSON.stringify(data)});
        `;
        this.executeJavaScript(scriptCode, false);
    }
    /**
     * Called from delegate on webview event.
     * Triggered by: window.nsWebViewBridge.emit(eventName: string, data: any); inside the webview
     */
    onWebViewEvent(eventName, data) {
        this.notify({
            eventName,
            object: this,
            data,
        });
    }
    /**
     * Get document.title
     * NOTE: On Android, if empty returns filename
     */
    getTitle() {
        throw new Error('Method not implemented.');
    }
    zoomIn() {
        throw new Error('Method not implemented.');
    }
    zoomOut() {
        throw new Error('Method not implemented.');
    }
    zoomBy(zoomFactor) {
        throw new Error('Method not implemented.');
    }
    /**
     * Helper function, strips 'x-local://' from a resource name
     */
    fixLocalResourceName(resourceName) {
        if (resourceName.startsWith(this.interceptScheme)) {
            return resourceName.substr(this.interceptScheme.length + 3);
        }
        return resourceName;
    }
    [isEnabledProperty.getDefault]() {
        return true;
    }
};
WebViewExtBase = WebViewExtBase_1 = __decorate([
    CSSType('WebView')
], WebViewExtBase);
export { WebViewExtBase };
autoInjectJSBridgeProperty.register(WebViewExtBase);
builtInZoomControlsProperty.register(WebViewExtBase);
cacheModeProperty.register(WebViewExtBase);
databaseStorageProperty.register(WebViewExtBase);
debugModeProperty.register(WebViewExtBase);
displayZoomControlsProperty.register(WebViewExtBase);
domStorageProperty.register(WebViewExtBase);
srcProperty.register(WebViewExtBase);
supportZoomProperty.register(WebViewExtBase);
scrollBounceProperty.register(WebViewExtBase);
viewPortProperty.register(WebViewExtBase);
limitsNavigationsToAppBoundDomainsProperty.register(WebViewExtBase);
//# sourceMappingURL=common.js.map