import { CollectionService, RunService, ServerScriptService, StarterPlayer, Workspace } from "@rbxts/services";
import { IComponentManifest } from "../Types/IComponentManifest";
import { BaseComponent } from "../Classes/BaseComponent";
import { BaseController } from "../Classes/BaseController";
import { BullshitHelpers } from "../Services/BullshitHelpers";
import { ComponentService } from "../Services/ComponentService";

export class ComponentController extends BaseController {
	public static ComponentManifest: IComponentManifest = [];

	public static GetComponentsFolder(): Folder | undefined {
		const BasePath = RunService.IsClient()
			? StarterPlayer.FindFirstChild("StarterPlayerScripts")
			: ServerScriptService;

		return BasePath?.FindFirstChild("TS")
			?.FindFirstChild("Logic")
			?.FindFirstChild("Classes")
			?.FindFirstChild("Components") as Folder;
	}

	public override async Initialize() {
		super.Initialize();

		const ComponentsFolder = ComponentController.GetComponentsFolder();

		if (!ComponentsFolder) {
			throw "Failed to find Components folder";
		}

		const RequiredComponents = new Array<typeof BaseComponent<Instance>>();

		ComponentsFolder.GetChildren().forEach((Component) => {
			if (Component.IsA("ModuleScript")) {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const RequiredComponent = require(Component) as typeof BaseComponent<Instance>;

				RequiredComponents.push(RequiredComponent);
			}
		});

		for (const ComponentToRegister of ComponentController.ComponentManifest) {
			const ComponentAdded = (Instance: Instance): void => {
				if (!Instance.IsDescendantOf(Workspace)) {
					Instance.AncestryChanged.Once(() => {
						if (Instance.IsDescendantOf(Workspace)) {
							ComponentAdded(Instance);
						}
					});
					return;
				}

				const [WasSuccess, Result] = pcall(() => {
					task.spawn(() => {
						if (ComponentService.GetComponent(Instance)) {
							// warn("Component already registered", ComponentToRegister, "on", Instance);

							return;
						}

						ComponentService.RegisterComponent(
							Instance,
							ComponentToRegister as unknown as new (instance: Instance) => BaseComponent<Instance>,
						);
					});
				});

				if (!WasSuccess) {
					BullshitHelpers.LogWarning(
						"Failed to register component",
						ComponentToRegister,
						"on",
						Instance,
						Result,
					);
				}
			};

			const Name = tostring(ComponentToRegister);

			if (Name === "Component") {
				BullshitHelpers.LogWarning(`Component Name: {${Name}} is reserved`);

				return;
			}

			CollectionService.GetTagged(Name).forEach(ComponentAdded);

			CollectionService.GetInstanceAddedSignal(Name).Connect(ComponentAdded);
		}

		task.delay(5, () => {
			// Go through the manifest, check if any components have not been registered yet
			const RegisteredComponents = ComponentService.GetAllComponents().map((Component) => Component.GetName());

			const UnregisteredComponents = ComponentController.ComponentManifest.filter((ComponentToRegister) => {
				// InstanceOf check
				const ComponentName = tostring(ComponentToRegister);

				return !RegisteredComponents.includes(ComponentName);
			});

			if (UnregisteredComponents.size() > 0) {
				BullshitHelpers.LogWarning(
					"The following components have not been utilized:",
					UnregisteredComponents.map((Component) => tostring(Component)).join(", "),
				);
			}
		});
	}

	public override async PostInitialize() {
		super.PostInitialize();

		BullshitHelpers.LogSuccess(`${ComponentController.ComponentManifest.size()} components registered`);
	}
}

export function RegisterComponent<T extends typeof BaseComponent<Instance>>(Component: T) {
	if (!ComponentController.ComponentManifest.includes(Component)) {
		ComponentController.ComponentManifest.push(Component);

		// BullshitHelpers.LogSuccess(`Registered component ${tostring(Component)}`);
	} else {
		BullshitHelpers.LogWarning(`Component ${tostring(Component)} already registered`);
	}
}
