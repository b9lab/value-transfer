pragma solidity ^0.4.4;

contract SafeMortal {
	address public owner;
	bool public killed;

	function SafeMortal() {
		owner = msg.sender;
	}

	function kill() isNotKilled {
		if (msg.sender != owner) {
			throw;
		}
		if (!owner.call.value(this.balance)()) {
			throw;
		}
		killed = true;
	}

	modifier isNotKilled {
		if (killed) {
			throw;
		}
		_;
	}

	function () isNotKilled payable {}
}