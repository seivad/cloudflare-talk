import QRCode from 'qrcode';

/**
 * Generate QR code for Cloudflare Workers environment
 * Uses the toString method to generate SVG, then converts to data URL
 */
export async function generateQRCode(text: string, size: number = 300): Promise<string> {
  try {
    // Generate QR code as SVG string (works in Workers)
    const svgString = await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    // Convert SVG to data URL
    const base64 = btoa(svgString);
    return `data:image/svg+xml;base64,${base64}`;
  } catch (err) {
    console.error('Error generating QR code as SVG:', err);
    
    try {
      // Fallback: Try PNG generation using buffer
      const buffer = await QRCode.toBuffer(text, {
        type: 'png',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      // Convert buffer to base64
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      return `data:image/png;base64,${base64}`;
    } catch (bufferErr) {
      console.error('Error generating QR code as buffer:', bufferErr);
      
      // Final fallback: return empty string to trigger external service
      return '';
    }
  }
}

/**
 * Generate QR code as a Buffer (for direct response)
 */
export async function generateQRCodeBuffer(text: string, size: number = 300): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(text, {
      type: 'png',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    return buffer;
  } catch (err) {
    console.error('Error generating QR code buffer:', err);
    throw err;
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(text: string, size: number = 300): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    return svg;
  } catch (err) {
    console.error('Error generating QR code SVG:', err);
    throw err;
  }
}