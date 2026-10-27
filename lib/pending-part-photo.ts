/**
 * A part photo picked on a /r/ part result ("Add another photo of this part",
 * "Try another photo"), handed to /part-identifier so it opens with the
 * photo in the upload card. Browsers only open a file picker from a tap, so
 * the picker opens on /r/ and the file rides along in memory across the
 * client-side navigation. A full page load starts empty, which is fine.
 */

let pendingPhoto: File | null = null

export function setPendingPartPhoto(file: File) {
    pendingPhoto = file
}

/** Returns the waiting photo once, then forgets it. */
export function takePendingPartPhoto(): File | null {
    const file = pendingPhoto
    pendingPhoto = null
    return file
}
