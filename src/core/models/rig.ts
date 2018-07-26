import * as React from 'react';
import { PositionProperty } from 'csstype';
import { ManifestViews } from './manifest';

export interface RigExtensionView {
  x: number;
  y: number;
  orientation: string;
  id: string;
  extension: RigExtension;
  type: string;
  mode: string;
  role: string;
  linked: boolean;
  deleteViewHandler: (id: string) => void;
  openEditViewHandler: (id: string) => void;
  position?: Position;
  frameSize?: FrameSize;
}

export interface ViewStyles extends React.CSSProperties {
  border?: string;
  position?: PositionProperty;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  width?: string;
  height?: string;
  transformOrigin?: string;
  transform?: string;
}

export interface FrameSize {
  height: number;
  width: number;
}

export interface RigExtension {
  authorName: string;
  id: string;
  clientId?: string;
  description: string;
  iconUrl: string;
  name: string;
  requestIdentityLink: boolean
  sku: string;
  state: string;
  summary: string;
  token: string;
  vendorCode: string;
  version: string;
  views: ManifestViews;
  whitelistedConfigUrls: string[];
  whitelistedPanelUrls: string[];
  bitsEnabled: boolean;
}
