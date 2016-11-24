# Demonstrates Ether balance modifications

It is possible to change the balance of a contract in 3 different ways:

* send a transaction to it
* send a transaction to it before it has even been deployed
* make it the beneficiary of a kill function, which triggers no internal transaction

Contracts in use:

* `DirectPay` sends Ethers to addresses.
* `NoValuePlease` is a contract that rejects Ether transfers via transactions.
* `Mortal`'s purpose is to receive value on creation and disburse it on `selfdestruct`.