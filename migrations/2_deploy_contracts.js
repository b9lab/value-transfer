module.exports = function(deployer) {
  deployer.deploy(DirectPay, { value: web3.toWei(10) });
  deployer.deploy(NoValuePlease);
};
