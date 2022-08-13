export interface Span {
    setTag: (tag: string, value: any) => void;
    log: (attrs: any) => void;
    finish: () => void;
    context: () => any;
}
export declare class NullSpan implements Span {
    setTag(): void;
    log(): void;
    finish(): void;
    context(): {};
}
export interface TraceService {
    startSpan: (name: string, attrs: any) => Span;
}
