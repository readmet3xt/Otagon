// ========================================
// 🖼️ IMAGE VALIDATION UTILITIES
// ========================================
// Comprehensive validation for image uploads to prevent "invalid input" errors

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    mimeType: string;
  };
}

export interface ImageValidationOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeBytes?: number;
  allowedFormats?: string[];
  requireDimensions?: boolean;
}

const DEFAULT_OPTIONS: Required<ImageValidationOptions> = {
  maxWidth: 4096,
  maxHeight: 4096,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  requireDimensions: true
};

/**
 * Validates base64 string format
 */
export function validateBase64(base64: string): { isValid: boolean; error?: string } {
  if (!base64 || typeof base64 !== 'string') {
    return { isValid: false, error: 'Base64 data is missing or invalid' };
  }

  // Remove data URL prefix if present
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;

  // Check if it's valid base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleanBase64)) {
    return { isValid: false, error: 'Invalid base64 format' };
  }

  // Check if length is valid (must be multiple of 4)
  if (cleanBase64.length % 4 !== 0) {
    return { isValid: false, error: 'Invalid base64 length' };
  }

  return { isValid: true };
}

/**
 * Validates MIME type
 */
export function validateMimeType(mimeType: string, allowedFormats: string[]): { isValid: boolean; error?: string } {
  if (!mimeType || typeof mimeType !== 'string') {
    return { isValid: false, error: 'MIME type is missing' };
  }

  if (!allowedFormats.includes(mimeType)) {
    return { 
      isValid: false, 
      error: `Unsupported image format: ${mimeType}. Supported formats: ${allowedFormats.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Validates image dimensions and size
 */
export function validateImageDimensions(
  width: number, 
  height: number, 
  sizeBytes: number, 
  options: Required<ImageValidationOptions>
): { isValid: boolean; error?: string; warnings?: string[] } {
  const warnings: string[] = [];

  if (width <= 0 || height <= 0) {
    return { isValid: false, error: 'Invalid image dimensions' };
  }

  if (width > options.maxWidth || height > options.maxHeight) {
    return { 
      isValid: false, 
      error: `Image dimensions (${width}x${height}) exceed maximum allowed (${options.maxWidth}x${options.maxHeight})` 
    };
  }

  if (sizeBytes > options.maxSizeBytes) {
    return { 
      isValid: false, 
      error: `Image size (${Math.round(sizeBytes / 1024)}KB) exceeds maximum allowed (${Math.round(options.maxSizeBytes / 1024)}KB)` 
    };
  }

  // Add warnings for large images
  if (width > 2048 || height > 2048) {
    warnings.push('Large image detected - processing may take longer');
  }

  if (sizeBytes > 5 * 1024 * 1024) { // 5MB
    warnings.push('Large file size detected - consider compressing the image');
  }

  return { isValid: true, warnings };
}

/**
 * Validates image file object
 */
export function validateImageFile(file: File, options: ImageValidationOptions = {}): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Basic file validation
    if (!file || !(file instanceof File)) {
      resolve({ isValid: false, error: 'Invalid file object' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      resolve({ isValid: false, error: 'File is not an image' });
      return;
    }

    // Validate MIME type
    const mimeValidation = validateMimeType(file.type, opts.allowedFormats);
    if (!mimeValidation.isValid) {
      resolve({ isValid: false, error: mimeValidation.error });
      return;
    }

    // Validate file size
    if (file.size > opts.maxSizeBytes) {
      resolve({ 
        isValid: false, 
        error: `File size (${Math.round(file.size / 1024)}KB) exceeds maximum allowed (${Math.round(opts.maxSizeBytes / 1024)}KB)` 
      });
      return;
    }

    // If dimensions are required, load image to check dimensions
    if (opts.requireDimensions) {
      const img = new Image();
      img.onload = () => {
        const dimensionValidation = validateImageDimensions(
          img.naturalWidth, 
          img.naturalHeight, 
          file.size, 
          opts
        );

        if (!dimensionValidation.isValid) {
          resolve({ isValid: false, error: dimensionValidation.error });
          return;
        }

        resolve({
          isValid: true,
          warnings: dimensionValidation.warnings,
          metadata: {
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: file.size,
            format: file.type,
            mimeType: file.type
          }
        });
      };

      img.onerror = () => {
        resolve({ isValid: false, error: 'Failed to load image for validation' });
      };

      img.src = URL.createObjectURL(file);
    } else {
      resolve({
        isValid: true,
        metadata: {
          width: 0,
          height: 0,
          size: file.size,
          format: file.type,
          mimeType: file.type
        }
      });
    }
  });
}

/**
 * Validates base64 image data
 */
export function validateBase64Image(
  base64: string, 
  mimeType: string, 
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate base64 format
    const base64Validation = validateBase64(base64);
    if (!base64Validation.isValid) {
      resolve({ isValid: false, error: base64Validation.error });
      return;
    }

    // Validate MIME type
    const mimeValidation = validateMimeType(mimeType, opts.allowedFormats);
    if (!mimeValidation.isValid) {
      resolve({ isValid: false, error: mimeValidation.error });
      return;
    }

    // If dimensions are required, load image to check dimensions
    if (opts.requireDimensions) {
      const img = new Image();
      img.onload = () => {
        // Calculate size from base64 length (approximate)
        const sizeBytes = Math.round((base64.length * 3) / 4);

        const dimensionValidation = validateImageDimensions(
          img.naturalWidth, 
          img.naturalHeight, 
          sizeBytes, 
          opts
        );

        if (!dimensionValidation.isValid) {
          resolve({ isValid: false, error: dimensionValidation.error });
          return;
        }

        resolve({
          isValid: true,
          warnings: dimensionValidation.warnings,
          metadata: {
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: sizeBytes,
            format: mimeType,
            mimeType: mimeType
          }
        });
      };

      img.onerror = () => {
        resolve({ isValid: false, error: 'Failed to load image for validation' });
      };

      // Ensure proper data URL format
      const dataUrl = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
      img.src = dataUrl;
    } else {
      // Calculate size from base64 length (approximate)
      const sizeBytes = Math.round((base64.length * 3) / 4);

      if (sizeBytes > opts.maxSizeBytes) {
        resolve({ 
          isValid: false, 
          error: `Image size (${Math.round(sizeBytes / 1024)}KB) exceeds maximum allowed (${Math.round(opts.maxSizeBytes / 1024)}KB)` 
        });
        return;
      }

      resolve({
        isValid: true,
        metadata: {
          width: 0,
          height: 0,
          size: sizeBytes,
          format: mimeType,
          mimeType: mimeType
        }
      });
    }
  });
}

/**
 * Validates ImageFile object
 */
export function validateImageFileObject(
  imageFile: { base64: string; mimeType: string; size?: number },
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate base64
  const base64Validation = validateBase64(imageFile.base64);
  if (!base64Validation.isValid) {
    return Promise.resolve({ isValid: false, error: base64Validation.error });
  }

  // Validate MIME type
  const mimeValidation = validateMimeType(imageFile.mimeType, opts.allowedFormats);
  if (!mimeValidation.isValid) {
    return Promise.resolve({ isValid: false, error: mimeValidation.error });
  }

  // If size is provided, validate it
  if (imageFile.size && imageFile.size > opts.maxSizeBytes) {
    return Promise.resolve({ 
      isValid: false, 
      error: `Image size (${Math.round(imageFile.size / 1024)}KB) exceeds maximum allowed (${Math.round(opts.maxSizeBytes / 1024)}KB)` 
    });
  }

  // Validate dimensions if required
  if (opts.requireDimensions) {
    return validateBase64Image(imageFile.base64, imageFile.mimeType, options);
  }

  return Promise.resolve({
    isValid: true,
    metadata: {
      width: 0,
      height: 0,
      size: imageFile.size || 0,
      format: imageFile.mimeType,
      mimeType: imageFile.mimeType
    }
  });
}

/**
 * Quick validation for common issues
 */
export function quickValidateImage(imageFile: { base64: string; mimeType: string }): { isValid: boolean; error?: string } {
  // Check if base64 is present and not empty
  if (!imageFile.base64 || imageFile.base64.trim() === '') {
    return { isValid: false, error: 'Image data is missing' };
  }

  // Check if MIME type is present
  if (!imageFile.mimeType || imageFile.mimeType.trim() === '') {
    return { isValid: false, error: 'Image format is missing' };
  }

  // Check if it looks like a data URL
  if (imageFile.base64.includes(',') && !imageFile.base64.startsWith('data:')) {
    return { isValid: false, error: 'Invalid image data format' };
  }

  return { isValid: true };
}

