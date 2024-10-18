const fs = require('fs').promises;
const crypto = require('crypto');
const SparkMD5 = require('spark-md5');  // Ensure to install this if needed

async function parseFile(filePath) {
    try {
        // Read the file at the given path
        const arrayBuffer = await fs.readFile(filePath);
        const dataView = new DataView(arrayBuffer.buffer);

        // getString takes in offset and length as parameters
        const signature = getString(dataView, 0, 5);
        if (signature !== "AGPAY") {
            console.log("Invalid Card");
            return;
        }
        const version = getString(dataView, 5, 2);
        const encryptionKey = new Uint8Array(arrayBuffer.slice(7, 39));
        const reserved = new Uint8Array(arrayBuffer.slice(39, 49));

        const footerSignature = getString(
            dataView,
            arrayBuffer.byteLength - 22,
            6
        );
        if (footerSignature !== "ENDAGP") {
            console.log("Invalid Card");
            return;
        }
        const checksum = new Uint8Array(
            arrayBuffer.slice(arrayBuffer.byteLength - 16, arrayBuffer.byteLength)
        );

        // iv = entire 00000030 row in hexdump
        const iv = new Uint8Array(arrayBuffer.slice(49, 65));

        // everything after iv until ENDAGP
        const encryptedData = new Uint8Array(
            arrayBuffer.slice(65, arrayBuffer.byteLength - 22)
        );

        const calculatedChecksum = hexToBytes(
            SparkMD5.ArrayBuffer.hash(new Uint8Array([...iv, ...encryptedData]))
        );

        if (!arrayEquals(calculatedChecksum, checksum)) {
            console.log("Invalid Card");
            return;
        }

        const decryptedData = await decryptData(
            encryptedData,
            encryptionKey,
            iv
        );

        const cardNumber = getString(decryptedData, 0, 16);
        const cardExpiryDate = decryptedData.getUint32(20, false);
        const balance = decryptedData.getBigUint64(24, false);

        console.log(`Card Number: ${cardNumber}`);
        console.log(`Expiry Date: ${cardExpiryDate}`);
        console.log(`Balance: ${balance}`);
    } catch (error) {
        console.error('Error parsing file:', error);
    }
}

function getString(dataView, offset, length) {
    let result = "";
    for (let i = offset; i < offset + length; i++) {
        result += String.fromCharCode(dataView.getUint8(i));
    }
    return result;
}

function arrayEquals(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function hexToBytes(hex) {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return new Uint8Array(bytes);
}

async function decryptData(encryptedData, key, iv) {
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "AES-CBC" },
        false,
        ["decrypt"]
    );
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv: iv },
        cryptoKey,
        encryptedData
    );
    return new DataView(decryptedBuffer);
}

// Example usage with file path input
const filePath = "./newcard.agpay";  // Change this to your file path
parseFile(filePath);
