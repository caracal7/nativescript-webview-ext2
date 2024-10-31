import '@nativescript/core';
import { File, knownFolders, Trace } from '@nativescript/core';
import { isEnabledProperty } from '@nativescript/core/ui/core/view';
import { builtInZoomControlsProperty, cacheModeProperty, databaseStorageProperty, debugModeProperty, displayZoomControlsProperty, domStorageProperty, supportZoomProperty, UnsupportedSDKError, WebViewExtBase } from './common';
export * from './common';
const extToMimeType = new Map([
    ['html', 'text/html'],
    ['htm', 'text/html'],
    ['xhtml', 'text/html'],
    ['xhtm', 'text/html'],
    ['css', 'text/css'],
    ['gif', 'image/gif'],
    ['jpeg', 'image/jpeg'],
    ['jpg', 'image/jpeg'],
    ['js', 'text/javascript'],
    ['otf', 'application/vnd.ms-opentype'],
    ['png', 'image/png'],
    ['svg', 'image/svg+xml'],
    ['ttf', 'application/x-font-ttf'],
]);
const extToBinaryEncoding = new Set(['gif', 'jpeg', 'jpg', 'otf', 'png', 'ttf']);
//#region android_native_classes
let cacheModeMap;
let WebViewExtClient;
let WebChromeViewExtClient;
let WebViewBridgeInterface;
function initializeWebViewClient() {
    if (WebViewExtClient) {
        return;
    }
    cacheModeMap = new Map([
        ['cache_first', android.webkit.WebSettings.LOAD_CACHE_ELSE_NETWORK],
        ['cache_only', android.webkit.WebSettings.LOAD_CACHE_ONLY],
        ['default', android.webkit.WebSettings.LOAD_DEFAULT],
        ['no_cache', android.webkit.WebSettings.LOAD_NO_CACHE],
        ['normal', android.webkit.WebSettings.LOAD_NORMAL],
    ]);
    var WebViewExtClientImpl = /** @class */ (function (_super) {
    __extends(WebViewExtClientImpl, _super);
    function WebViewExtClientImpl(owner) {
        var _this = _super.call(this) || this;
        _this.owner = new WeakRef(owner);
        return global.__native(_this);
    }
    /**
     * Give the host application a chance to take control when a URL is about to be loaded in the current WebView.
     */
    WebViewExtClientImpl.prototype.shouldOverrideUrlLoading = function (view, request) {
        var owner = this.owner.get();
        if (!owner) {
            console.warn('WebViewExtClientImpl.shouldOverrideUrlLoading(...) - no owner');
            return true;
        }
        var url = request;
        var httpMethod = 'GET';
        var isRedirect = false;
        var hasGesture = false;
        var isForMainFrame = false;
        var requestHeaders = null;
        if (typeof request === 'object') {
            httpMethod = request.getMethod();
            isRedirect = request.isRedirect();
            hasGesture = request.hasGesture();
            isForMainFrame = request.isForMainFrame();
            requestHeaders = request.getRequestHeaders();
            url = request.getUrl().toString();
        }
        owner.writeTrace("WebViewClientClass.shouldOverrideUrlLoading(\"".concat(url, "\") - method:").concat(httpMethod, " isRedirect:").concat(isRedirect, " hasGesture:").concat(hasGesture, " isForMainFrame:").concat(isForMainFrame, " headers:").concat(requestHeaders));
        if (url.startsWith(owner.interceptScheme)) {
            owner.writeTrace("WebViewClientClass.shouldOverrideUrlLoading(\"".concat(url, "\") - \"").concat(owner.interceptScheme, "\" - cancel"));
            return true;
        }
        var shouldOverrideUrlLoading = owner._onShouldOverrideUrlLoading(url, httpMethod);
        if (shouldOverrideUrlLoading === true) {
            owner.writeTrace("WebViewClientClass.shouldOverrideUrlLoading(\"".concat(url, "\") - cancel loading url"));
            return true;
        }
        return false;
    };
    WebViewExtClientImpl.prototype.shouldInterceptRequest = function (view, request) {
        var owner = this.owner.get();
        if (!owner) {
            console.warn('WebViewExtClientImpl.shouldInterceptRequest(...) - no owner');
            return _super.prototype.shouldInterceptRequest.call(this, view, request);
        }
        var url;
        if (typeof request === 'string') {
            url = request;
        }
        else if (typeof request === 'object') {
            url = request.getUrl().toString();
        }
        if (typeof url !== 'string') {
            owner.writeTrace("WebViewClientClass.shouldInterceptRequest(\"".concat(url, "\") - is not a string"));
            return _super.prototype.shouldInterceptRequest.call(this, view, request);
        }
        if (!url.startsWith(owner.interceptScheme)) {
            return _super.prototype.shouldInterceptRequest.call(this, view, request);
        }
        var filepath = owner.getRegisteredLocalResource(url);
        if (!filepath) {
            owner.writeTrace("WebViewClientClass.shouldInterceptRequest(\"".concat(url, "\") - no matching file"));
            return _super.prototype.shouldInterceptRequest.call(this, view, request);
        }
        if (!File.exists(filepath)) {
            owner.writeTrace("WebViewClientClass.shouldInterceptRequest(\"".concat(url, "\") - file: \"").concat(filepath, "\" doesn't exists"));
            return _super.prototype.shouldInterceptRequest.call(this, view, request);
        }
        var tnsFile = File.fromPath(filepath);
        var javaFile = new java.io.File(tnsFile.path);
        var stream = new java.io.FileInputStream(javaFile);
        var ext = tnsFile.extension.substr(1).toLowerCase();
        var mimeType = extToMimeType.get(ext) || 'application/octet-stream';
        var encoding = extToBinaryEncoding.has(ext) || mimeType === 'application/octet-stream' ? 'binary' : 'UTF-8';
        owner.writeTrace("WebViewClientClass.shouldInterceptRequest(\"".concat(url, "\") - file: \"").concat(filepath, "\" mimeType:").concat(mimeType, " encoding:").concat(encoding));
        var response = new android.webkit.WebResourceResponse(mimeType, encoding, stream);
        if (android.os.Build.VERSION.SDK_INT < 21 || !response.getResponseHeaders) {
            return response;
        }
        var responseHeaders = response.getResponseHeaders();
        if (!responseHeaders) {
            responseHeaders = new java.util.HashMap();
        }
        responseHeaders.put('Access-Control-Allow-Origin', '*');
        response.setResponseHeaders(responseHeaders);
        return response;
    };
    WebViewExtClientImpl.prototype.onPageStarted = function (view, url, favicon) {
        _super.prototype.onPageStarted.call(this, view, url, favicon);
        var owner = this.owner.get();
        if (!owner) {
            console.warn("WebViewExtClientImpl.onPageStarted(\"".concat(view, "\", \"").concat(url, "\", \"").concat(favicon, "\") - no owner"));
            return;
        }
        owner.writeTrace("WebViewClientClass.onPageStarted(\"".concat(view, "\", \"").concat(url, "\", \"").concat(favicon, "\")"));
        owner._onLoadStarted(url);
    };
    WebViewExtClientImpl.prototype.onPageFinished = function (view, url) {
        _super.prototype.onPageFinished.call(this, view, url);
        var owner = this.owner.get();
        if (!owner) {
            console.warn("WebViewExtClientImpl.onPageFinished(\"".concat(view, "\", ").concat(url, "\") - no owner"));
            return;
        }
        owner.writeTrace("WebViewClientClass.onPageFinished(\"".concat(view, "\", ").concat(url, "\")"));
        owner._onLoadFinished(url).catch(function () { return void 0; });
    };
    WebViewExtClientImpl.prototype.onReceivedError = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (args.length === 4) {
            var _a = args, view = _a[0], errorCode = _a[1], description = _a[2], failingUrl = _a[3];
            this.onReceivedErrorBeforeAPI23(view, errorCode, description, failingUrl);
        }
        else {
            var _b = args, view = _b[0], request = _b[1], error = _b[2];
            this.onReceivedErrorAPI23(view, request, error);
        }
    };
    WebViewExtClientImpl.prototype.onReceivedErrorAPI23 = function (view, request, error) {
        _super.prototype.onReceivedError.call(this, view, request, error);
        var owner = this.owner.get();
        if (!owner) {
            console.warn('WebViewExtClientImpl.onReceivedErrorAPI23(...) - no owner');
            return;
        }
        var url = error.getUrl && error.getUrl();
        if (!url && typeof request === 'object') {
            url = request.getUrl().toString();
        }
        owner.writeTrace("WebViewClientClass.onReceivedErrorAPI23(".concat(error.getErrorCode(), ", ").concat(error.getDescription(), ", ").concat(url, ")"));
        owner._onLoadFinished(url, "".concat(error.getDescription(), "(").concat(error.getErrorCode(), ")")).catch(function () { return void 0; });
    };
    WebViewExtClientImpl.prototype.onReceivedErrorBeforeAPI23 = function (view, errorCode, description, failingUrl) {
        _super.prototype.onReceivedError.call(this, view, errorCode, description, failingUrl);
        var owner = this.owner.get();
        if (!owner) {
            console.warn('WebViewExtClientImpl.onReceivedErrorBeforeAPI23(...) - no owner');
            return;
        }
        owner.writeTrace("WebViewClientClass.onReceivedErrorBeforeAPI23(".concat(errorCode, ", \"").concat(description, "\", \"").concat(failingUrl, "\")"));
        owner._onLoadFinished(failingUrl, "".concat(description, "(").concat(errorCode, ")")).catch(function () { return void 0; });
    };
    return WebViewExtClientImpl;
}(android.webkit.WebViewClient));
    WebViewExtClient = WebViewExtClientImpl;
    var WebChromeViewExtClientImpl = /** @class */ (function (_super) {
    __extends(WebChromeViewExtClientImpl, _super);
    function WebChromeViewExtClientImpl(owner) {
        var _this = _super.call(this) || this;
        _this.owner = new WeakRef(owner);
        return global.__native(_this);
    }
    WebChromeViewExtClientImpl.prototype.onShowCustomView = function (view) {
        var _this = this;
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        var callback;
        if (arguments.length === 3) {
            callback = arguments[2];
        }
        else if (arguments.length === 2) {
            callback = arguments[1];
        }
        else {
            return;
        }
        if (owner._onEnterFullscreen(function () { return _this.hideCustomView(); })) {
            this.showCustomViewCallback = callback;
        }
        else {
            callback.onCustomViewHidden();
        }
    };
    WebChromeViewExtClientImpl.prototype.hideCustomView = function () {
        if (this.showCustomViewCallback) {
            this.showCustomViewCallback.onCustomViewHidden();
        }
        this.showCustomViewCallback = undefined;
    };
    WebChromeViewExtClientImpl.prototype.onHideCustomView = function () {
        this.showCustomViewCallback = undefined;
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        owner._onExitFullscreen();
    };
    WebChromeViewExtClientImpl.prototype.onProgressChanged = function (view, newProgress) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        owner._loadProgress(newProgress);
    };
    WebChromeViewExtClientImpl.prototype.onReceivedTitle = function (view, title) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        owner._titleChanged(title);
    };
    WebChromeViewExtClientImpl.prototype.onJsAlert = function (view, url, message, result) {
        var owner = this.owner.get();
        if (!owner) {
            return false;
        }
        var gotResponse = false;
        return owner._webAlert(message, function () {
            if (!gotResponse) {
                result.confirm();
            }
            gotResponse = true;
        });
    };
    WebChromeViewExtClientImpl.prototype.onJsConfirm = function (view, url, message, result) {
        var owner = this.owner.get();
        if (!owner) {
            return false;
        }
        var gotResponse = false;
        return owner._webConfirm(message, function (confirmed) {
            if (!gotResponse) {
                if (confirmed) {
                    result.confirm();
                }
                else {
                    result.cancel();
                }
            }
            gotResponse = true;
        });
    };
    WebChromeViewExtClientImpl.prototype.onJsPrompt = function (view, url, message, defaultValue, result) {
        var owner = this.owner.get();
        if (!owner) {
            return false;
        }
        var gotResponse = false;
        return owner._webPrompt(message, defaultValue, function (message) {
            if (!gotResponse) {
                if (message) {
                    result.confirm(message);
                }
                else {
                    result.confirm();
                }
            }
            gotResponse = true;
        });
    };
    WebChromeViewExtClientImpl.prototype.onConsoleMessage = function () {
        if (arguments.length !== 1) {
            return false;
        }
        var owner = this.owner.get();
        if (!owner) {
            return false;
        }
        var consoleMessage = arguments[0];
        if (consoleMessage instanceof android.webkit.ConsoleMessage) {
            var message = consoleMessage.message();
            var lineNo = consoleMessage.lineNumber();
            var level = 'log';
            var _a = android.webkit.ConsoleMessage.MessageLevel, DEBUG = _a.DEBUG, LOG = _a.LOG, WARNING = _a.WARNING;
            switch (consoleMessage.messageLevel()) {
                case DEBUG: {
                    level = 'debug';
                    break;
                }
                case LOG: {
                    level = 'log';
                    break;
                }
                case WARNING: {
                    level = 'warn';
                    break;
                }
            }
            return owner._webConsole(message, lineNo, level);
        }
        return false;
    };
    return WebChromeViewExtClientImpl;
}(android.webkit.WebChromeClient));
    WebChromeViewExtClient = WebChromeViewExtClientImpl;
    var WebViewBridgeInterfaceImpl = /** @class */ (function (_super) {
    __extends(WebViewBridgeInterfaceImpl, _super);
    function WebViewBridgeInterfaceImpl(owner) {
        var _this = _super.call(this) || this;
        _this.owner = new WeakRef(owner);
        return global.__native(_this);
    }
    WebViewBridgeInterfaceImpl.prototype.emitEventToNativeScript = function (eventName, data) {
        var owner = this.owner.get();
        if (!owner) {
            console.warn("WebViewExtClientImpl.emitEventToNativeScript(\"".concat(eventName, "\") - no owner"));
            return;
        }
        try {
            if (typeof data == 'string' && data) {
                owner.onWebViewEvent(eventName, JSON.parse(data));
                return;
            }
            owner.onWebViewEvent(eventName, null);
            return;
        }
        catch (err) {
            owner.writeTrace("WebViewExtClientImpl.emitEventToNativeScript(\"".concat(eventName, "\") - couldn't parse data: ").concat(JSON.stringify(data), " err: ").concat(err));
        }
    };
    return WebViewBridgeInterfaceImpl;
}(dk.nota.webviewinterface.WebViewBridgeInterface));
    WebViewBridgeInterface = WebViewBridgeInterfaceImpl;
}
//#endregion android_native_classes
let instanceNo = 0;
class WebViewExt extends WebViewExtBase {
    constructor() {
        super(...arguments);
        this.localResourceMap = new Map();
        this.supportXLocalScheme = true;
        this.instance = ++instanceNo;
    }
    createNativeView() {
        const nativeView = new android.webkit.WebView(this._context);
        const settings = nativeView.getSettings();
        // Needed for the bridge library
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(true); // Needed for Android 11
        settings.setBuiltInZoomControls(!!this.builtInZoomControls);
        settings.setDisplayZoomControls(!!this.displayZoomControls);
        settings.setSupportZoom(!!this.supportZoom);
        if (android.os.Build.VERSION.SDK_INT >= 21) {
            // Needed for x-local in https-sites
            settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }
        // Needed for XHRRequests with x-local://
        settings.setAllowUniversalAccessFromFileURLs(true);
        return nativeView;
    }
    initNativeView() {
        super.initNativeView();
        initializeWebViewClient();
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        const client = new WebViewExtClient(this);
        const chromeClient = new WebChromeViewExtClient(this);
        nativeView.setWebViewClient(client);
        nativeView.client = client;
        nativeView.setWebChromeClient(chromeClient);
        nativeView.chromeClient = chromeClient;
        const bridgeInterface = new WebViewBridgeInterface(this);
        nativeView.addJavascriptInterface(bridgeInterface, 'androidWebViewBridge');
        nativeView.bridgeInterface = bridgeInterface;
    }
    disposeNativeView() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            nativeView.client = null;
            nativeView.chromeClient = null;
            nativeView.destroy();
        }
        super.disposeNativeView();
    }
    async ensurePromiseSupport() {
        if (android.os.Build.VERSION.SDK_INT >= 21) {
            return;
        }
        return await super.ensurePromiseSupport();
    }
    _loadUrl(src) {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        this.writeTrace(`WebViewExt<android>._loadUrl("${src}")`);
        nativeView.loadUrl(src);
        this.writeTrace(`WebViewExt<android>._loadUrl("${src}") - end`);
    }
    _loadData(src) {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        const baseUrl = `file:///${knownFolders.currentApp().path}/`;
        this.writeTrace(`WebViewExt<android>._loadData("${src}") -> baseUrl: "${baseUrl}"`);
        nativeView.loadDataWithBaseURL(baseUrl, src, 'text/html', 'utf-8', null);
    }
    get canGoBack() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            return nativeView.canGoBack();
        }
        return false;
    }
    stopLoading() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            nativeView.stopLoading();
        }
    }
    get canGoForward() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            return nativeView.canGoForward();
        }
        return false;
    }
    goBack() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            return nativeView.goBack();
        }
    }
    goForward() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            return nativeView.goForward();
        }
    }
    reload() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            return nativeView.reload();
        }
    }
    registerLocalResource(resourceName, path) {
        resourceName = this.fixLocalResourceName(resourceName);
        const filepath = this.resolveLocalResourceFilePath(path);
        if (!filepath) {
            this.writeTrace(`WebViewExt<android>.registerLocalResource("${resourceName}", "${path}") -> file doesn't exist`, Trace.messageType.error);
            return;
        }
        this.writeTrace(`WebViewExt<android>.registerLocalResource("${resourceName}", "${path}") -> file: "${filepath}"`);
        this.localResourceMap.set(resourceName, filepath);
    }
    unregisterLocalResource(resourceName) {
        this.writeTrace(`WebViewExt<android>.unregisterLocalResource("${resourceName}")`);
        resourceName = this.fixLocalResourceName(resourceName);
        this.localResourceMap.delete(resourceName);
    }
    getRegisteredLocalResource(resourceName) {
        resourceName = this.fixLocalResourceName(resourceName);
        const result = this.localResourceMap.get(resourceName);
        this.writeTrace(`WebViewExt<android>.getRegisteredLocalResource("${resourceName}") => "${result}"`);
        return result;
    }
    /**
     * Always load the Fetch-polyfill on Android.
     *
     * Native 'Fetch API' on Android rejects all request for resources no HTTP or HTTPS.
     * This breaks x-local:// requests (and file://).
     */
    async ensureFetchSupport() {
        this.writeTrace("WebViewExt<android>.ensureFetchSupport() - Override 'Fetch API' to support x-local.");
        // The polyfill is not loaded if fetch already exists, start by null'ing it.
        await this.executeJavaScript(`
            try {
                window.fetch = null;
            } catch (err) {
                console.error("null'ing Native Fetch API failed:", err);
            }
        `);
        await this.loadFetchPolyfill();
    }
    async executeJavaScript(scriptCode) {
        if (android.os.Build.VERSION.SDK_INT < 19) {
            this.writeTrace(`WebViewExt<android>.executeJavaScript() -> SDK:${android.os.Build.VERSION.SDK_INT} not supported`, Trace.messageType.error);
            return Promise.reject(new UnsupportedSDKError(19));
        }
        const result = await new Promise((resolve, reject) => {
            const androidWebView = this.nativeViewProtected;
            if (!androidWebView) {
                this.writeTrace(`WebViewExt<android>.executeJavaScript() -> no nativeView?`, Trace.messageType.error);
                reject(new Error('Native Android not initialized, cannot call executeJavaScript'));
                return;
            }
            androidWebView.evaluateJavascript(scriptCode, new android.webkit.ValueCallback({
                onReceiveValue(result) {
                    resolve(result);
                },
            }));
        });
        return await this.parseWebViewJavascriptResult(result);
    }
    async getTitle() {
        return this.nativeViewProtected && this.nativeViewProtected.getTitle();
    }
    zoomIn() {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return false;
        }
        return androidWebView.zoomIn();
    }
    zoomOut() {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return false;
        }
        return androidWebView.zoomOut();
    }
    zoomBy(zoomFactor) {
        if (android.os.Build.VERSION.SDK_INT < 21) {
            this.writeTrace(`WebViewExt<android>.zoomBy - not supported on this SDK`);
            return;
        }
        if (!this.nativeViewProtected) {
            return;
        }
        if (zoomFactor >= 0.01 && zoomFactor <= 100) {
            return this.nativeViewProtected.zoomBy(zoomFactor);
        }
        throw new Error(`ZoomBy only accepts values between 0.01 and 100 both inclusive`);
    }
    [debugModeProperty.getDefault]() {
        return false;
    }
    [debugModeProperty.setNative](enabled) {
        android.webkit.WebView.setWebContentsDebuggingEnabled(!!enabled);
    }
    [builtInZoomControlsProperty.getDefault]() {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return false;
        }
        const settings = androidWebView.getSettings();
        return settings.getBuiltInZoomControls();
    }
    [builtInZoomControlsProperty.setNative](enabled) {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return;
        }
        const settings = androidWebView.getSettings();
        settings.setBuiltInZoomControls(!!enabled);
    }
    [displayZoomControlsProperty.getDefault]() {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return false;
        }
        const settings = androidWebView.getSettings();
        return settings.getDisplayZoomControls();
    }
    [displayZoomControlsProperty.setNative](enabled) {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return;
        }
        const settings = androidWebView.getSettings();
        settings.setDisplayZoomControls(!!enabled);
    }
    [cacheModeProperty.getDefault]() {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return null;
        }
        const settings = androidWebView.getSettings();
        const cacheModeInt = settings.getCacheMode();
        for (const [key, value] of cacheModeMap) {
            if (value === cacheModeInt) {
                return key;
            }
        }
        return null;
    }
    [cacheModeProperty.setNative](cacheMode) {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return;
        }
        const settings = androidWebView.getSettings();
        for (const [key, nativeValue] of cacheModeMap) {
            if (key === cacheMode) {
                settings.setCacheMode(nativeValue);
                return;
            }
        }
    }
    [databaseStorageProperty.getDefault]() {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return false;
        }
        const settings = androidWebView.getSettings();
        return settings.getDatabaseEnabled();
    }
    [databaseStorageProperty.setNative](enabled) {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return;
        }
        const settings = androidWebView.getSettings();
        settings.setDatabaseEnabled(!!enabled);
    }
    [domStorageProperty.getDefault]() {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return false;
        }
        const settings = androidWebView.getSettings();
        return settings.getDomStorageEnabled();
    }
    [domStorageProperty.setNative](enabled) {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return;
        }
        const settings = androidWebView.getSettings();
        settings.setDomStorageEnabled(!!enabled);
    }
    [supportZoomProperty.getDefault]() {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return false;
        }
        const settings = androidWebView.getSettings();
        return settings.supportZoom();
    }
    [supportZoomProperty.setNative](enabled) {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return;
        }
        const settings = androidWebView.getSettings();
        settings.setSupportZoom(!!enabled);
    }
    [isEnabledProperty.setNative](enabled) {
        const androidWebView = this.nativeViewProtected;
        if (!androidWebView) {
            return;
        }
        if (enabled) {
            androidWebView.setOnTouchListener(null);
        }
        else {
            androidWebView.setOnTouchListener(new android.view.View.OnTouchListener({
                onTouch() {
                    return true;
                },
            }));
        }
    }
}
WebViewExt.supportXLocalScheme = true;
export { WebViewExt };
//# sourceMappingURL=index.android.js.map