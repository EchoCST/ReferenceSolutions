<?php

/**
 * Submit an XML file of Stream Items to DataServer to be created/updated.
 */

require_once('config.php');

$accountName = $_SERVER['argv'][1];
if (!$accountName || !$config->accounts || !$config->accounts->{$accountName}) {
  die('Usage: submit-xml.php <account in config.json> <xmlfile>' . PHP_EOL);
}

$filename = $_SERVER['argv'][2];
if (!$filename || !file_exists($filename)) {
  die('Usage: submit-xml.php <account> <xmlfile>' . PHP_EOL);
}

$postfields = array(
  'content=' . urlencode(file_get_contents($filename)),
  'mode=update',
);

$url       = 'https://api.echoenabled.com/v1/submit';
$appKey    = $config->accounts->{$accountName}->key;
$secretKey = $config->accounts->{$accountName}->secret;

$curl = curl_init($url);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_USERPWD, $appKey . ':' . $secretKey);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl, CURLOPT_POSTFIELDS, implode('&', $postfields));
if (!$response = curl_exec($curl)) {
		print 'Error: ' . curl_error($curl) . PHP_EOL;
		exit;
}

$result = json_decode($response);
print_r($result);
