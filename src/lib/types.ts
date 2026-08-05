export type Theme = {
  slug: string;
  title: string;
  description: string;
  cover: string | null;
  accentColor: string;
  createdAt: string;
};

export type GalleryImage = {
  publicId: string;
  caption: string | null;
  order: number;
  width: number | null;
  height: number | null;
};

export type ThemesFile = { themes: Theme[] };

export type SessionPayload = {
  admin: true;
  exp: number;
};