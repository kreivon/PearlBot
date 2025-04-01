import { createBot } from 'mineflayer';
import { loader as autoEat } from 'mineflayer-auto-eat'
import mineflayerPathfinder from 'mineflayer-pathfinder';
const { pathfinder, Movements, goals: { GoalNear } } = mineflayerPathfinder;
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
import { Vec3 } from 'vec3';

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require('./config.json');

export function minebot(host, port, chamberId, pearlId) {
    // Bot Definition
    const bot = createBot({
        host: config['chambers'][chamberId]['server']['address'],
        port: config['chambers'][chamberId]['server']['port'],
        username: config['chambers'][chamberId]['bot']['username'],
        auth: config['chambers'][chamberId]['bot']['auth']
    });

    // Bot Plugins
    bot.loadPlugin(autoEat);
    bot.loadPlugin(pathfinder);

    // Events
    bot.once('spawn', async () => {
        // Setup pathfinder
        var movements = new Movements(bot);
        movements.allowSprinting = false;
        movements.allowParkour = false;
        bot.pathfinder.setMovements(movements);

        // Setup auto-eat
        if (config['bot_settings']['autoeat']['enabled']) {
            bot.autoEat.opts.priority = 'foodPoints';
            bot.autoEat.opts.startAt = config['bot_settings']['autoeat']['threshold'];
            bot.autoEat.opts.bannedFood = [];
            for (let x in config['bot_settings']['autoeat']['banned_food']) {
                bot.autoEat.opts.bannedFood.push(x);
            }

            bot.autoEat.on('eatStart', (opts) => {
                info(`Started eating ${opts.food.name} in ${opts.offhand ? 'offhand' : 'hand'}`, true)
            })
    
            bot.autoEat.on('eatFinish', (opts) => {
                info(`Finished eating ${opts.food.name}`, true)
            })
    
            bot.autoEat.on('eatFail', (err) => {
                error(`Eating failed: ${err}`, true)
            })
    
            bot.on('error', (err) => {
                error(`${err}`);
            });
        }

        // Finished setup
        info('Bot spawned');


        // Move to rest position
        await center(bot, config, chamberId);

        // Pause
        await sleep(1000);

        // Flip pearl
        await path(bot, chamberId, pearlId);

        // Move to rest position
        await center(bot, config, chamberId);

        // Pause
        await sleep(1000);

        // Disconnect
        disconnect(bot, 0);

    });

    bot.on('health', () => {
        // Disconnect for safety settings
        if (config['bot_settings']['safety']['hp_disconnect'] && bot.health <= 6) {
            error(`Bot health critically low: ${bot.health}`);
            error(`Manual intervention required!`);
            disconnect(bot, 1);
        } else if (config['bot_settings']['safety']['food_disconnect'] && bot.food <= 6) {
            error(`Bot food critically low: ${bot.food}`);
            error(`Manual intervention required!`);
            disconnect(bot, 1);
        }

        // Auto-Eat
        if (bot.food === 20){
            bot.autoEat.disableAuto();
        } else {
            bot.autoEat.enableAuto();
        }
    });
}

async function path(bot, chamberId, pearlId) {
    // Move to pearl position
    const pearl = config['chambers'][chamberId]['pearls'][pearlId]['position'];
    var distance = Math.sqrt(
        (bot.entity.position.x - pearl['x']) * (bot.entity.position.x - pearl['x']) +
        (bot.entity.position.y - pearl['y']) * (bot.entity.position.y - pearl['y']) +
        (bot.entity.position.z - pearl['z']) * (bot.entity.position.z - pearl['z'])
    );

    if (distance > config['chambers'][chamberId]['bot']['max_distance']) {
        error('Pearl position too far');
        error(`|-- Pearl ID: ${pearlId}`, true);
        error(`|-- Distance: ${distance}`, true);
        disconnect(bot, 1);
    } else {
        bot.pathfinder.setGoal(new GoalNear(pearl['x'], pearl['y'], pearl['z'], 2));
        info('Moving to pearl position');
        info(`|-- Pearl ID: ${pearlId}`, true);
        info(`|-- Distance: ${distance}`, true);
        await bot.waitForTicks(Math.floor(distance*config['bot_settings']['timings']['walking_tick_multiplier']));
    
        // Activate pearl with trapdoor
        bot.activateBlock(bot.blockAt(new Vec3(pearl['x'], pearl['y'], pearl['z'])));
        await bot.waitForTicks(config['bot_settings']['timings']['trapdoor_ticks']);
        bot.activateBlock(bot.blockAt(new Vec3(pearl['x'], pearl['y'], pearl['z'])));
    }
}

async function center(bot, config, chamberId) {
    // Navigates the bot to a rest position in the pearl chamber.
    const restPos = config['chambers'][chamberId]['bot']['rest_position']
    const restDistance = Math.sqrt(
        (bot.entity.position.x - restPos['x']) * (bot.entity.position.x - restPos['x']) +
        (bot.entity.position.y - restPos['y']) * (bot.entity.position.y - restPos['y']) +
        (bot.entity.position.z - restPos['z']) * (bot.entity.position.z - restPos['z'])
    );

    if (restDistance > config['chambers'][chamberId]['bot']['max_distance']) {
        error('Rest position too far');
        error(`|-- Distance: ${restDistance}`, true);
        disconnect(bot, 1);
    } else {
        bot.pathfinder.setGoal(new GoalNear(restPos['x'], restPos['y'], restPos['z'], 0));
        info('Moving to rest position');
        info(`|-- Distance: ${restDistance}`, true);
        await bot.waitForTicks(Math.floor(restDistance*config['bot_settings']['timings']['walking_tick_multiplier']));
    }
}

async function disconnect(bot, code) {
    // Disconnects the bot from the server and exits
    info('Disconnecting');
    bot.quit();
    process.exit(code);
}

function info(message, verbose=false) {
    // Logs a message with an info prefix
    log(message, 'INFO', verbose)
}

function warn(message, verbose=false) {
    // Logs a message with a warn prefix
    log(message, 'WARN', verbose)
}

function error(message, verbose=false) {
    // Logs a message with an error prefix
    log(message, 'ERROR', verbose)
}

function log(message, prefix, verbose) {
    // Logs a message with respect to prefix and verbosity settings
    var log_prefix = ''
    if (config['bot_settings']['log_prefix']) {
        log_prefix = `[${prefix}][MINEBOT] `
    }
    if (!verbose || (verbose && config['bot_settings']['verbose'])) {
        console.log(`${log_prefix}${message}`)
    }
}