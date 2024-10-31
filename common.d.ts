import '@nativescript/core';
import { ContainerView, EventData, Property } from '@nativescript/core';
export interface ViewPortProperties {
    width?: number | 'device-width';
    height?: number | 'device-height';
    initialScale?: number;
    maximumScale?: number;
    minimumScale?: number;
    userScalable?: boolean;
}
export type CacheMode = 'default' | 'cache_first' | 'no_cache' | 'cache_only' | 'normal';
export declare const autoInjectJSBridgeProperty: Property<WebViewExtBase, boolean>;
export declare const builtInZoomControlsProperty: Property<WebViewExtBase, boolean>;
export declare const cacheModeProperty: Property<WebViewExtBase, CacheMode>;
export declare const databaseStorageProperty: Property<WebViewExtBase, boolean>;
export declare const domStorageProperty: Property<WebViewExtBase, boolean>;
export declare const debugModeProperty: Property<WebViewExtBase, boolean>;
export declare const displayZoomControlsProperty: Property<WebViewExtBase, boolean>;
export declare const supportZoomProperty: Property<WebViewExtBase, boolean>;
export declare const srcProperty: Property<WebViewExtBase, string>;
export declare const scrollBounceProperty: Property<WebViewExtBase, boolean>;
export declare const limitsNavigationsToAppBoundDomainsProperty: Property<WebViewExtBase, boolean>;
export type ViewPortValue = boolean | ViewPortProperties;
export declare const viewPortProperty: Property<WebViewExtBase, ViewPortValue>;
export declare enum EventNames {
    LoadFinished = "loadFinished",
    LoadProgress = "loadProgress",
    LoadStarted = "loadStarted",
    ShouldOverrideUrlLoading = "shouldOverrideUrlLoading",
    TitleChanged = "titleChanged",
    WebAlert = "webAlert",
    WebConfirm = "webConfirm",
    WebConsole = "webConsole",
    EnterFullscreen = "enterFullscreen",
    ExitFullscreen = "exitFullscreen",
    WebPrompt = "webPrompt"
}
export interface LoadJavaScriptResource {
    resourceName: string;
    filepath: string;
}
export interface LoadStyleSheetResource {
    resourceName: string;
    filepath: string;
    insertBefore?: boolean;
}
export interface InjectExecuteJavaScript {
    scriptCode: string;
    name: string;
}
export interface WebViewExtEventData extends EventData {
    object: WebViewExtBase;
}
/**
 * Event data containing information for the loading events of a WebView.
 */
export interface LoadEventData extends WebViewExtEventData {
    /**
     * Gets the url of the web-view.
     */
    url: string;
    /**
     * Gets the navigation type of the web-view.
     */
    navigationType?: NavigationType;
    /**
     * Gets the error (if any).
     */
    error?: string;
}
export interface LoadStartedEventData extends LoadEventData {
    eventName: EventNames.LoadStarted;
}
export interface LoadFinishedEventData extends LoadEventData {
    eventName: EventNames.LoadFinished;
}
export interface ShouldOverrideUrlLoadEventData extends LoadEventData {
    eventName: EventNames.ShouldOverrideUrlLoading;
    httpMethod: string;
    /** Flip this to true in your callback, if you want to cancel the url-loading */
    cancel?: boolean;
}
/** BackForward compat for spelling error... */
export interface ShouldOverideUrlLoadEventData extends ShouldOverrideUrlLoadEventData {
}
export interface LoadProgressEventData extends WebViewExtEventData {
    eventName: EventNames.LoadProgress;
    url: string;
    progress: number;
}
export interface TitleChangedEventData extends WebViewExtEventData {
    eventName: EventNames.TitleChanged;
    url: string;
    title: string;
}
export interface WebAlertEventData extends WebViewExtEventData {
    eventName: EventNames.WebAlert;
    url: string;
    message: string;
    callback: () => void;
}
export interface WebPromptEventData extends WebViewExtEventData {
    eventName: EventNames.WebPrompt;
    url: string;
    message: string;
    defaultText?: string;
    callback: (response?: string) => void;
}
export interface WebConfirmEventData extends WebViewExtEventData {
    eventName: EventNames.WebConfirm;
    url: string;
    message: string;
    callback: (response: boolean) => void;
}
export interface WebConsoleEventData extends WebViewExtEventData {
    eventName: EventNames.WebConsole;
    url: string;
    data: {
        lineNo: number;
        message: string;
        level: string;
    };
}
/**
 * Event data containing information for the loading events of a WebView.
 */
export interface WebViewEventData extends WebViewExtEventData {
    data?: any;
}
export interface EnterFullscreenEventData extends WebViewExtEventData {
    eventName: EventNames.EnterFullscreen;
    url: string;
    exitFullscreen(): void;
}
export interface ExitFullscreenEventData extends WebViewExtEventData {
    eventName: EventNames.ExitFullscreen;
    url: string;
}
/**
 * Represents navigation type
 */
export type NavigationType = 'linkClicked' | 'formSubmitted' | 'backForward' | 'reload' | 'formResubmitted' | 'other' | void;
export declare class UnsupportedSDKError extends Error {
    constructor(minSdk: number);
}
export declare class WebViewExtBase extends ContainerView {
    static readonly supportXLocalScheme: boolean;
    /**
     * Is Fetch API supported?
     *
     * Note: Android's Native Fetch API needs to be replaced with the polyfill.
     */
    static isFetchSupported: boolean;
    /**
     * Does this platform's WebView support promises?
     */
    static isPromiseSupported: boolean;
    /**
     * Gets the native [android widget](http://developer.android.com/reference/android/webkit/WebView.html) that represents the user interface for this component. Valid only when running on Android OS.
     */
    android: any;
    /**
     * Gets the native [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview/) that represents the user interface for this component. Valid only when running on iOS 11+.
     */
    ios: any;
    get interceptScheme(): string;
    /**
     * String value used when hooking to loadStarted event.
     */
    static get loadStartedEvent(): EventNames;
    /**
     * String value used when hooking to loadFinished event.
     */
    static get loadFinishedEvent(): EventNames;
    /** String value used when hooking to shouldOverrideUrlLoading event */
    static get shouldOverrideUrlLoadingEvent(): EventNames;
    static get loadProgressEvent(): EventNames;
    static get titleChangedEvent(): EventNames;
    static get webAlertEvent(): EventNames;
    static get webConfirmEvent(): EventNames;
    static get webPromptEvent(): EventNames;
    static get webConsoleEvent(): EventNames;
    static get enterFullscreenEvent(): EventNames;
    static get exitFullscreenEvent(): EventNames;
    readonly supportXLocalScheme: boolean;
    /**
     * Gets or sets the url, local file path or HTML string.
     */
    src: string;
    /**
     * Auto Inject WebView JavaScript Bridge on load finished? Defaults to true.
     */
    autoInjectJSBridge: boolean;
    /**
     * Android: Enable/disable debug-mode
     */
    debugMode: boolean;
    /**
     * Android: Is the built-in zoom mechanisms being used
     */
    builtInZoomControls: boolean;
    /**
     * Android: displays on-screen zoom controls when using the built-in zoom mechanisms
     */
    displayZoomControls: boolean;
    /**
     * Android: Enable/Disabled database storage API.
     * Note: It affects all webviews in the process.
     */
    databaseStorage: boolean;
    /**
     * Android: Enable/Disabled DOM Storage API. E.g localStorage
     */
    domStorage: boolean;
    /**
     * Android: should the webview support zoom
     */
    supportZoom: boolean;
    /**
     * iOS: Should the scrollView bounce? Defaults to true.
     */
    scrollBounce: boolean;
    /**
     * Set viewport metadata for the webview.
     * Set to false to disable.
     *
     * **Note**: WkWebView defaults initial-scale=1.0.
     */
    viewPortSize: ViewPortValue;
    cacheMode: 'default' | 'no_cache' | 'cache_first' | 'cache_only';
    /**
     * List of js-files to be auto injected on load finished
     */
    protected autoInjectScriptFiles: LoadJavaScriptResource[];
    /**
     * List of css-files to be auto injected on load finished
     */
    protected autoInjectStyleSheetFiles: LoadStyleSheetResource[];
    /**
     * List of code blocks to be executed after JS-files and CSS-files have been loaded.
     */
    protected autoInjectJavaScriptBlocks: InjectExecuteJavaScript[];
    /**
     * Prevent this.src loading changes from the webview's onLoadFinished-event
     */
    protected tempSuspendSrcLoading: boolean;
    /**
     * Callback for the loadFinished-event. Called from the native-webview
     */
    _onLoadFinished(url: string, error?: string): Promise<LoadFinishedEventData>;
    /**
     * Callback for onLoadStarted-event from the native webview
     *
     * @param url URL being loaded
     * @param navigationType Type of navigation (iOS-only)
     */
    _onLoadStarted(url: string, navigationType?: NavigationType): void;
    /**
     * Callback for should override url loading.
     * Called from the native-webview
     *
     * @param url
     * @param httpMethod GET, POST etc
     * @param navigationType Type of navigation (iOS-only)
     */
    _onShouldOverrideUrlLoading(url: string, httpMethod: string, navigationType?: NavigationType): boolean;
    _loadProgress(progress: number): void;
    _titleChanged(title: string): void;
    _webAlert(message: string, callback: () => void): boolean;
    _webConfirm(message: string, callback: (response: boolean | null) => void): boolean;
    _webPrompt(message: string, defaultText: string, callback: (response: string | null) => void): boolean;
    _webConsole(message: string, lineNo: number, level: string): boolean;
    _onEnterFullscreen(exitFullscreen: () => void): boolean;
    _onExitFullscreen(): boolean;
    /**
     * Platform specific loadURL-implementation.
     */
    _loadUrl(src: string): void;
    /**
     * Platform specific loadData-implementation.
     */
    _loadData(src: string): void;
    /**
     * Stops loading the current content (if any).
     */
    stopLoading(): void;
    /**
     * Gets a value indicating whether the WebView can navigate back.
     */
    get canGoBack(): boolean;
    /**
     * Gets a value indicating whether the WebView can navigate forward.
     */
    get canGoForward(): boolean;
    /**
     * Navigates back.
     */
    goBack(): void;
    /**
     * Navigates forward.
     */
    goForward(): void;
    /**
     * Reloads the current url.
     */
    reload(): void;
    resolveLocalResourceFilePath(filepath: string): string | void;
    /**
     * Register a local resource.
     * This resource can be loaded via "x-local://{name}" inside the webview
     */
    registerLocalResource(name: string, filepath: string): void;
    /**
     * Unregister a local resource.
     */
    unregisterLocalResource(name: string): void;
    /**
     * Resolve a "x-local://{name}" to file-path.
     */
    getRegisteredLocalResource(name: string): string | void;
    /**
     * Load URL - Wait for promise
     *
     * @param {string} src
     * @returns {Promise<LoadFinishedEventData>}
     */
    loadUrl(src: string): Promise<LoadFinishedEventData>;
    /**
     * Load a JavaScript file on the current page in the webview.
     */
    loadJavaScriptFile(scriptName: string, filepath: string): Promise<void>;
    /**
     * Load multiple JavaScript-files on the current page in the webview.
     */
    loadJavaScriptFiles(files: LoadStyleSheetResource[]): Promise<void>;
    /**
     * Load a stylesheet file on the current page in the webview.
     */
    loadStyleSheetFile(stylesheetName: string, filepath: string, insertBefore?: boolean): Promise<void>;
    /**
     * Load multiple stylesheet-files on the current page in the webview
     */
    loadStyleSheetFiles(files: LoadStyleSheetResource[]): Promise<void>;
    /**
     * Auto-load a JavaScript-file after the page have been loaded.
     */
    autoLoadJavaScriptFile(resourceName: string, filepath: string): void;
    removeAutoLoadJavaScriptFile(resourceName: string): void;
    /**
     * Auto-load a stylesheet-file after the page have been loaded.
     */
    autoLoadStyleSheetFile(resourceName: string, filepath: string, insertBefore?: boolean): void;
    removeAutoLoadStyleSheetFile(resourceName: string): void;
    autoExecuteJavaScript(scriptCode: string, name: string): void;
    removeAutoExecuteJavaScript(name: string): void;
    normalizeURL(url: string): string;
    /**
     * Ensure fetch-api is available.
     */
    protected ensureFetchSupport(): Promise<void>;
    protected loadFetchPolyfill(): Promise<void>;
    /**
     * Older Android WebView don't support promises.
     * Inject the promise-polyfill if needed.
     */
    protected ensurePromiseSupport(): Promise<void>;
    protected loadPromisePolyfill(): Promise<void>;
    protected ensurePolyfills(): Promise<void>;
    /**
     * Execute JavaScript inside the webview.
     * The code should be wrapped inside an anonymous-function.
     * Larger scripts should be injected with loadJavaScriptFile.
     * NOTE: stringifyResult only applies on iOS.
     */
    executeJavaScript<T>(scriptCode: string, stringifyResult?: boolean): Promise<T>;
    /**
     * Execute a promise inside the webview and wait for it to resolve.
     * Note: The scriptCode must return a promise.
     */
    executePromise<T>(scriptCode: string, timeout?: number): Promise<T>;
    executePromises<T>(scriptCodes: string[], timeout?: number): Promise<T | void>;
    /**
     * Generate script code for loading javascript-file.
     */
    generateLoadJavaScriptFileScriptCode(resourceName: string, path: string): Promise<string>;
    /**
     * Generate script code for loading CSS-file.generateLoadCSSFileScriptCode
     */
    generateLoadCSSFileScriptCode(resourceName: string, path: string, insertBefore?: boolean): Promise<string>;
    /**
     * Inject WebView JavaScript Bridge.
     */
    protected injectWebViewBridge(): Promise<void>;
    protected injectViewPortMeta(): Promise<void>;
    generateViewPortCode(): Promise<string | null>;
    /**
     * Convert response from WebView into usable JS-type.
     */
    protected parseWebViewJavascriptResult(result: any): any;
    writeTrace(message: string, type?: number): void;
    /**
     * Emit event into the webview.
     */
    emitToWebView(eventName: string, data: any): void;
    /**
     * Called from delegate on webview event.
     * Triggered by: window.nsWebViewBridge.emit(eventName: string, data: any); inside the webview
     */
    onWebViewEvent(eventName: string, data: any): void;
    /**
     * Get document.title
     * NOTE: On Android, if empty returns filename
     */
    getTitle(): Promise<string | void>;
    zoomIn(): boolean;
    zoomOut(): boolean;
    zoomBy(zoomFactor: number): void;
    /**
     * Helper function, strips 'x-local://' from a resource name
     */
    fixLocalResourceName(resourceName: string): string;
}
export interface WebViewExtBase {
    /**
     * A basic method signature to hook an event listener (shortcut alias to the addEventListener method).
     * @param eventNames - String corresponding to events (e.g. "propertyChange"). Optionally could be used more events separated by `,` (e.g. "propertyChange", "change").
     * @param callback - Callback function which will be executed when event is raised.
     * @param thisArg - An optional parameter which will be used as `this` context for callback execution.
     */
    on(eventNames: string, callback: (data: WebViewEventData) => void, thisArg?: any): any;
    once(eventNames: string, callback: (data: WebViewEventData) => void, thisArg?: any): any;
    /**
     * Raised before the webview requests an URL.
     * Can be cancelled by settings args.cancel = true in your event handler.
     */
    on(event: EventNames.ShouldOverrideUrlLoading, callback: (args: ShouldOverrideUrlLoadEventData) => void, thisArg?: any): any;
    once(event: EventNames.ShouldOverrideUrlLoading, callback: (args: ShouldOverrideUrlLoadEventData) => void, thisArg?: any): any;
    /**
     * Raised when a loadStarted event occurs.
     */
    on(event: EventNames.LoadStarted, callback: (args: LoadStartedEventData) => void, thisArg?: any): any;
    once(event: EventNames.LoadStarted, callback: (args: LoadStartedEventData) => void, thisArg?: any): any;
    /**
     * Raised when a loadFinished event occurs.
     */
    on(event: EventNames.LoadFinished, callback: (args: LoadFinishedEventData) => void, thisArg?: any): any;
    once(event: EventNames.LoadFinished, callback: (args: LoadFinishedEventData) => void, thisArg?: any): any;
    /**
     * Raised when a loadProgress event occurs.
     */
    on(event: EventNames.LoadProgress, callback: (args: LoadProgressEventData) => void, thisArg?: any): any;
    once(event: EventNames.LoadProgress, callback: (args: LoadProgressEventData) => void, thisArg?: any): any;
    /**
     * Raised when a titleChanged event occurs.
     */
    on(event: EventNames.TitleChanged, callback: (args: TitleChangedEventData) => void, thisArg?: any): any;
    once(event: EventNames.TitleChanged, callback: (args: TitleChangedEventData) => void, thisArg?: any): any;
    /**
     * Override web alerts to replace them.
     * Call args.cancel() on close.
     */
    on(event: EventNames.WebAlert, callback: (args: WebAlertEventData) => void, thisArg?: any): any;
    once(event: EventNames.WebAlert, callback: (args: WebAlertEventData) => void, thisArg?: any): any;
    /**
     * Override web confirm dialogs to replace them.
     * Call args.cancel(res) on close.
     */
    on(event: EventNames.WebConfirm, callback: (args: WebConfirmEventData) => void, thisArg?: any): any;
    once(event: EventNames.WebConfirm, callback: (args: WebConfirmEventData) => void, thisArg?: any): any;
    /**
     * Override web confirm prompts to replace them.
     * Call args.cancel(res) on close.
     */
    on(event: EventNames.WebPrompt, callback: (args: WebPromptEventData) => void, thisArg?: any): any;
    once(event: EventNames.WebPrompt, callback: (args: WebPromptEventData) => void, thisArg?: any): any;
    /**
     * Get Android WebView console entries.
     */
    on(event: EventNames.WebConsole, callback: (args: WebConsoleEventData) => void, thisArg?: any): any;
    once(event: EventNames.WebConsole, callback: (args: WebConsoleEventData) => void, thisArg?: any): any;
}
