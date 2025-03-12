/**
 * Upgrader service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import * as child from 'child_process';
import fs from 'fs';
import promptSync from 'prompt-sync';
import semver from 'semver';
import sha256File from 'sha256-file';
import unzipper from 'unzipper';
import util from 'util';
import { deleteSync } from 'del';
import { finished } from 'stream/promises';
import { Readable } from "stream";

import logger from '../middleware/logger.js';


class Upgrader {

    constructor(opts, config) {
        this.opts = opts;
        this.statusCode = 1;
        this.path = opts.path;
        this.config = config;
        this.pathIsValid = false;
        this.currentVersionRaw = null;
        this.currentVersion = null;
        this.latestVersionRaw = null;
        this.latestVersion = null;
        this.newVersionAvailable = false;
        this.upgradeConfirmed = false;
        this.downloadDir = null;
        this.downloadBaseUrl = null;
        this.archiveFilename = null;
        this.checksumsFilename = null;
        this.archiveFilePath = null;
        this.checksumsFilePath = null;
        this.releaseUrl = null;
        this.downloadedFileCount = 0;
        this.downloadVerified = false;
        this.extractDir = null;
        this.extractIsValid = false;
        this.backupDir = null;
        this.upgradeIsValid = false;
        this.upgradeStartDateTime = new Date().toISOString()
            .replace(/[-:.TZ]/g, '').substring(0, 14);
    }

    #validateInstance(path) {

        // Validate that the specified path points to a valid instance of 
        // Teddy by confirming the existence of the relevant core Teddy 
        // system resources.
        for ( const resource of this.config.system.resources.directories.concat(
            this.config.system.resources.files) ) {
            const resourcePath = `${path}/${resource}`;
            if ( !fs.existsSync(resourcePath) ) {
                logger.error(new Error('The specified path ' + 
                    `'${this.path}' does not point to a valid ` + 
                    'instance of Teddy, as the following resource is ' + 
                    `missing: '${resource}'.`));
                return false;
            }
        }
        return true;

    }

    #validatePath() {
        this.pathIsValid = this.#validateInstance(this.path);
    }

    #getCurrentVersion() {
        const packageConfig = JSON.parse(fs.readFileSync(
            `${this.path}/package.json`, 'utf8'));
        this.currentVersionRaw = packageConfig.version;
        if ( this.currentVersionRaw ) {
            this.currentVersion = semver.clean(this.currentVersionRaw);
        }
    }

    async #getLatestVersion() {
        const url = this.config.releases.latest;
        try {
            const response = await fetch(url, {
                    method: 'GET', 
                    headers: { 
                        'Content-Type': 'application/json' 
                    }
                }
            );
            if ( response.ok ) {
                const latestMetadata = await response.json();
                if ( 'tag_name' in latestMetadata ) {
                    this.latestVersionRaw = latestMetadata.tag_name;
                } else if ( 'name' in latestMetadata ) {
                    this.latestVersionRaw = latestMetadata.name;
                }
                if ( this.latestVersionRaw ) {
                    this.latestVersion = semver.clean(this.latestVersionRaw);
                }
            } else {
                throw {
                    json: await response.json(), 
                    status: response.status,
                    statusText: response.statusText
                }
            }
        } catch (requestErr) {
            logger.error('An error was encountered whilst attempting to ' + 
                'retrieve the latest release metadata from ' + 
                `${this.config.releases.latest}.`);
            logger.error(requestErr.stack);
        }
    }

    #compareVersions() {
        if ( this.currentVersion && this.latestVersion ) {
            this.newVersionAvailable = semver.gt(
                this.latestVersion, this.currentVersion);
        }
    }

    #promptUser() {
        console.log('');
        console.log('A new version of Teddy is available!');
        console.log(`Current version: ${this.currentVersion}`);
        console.log(`Latest version: ${this.latestVersion}`);
        console.log('Please read the release notes at ' + 
            `${this.config.releases.notes} before upgrading.`);
        const prompt = promptSync({sigint: true});
        const response = prompt('Do you wish to upgrade Teddy to ' + 
            `v${this.latestVersion}? [Y|n]: `);
        if ( response == 'Y' ) {
            this.upgradeConfirmed = true;
            console.log('Upgrade confirmed. Upgrading Teddy...');
        } else {
            console.log('Upgrade declined.');
        }
        console.log('');
    }

    #createDownloadDirectory() {
        this.downloadDir = `${this.config.dirs.download}/${this.latestVersion}`;
        if ( !fs.existsSync(this.downloadDir) ) {
            fs.mkdirSync(this.downloadDir, { 
                recursive: true });
        }
    }

    #generateDownloadUrls() {
        this.downloadBaseUrl = this.config.releases.download.baseUrl
            .replaceAll('${version}', this.latestVersion);
        this.archiveFilename = this.config.releases.download.archive
            .replaceAll('${version}', this.latestVersion);
        this.archiveFilePath = 
            `${this.downloadDir}/${this.archiveFilename}`;
        this.checksumsFilename = this.config.releases.download.checksums
            .replaceAll('${version}', this.latestVersion);
        this.checksumsFilePath = 
            `${this.downloadDir}/${this.checksumsFilename}`;
        this.releaseUrl = this.config.releases.tag
            .replaceAll('${version}', this.latestVersion);
    }

    async #download(filename) {
        const downloadUrl = `${this.downloadBaseUrl}/${filename}`;
        const downloadFilePath = `${this.downloadDir}/${filename}`;
        try {
            const response = await fetch(downloadUrl);
            if (response.ok && response.body) {
                let writer = fs.createWriteStream(downloadFilePath);
                await finished(Readable.fromWeb(response.body).pipe(writer));
                this.downloadedFileCount += 1;
            } else {
                throw {
                    status: response.status,
                    statusText: response.statusText
                }
            }
        } catch (requestErr) {
            logger.error('An error was encountered whilst attempting to ' + 
                `download the latest release of Teddy from ${downloadUrl}.`);
            logger.error(requestErr.stack);
        }
    }

    #verifyDownload() {
        const archiveFileHash = sha256File(this.archiveFilePath);
        const checksums = fs.readFileSync(this.checksumsFilePath, 'utf8')
            .split(/\r?\n/)
            .filter(line => line.includes(this.archiveFilename));
        if ( checksums.length == 1 ) {
            const expectedHash = checksums[0].split(/\s+/)[0].trim();
            if ( archiveFileHash === expectedHash ) {
                this.downloadVerified = true;
            }
        }
        if ( !this.downloadVerified ) {
            logger.error('The downloaded archive file failed ' + 
                'integrity verification.');
        }
    }

    async #extractDownload() {
        this.extractDir = `${this.downloadDir}/teddy-${this.latestVersion}`;
        return new Promise( (resolve, reject) => {
            fs.createReadStream(this.archiveFilePath)
                .pipe(unzipper.Extract({ path: this.extractDir }))
                .on('close', resolve)
                .on('error', reject);
        });
    }

    #verifyExtraction() {
        if ( fs.existsSync(this.extractDir) ) {
            this.extractIsValid = this.#validateInstance(this.extractDir);
        }
    }

    #createBackupDirectory() {
        this.backupDir = this.config.dirs.backup + '/' + 
            this.upgradeStartDateTime;
        if ( !fs.existsSync(this.backupDir) ) {
            fs.mkdirSync(this.backupDir, { 
                recursive: true });
        }
    }

    #backupCurrentVersion() {
        fs.cpSync(this.path, this.backupDir, {
            filter: (src, dest) => {
                return !src.includes('node_modules');
            },  
            preserveTimestamps: true, 
            recursive: true
        });
    }

    #deleteResourcesFromCurrentVersion() {
        const directories = this.config.system.resources.directories.map(
            directory => `${this.path}/${directory}`);
        directories.push(`${this.path}/sites/travelbook/build`);
        directories.push(`${this.path}/sites/travelbook/public`);
        const files = this.config.system.resources.files.map(
            file => `${this.path}/${file}`);
        deleteSync(directories.concat(files), {
            dot: true, 
            force: true
        });
    }

    #copyUpgradedResources() {
        const sourceDirs = this.config.system.resources.directories.map(
            directory => `${this.extractDir}/${directory}`);
        const targetDirs = this.config.system.resources.directories.map(
            directory => `${this.path}/${directory}`);
        for (let i = 0; i < sourceDirs.length; i++ ) {
            fs.cpSync(sourceDirs[i], targetDirs[i], { 
                preserveTimestamps: true, 
                recursive: true 
            });
        }
        const sourceFiles = this.config.system.resources.files.map(
            file => `${this.extractDir}/${file}`);
        const targetFiles = this.config.system.resources.files.map(
            file => `${this.path}/${file}`);
        for (let i = 0; i < sourceDirs.length; i++ ) {
            fs.copyFileSync(sourceFiles[i], targetFiles[i]);
        }
    }

    #verifyUpgrade() {
        this.upgradeIsValid = this.#validateInstance(this.path);
    }

    async #installUpgradedDependencies() {
        const cmd = `npm --prefix "${this.path}" install`;
        const exec = util.promisify(child.exec);
        try {
            await exec(cmd);
        } catch (err) {
            logger.error(new Error('An error was encountered when attempting ' +
                'to automatically install the upgraded dependencies. Please ' + 
                `navigate to ${this.path} and run the command 'npm install' ` + 
                'to install the upgraded dependencies manually.'));
            logger.debug(err.stderr);
        }
    }

    #deleteDownloadDirectory() {
        if ( this.downloadDir && fs.existsSync(this.downloadDir) ) {
            logger.info('Deleting the download directory...');
            try {
                deleteSync(this.downloadDir, {
                    dot: true, 
                    force: true
                });
            } catch (err) {
                logger.error('Could not delete the download directory at ' + 
                    `'${this.downloadDir}'. Please consult the logs for ` + 
                    'further details.');
                logger.debug(err.stack);
            }
        }
    }

    #deleteBackupDirectory() {
        if ( this.backupDir && fs.existsSync(this.backupDir) && 
            this.opts.deleteBackup ) {
            logger.info('Deleting the backup directory...');
            try {
                deleteSync(this.backupDir, {
                    dot: true, 
                    force: true
                });
            } catch (err) {
                logger.error('Could not delete the backup directory at ' + 
                    `'${this.backupDir}'. Please consult the logs for ` + 
                    'further details.');
                logger.debug(err.stack);
            }
        }
    }

    async upgrade() {
        try {

            // Validate the path.
            logger.info(`Teddy path: ${this.path}`);
            logger.info('Stage 1 of 17 - Validating the path...');
            this.#validatePath();
            if ( this.pathIsValid ) {

                // Get the current version number.
                logger.info('Stage 2 of 17 - Identifying the current ' + 
                    'version number...');
                this.#getCurrentVersion();

                // Get the latest version number.
                logger.info('Stage 3 of 17 - Identifying the latest ' + 
                    'version number...');
                await this.#getLatestVersion();

                // Determine whether a newer version exists.
                logger.info('Stage 4 of 17 - Comparing version numbers...');
                this.#compareVersions();
                if ( this.newVersionAvailable ) {

                    // Prompt the user for confirmation to upgrade.
                    logger.info('Stage 5 of 17 - Awaiting confirmation ' + 
                        'to upgrade...');
                    this.#promptUser();
                    if ( this.upgradeConfirmed ) {

                        // Create the download directory.
                        logger.info('Stage 6 of 17 - Creating the download ' + 
                            'directory...');
                        this.#createDownloadDirectory();

                        // Generate the download URLs.
                        logger.info('Stage 7 of 17 - Generating the download ' +
                            'URLs...');
                        this.#generateDownloadUrls();

                        // Download the latest version of Teddy.
                        logger.info('Stage 8 of 17 - Downloading Teddy ' + 
                            `v${this.latestVersion}...`);
                        await this.#download(this.archiveFilename);
                        await this.#download(this.checksumsFilename);
                        if ( this.downloadedFileCount == 2 ) {

                            // Verify the downloaded archive file.
                            logger.info('Stage 9 of 17 - Verifying the ' + 
                                'download integrity...');
                            this.#verifyDownload();
                            if ( this.downloadVerified ) {

                                // Extract the downloaded archive file.
                                logger.info('Stage 10 of 17 - Extracting the ' +
                                    'download...');
                                await this.#extractDownload();

                                // Verify the extraction.
                                logger.info('Stage 11 of 17 - Verifying ' +
                                    'the extraction...');
                                this.#verifyExtraction();
                                if ( this.extractIsValid ) {

                                    // Create the backup directory.
                                    logger.info('Stage 12 of 17 - Creating ' +
                                        'the backup directory...');
                                    this.#createBackupDirectory();

                                    // Create a backup of the Teddy instance.
                                    logger.info('Stage 13 of 17 - Creating ' +
                                        'a backup of the Teddy instance...');
                                    this.#backupCurrentVersion();

                                    // Delete relevant resources from the
                                    // current instance of Teddy.
                                    logger.info('Stage 14 of 17 - Deleting ' +
                                        'resources from the Teddy instance...');
                                    this.#deleteResourcesFromCurrentVersion();

                                    // Copy the upgraded resources to the
                                    // current instance of Teddy.
                                    logger.info('Stage 15 of 17 - Copying ' +
                                        'upgraded resources to the ' + 
                                        'Teddy instance...');
                                    this.#copyUpgradedResources();

                                    // Verify the upgrade.
                                    logger.info('Stage 16 of 17 - Verifying ' +
                                        'the upgrade...');
                                    this.#verifyUpgrade();
                                    if ( this.upgradeIsValid ) {

                                        // Install the upgraded dependencies.
                                        logger.info('Stage 17 of 17 - ' +
                                            'Installing upgraded ' + 
                                            'dependencies...');
                                        this.#installUpgradedDependencies();

                                        this.statusCode = 0;
                                        logger.info('Successfully finished ' + 
                                            'upgrading Teddy!');
                                        logger.info('Teddy location: ' + 
                                            this.path);
                                        logger.info('Old version: ' + 
                                            this.currentVersion);
                                        logger.info('New version: ' + 
                                            this.latestVersion);
                                        this.#deleteBackupDirectory();

                                    }

                                }

                            }

                        } else {
                            logger.error('An error was encountered whilst ' + 
                                'attempting to download the latest release ' + 
                                `of Teddy from ${this.downloadBaseUrl}.`);
                        }

                    }

                } else {
                    this.statusCode = 0;
                    logger.info('No updates found. The instance of Teddy is ' + 
                        'already using the latest available version.');
                    logger.info(`Teddy location: ${this.path}`);
                    logger.info(`Current version: ${this.currentVersion}`);
                }

            }

            // Persistent error help.
            if ( this.statusCode == 1 ) {
                logger.error('If this error persists, please manually ' + 
                    'download and upgrade Teddy from ' + 
                    `${this.config.releases.notes}.`);
                if ( this.backupDir ) {
                    logger.info('The backup of your original Teddy instance ' +  
                        `may be found in '${this.backupDir}'.`);
                }
            }

            this.#deleteDownloadDirectory();

        } catch (err) {
            logger.error('An error was encountered whilst running the ' + 
                'upgrade pipeline. Please consult the logs for ' + 
                'further details.');
            logger.error(err.stack);
            logger.error('If this error persists, please manually download ' + 
                `and upgrade Teddy from ${this.config.releases.notes}.`);
            if ( this.backupDir ) {
                logger.info('The backup of your original Teddy instance may ' + 
                    `be found in '${this.backupDir}'.`);
            }
            this.#deleteDownloadDirectory();
        }
    }

}

export default Upgrader;
