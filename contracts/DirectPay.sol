pragma solidity ^0.4.4;

contract DirectPay {
	uint public calls;

	function pay(address whom, uint value) 
		returns (bool success) {
		calls++;
		return whom.send(value);
	}
}