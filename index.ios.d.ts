import '@nativescript/core';
import { WebViewExtBase } from './common';
export * from './common';
export declare class WebViewExt extends WebViewExtBase {
    ios: WKWebView;
    static supportXLocalScheme: boolean;
    protected wkWebViewConfiguration: WKWebViewConfiguration;
    protected wkNavigationDelegate: WKNavigationDelegateNotaImpl;
    protected wkUIDelegate: WKUIDelegateNotaImpl;
    protected wkCustomUrlSchemeHandler: CustomUrlSchemeHandler | void;
    protected wkUserContentController: WKUserContentController;
    protected wkUserScriptInjectWebViewBridge?: WKUserScript;
    protected wkUserScriptViewPortCode: Promise<WKUserScript | null> | null;
    protected wkNamedUserScripts: {
        resourceName: string;
        wkUserScript: WKUserScript;
    }[];
    readonly supportXLocalScheme: boolean;
    viewPortSize: {
        initialScale: number;
    };
    private limitsNavigationsToAppBoundDomains;
    createNativeView(): WKWebView;
    initNativeView(): void;
    disposeNativeView(): void;
    protected injectWebViewBridge(): Promise<void>;
    protected injectViewPortMeta(): Promise<void>;
    executeJavaScript<T>(scriptCode: string, stringifyResult?: boolean): Promise<T>;
    onLoaded(): void;
    onUnloaded(): void;
    stopLoading(): void;
    _loadUrl(src: string): void;
    _loadData(content: string): void;
    get canGoBack(): boolean;
    get canGoForward(): boolean;
    goBack(): void;
    goForward(): void;
    reload(): void;
    _webAlert(message: string, callback: () => void): boolean;
    _webConfirm(message: string, callback: (response: boolean | null) => void): boolean;
    _webPrompt(message: string, defaultText: string, callback: (response: string | null) => void): boolean;
    registerLocalResource(resourceName: string, path: string): void;
    unregisterLocalResource(resourceName: string): void;
    getRegisteredLocalResource(resourceName: string): string;
    getTitle(): Promise<string>;
    autoLoadStyleSheetFile(resourceName: string, path: string, insertBefore?: boolean): Promise<void>;
    removeAutoLoadStyleSheetFile(resourceName: string): void;
    autoLoadJavaScriptFile(resourceName: string, path: string): Promise<void>;
    removeAutoLoadJavaScriptFile(resourceName: string): void;
    /**
     * iOS11+
     *
     * Sets up loading WKUserScripts
     *
     * @param autoInjectJSBridge If true viewport-code, bridge-code and named scripts will be loaded, if false only viewport-code
     */
    protected loadWKUserScripts(autoInjectJSBridge?: boolean): void;
    /**
     * iOS11+
     *
     * Remove a named WKUserScript
     */
    protected removeNamedWKUserScript(resourceName: string): void;
    protected resetViewPortCode(): Promise<void>;
    protected registerLocalResourceForNative(resourceName: string, filepath: string): void;
    protected unregisterLocalResourceForNative(resourceName: string): void;
    protected getRegisteredLocalResourceFromNative(resourceName: string): string;
    protected makeWKUserScriptPromise(scriptCodePromise: Promise<string | null>): Promise<WKUserScript | null>;
    protected addUserScriptFromPromise(userScriptPromise: Promise<WKUserScript | null>): Promise<void>;
    protected addUserScript(userScript: WKUserScript | null): void;
    /**
     * iOS11+
     *
     * Add/replace a named WKUserScript.
     * These scripts will be injected when a new document is loaded.
     */
    protected addNamedWKUserScript(resourceName: string, scriptCode: string): void;
    /**
     * iOS11+
     *
     * Factory function for creating a WKUserScript instance.
     */
    protected createWkUserScript(source: string): WKUserScript;
}
export declare class WKNavigationDelegateNotaImpl extends NSObject implements WKNavigationDelegate {
    static ObjCProtocols: {
        prototype: WKNavigationDelegate;
    }[];
    static initWithOwner(owner: WeakRef<WebViewExt>): WKNavigationDelegateNotaImpl;
    private owner;
    webViewDecidePolicyForNavigationActionDecisionHandler(webView: WKWebView, navigationAction: WKNavigationAction, decisionHandler: (policy: WKNavigationActionPolicy) => void): void;
    webViewDidStartProvisionalNavigation(webView: WKWebView, navigation: WKNavigation): void;
    webViewDidFinishNavigation(webView: WKWebView, navigation: WKNavigation): void;
    webViewDidFailNavigationWithError(webView: WKWebView, navigation: WKNavigation, error: NSError): void;
    webViewDidFailProvisionalNavigationWithError(webView: WKWebView, navigation: WKNavigation, error: NSError): void;
}
export declare class WKScriptMessageHandlerNotaImpl extends NSObject implements WKScriptMessageHandler {
    static ObjCProtocols: {
        prototype: WKScriptMessageHandler;
    }[];
    private owner;
    static initWithOwner(owner: WeakRef<WebViewExtBase>): WKScriptMessageHandlerNotaImpl;
    userContentControllerDidReceiveScriptMessage(userContentController: WKUserContentController, webViewMessage: WKScriptMessage): void;
}
export declare class WKUIDelegateNotaImpl extends NSObject implements WKUIDelegate {
    static ObjCProtocols: {
        prototype: WKUIDelegate;
    }[];
    owner: WeakRef<WebViewExt>;
    static initWithOwner(owner: WeakRef<WebViewExt>): WKUIDelegateNotaImpl;
    /**
     * Handle alerts from the webview
     */
    webViewRunJavaScriptAlertPanelWithMessageInitiatedByFrameCompletionHandler(webView: WKWebView, message: string, frame: WKFrameInfo, completionHandler: () => void): void;
    /**
     * Handle confirm dialogs from the webview
     */
    webViewRunJavaScriptConfirmPanelWithMessageInitiatedByFrameCompletionHandler(webView: WKWebView, message: string, frame: WKFrameInfo, completionHandler: (confirmed: boolean) => void): void;
    /**
     * Handle prompt dialogs from the webview
     */
    webViewRunJavaScriptTextInputPanelWithPromptDefaultTextInitiatedByFrameCompletionHandler(webView: WKWebView, message: string, defaultText: string, frame: WKFrameInfo, completionHandler: (response: string) => void): void;
}
