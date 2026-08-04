/**
 * Downscales an image File so that its longest edge is at most `maxSize` pixels.
 * Uses a canvas to resize the image and returns a new JPEG File at `quality`.
 * If the image is already smaller than `maxSize`, it returns the original file.
 *
 * @param file The original image file
 * @param maxSize Maximum pixels for the longest edge (default 1568)
 * @param quality JPEG compression quality from 0 to 1 (default 0.8)
 */
export async function downscaleImage(
    file: File,
    maxSize: number = 1568,
    quality: number = 0.8
): Promise<File> {
    return new Promise((resolve, reject) => {
        // We only process valid image types
        if (!file.type.startsWith('image/')) {
            return resolve(file)
        }

        const img = new Image()
        img.onload = () => {
            let width = img.width
            let height = img.height

            // Calculate new dimensions
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width)
                    width = maxSize
                } else {
                    width = Math.round((width * maxSize) / height)
                    height = maxSize
                }
            } else {
                // If it's already small enough, just return original
                URL.revokeObjectURL(img.src)
                return resolve(file)
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
                URL.revokeObjectURL(img.src)
                return reject(new Error('Canvas 2D context not available'))
            }

            // Draw and resize
            ctx.drawImage(img, 0, 0, width, height)
            
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(img.src)
                    if (blob) {
                        // Keep original name but change extension if needed
                        const nameParts = file.name.split('.')
                        nameParts.pop() // remove extension
                        const baseName = nameParts.join('.') || 'image'
                        const newFileName = `${baseName}.jpg`
                        
                        resolve(new File([blob], newFileName, { type: 'image/jpeg' }))
                    } else {
                        reject(new Error('Canvas toBlob failed'))
                    }
                },
                'image/jpeg',
                quality
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(img.src)
            reject(new Error('Failed to load image for resizing'))
        }

        img.src = URL.createObjectURL(file)
    })
}
