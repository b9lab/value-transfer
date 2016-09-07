contract DirectPay {
	uint public calls;

	function pay(address whom, uint value) 
		returns (bool success) {
		calls++;
		return whom.send(value);
	}
}