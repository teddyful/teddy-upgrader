/**
 * Teddy upgrader.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { Command } from 'commander';

import config from './config/config.js';
import logger from './src/middleware/logger.js';
import packageConfig from './package.json' with { type: 'json' };
import Upgrader from './src/services/upgrader.js';


console.log('');
console.log('           _     _');
console.log('          ( \\---/ )');
console.log('           ) . . (');
console.log(' ____,--._(___Y___)_,--.____');
console.log("     `--'           `--'");
console.log("            TEDDY");
console.log("         teddyful.com");
console.log(' ___________________________');
console.log('');
console.log('');

/* -----------------------------------------------------------------------------
 * CLI with variadic options
 * ---------------------------------------------------------------------------*/

const program = new Command();
program.name(packageConfig.name)
    .description(packageConfig.description)
    .version(packageConfig.version)
    .requiredOption('--path <path>', 
        'Absolute path to the locally installed instance of Teddy (required)')
    .option('--delete-backup', 'Delete the backup of the pre-upgraded instance of Teddy after a successful upgrade', false)
    .action(async function(opts) {
        logger.info('Started the Teddy upgrader app ' + 
            `(v${packageConfig.version}).`);
        const upgrader = new Upgrader(opts, config);
        await upgrader.upgrade();
        logger.info('Exiting the Teddy upgrader app (exitCode = ' + 
            `${upgrader.statusCode}).`);
        setTimeout(() => {
            process.exit(upgrader.statusCode);
        }, 2000);
    })
program.parse();
