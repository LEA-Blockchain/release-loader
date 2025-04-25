import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as tar from 'tar';
import os from 'os';
import { pipeline } from 'stream/promises';
import * as openpgp from 'openpgp';

import EMBEDDED_PUBLIC_KEY_ARMORED from './publickey.asc';

const USER_AGENT = 'lea-release-loader';

async function cleanupFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (cleanupErr) {
        if (cleanupErr.code !== 'ENOENT') {
            console.warn(`Failed to delete temporary file (${filePath}): ${cleanupErr.message}`);
        }
    }
}

async function download(url, dest, userAgent) {
    let fileStream;
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': userAgent },
            redirect: 'follow',
        });
        if (!response.ok) {
            let errorDetails = '';
            try {
                errorDetails = await response.text();
            } catch (_error) {
                /* Ignore */
            }
            throw new Error(
                `Download failed: HTTP ${response.status} ${response.statusText} from ${url}${errorDetails ? `\nResponse: ${errorDetails.substring(0, 200)}` : ''}`
            );
        }
        if (!response.body) {
            throw new Error(`Response body is missing for ${url}`);
        }
        fileStream = fs.createWriteStream(dest);
        await pipeline(response.body, fileStream);
    } catch (error) {
        if (fileStream && !fileStream.closed) {
            await new Promise((resolve) => fileStream.close(resolve));
        }
        throw error;
    }
}

async function verifySignature(signatureFilePath, dataFilePath, publicKeyArmored) {
    console.log(`Verifying PGP signature: ${path.basename(signatureFilePath)} for ${path.basename(dataFilePath)}`);
    try {
        const signatureArmored = await fs.promises.readFile(signatureFilePath, 'utf8');
        const signature = await openpgp.readSignature({ armoredSignature: signatureArmored });
        const dataBuffer = await fs.promises.readFile(dataFilePath);
        const messageToVerify = await openpgp.createMessage({ binary: dataBuffer });
        const verificationKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

        const verificationResult = await openpgp.verify({
            signature: signature,
            message: messageToVerify,
            verificationKeys: verificationKey,
        });

        const verifiedSignature = verificationResult.signatures.find((sig) => sig.verified);
        if (verifiedSignature && (await verifiedSignature.verified)) {
            const keyId = verifiedSignature.keyID.toHex().toUpperCase();
            console.log(`PGP signature verification successful. Signed by key ID ${keyId}.`);
        } else {
            const firstSignature = verificationResult.signatures[0];
            let errMsg = 'PGP signature verification failed: ';
            if (firstSignature) {
                const keyId = firstSignature.keyID.toHex().toUpperCase();
                errMsg += `Signature found (Key ID: ${keyId}) but could not be verified.`;
            } else {
                errMsg += 'No valid signature structure found in the .asc file.';
            }
            errMsg +=
                ' Ensure the embedded public key corresponds to the signature and the data file has not been corrupted.';
            throw new Error(errMsg);
        }
    } catch (error) {
        console.error('Error during PGP verification:', error.message);
        let specificError = error.message;
        if (error.message.includes('readKey')) {
            specificError = `Could not read imported public key. Ensure the publickey.asc file is correct and build process worked. Original error: ${error.message}`;
        }
        // ... other specific error checks ...
        throw new Error(`PGP verification failed: ${specificError}`);
    }
}

// --- CLI Argument Parsing and Main Logic ---

async function run() {
    const args = process.argv.slice(2);

    // --- Updated Usage and Argument Check ---
    if (args.length !== 2 || args.includes('--help') || args.includes('-h')) {
        console.log(`
Usage: npx lea-rl <releaseFileUrl> <destinationDir>

Arguments:
  releaseFileUrl    Full URL of the release artifact (e.g., .tar.gz file).
                    The signature file URL will be derived by appending '.asc'.
  destinationDir    Local directory to extract the release files into.

Example:
  npx lea-rl https://example.getlea.org/releases/v1.0.0/data.tar.gz ./output-folder

`);
        process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
    }

    const [releaseFileUrl, destinationDir] = args;

    try {
        new URL(releaseFileUrl);
    } catch (e) {
        console.error(`Error: Invalid URL provided - ${e.message}`);
        process.exit(1);
    }
    const signatureFileUrl = `${releaseFileUrl}.asc`;
    console.log(`Derived Signature File URL: ${signatureFileUrl}`);

    const extractDir = path.resolve(process.cwd(), destinationDir);

    const TEMP_DIR = os.tmpdir();
    const RANDOM_ID = crypto.randomUUID();
    const tempTargzFilename = `download-${RANDOM_ID}-${path.basename(new URL(releaseFileUrl).pathname) || 'release'}`;
    const tempAscFilename = `download-${RANDOM_ID}-${path.basename(new URL(signatureFileUrl).pathname) || 'signature'}.asc`;
    const TEMP_FILE_TARGZ = path.join(TEMP_DIR, tempTargzFilename);
    const TEMP_FILE_ASC = path.join(TEMP_DIR, tempAscFilename);

    let targzDownloaded = false;
    let ascDownloaded = false;

    console.log(`Release File URL: ${releaseFileUrl}`);
    console.log(`Target directory: ${extractDir}`);

    try {
        console.log(`Downloading release file...`);
        await download(releaseFileUrl, TEMP_FILE_TARGZ, USER_AGENT);
        targzDownloaded = true;

        console.log(`Downloading signature file...`);
        await download(signatureFileUrl, TEMP_FILE_ASC, USER_AGENT);
        ascDownloaded = true;

        await verifySignature(TEMP_FILE_ASC, TEMP_FILE_TARGZ, EMBEDDED_PUBLIC_KEY_ARMORED);

        console.log(`Ensuring extraction directory exists: ${extractDir}`);
        await fs.promises.mkdir(extractDir, { recursive: true });

        console.log(`Extracting ${path.basename(TEMP_FILE_TARGZ)} to ${extractDir}...`);
        await tar.x({
            file: TEMP_FILE_TARGZ,
            cwd: extractDir,
            strip: 0,
        });

        console.log(`Files extracted to ${extractDir}`);
    } catch (err) {
        console.error('failed:', err.message);
        process.exitCode = 1;
    } finally {
        if (targzDownloaded) {
            await cleanupFile(TEMP_FILE_TARGZ);
        }
        if (ascDownloaded) {
            await cleanupFile(TEMP_FILE_ASC);
        }
        process.exit(process.exitCode || 0);
    }
}

run();
