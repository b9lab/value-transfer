module.exports = {
	init: function (web3, assert) {
		web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
			var transactionReceiptAsync;
			interval = interval ? interval : 500;
			transactionReceiptAsync = function(txnHash, resolve, reject) {
				try {
					var receipt = web3.eth.getTransactionReceipt(txnHash);
					if (receipt == null) {
						setTimeout(function () {
							transactionReceiptAsync(txnHash, resolve, reject);
						}, interval);
					} else {
						resolve(receipt);
					}
				} catch(e) {
					reject(e);
				}
			};

			return new Promise(function (resolve, reject) {
					transactionReceiptAsync(txnHash, resolve, reject);
			});
		};

		assert.isTxHash = function (txnHash, message) {
			assert(typeof txnHash === "string",
				'expected #{txnHash} to be a string',
				'expected #{txnHash} to not be a string');
			assert(txnHash.length === 66,
				'expected #{txnHash} to be a 66 character transaction hash (0x...)',
				'expected #{txnHash} to not be a 66 character transaction hash (0x...)');

			// Convert txnHash to a number. Make sure it's not zero.
			// Controversial: Technically there is that edge case where
			// all zeroes could be a valid address. But: This catches all
			// those cases where Ethereum returns 0x0000... if something fails.
			var number = web3.toBigNumber(txnHash, 16);
			assert(number.equals(0) === false, 
				'expected address #{txnHash} to not be zero', 
				'you shouldn\'t ever see this.');
		};

	},

	getEventsPromise: function (myFilter, count) {
		return new Promise(function (resolve, reject) {
			count = count ? count : 1;
			var results = [];
			myFilter.watch(function (error, result) {
				if (error) {
					reject(error);
				} else {
					count--;
					results.push(result);
				}
				if (count <= 0) {
					resolve(results);
					myFilter.stopWatching();
				}
			});
		});
	},

	expectedExceptionPromise: function (action, gasToUse, timeOut) {
		var promise = new Promise(function (resolve, reject) {
				try {
					resolve(action());
				} catch(e) {
					reject(e);
				}
			})
			.then(function (txnHash) {
				assert.isTxHash(txnHash, "it should have thrown");
				return web3.eth.getTransactionReceiptMined(txnHash);
			})
			.then(function (receipt) {
				// We are in Geth
				assert.equal(receipt.gasUsed, gasToUse, "should have used all the gas");
			})
			.catch(function (e) {
				if ((e + "").indexOf("invalid JUMP") > -1) {
					// We are in TestRPC
				} else if ((e + "").indexOf("please check your gas amount") > -1) {
					// We are in Geth for a deployment
				} else {
					throw e;
				}
			});

		return promise;
	}

};
