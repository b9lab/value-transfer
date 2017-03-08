var SafeMortal = artifacts.require("./SafeMortal.sol");

Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('SafeMortal', function(accounts) {

    var owner, recipient;

    before("should prepare accounts", function () {
        assert.isAbove(accounts.length, 2, "should have at least 2 accounts");
        owner = accounts[0];
        recipient = accounts[1];
        return Extensions.makeSureAreUnlocked([ owner ]);
    });

    describe("Basics", function() {
        var safeMortal;

        beforeEach("should create a SafeMortal", function() {
            return SafeMortal.new({ from: owner })
                .then(created => {
                    safeMortal = created;
                    return safeMortal.owner();
                })
                .then(fetchedOwner => {
                    assert.strictEqual(fetchedOwner, owner, "should have saved owner");
                    return safeMortal.killed();
                })
                .then(killed => assert.isFalse(killed, "should not be killed yet"));
        });

        it("should be possible to send to safeMortal", function() {
            return web3.eth.sendTransactionPromise({
                    from: owner,
                    to: safeMortal.address,
                    value: 1,
                    gas: 3000000
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => assert.isBelow(receipt.gasUsed, 3000000, "should not have used all gas"));
        });

        it("should be possible to kill safeMortal", function() {
            return safeMortal.kill({ from: owner, gas: 3000000 })
                .then(txObject => {
                    assert.isBelow(txObject.receipt.gasUsed, 3000000, "should not have used all");
                    return safeMortal.killed();
                })
                .then(killed => assert.isTrue(killed, "should have been marked as killed"));
        });

        it("should not be possible to kill if not owner", function() {
            return Extensions.expectedExceptionPromise(
                () => safeMortal.kill({ from: recipient, gas: 3000000 }),
                3000000);
        });

        it("should be possible to send Ether", function() {
            return web3.eth.sendTransactionPromise({
                    from: owner,
                    to: safeMortal.address,
                    value: 1
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => web3.eth.getBalancePromise(safeMortal.address))
                .then(balance => assert.strictEqual(balance.toNumber(), 1, "should have received"));
        });

    });

    describe("Killing", function() {
        var safeMortal;

        beforeEach("should create a SafeMortal with value", function() {
            return SafeMortal.new({ from: owner })
                .then(created => {
                    safeMortal = created;
                    return web3.eth.sendTransactionPromise({
                        from: owner,
                        to: safeMortal.address,
                        value: 2
                    });
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => web3.eth.getBalancePromise(safeMortal.address))
                .then(balance => assert.strictEqual(balance.toNumber(), 2, "should have received wei"));
        });

        it("should be possible to empty on kill", function() {
            return safeMortal.kill({ from: owner, gas: 3000000 })
                .then(txObject => {
                    assert.isBelow(txObject.receipt.gasUsed, 3000000, "should have gone through");
                    return web3.eth.getBalancePromise(safeMortal.address);
                })
                .then(balance => assert.strictEqual(balance.toNumber(), 0, "should have returned all"));
        });
    });

    describe("After kill", function() {
        var safeMortal;

        beforeEach("should create a killed SafeMortal", function() {
            return SafeMortal.new({ from: owner })
                .then(created => {
                    safeMortal = created;
                    return safeMortal.kill({ from: owner });
                })
                .then(txObject => safeMortal.killed())
                .then(killed => assert.isTrue(killed, "should have been killed"));
        });

        it("should not be possible to call kill again", function() {
            return Extensions.expectedExceptionPromise(
                () => safeMortal.kill({ from: owner, gas: 3000000 }),
                3000000);
        });

        it("should not be possible to send Ether to it", function() {
            return Extensions.expectedExceptionPromise(
                () => web3.eth.sendTransactionPromise({
                    from: owner,
                    to: safeMortal.address,
                    value: 1
                }),
                3000000);
        });

    });

});