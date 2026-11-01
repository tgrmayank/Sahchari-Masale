import { supabase, BUCKET } from './supabase';

const MAX_SIDE = 1600;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image. Try a JPG, PNG or WebP file.')); };
    img.src = url;
  });
}

/** Resize + compress in the browser, upload to Supabase Storage, return the public URL. */
export async function uploadImage(file, folder = 'misc', opts = {}) {
  if (!file || !/^image\//.test(file.type)) throw new Error('Please choose an image file (JPG, PNG or WebP).');
  if (file.size > 20 * 1024 * 1024) throw new Error('Image is too large (max 20 MB).');

  const img = await loadImage(file);
  const max = opts.max || MAX_SIDE;
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  const sc = Math.min(1, max / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * sc));
  const h = Math.max(1, Math.round(h0 * sc));

  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  cv.getContext('2d').drawImage(img, 0, 0, w, h);

  const blob = await new Promise((r) => cv.toBlob(r, 'image/webp', 0.86));
  if (!blob) throw new Error('Could not process this image.');
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
