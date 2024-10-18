const fs = require('fs').promises;
const crypto = require('crypto');
const SparkMD5 = require('spark-md5');

async function generateFile(filePath, cardNumber, expiryDate, balance) {
    try {
        // Ensure card number is 16 characters
        if (cardNumber.length !== 16) {
            console.error('Card number must be 16 characters.');
            return;
        }

        // Convert expiry date and balance into appropriate binary representations
        const expiryDateBuffer = Buffer.alloc(4); // 4 bytes for expiry date
        expiryDateBuffer.writeUInt32BE(expiryDate); // Writes Unix timestamp (e.g., 1715280000)        

        const balanceBuffer = Buffer.alloc(8); // 8 bytes for balance
        balanceBuffer.writeBigUInt64BE(BigInt(balance)); // Write as 8-byte BigUInt64

        const paddingBuffer = Buffer.alloc(4);
        // Create an array buffer for the decrypted card data
        const cardData = Buffer.concat([
            Buffer.from(cardNumber, 'utf-8'),   // Card number (16 bytes)
            paddingBuffer,
            expiryDateBuffer,                   // Expiry date (4 bytes)
            balanceBuffer                       // Balance (8 bytes)
        ]);

        // Create a random encryption key (32 bytes) and IV (16 bytes)
        const encryptionKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);

        // Encrypt the card data
        const encryptedData = encryptData(cardData, encryptionKey, iv);

        // Prepare the file buffer according to the format
        const signature = Buffer.from('AGPAY', 'utf-8'); // 5 bytes signature
        const version = Buffer.from('01', 'utf-8'); // 2 bytes version

        const reserved = Buffer.alloc(10); // 10 bytes reserved

        // Footer
        const footerSignature = Buffer.from('ENDAGP', 'utf-8'); // 6 bytes footer

        // Calculate checksum
        const calculatedChecksum = hexToBytes(SparkMD5.ArrayBuffer.hash(Buffer.concat([iv, encryptedData])));

        // Create the final file buffer
        const fileBuffer = Buffer.concat([
            signature,
            version,
            encryptionKey,               // 32 bytes encryption key
            reserved,                    // 10 bytes reserved
            iv,                          // 16 bytes IV
            encryptedData,               // Encrypted card data
            footerSignature,             // 6 bytes footer signature
            calculatedChecksum           // 16 bytes checksum
        ]);

        // Write the file
        await fs.writeFile(filePath, fileBuffer);

        console.log(`File generated successfully at ${filePath}`);
    } catch (error) {
        console.error('Error generating file:', error);
    }
}

function encryptData(data, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return encrypted;
}

function hexToBytes(hex) {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return Buffer.from(bytes);
}

// Example usage to generate a file with card number, expiry date, and large balance
const cardNumber = '1234567812345678'; // Example card number (16 characters)
const expiryDate = 1715280000; // Example expiry date in YYYYMMDD format
const balance = 313371337;   // User's large balance

const filePath = './newcard.agpay';  // Path to save the generated file
generateFile(filePath, cardNumber, expiryDate, balance);
