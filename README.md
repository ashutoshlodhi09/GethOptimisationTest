# Prerequisite to run testcases. Configure below constants as per your configurations. 

 * wsEndPoint - WS RPC endpoint.
 * httpEndPoint - HTTP RPC endpoint.
 * blockCount - Total blocks to scan.
 * blockStart - Block to start scanning from.
 * blockEnd - Block to end scanning from.
 * totalTransactionToScan - Total Transactions to scan.
 * maxSameIterate - Same test case for multiple iterations.
 * maxHttpScokets - Max http connection to open.
 
# Note : Run test for each Inputs provided below. It should be runned one at a time. 
# Imputs to be provide for INIT function

* Input: web3-ws ,  web3-http , ost-base-ws-pool , ost-base-http , openst-js-http
* web3-http - Runs testcase via HTTP protocol. 
* web3-ws - Runs testcase via WS protocol.  
* ost-base-ws-pool - Runs testcase for OST implementation via WS protocol;
* ost-base-http - Runs testcase by OST implementation via HTTP protocol;



