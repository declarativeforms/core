import { detectFileContentType, isSafeRasterImage } from './file-content';

describe('file content detection', () => {
  test('detects supported raster images and PDF by their bytes', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(detectFileContentType(png)).toBe('image/png');
    expect(isSafeRasterImage(detectFileContentType(png))).toBe(true);
    expect(detectFileContentType(Buffer.from('%PDF-1.7'))).toBe(
      'application/pdf',
    );
  });

  test('does not trust active content or a claimed MIME type', () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    const svg = Buffer.from('<svg onload="alert(1)"></svg>');

    expect(detectFileContentType(html)).toBeNull();
    expect(detectFileContentType(svg)).toBeNull();
    expect(isSafeRasterImage(detectFileContentType(svg))).toBe(false);
  });
});
