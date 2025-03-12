/**
 * Upgrader configuration.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

// Core system resources.
const config = {
    dirs: {
        backup: './working/backups', 
        download: './working/downloads'
    }, 
    releases: {
        latest: 'https://api.github.com/repos/teddyful/teddy/releases/latest', 
        notes: 'https://github.com/teddyful/teddy/releases', 
        tag: 'https://github.com/teddyful/teddy/releases/tag/v${version}', 
        download: {
            baseUrl: 'https://github.com/teddyful/teddy/releases/download/v${version}', 
            archive: 'teddy-${version}.zip', 
            checksums: 'teddy-${version}-checksums.txt'
        }
    }, 
    system: {
        resources: {
            directories: [
                `config`, 
                `sites/travelbook/assets`, 
                `sites/travelbook/languages`, 
                `sites/travelbook/pages`, 
                `sites/travelbook/web`, 
                `system/`, 
                `themes/bear`
            ], 
            files: [
                `.gitignore`, 
                `build.js`, 
                `LICENSE`, 
                `package.json`, 
                `package-lock.json`, 
                `README.md`, 
                `sites/travelbook/site.json`
            ]
        }
    }
}

export default config;
