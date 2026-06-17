async function downloadEncryptedMedia(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return buffer;
  }
  
  async function decryptMedia(encryptedArrayBuffer, base64MediaKey, mediaType = "audio") {
    const mediaKeyBytes = Uint8Array.from(atob(base64MediaKey), c => c.charCodeAt(0));
  
    const infoStrings = {
      audio: "WhatsApp Audio Keys",
      video: "WhatsApp Video Keys",
      image: "WhatsApp Image Keys",
      document: "WhatsApp Document Keys"
    };
  
    const info = infoStrings[mediaType];
    if (!info) throw new Error('Unsupported media type: ' + mediaType);
  
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      mediaKeyBytes,
      { name: "HKDF" },
      false,
      ["deriveBits", "deriveKey"]
    );
  
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: "HKDF",
        salt: new Uint8Array(32),
        info: new TextEncoder().encode(info),
        hash: "SHA-256"
      },
      keyMaterial,
      512
    );
  
    const expandedKey = new Uint8Array(derivedBits);
    const iv = expandedKey.slice(0, 16);
    const cipherKey = expandedKey.slice(16, 48);
  
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      cipherKey,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );
  
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv: iv },
      cryptoKey,
      encryptedArrayBuffer
    );
  
    return decrypted;
  }
  