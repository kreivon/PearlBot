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
                console.log(`[INFO][MINEBOT] Started eating ${opts.food.name} in ${opts.offhand ? 'offhand' : 'hand'}`)
            })
    
            bot.autoEat.on('eatFinish', (opts) => {
                console.log(`[INFO][MINEBOT] Finished eating ${opts.food.name}`)
            })
    
            bot.autoEat.on('eatFail', (err) => {
                console.error(`[ERROR][MINEBOT] Eating failed: ${err}`)
            })
    
            bot.on('error', (err) => {
                console.error(`[ERROR][MINEBOT] ${err}`);
            });
        }

        // Finished setup
        console.log('[INFO][MINEBOT] Bot spawned');


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
            console.error(`[ERROR][MINEBOT] Bot health critically low: ${bot.health}`);
            console.error(`[ERROR][MINEBOT] Manual intervention required!`);
            disconnect(bot, 1);
        } else if (config['bot_settings']['safety']['food_disconnect'] && bot.food <= 6) {
            console.error(`[ERROR][MINEBOT] Bot food critically low: ${bot.food}`);
            console.error(`[ERROR][MINEBOT] Manual intervention required!`);
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
        console.log('[ERROR][MINEBOT] Pearl position too far');
        console.log(`[ERROR][MINEBOT] |-- Pearl ID: ${pearlId}`);
        console.log(`[ERROR][MINEBOT] |-- Distance: ${distance}`);
        disconnect(bot, 1);
    } else {
        bot.pathfinder.setGoal(new GoalNear(pearl['x'], pearl['y'], pearl['z'], 2));
        console.log('[INFO][MINEBOT] Moving to pearl position');
        console.log(`[INFO][MINEBOT] |-- Pearl ID: ${pearlId}`);
        console.log(`[INFO][MINEBOT] |-- Distance: ${distance}`);
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
        console.log('[ERROR][MINEBOT] Rest position too far');
        console.log(`[ERROR][MINEBOT] |-- Distance: ${restDistance}`);
        disconnect(bot, 1);
    } else {
        bot.pathfinder.setGoal(new GoalNear(restPos['x'], restPos['y'], restPos['z'], 0));
        console.log('[INFO][MINEBOT] Moving to rest position');
        console.log(`[INFO][MINEBOT] |-- Distance: ${restDistance}`);
        await bot.waitForTicks(Math.floor(restDistance*config['bot_settings']['timings']['walking_tick_multiplier']));
    }
}

async function disconnect(bot, code) {
    console.log('[INFO][MINEBOT] Disconnecting');
    bot.quit();
    process.exit(code);
}