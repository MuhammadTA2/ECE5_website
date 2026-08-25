export type GalleryPhoto = {
  id: string;
  caption: string;
  filename: string;
  contentType: string;
  byteSize: number;
  addedAt: number;
  position: number;
  version: number;
  tags: string[];
  imageUrl: string;
};

export type GallerySnapshot = {
  settings: { title: string; subtitle: string };
  photos: GalleryPhoto[];
  revision: number;
};

export type ViewerState = {
  isSignedIn: boolean;
  isEditor: boolean;
  canClaimOwnership: boolean;
  displayName: string | null;
  email: string | null;
};
