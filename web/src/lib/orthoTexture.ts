const detailUrl = '/hero/matterhorn-ortho-4096.webp';
const detailSize = 4096;

export async function loadOrthoTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  previewUrl: string,
  onLoad: (size: number) => void,
) {
  let size = 0;
  const load = async (url: string, priority: RequestPriority) => {
    const response = await fetch(url, { priority });
    if (!response.ok) throw new Error(`Orthophoto request failed: ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob(), {
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    });
    try {
      if (bitmap.width <= size || gl.isContextLost()) return;
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
      // The shaders select a mip level based on the ground covered by a pixel.
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      size = bitmap.width;
      onLoad(size);
    } finally {
      bitmap.close();
    }
  };

  const preview = load(previewUrl, 'auto');
  if (gl.getParameter(gl.MAX_TEXTURE_SIZE) < detailSize) return preview;
  await Promise.allSettled([preview, load(detailUrl, 'low')]);
}
