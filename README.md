<p align="center">
  <img src="pearlbot.png"/>
</p>
<h1 align="center">Minecraft Pearl Bot</h1>
<h3 align="center">Discord bridge coming soon!<h3>
<div></div>


<h3>About Pearl Bot</h3>
<p>This is a scuffed pearl chamber bot for Minecraft written in JavaScript using <a href="https://github.com/PrismarineJS/mineflayer">Mineflayer</a>.</p>
<p>I am not a JavaScript dev and I absolutely hate using the language so if something is shit that's why.  Make a PR.</p>

<h3>Usage</h3>
<ol>
  <li>Clone the repository</li>
  <li>Run <code>npm install</code> to fetch required dependencies</li>
  <li>Copy the file <code>default_config.json</code> and rename it to <code>config.json</code></li>
  <li>Edit <code>config.json</code> to add account logins <a href="https://github.com/PrismarineJS/mineflayer?tab=readme-ov-file#echo-example">as done with Mineflayer</a>, and specify chamber coordinates using the test world as an example</li>
  <li>Run the bot: <br>
  <code>$ ./node pearlbot.js &lt;chamberId&gt; &lt;pearlId&gt;</code>
</ol>

<h3>Test World</h3>
<p>Included in the repository is a save named <code>pearlbot_test_world</code> which the default configuration is built around.</p>
<p>Load this save on an <u>offline server</u> with <u>spawn protection disabled</u> or modify the configuration with an online account.</p>
<p>Please load up this world to figure out how the configuration works before you ask any questions.</p>

<h3>Credits</h3>
<ul>
  <li><b>Kreivon</b> | Writing the bot (poorly)</li>
  <li><b>PrismarineJS</b> | Mineflayer and the pathfinding library</li>
  <li><b>link-discord</b> | Mineflayer Auto-Eat library</li>
</ul>
