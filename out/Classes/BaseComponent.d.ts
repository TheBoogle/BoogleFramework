import Signal from "@rbxts/signal";
export declare abstract class BaseComponent<T extends Instance> {
    protected ComponentInstance: T;
    protected Instance: T;
    readonly ID: string;
    protected RenderStep: RBXScriptConnection | undefined;
    protected Heartbeat: RBXScriptConnection | undefined;
    readonly Destroyed: Signal<(Manual: boolean) => void, false>;
    constructor(ComponentInstance: T, ID?: string);
    static GetAttributeName(): string;
    static GetServerAttribute(): string;
    static GetClientAttribute(): string;
    Initialize(): void;
    GetName(): string;
    static GetClassName(): string;
    protected TagInstance(ForceName?: string): void;
    protected InitializeRenderStep(): void;
    protected InitializeHeartbeat(): void;
    Stop(): void;
    Destroy(): void;
    GetInstance(): T;
    protected RenderUpdate(DeltaTime: number): void;
    protected PhysicsUpdate(DeltaTime: number): void;
}
