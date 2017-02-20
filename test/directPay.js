ethJsUtil = require('../node_modules/ethereumjs-util/');
Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('DirectPay', function(accounts) {

    var isTestRPC;
    var owner, recipient;
    var directPay;
    var right;

    before("should prepare accounts", function () {
        assert.isAbove(accounts.length, 2, "should have at least 2 accounts");
        owner = accounts[0];
        recipient = accounts[1];
        return Extensions.makeSureAreUnlocked([ owner ])
            .then(web3.version.getNodePromise())
            .then(node => {
                isTestRPC = node.indexOf("EthereumJS TestRPC") > -1;
            });
    });

    describe("Regular actions", function() {

        beforeEach("should deploy a DirectPay", function() {
            return DirectPay.new({ from: owner, value: web3.toWei(5) })
                .then(created => {
                    directPay = created;
                    return web3.eth.getBalancePromise(directPay.address);
                })
                .then(balance => {
                    assert.strictEqual(
                        balance.toString(10),
                        web3.toWei(5).toString(10),
                        "should start with 5 Ether");
                    return directPay.calls();
                })
                .then(calls => {
                    assert.strictEqual(calls.toNumber(), 0, "should start with 0 calls");
                });
        });

        it("should be possible to send 1 ether", function() {
            var account1Balance;

            return web3.eth.getBalancePromise(recipient)
                .then(balance => {
                    account1Balance = balance;
                    return directPay.pay.call(recipient, web3.toWei(1), { from: owner });
                })
                .then(success => {
                    assert.isTrue(success, "should be possible to send 1 ether");
                    return directPay.pay(recipient, web3.toWei(1), { from: owner, gas: 3000000 });
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => {
                    assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                    return web3.eth.getBalancePromise(directPay.address);
                })
                .then(balance => {
                    assert.strictEqual(
                        balance.toString(10),
                        web3.toWei(4).toString(10),
                        "should be down to 4 Ether");
                    return web3.eth.getBalancePromise(recipient);
                })
                .then(newAccout1Balance => {
                    if (isTestRPC) {
                        console.log("SKIPPED asserts that fail in TestRPC");
                    } else {
                        assert.strictEqual(
                            newAccout1Balance.minus(account1Balance).toString(10),
                            web3.toWei(1).toString(10),
                            "should have new balance");
                    }
                    return directPay.calls();
                })
                .then(calls => {
                    assert.strictEqual(calls.toNumber(), 1, "should have had a single call");
                });
        });

        it("should be possible to send 0 ether", function() {
            var account1Balance;

            return web3.eth.getBalancePromise(recipient)
                .then(balance => {
                    account1Balance = balance;
                    return directPay.pay.call(recipient, 0, { from: owner });
                })
                .then(success => {
                    assert.isTrue(success, "should be possible to send 0 ether");
                    return directPay.pay(recipient, 0, { from: owner, gas: 3000000 });
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => {
                    assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                    return web3.eth.getBalancePromise(directPay.address);
                })
                .then(balance => {
                    assert.strictEqual(
                        balance.toString(10),
                        web3.toWei(5).toString(10),
                        "should still be at 5 Ethers");
                    return web3.eth.getBalancePromise(recipient);
                })
                .then(newAccout1Balance => {
                    if (isTestRPC) {
                        console.log("SKIPPED asserts that fail in TestRPC");
                    } else {
                        assert.strictEqual(
                            newAccout1Balance.minus(account1Balance).toNumber(),
                            0,
                            "should have same balance");
                    }
                    return directPay.calls();
                })
                .then(calls => {
                    assert.strictEqual(calls.toNumber(), 1, "should have had a single call");
                });
        });

        it("should not be possible to deploy NoValuePlease with value", function() {
            return Extensions.expectedExceptionPromise(
                () => NoValuePlease.new({ from: owner, value: 1, gas: 3000000 }),
                3000000);
        });

        it("should not be possible to send 1 ether to NoValuePlease", function() {
            var noValuePlease;

            return NoValuePlease.new({ from: owner })
                .then(created => {
                    noValuePlease = created;
                    return directPay.pay.call(noValuePlease.address, 1, { from: owner });
                })
                .then(success => {
                    assert.isFalse(success, "should not be possible to send 1 ether");
                    return directPay.pay(noValuePlease.address, 1, { from: owner, gas: 3000000 });
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => {
                    assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                    return web3.eth.getBalancePromise(directPay.address);
                })
                .then(balance => {
                    assert.strictEqual(
                        balance.toString(10),
                        web3.toWei(5).toString(10),
                        "should still be at 5 Ether");
                    return web3.eth.getBalancePromise(noValuePlease.address);
                })
                .then(noValueBalance => {
                    if (isTestRPC) {
                        console.log("SKIPPED asserts that fail in TestRPC");
                    } else {
                        assert.strictEqual(
                            noValueBalance.toNumber(),
                            0,
                            "should still be 0 balance");
                    }
                    return directPay.calls();
                })
                .then(calls => {
                    assert.strictEqual(calls.toNumber(), 1, "should have had a single call");
                });
        });

        it("should not be possible to send more than what it has", function () {
            return web3.eth.getBalancePromise(directPay.address)
                .then(balance => {
                    return directPay.pay.call(
                        recipient,
                        balance.plus(1),
                        { from: owner });
                })
                .then(success => {
                    assert.isFalse(success, "should not accept to send more than has");
                });
        });

    });

    describe("Irregular actions", function() {

        it("should be possible to increase balance of NoValuePlease via selfdestruct", function() {
            var mortal, noValuePlease;

            return Promise.all([
                    Mortal.new({ from: owner, value: 8 }),
                    NoValuePlease.new({ from: owner })
                ]) 
                .then(createds => {
                    mortal = createds[0];
                    noValuePlease = createds[1];
                    return web3.eth.getBalancePromise(noValuePlease.address);
                })
                .then(balance => {
                    assert.strictEqual(balance.toNumber(), 0, "should have nothing");
                    return mortal.kill(noValuePlease.address);
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => {
                    return web3.eth.getBalancePromise(noValuePlease.address);
                })
                .then(balance => {
                    assert.strictEqual(
                        balance.toNumber(), 8, "should have an updated balance");
                });
        });

        it("should be possible to increase balance of NoValuePlease before deployment", function() {
            var futureAddress;

            return web3.eth.getTransactionCountPromise(owner)
                .then(currentNonce => {
                    futureAddress = ethJsUtil.bufferToHex(ethJsUtil.generateAddress(
                        owner, currentNonce + 1));
                    return web3.eth.sendTransactionPromise({
                            from: owner,
                            to: futureAddress,
                            value: 17
                        });
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => {
                    return NoValuePlease.new({ from: owner });
                })
                .then(noValuePlease => {
                    return web3.eth.getBalancePromise(noValuePlease.address);
                })
                .then(balance => {
                    assert.strictEqual(
                        balance.toNumber(), 17, "should already have a balance");                    
                });
        });

    });

});
