<?php

function usage() {
    die('Usage: submit-xml.php <account> <filename-to-submit.xml>' . PHP_EOL .
        'Note: Be sure you have created config.json - see README.md' . PHP_EOL);
}

$cfgfile = dirname(__FILE__) . "/../config.json";
if (!$cfgfile || !file_exists($cfgfile)) {
    die('This script requires config.json. ' . PHP_EOL .
        'Please see README.md and create one.' . PHP_EOL);
}

$config = json_decode(file_get_contents($cfgfile));
if (!$config) {
    die('Invalid config.json. Please verify that it is a valid JSON file.' . PHP_EOL);
}
