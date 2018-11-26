'use strict';


const Web3   = require('web3') ,
  OpenstBase = require('@openstfoundation/openst-base') ,
  fs = require('fs'),
  util = require('util'),
  ProgressBar = require('progress'),
  separator ="-"
;

let  loggerObject = {}  , bar = {};

let startTime500 , endTime500 ,
  timeTaken500, timeTaken500InSec ,
  timeTaken500InMins
;

let OpenstJS, logFile;

/******* START Configurable Constants ******* /
 * Constants to be changed as per the setup on your system to run.
 * wsEndPoint - WS RPC endpoint
 * httpEndPoint - HTTP RPC endpoint
 * blockCount - Total blocks to scan
 * blockStart - Block to start scanning from
 * blockEnd - Block to end scanning from.
 * totalTransactionToScan - Total Transactions to scan.
 * maxSameIterate - Same test case for multiple iterations.
 * maxHttpSockets - Max http connection to open.
 */
const wsEndPoint = 'ws://172.16.0.198:8546' ,
  httpEndPoint   = 'http://172.16.0.198:8545',
  blockCount     = 74 ,
  blockStart     = 275944,
  blockEnd       = blockStart + blockCount,
  totalTransactionToScan  = 10000,
  maxSameIterate = 5,
  maxHttpSockets = 20
;

/******* END Configurable Constants *******/

let allTransactions = [] ,
  passTransactionCnt = 0 ,  failedTransactionCnt = 0,
  intervalFor500Txns = [], failureReasons = [],
  startTime = null, endTime = null
;

let scannerProvider = null ,
  provider = null , web3 = null
;

function initProvider() {
  switch( scannerProvider ) {
    case 'web3-ws':
      web3  =  new Web3(  wsEndPoint );
      break ;
    case 'web3-http':
      web3  =  new Web3(  httpEndPoint );
      break ;
    case 'ost-base-ws-pool':
      provider  =  OpenstBase.OstWeb3Pool.Factory;
      break ;
    case 'ost-base-http':
      web3  =  new OpenstBase.OstWeb3(  httpEndPoint );
      break ;
    case 'openst-js-http':
      OpenstJS  = require('@openstfoundation/openst.js');
      provider  = new OpenstJS( httpEndPoint ) ;
      web3 = provider.web3();
      break ;
  }
}

function getWeb3() {
  if( scannerProvider == 'ost-base-ws-pool' ){
    return provider.getWeb3( wsEndPoint );
  }
  return web3;
}

function newProgressBar() {
  bar = new ProgressBar('Scanning blocks [:bar] :percent :etas', { complete: '=',
    incomplete: ' ',total: 100 }) ;
}

function scanBlocks() {
  initConsoleLog();
  newProgressBar();
  startTime = new Date();
  scanBlock( );
}


function scanBlock(){
  for (let cnt = blockStart ; cnt < blockEnd ; cnt++){
    getWeb3().eth.getBlock( cnt ).then( function ( block ) {
      onBlockGetSuccess( block );
    }).catch(function(error){
      onBlockGetError( error )
    });
  }
}

let transactionScanStarted = false ;
function onBlockGetSuccess( block ) {
  allTransactions = allTransactions.concat( block.transactions );

  if(  allTransactions.length > totalTransactionToScan && !transactionScanStarted){
    transactionScanStarted =  true ;
    scanAllTransactions();
  }
}

function onBlockGetError( error ) {

}

function scanAllTransactions() {
  for( let cnt = 0 ; cnt < totalTransactionToScan ;  cnt++ ){
    getWeb3().eth.getTransactionReceipt( allTransactions[ cnt ] ).then( function ( receipt ) {
      passTransactionCnt++;
      isAllTransactionDone();
    }).catch( function ( error ) {
      failedTransactionCnt++;
      failureReasons.push({tx_hash:allTransactions[ cnt ] , error: error });
      isAllTransactionDone();
    })
  }
}

let tempCount = 0 ;
function isAllTransactionDone() {

  let totalTransactions = passTransactionCnt +  failedTransactionCnt ;
  if(totalTransactions % 100 == 0 ) bar.tick();
  if( totalTransactions % 500 == 0 ){
    if( !startTime500 ){
      startTime500 = startTime ;
    }
    endTime500 =  new Date();
    timeTaken500 = endTime500 - startTime500 ;
    timeTaken500InSec = timeTaken500 / 1000 ;
    timeTaken500InMins = timeTaken500InSec / 60;
    startTime500 = endTime500 ;
    tempCount += 500 ;
    intervalFor500Txns.push(timeTaken500 + "ms   " + timeTaken500InSec + "seconds   " + timeTaken500InMins + "min");
  }
  if( totalTransactions == totalTransactionToScan ){
    onBlockScannerStop();
  }
}

function onBlockScannerStop() {
  let endTime = new Date() ,
    timeElapsed = (endTime - startTime),
    timeElapsedInSec = timeElapsed / 1000 ,
    timeElapsedInMin = timeElapsedInSec  / 60
  ;
  console.log("Total Pass TransactionCnt - " + passTransactionCnt);
  console.log("Total Failed TransactionCnt - " + failedTransactionCnt );
  console.log("Total transactions - " + ( passTransactionCnt + failedTransactionCnt ));
  console.log("Block scanner duration - " + timeElapsed +  "ms   " +  timeElapsedInSec + "seconds   "  + timeElapsedInMin.toFixed(4) + "min");
  console.log("Timestamps after each 500 transactions");
  console.log(intervalFor500Txns);
  console.log("Failure reasons");
  printArray(failureReasons);

  if( loggerObject[scannerProvider] < maxSameIterate  ){
    resetConstants();
    scanBlocks();
  }
}

function resetConstants () {
  transactionScanStarted = false;
  allTransactions = []  ;
  passTransactionCnt = 0 ;
  failedTransactionCnt = 0;
  intervalFor500Txns = [];
  failureReasons = [];
  startTime = null;
  endTime = null;
  startTime500  = null;
  endTime500 = null ;
  timeTaken500 = null ;
  timeTaken500InMins = null ;
  timeTaken500InSec = null;
}

function initConsoleLog() {
  console.log = function(d) {
    if( isIgnoreText( d ) ) return false ;
    logFile.write(util.format(d) + '\n');
  };
  logFile = fs.createWriteStream(getLogFilePath(), {flags : 'w'});
}

function isIgnoreText( d ) {
  return d.indexOf &&  (d.indexOf('[OSTWeb3]') > -1 || d.indexOf('[Web3Pool]') > -1 ||  d.indexOf('[OstWSProvider]') > -1 );
}

function printArray(array) {
  for (let i in array){
    console.log(array[i]);
  }
}


function init( source  ) {
  if (!source) {
    console.error("Please specify the sourcesName");
    return;
  }
  scannerProvider = source;
  initProvider();
  scanBlocks();
}

function getLogFilePath() {
  let extraFileNameInfo = null ,
      directory = __dirname + '/logs/'+  scannerProvider
  ;
  if( loggerObject[scannerProvider] == undefined ){
    loggerObject[scannerProvider] = 1 ;
  }else {
    loggerObject[scannerProvider] = loggerObject[scannerProvider] + 1;
  }
  
  if (!fs.existsSync( directory )){
    fs.mkdirSync( directory );
  }
  
  if( scannerProvider == 'openst-js-http'){
    directory = directory + "/" + maxHttpSockets ;
    if (!fs.existsSync( directory )){
      fs.mkdirSync( directory );
    }
  }
  
  
  return directory + "/"  + loggerObject[ scannerProvider ] ;
}


/*
* Note : run for each Inputs provided below
* Input: web3-ws ,  web3-http , ost-base-ws-pool  , openst-js-http
* init('web3-http');
* init('web3-ws');
* init('ost-base-ws-pool');
* init('openst-js-http');
**/

init('web3-http');