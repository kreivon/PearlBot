import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load Configuration
// TODO: Generate config.json if it is not present and exit
const config = require('./config.json');
import { minebot } from './minebot.js';


// Argument Processing
if (process.argv.length != 4) {
	console.log('Usage : node pearlbot.js <chamberId> <pearlId>');
	process.exit(1);
}

// Program start
minebot(
    config['chambers'][process.argv[2]]['server']['address'],
    config['chambers'][process.argv[2]]['server']['port'],
    process.argv[2],
    process.argv[3]
);