export type StorageBucket = "learning-audio" | "learning-images" | "avatar-assets" | "game-assets";

export type UploadRequest = {
  bucket: StorageBucket;
  path: string;
  mimeType: string;
  byteLength: number;
  ownerId?: string;
};

export interface StorageAdapter {
  validateUpload(request: UploadRequest): Promise<void>;
  createUploadUrl(
    request: UploadRequest
  ): Promise<{ url: string; fields?: Record<string, string> }>;
}

export class PlaceholderStorageAdapter implements StorageAdapter {
  async validateUpload(request: UploadRequest): Promise<void> {
    if (request.byteLength > 5 * 1024 * 1024) throw new Error("File is too large.");
    if (request.path.includes("..")) throw new Error("Invalid destination path.");
    if (!/^[a-z0-9/_-]+\.[a-z0-9]+$/i.test(request.path)) throw new Error("Invalid path format.");
  }

  async createUploadUrl(): Promise<{ url: string }> {
    throw new Error("Supabase Storage upload URLs are not implemented in the boilerplate.");
  }
}
