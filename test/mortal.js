Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('Mortal', function(accounts) {

    var owner, recipient;

    before("should prepare accounts", function () {
        assert.isAbove(accounts.length, 2, "should have at least 2 accounts");
        owner = accounts[0];
        recipient = accounts[1];
        return Extensions.makeSureAreUnlocked([ owner ]);
    });

    it("should be possible to send Ether after selfdestruct", function() {
        var mortal;
        return CanReceiveMortal.new({ from: owner })
            .then(created => {
                mortal = created;
                return web3.eth.sendTransactionPromise({
                    from: owner,
                    to: mortal.address,
                    value: 1
                });
            })
            .then(web3.eth.getTransactionReceiptMined)
            .then(receipt => {
                return mortal.kill(owner, { from: owner });
            })
            .then(web3.eth.getTransactionReceiptMined)
            .then(receipt => {
                return web3.eth.getBalancePromise(mortal.address);
            })
            .then(balance => {
                assert.strictEqual(balance.toNumber(), 0, "should be empty");
                return web3.eth.sendTransactionPromise({
                    from: owner,
                    to: mortal.address,
                    value: 2,
                    gas: 3000000
                });
            })
            .then(web3.eth.getTransactionReceiptMined)
            .then(receipt => {
                assert.isBelow(receipt.gasUsed, 3000000, "should not have used all gas");
                return web3.eth.getBalancePromise(mortal.address);
            })
            .then(balance => {
                assert.strictEqual(balance.toNumber(), 2, "should have received");
                return mortal.kill(owner, { from: owner });
            })
            .then(web3.eth.getTransactionReceiptMined)
            .then(receipt => {
                assert.isBelow(receipt.gasUsed, 3000000, "should not have used all gas");
                return web3.eth.getBalancePromise(mortal.address);
            })
            .then(balance => {
                assert.strictEqual(balance.toNumber(), 2, "should not have been emptied");
            });
    });

});