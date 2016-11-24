extensions = require("./extensions.js");
extensions.init(web3, assert);

contract('DirectPay', function(accounts) {

    it("should be possible to send 1 ether", function() {
        var directPay = DirectPay.deployed();
        var account1Balance = web3.eth.getBalance(accounts[1]);

        assert.equal(
            web3.fromWei(web3.eth.getBalance(directPay.address)).valueOf(),
            10,
            "should start with 10 Ether");

        return directPay.calls()
            .then(function (calls) {
                assert.equal(calls.valueOf(), 0, "should have had no calls so far");
                return  directPay.pay.call(accounts[1], web3.toWei(1), { from: accounts[0] });
            })
            .then(function (success) {
                assert.isTrue(success, "should be possible to send 1 ether");
                return directPay.pay(accounts[1], web3.toWei(1), { from: accounts[0], gas: 3000000 });
            })
            .then(function (tx) {
                return web3.eth.getTransactionReceiptMined(tx);
            })
            .then(function (receipt) {
                assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                assert.equal(
                    web3.fromWei(web3.eth.getBalance(directPay.address)).valueOf(),
                    9,
                    "should be down to 9 Ether");
                var newAccout1Balance = web3.eth.getBalance(accounts[1]); 
                // This fails in TestRPC
                assert.equal(
                    web3.fromWei(newAccout1Balance - account1Balance).valueOf(),
                    1,
                    "should have new balance");
                return directPay.calls();
            })
            .then(function (calls) {
                assert.equal(calls.valueOf(), 1, "should have had a single call");
            });
    });

    it("should be possible to send 0 ether", function() {
        var directPay = DirectPay.deployed();
        var account1Balance = web3.eth.getBalance(accounts[1]);

        assert.equal(web3.fromWei(web3.eth.getBalance(directPay.address)).valueOf(), 9, "should start with 9 Ether");

        return directPay.pay.call(accounts[1], 0, { from: accounts[0] })
            .then(function (success) {
                assert.isTrue(success, "should be possible to send 0 ether");
                return directPay.pay(accounts[1], 0, { from: accounts[0], gas: 3000000 });
            })
            .then(function (tx) {
                return web3.eth.getTransactionReceiptMined(tx);
            })
            .then(function (receipt) {
                assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                assert.equal(web3.fromWei(web3.eth.getBalance(directPay.address)).valueOf(), 9, "should still be at 9 Ether");
                var newAccout1Balance = web3.eth.getBalance(accounts[1]); 
                // This fails in TestRPC
                assert.equal(web3.fromWei(newAccout1Balance - account1Balance).valueOf(), 0, "should have same balance");
                return directPay.calls();
            })
            .then(function (calls) {
                assert.equal(calls.valueOf(), 2, "should have had 2 calls");
            });
    });

    it("should not be possible to send 1 ether to NoValuePlease", function() {
        var directPay = DirectPay.deployed();
        var noValuePlease = NoValuePlease.deployed();

        assert.equal(web3.fromWei(web3.eth.getBalance(directPay.address)).valueOf(), 9, "should start with 9 Ether");

        return directPay.pay.call(noValuePlease.address, 1, { from: accounts[0] })
            .then(function (success) {
                assert.isFalse(success, "should not be possible to send 1 ether");
                return directPay.pay(noValuePlease.address, 1, { from: accounts[0], gas: 3000000 });
            })
            .then(function (tx) {
                return web3.eth.getTransactionReceiptMined(tx);
            })
            .then(function (receipt) {
                assert.isBelow(receipt.gasUsed, 3000000, "should not use all gas");
                assert.equal(web3.fromWei(web3.eth.getBalance(directPay.address)).valueOf(), 9, "should still be at 9 Ether");
                var noValueBalance = web3.eth.getBalance(noValuePlease.address); 
                // This fails in TestRPC
                assert.equal(web3.fromWei(noValueBalance).valueOf(), 0, "should still be 0 balance");
                return directPay.calls();
            })
            .then(function (calls) {
                assert.equal(calls.valueOf(), 3, "should have had 3 calls");
            });
    });

    it("should not be possible to send more than what it has", function () {

        var directPay = DirectPay.deployed();

        return directPay.pay.call(
                accounts[1],
                web3.eth.getBalance(directPay.address).plus(1),
                { from: accounts[0] })
            .then(function (success) {
                assert.isFalse(success, "should not accept to send more than has");
            })
    });

});
