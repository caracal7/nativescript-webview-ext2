import '@nativescript/core';
import { WebViewExtBase } from './common';
export * from './common';
export interface AndroidWebViewClient extends android.webkit.WebViewClient {
}
export interface AndroidWebView extends android.webkit.WebView {
    client: AndroidWebViewClient | null;
    chromeClient: android.webkit.WebChromeClient | null;
    bridgeInterface?: dk.nota.webviewinterface.WebViewBridgeInterface;
}
export declare class WebViewExt extends WebViewExtBase {
    static supportXLocalScheme: boolean;
    nativeViewProtected: AndroidWebView | void;
    protected readonly localResourceMap: Map<string, string>;
    supportXLocalScheme: boolean;
    readonly instance: number;
    android: AndroidWebView;
    createNativeView(): AndroidWebView;
    initNativeView(): void;
    disposeNativeView(): void;
    ensurePromiseSupport(): Promise<void>;
    _loadUrl(src: string): void;
    _loadData(src: string): void;
    get canGoBack(): boolean;
    stopLoading(): void;
    get canGoForward(): boolean;
    goBack(): void;
    goForward(): void;
    reload(): void;
    registerLocalResource(resourceName: string, path: string): void;
    unregisterLocalResource(resourceName: string): void;
    getRegisteredLocalResource(resourceName: string): string;
    /**
     * Always load the Fetch-polyfill on Android.
     *
     * Native 'Fetch API' on Android rejects all request for resources no HTTP or HTTPS.
     * This breaks x-local:// requests (and file://).
     */
    ensureFetchSupport(): Promise<void>;
    executeJavaScript<T>(scriptCode: string): Promise<T>;
    getTitle(): Promise<string>;
    zoomIn(): boolean;
    zoomOut(): boolean;
    zoomBy(zoomFactor: number): void;
}
