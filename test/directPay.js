Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('DirectPay', function(accounts) {

    var isTestRPC = web3.version.node.indexOf("EthereumJS TestRPC") > -1;
    var owner, recipient;
    var directPay;
    var right;

    before("should prepare accounts", function () {
        assert.isAbove(accounts.length, 2, "should have at least 2 accounts");
        owner = accounts[0];
        recipient = accounts[1];
        return Extensions.makeSureAreUnlocked([ owner ]);
    });

    beforeEach("should deploy a DirectPay", function() {
        return DirectPay.new({ from: owner, value: web3.toWei(10) })
            .then(function(created) {
                directPay = created;
                assert.strictEqual(
                    web3.eth.getBalance(directPay.address).toString(10),
                    web3.toWei(10).toString(10),
                    "should start with 10 Ether");
                return directPay.calls();
            })
            .then(function (calls) {
                assert.strictEqual(calls.toNumber(), 0, "should start with 0 calls");
            });
    });

    it("should be possible to send 1 ether", function() {
        var account1Balance = web3.eth.getBalance(accounts[1]);

        return  directPay.pay.call(recipient, web3.toWei(1), { from: owner })
            .then(function (success) {
                assert.isTrue(success, "should be possible to send 1 ether");
                return directPay.pay(recipient, web3.toWei(1), { from: owner, gas: 3000000 });
            })
            .then(function (tx) {
                return web3.eth.getTransactionReceiptMined(tx);
            })
            .then(function (receipt) {
                assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                assert.strictEqual(
                    web3.eth.getBalance(directPay.address).toString(10),
                    web3.toWei(9).toString(10),
                    "should be down to 9 Ether");
                var newAccout1Balance = web3.eth.getBalance(recipient);
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
            .then(function (calls) {
                assert.strictEqual(calls.toNumber(), 1, "should have had a single call");
            });
    });

    it("should be possible to send 0 ether", function() {
        var account1Balance = web3.eth.getBalance(recipient);

        return directPay.pay.call(recipient, 0, { from: owner })
            .then(function (success) {
                assert.isTrue(success, "should be possible to send 0 ether");
                return directPay.pay(recipient, 0, { from: owner, gas: 3000000 });
            })
            .then(function (tx) {
                return web3.eth.getTransactionReceiptMined(tx);
            })
            .then(function (receipt) {
                assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                assert.strictEqual(
                    web3.eth.getBalance(directPay.address).toString(10),
                    web3.toWei(10).toString(10),
                    "should still be at 10 Ethers");
                var newAccout1Balance = web3.eth.getBalance(recipient);
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
            .then(function (calls) {
                assert.strictEqual(calls.toNumber(), 1, "should have had a single call");
            });
    });

    it("should not be possible to send 1 ether to NoValuePlease", function() {
        var noValuePlease;

        return NoValuePlease.new()
            .then(function(created) {
                noValuePlease = created;
                return directPay.pay.call(noValuePlease.address, 1, { from: owner });
            })
            .then(function (success) {
                assert.isFalse(success, "should not be possible to send 1 ether");
                return directPay.pay(noValuePlease.address, 1, { from: owner, gas: 3000000 });
            })
            .then(function (tx) {
                return web3.eth.getTransactionReceiptMined(tx);
            })
            .then(function (receipt) {
                assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                assert.strictEqual(
                    web3.eth.getBalance(directPay.address).toString(10),
                    web3.toWei(10).toString(10),
                    "should still be at 10 Ether");
                var noValueBalance = web3.eth.getBalance(noValuePlease.address);
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
            .then(function (calls) {
                assert.strictEqual(calls.toNumber(), 1, "should have had a single call");
            });
    });

    it("should not be possible to send more than what it has", function () {

        return directPay.pay.call(
                recipient,
                web3.eth.getBalance(directPay.address).plus(1),
                { from: owner })
            .then(function (success) {
                assert.isFalse(success, "should not accept to send more than has");
            });
    });

});
