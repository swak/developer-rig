import { ExtensionManifest } from './manifest';

export interface RigProject {
  extensionViews: RigExtensionView[],
  isLocal: boolean;
  projectFolderPath: string;
  manifest: ExtensionManifest;
  secret: string;
  frontendFolderName: string;
  backendCommand: string;
}

export interface RigExtensionView {
  x: number;
  y: number;
  orientation: string;
  id: string;
  channelId: string;
  extension: ExtensionCoordinator.ExtensionObject;
  features: {
    isChatEnabled: boolean;
  };
  type: string;
  mode?: string;
  role: string;
  linked: boolean;
  isPopout: boolean;
  deleteViewHandler?: (id: string) => void;
  openEditViewHandler?: (id: string) => void;
  frameSize?: FrameSize;
}

export interface FrameSize {
  height: number;
  width: number;
}
