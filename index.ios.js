import '@nativescript/core';
import { alert, confirm, File, knownFolders, profile, prompt, Trace } from '@nativescript/core';
import { isEnabledProperty } from '@nativescript/core/ui/core/view';
import { webViewBridge } from './bridge-loader';
import { autoInjectJSBridgeProperty, limitsNavigationsToAppBoundDomainsProperty, scrollBounceProperty, viewPortProperty, WebViewExtBase } from './common';
export * from './common';
const messageHandlerName = 'nsBridge';
class WebViewExt extends WebViewExtBase {
    constructor() {
        super(...arguments);
        this.wkNamedUserScripts = [];
        this.supportXLocalScheme = typeof CustomUrlSchemeHandler !== 'undefined';
        this.viewPortSize = { initialScale: 1.0 };
        this.limitsNavigationsToAppBoundDomains = false;
    }
    createNativeView() {
        const configuration = WKWebViewConfiguration.new();
        configuration.dataDetectorTypes = -1 /* WKDataDetectorTypes.All */;
        this.wkWebViewConfiguration = configuration;
        const messageHandler = WKScriptMessageHandlerNotaImpl.initWithOwner(new WeakRef(this));
        const wkUController = (this.wkUserContentController = WKUserContentController.new());
        wkUController.addScriptMessageHandlerName(messageHandler, messageHandlerName);
        configuration.userContentController = wkUController;
        configuration.preferences.setValueForKey(true, 'allowFileAccessFromFileURLs');
        configuration.setValueForKey(true, 'allowUniversalAccessFromFileURLs');
        configuration.limitsNavigationsToAppBoundDomains = this.limitsNavigationsToAppBoundDomains;
        if (this.supportXLocalScheme) {
            this.wkCustomUrlSchemeHandler = new CustomUrlSchemeHandler();
            configuration.setURLSchemeHandlerForURLScheme(this.wkCustomUrlSchemeHandler, this.interceptScheme);
        }
        const webview = new WKWebView({
            frame: CGRectZero,
            configuration,
        });
        return webview;
    }
    initNativeView() {
        super.initNativeView();
        this.wkNavigationDelegate = WKNavigationDelegateNotaImpl.initWithOwner(new WeakRef(this));
        this.wkUIDelegate = WKUIDelegateNotaImpl.initWithOwner(new WeakRef(this));
        this.loadWKUserScripts();
    }
    disposeNativeView() {
        this.wkWebViewConfiguration?.userContentController?.removeScriptMessageHandlerForName(messageHandlerName);
        this.wkWebViewConfiguration = null;
        this.wkNavigationDelegate = null;
        this.wkCustomUrlSchemeHandler = null;
        this.wkUIDelegate = null;
        super.disposeNativeView();
    }
    injectWebViewBridge() {
        return this.ensurePolyfills();
    }
    async injectViewPortMeta() {
        this.resetViewPortCode();
        if (this.supportXLocalScheme) {
            return;
        }
        return await super.injectViewPortMeta();
    }
    async executeJavaScript(scriptCode, stringifyResult = true) {
        if (stringifyResult) {
            scriptCode = `
                (function(window) {
                    var result = null;

                    try {
                        result = ${scriptCode.trim()};
                    } catch (err) {
                        return JSON.stringify({
                            error: true,
                            message: err.message,
                            stack: err.stack
                        });
                    }

                    try {
                        return JSON.stringify(result);
                    } catch (err) {
                        return result;
                    }
                })(window);
            `;
        }
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return Promise.reject(new Error('WebView is missing'));
        }
        const rawResult = await new Promise((resolve, reject) => {
            nativeView.evaluateJavaScriptCompletionHandler(scriptCode.trim(), (result, error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });
        const result = await this.parseWebViewJavascriptResult(rawResult);
        const r = result;
        if (r && typeof r === 'object' && r.error) {
            const error = new Error(r.message);
            error.webStack = r.stack;
            throw error;
        }
        return result;
    }
    onLoaded() {
        super.onLoaded();
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            nativeView.navigationDelegate = this.wkNavigationDelegate;
            nativeView.UIDelegate = this.wkUIDelegate;
        }
    }
    onUnloaded() {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            nativeView.navigationDelegate = null;
            nativeView.UIDelegate = null;
        }
        super.onUnloaded();
    }
    stopLoading() {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        nativeView.stopLoading();
    }
    _loadUrl(src) {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        const nsURL = NSURL.URLWithString(src);
        if (src.startsWith('file:///')) {
            const cachePath = src.substring(0, src.lastIndexOf('/'));
            const nsReadAccessUrl = NSURL.URLWithString(cachePath);
            this.writeTrace(`WKWebViewWrapper.loadUrl("${src}") -> ios.loadFileURLAllowingReadAccessToURL("${nsURL}", "${nsReadAccessUrl}"`);
            nativeView.loadFileURLAllowingReadAccessToURL(nsURL, nsReadAccessUrl);
        }
        else {
            const nsRequestWithUrl = NSURLRequest.requestWithURL(nsURL);
            this.writeTrace(`WKWebViewWrapper.loadUrl("${src}") -> ios.loadRequest("${nsRequestWithUrl}"`);
            nativeView.loadRequest(nsRequestWithUrl);
        }
    }
    _loadData(content) {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        const baseUrl = `file:///${knownFolders.currentApp().path}/`;
        const nsBaseUrl = NSURL.URLWithString(baseUrl);
        this.writeTrace(`WKWebViewWrapper.loadUrl(content) -> this.ios.loadHTMLStringBaseURL("${nsBaseUrl}")`);
        nativeView.loadHTMLStringBaseURL(content, nsBaseUrl);
    }
    get canGoBack() {
        const nativeView = this.nativeViewProtected;
        return nativeView && !!nativeView.canGoBack;
    }
    get canGoForward() {
        const nativeView = this.nativeViewProtected;
        return nativeView && !!nativeView.canGoForward;
    }
    goBack() {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        nativeView.goBack();
    }
    goForward() {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        nativeView.goForward();
    }
    reload() {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        nativeView.reload();
    }
    _webAlert(message, callback) {
        if (!super._webAlert(message, callback)) {
            alert(message)
                .then(() => callback())
                .catch(() => callback());
        }
        return true;
    }
    _webConfirm(message, callback) {
        if (!super._webConfirm(message, callback)) {
            confirm(message)
                .then((res) => callback(res))
                .catch(() => callback(null));
        }
        return true;
    }
    _webPrompt(message, defaultText, callback) {
        if (!super._webPrompt(message, defaultText, callback)) {
            prompt(message, defaultText)
                .then((res) => {
                if (res.result) {
                    callback(res.text);
                }
                else {
                    callback(null);
                }
            })
                .catch(() => callback(null));
        }
        return true;
    }
    registerLocalResource(resourceName, path) {
        const cls = `WebViewExt<${this}.ios>.registerLocalResource("${resourceName}", "${path}")`;
        if (!this.supportXLocalScheme) {
            this.writeTrace(`${cls} -> custom schema isn't support on iOS <11`, Trace.messageType.error);
            return;
        }
        resourceName = this.fixLocalResourceName(resourceName);
        const filepath = this.resolveLocalResourceFilePath(path);
        if (!filepath) {
            this.writeTrace(`${cls} -> file doesn't exist`, Trace.messageType.error);
            return;
        }
        this.writeTrace(`${cls} -> file: "${filepath}"`);
        this.registerLocalResourceForNative(resourceName, filepath);
    }
    unregisterLocalResource(resourceName) {
        const cls = `WebViewExt<${this}.ios>.unregisterLocalResource("${resourceName}")`;
        if (!this.supportXLocalScheme) {
            this.writeTrace(`${cls} -> custom schema isn't support on iOS <11`, Trace.messageType.error);
            return;
        }
        this.writeTrace(cls);
        resourceName = this.fixLocalResourceName(resourceName);
        this.unregisterLocalResourceForNative(resourceName);
    }
    getRegisteredLocalResource(resourceName) {
        resourceName = this.fixLocalResourceName(resourceName);
        const cls = `WebViewExt<${this}.ios>.getRegisteredLocalResource("${resourceName}")`;
        if (!this.supportXLocalScheme) {
            this.writeTrace(`${cls} -> custom schema isn't support on iOS <11`, Trace.messageType.error);
            return;
        }
        let result = this.getRegisteredLocalResourceFromNative(resourceName);
        this.writeTrace(`${cls} -> "${result}"`);
        return result;
    }
    getTitle() {
        return this.executeJavaScript('document.title');
    }
    async autoLoadStyleSheetFile(resourceName, path, insertBefore) {
        const filepath = this.resolveLocalResourceFilePath(path);
        if (!filepath) {
            this.writeTrace(`WKWebViewWrapper.autoLoadStyleSheetFile("${resourceName}", "${path}") - couldn't resolve filepath`);
            return;
        }
        resourceName = this.fixLocalResourceName(resourceName);
        const scriptCode = await this.generateLoadCSSFileScriptCode(resourceName, filepath, insertBefore);
        if (scriptCode) {
            this.addNamedWKUserScript(`auto-load-css-${resourceName}`, scriptCode);
        }
    }
    removeAutoLoadStyleSheetFile(resourceName) {
        resourceName = this.fixLocalResourceName(resourceName);
        this.removeNamedWKUserScript(`auto-load-css-${resourceName}`);
    }
    async autoLoadJavaScriptFile(resourceName, path) {
        const filepath = this.resolveLocalResourceFilePath(path);
        if (!filepath) {
            this.writeTrace(`WKWebViewWrapper.autoLoadJavaScriptFile("${resourceName}", "${path}") - couldn't resolve filepath`);
            return;
        }
        const scriptCode = await File.fromPath(filepath).readText();
        this.addNamedWKUserScript(resourceName, scriptCode);
    }
    removeAutoLoadJavaScriptFile(resourceName) {
        const fixedResourceName = this.fixLocalResourceName(resourceName);
        const href = `${this.interceptScheme}://${fixedResourceName}`;
        this.removeNamedWKUserScript(href);
    }
    [autoInjectJSBridgeProperty.setNative](enabled) {
        this.loadWKUserScripts(enabled);
    }
    [scrollBounceProperty.getDefault]() {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return false;
        }
        return nativeView.scrollView.bounces;
    }
    [scrollBounceProperty.setNative](enabled) {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        nativeView.scrollView.bounces = !!enabled;
    }
    [viewPortProperty.setNative](value) {
        if (this.src) {
            this.injectViewPortMeta();
        }
    }
    [limitsNavigationsToAppBoundDomainsProperty.setNative](enabled) {
        this.limitsNavigationsToAppBoundDomains = enabled;
    }
    [limitsNavigationsToAppBoundDomainsProperty.getDefault]() {
        return false;
    }
    [isEnabledProperty.setNative](enabled) {
        const nativeView = this.nativeViewProtected;
        if (!nativeView) {
            return;
        }
        nativeView.userInteractionEnabled = !!enabled;
        nativeView.scrollView.userInteractionEnabled = !!enabled;
    }
    /**
     * iOS11+
     *
     * Sets up loading WKUserScripts
     *
     * @param autoInjectJSBridge If true viewport-code, bridge-code and named scripts will be loaded, if false only viewport-code
     */
    loadWKUserScripts(autoInjectJSBridge = this.autoInjectJSBridge) {
        if (!this.wkUserScriptViewPortCode) {
            this.wkUserScriptViewPortCode = this.makeWKUserScriptPromise(this.generateViewPortCode());
        }
        this.wkUserContentController.removeAllUserScripts();
        this.addUserScriptFromPromise(this.wkUserScriptViewPortCode);
        if (!autoInjectJSBridge) {
            return;
        }
        if (!this.wkUserScriptInjectWebViewBridge) {
            this.wkUserScriptInjectWebViewBridge = this.createWkUserScript(webViewBridge);
        }
        this.addUserScript(this.wkUserScriptInjectWebViewBridge);
        for (const { wkUserScript } of this.wkNamedUserScripts) {
            this.addUserScript(wkUserScript);
        }
    }
    /**
     * iOS11+
     *
     * Remove a named WKUserScript
     */
    removeNamedWKUserScript(resourceName) {
        const idx = this.wkNamedUserScripts.findIndex((val) => val.resourceName === resourceName);
        if (idx === -1) {
            return;
        }
        this.wkNamedUserScripts.splice(idx, 1);
        this.loadWKUserScripts();
    }
    async resetViewPortCode() {
        this.wkUserScriptViewPortCode = null;
        const viewPortScriptCode = await this.generateViewPortCode();
        if (viewPortScriptCode) {
            this.executeJavaScript(viewPortScriptCode);
            this.loadWKUserScripts();
        }
    }
    registerLocalResourceForNative(resourceName, filepath) {
        if (!this.wkCustomUrlSchemeHandler) {
            return;
        }
        this.wkCustomUrlSchemeHandler.registerLocalResourceForKeyFilepath(resourceName, filepath);
    }
    unregisterLocalResourceForNative(resourceName) {
        if (!this.wkCustomUrlSchemeHandler) {
            return;
        }
        this.wkCustomUrlSchemeHandler.unregisterLocalResourceForKey(resourceName);
    }
    getRegisteredLocalResourceFromNative(resourceName) {
        if (!this.wkCustomUrlSchemeHandler) {
            return;
        }
        return this.wkCustomUrlSchemeHandler.getRegisteredLocalResourceForKey(resourceName);
    }
    async makeWKUserScriptPromise(scriptCodePromise) {
        const scriptCode = await scriptCodePromise;
        if (!scriptCode) {
            return null;
        }
        return this.createWkUserScript(scriptCode);
    }
    async addUserScriptFromPromise(userScriptPromise) {
        const userScript = await userScriptPromise;
        if (!userScript) {
            return;
        }
        return this.addUserScript(userScript);
    }
    addUserScript(userScript) {
        if (!userScript) {
            return;
        }
        this.wkUserContentController.addUserScript(userScript);
    }
    /**
     * iOS11+
     *
     * Add/replace a named WKUserScript.
     * These scripts will be injected when a new document is loaded.
     */
    addNamedWKUserScript(resourceName, scriptCode) {
        if (!scriptCode) {
            return;
        }
        this.removeNamedWKUserScript(resourceName);
        const wkUserScript = this.createWkUserScript(scriptCode);
        this.wkNamedUserScripts.push({ resourceName, wkUserScript });
        this.addUserScript(wkUserScript);
    }
    /**
     * iOS11+
     *
     * Factory function for creating a WKUserScript instance.
     */
    createWkUserScript(source) {
        return WKUserScript.alloc().initWithSourceInjectionTimeForMainFrameOnly(source, 1 /* WKUserScriptInjectionTime.AtDocumentEnd */, true);
    }
}
WebViewExt.supportXLocalScheme = typeof CustomUrlSchemeHandler !== 'undefined';
__decorate([
    profile,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WebViewExt.prototype, "onLoaded", null);
export { WebViewExt };
export var WKNavigationDelegateNotaImpl = /** @class */ (function (_super) {
    __extends(WKNavigationDelegateNotaImpl, _super);
    function WKNavigationDelegateNotaImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WKNavigationDelegateNotaImpl.initWithOwner = function (owner) {
        var handler = WKNavigationDelegateNotaImpl.new();
        handler.owner = owner;
        return handler;
    };
    WKNavigationDelegateNotaImpl.prototype.webViewDecidePolicyForNavigationActionDecisionHandler = function (webView, navigationAction, decisionHandler) {
        var owner = this.owner.get();
        if (!owner) {
            decisionHandler(WKNavigationActionPolicy.Cancel);
            return;
        }
        var request = navigationAction.request;
        var httpMethod = request.HTTPMethod;
        var url = request.URL && request.URL.absoluteString;
        owner.writeTrace("webViewDecidePolicyForNavigationActionDecisionHandler: \"".concat(url, "\""));
        if (!url) {
            return;
        }
        var navType = 'other';
        switch (navigationAction.navigationType) {
            case WKNavigationType.LinkActivated: {
                navType = 'linkClicked';
                break;
            }
            case WKNavigationType.FormSubmitted: {
                navType = 'formSubmitted';
                break;
            }
            case WKNavigationType.BackForward: {
                navType = 'backForward';
                break;
            }
            case WKNavigationType.Reload: {
                navType = 'reload';
                break;
            }
            case WKNavigationType.FormResubmitted: {
                navType = 'formResubmitted';
                break;
            }
            default: {
                navType = 'other';
                break;
            }
        }
        var shouldOverrideUrlLoading = owner._onShouldOverrideUrlLoading(url, httpMethod, navType);
        if (shouldOverrideUrlLoading === true) {
            owner.writeTrace("WKNavigationDelegateClass.webViewDecidePolicyForNavigationActionDecisionHandler(\"".concat(url, "\", \"").concat(navigationAction.navigationType, "\") -> method:").concat(httpMethod, " \"").concat(navType, "\" -> cancel"));
            decisionHandler(WKNavigationActionPolicy.Cancel);
            return;
        }
        decisionHandler(WKNavigationActionPolicy.Allow);
        owner.writeTrace("WKNavigationDelegateClass.webViewDecidePolicyForNavigationActionDecisionHandler(\"".concat(url, "\", \"").concat(navigationAction.navigationType, "\") -> method:").concat(httpMethod, " \"").concat(navType, "\""));
        owner._onLoadStarted(url, navType);
    };
    WKNavigationDelegateNotaImpl.prototype.webViewDidStartProvisionalNavigation = function (webView, navigation) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        owner.writeTrace("WKNavigationDelegateClass.webViewDidStartProvisionalNavigation(\"".concat(webView.URL, "\")"));
    };
    WKNavigationDelegateNotaImpl.prototype.webViewDidFinishNavigation = function (webView, navigation) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        owner.writeTrace("WKNavigationDelegateClass.webViewDidFinishNavigation(\"".concat(webView.URL, "\")"));
        var src = owner.src;
        if (webView.URL) {
            src = webView.URL.absoluteString;
        }
        owner._onLoadFinished(src).catch(function () { return void 0; });
    };
    WKNavigationDelegateNotaImpl.prototype.webViewDidFailNavigationWithError = function (webView, navigation, error) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        var src = owner.src;
        if (webView.URL) {
            src = webView.URL.absoluteString;
        }
        owner.writeTrace("WKNavigationDelegateClass.webViewDidFailNavigationWithError(\"".concat(error.localizedDescription, "\")"));
        owner._onLoadFinished(src, error.localizedDescription).catch(function () { return void 0; });
    };
    WKNavigationDelegateNotaImpl.prototype.webViewDidFailProvisionalNavigationWithError = function (webView, navigation, error) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        var src = owner.src;
        if (webView.URL && webView.URL.absoluteString) {
            src = webView.URL.absoluteString;
        }
        owner.writeTrace("WKNavigationDelegateClass.webViewDidFailProvisionalNavigationWithError(".concat(error.localizedDescription));
        owner._onLoadFinished(src, error.localizedDescription).catch(function () { return void 0; });
    };
    WKNavigationDelegateNotaImpl.ObjCProtocols = [WKNavigationDelegate];
    return WKNavigationDelegateNotaImpl;
}(NSObject));
export var WKScriptMessageHandlerNotaImpl = /** @class */ (function (_super) {
    __extends(WKScriptMessageHandlerNotaImpl, _super);
    function WKScriptMessageHandlerNotaImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WKScriptMessageHandlerNotaImpl.initWithOwner = function (owner) {
        var delegate = WKScriptMessageHandlerNotaImpl.new();
        delegate.owner = owner;
        return delegate;
    };
    WKScriptMessageHandlerNotaImpl.prototype.userContentControllerDidReceiveScriptMessage = function (userContentController, webViewMessage) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        try {
            var message = JSON.parse(webViewMessage.body);
            owner.onWebViewEvent(message.eventName, message.data);
        }
        catch (err) {
            owner.writeTrace("userContentControllerDidReceiveScriptMessage(".concat(userContentController, ", ").concat(webViewMessage, ") - bad message: ").concat(JSON.stringify(webViewMessage.body)), Trace.messageType.error);
        }
    };
    WKScriptMessageHandlerNotaImpl.ObjCProtocols = [WKScriptMessageHandler];
    return WKScriptMessageHandlerNotaImpl;
}(NSObject));
export var WKUIDelegateNotaImpl = /** @class */ (function (_super) {
    __extends(WKUIDelegateNotaImpl, _super);
    function WKUIDelegateNotaImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WKUIDelegateNotaImpl.initWithOwner = function (owner) {
        var delegate = WKUIDelegateNotaImpl.new();
        delegate.owner = owner;
        console.log(delegate);
        return delegate;
    };
    /**
     * Handle alerts from the webview
     */
    WKUIDelegateNotaImpl.prototype.webViewRunJavaScriptAlertPanelWithMessageInitiatedByFrameCompletionHandler = function (webView, message, frame, completionHandler) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        var gotResponse = false;
        owner._webAlert(message, function () {
            if (!gotResponse) {
                completionHandler();
            }
            gotResponse = true;
        });
    };
    /**
     * Handle confirm dialogs from the webview
     */
    WKUIDelegateNotaImpl.prototype.webViewRunJavaScriptConfirmPanelWithMessageInitiatedByFrameCompletionHandler = function (webView, message, frame, completionHandler) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        var gotResponse = false;
        owner._webConfirm(message, function (confirmed) {
            if (!gotResponse) {
                completionHandler(confirmed);
            }
            gotResponse = true;
        });
    };
    /**
     * Handle prompt dialogs from the webview
     */
    WKUIDelegateNotaImpl.prototype.webViewRunJavaScriptTextInputPanelWithPromptDefaultTextInitiatedByFrameCompletionHandler = function (webView, message, defaultText, frame, completionHandler) {
        var owner = this.owner.get();
        if (!owner) {
            return;
        }
        var gotResponse = false;
        owner._webPrompt(message, defaultText, function (response) {
            if (!gotResponse) {
                completionHandler(response);
            }
            gotResponse = true;
        });
    };
    WKUIDelegateNotaImpl.ObjCProtocols = [WKUIDelegate];
    return WKUIDelegateNotaImpl;
}(NSObject));
//# sourceMappingURL=index.ios.js.map