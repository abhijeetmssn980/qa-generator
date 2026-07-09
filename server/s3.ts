// S3 storage for product assets (leaflet PDFs and images).
// Objects are written under `leaflets/<id>.pdf` and `images/<id>.webp` and served
// as public-read URLs, so the public product page links straight to S3. Enabled
// only when S3_BUCKET is set — otherwise the app falls back to storing in Postgres.
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';
const bucket = process.env.S3_BUCKET || '';

export const s3Enabled = !!bucket;

// Credentials come from the default provider chain (AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY env vars, or an IAM role on the host).
const client = s3Enabled ? new S3Client({ region }) : null;

// Public (virtual-hosted-style) URL for an object. Bucket must have a
// public-read policy on these prefixes for the object to be viewable.
export function publicUrl(key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (!client) throw new Error('S3 is not configured');
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=86400',
      // No ACL — modern buckets disable ACLs; public read is granted via bucket policy.
    })
  );
}

async function removeObject(key: string): Promise<void> {
  if (!client) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

const leafletKey = (uniqueId: string) => `leaflets/${uniqueId}.pdf`;
const imageKey = (uniqueId: string) => `images/${uniqueId}.webp`;

// Upload and return a cache-busted public URL (`version` is the caller's timestamp,
// so a replacement is picked up immediately).
export async function uploadLeaflet(uniqueId: string, buffer: Buffer, version: number): Promise<string> {
  await putObject(leafletKey(uniqueId), buffer, 'application/pdf');
  return `${publicUrl(leafletKey(uniqueId))}?v=${version}`;
}

export async function deleteLeaflet(uniqueId: string): Promise<void> {
  await removeObject(leafletKey(uniqueId));
}

export async function uploadImage(uniqueId: string, buffer: Buffer, version: number): Promise<string> {
  await putObject(imageKey(uniqueId), buffer, 'image/webp');
  return `${publicUrl(imageKey(uniqueId))}?v=${version}`;
}

export async function deleteImage(uniqueId: string): Promise<void> {
  await removeObject(imageKey(uniqueId));
}
