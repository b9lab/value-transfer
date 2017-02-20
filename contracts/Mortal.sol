pragma solidity ^0.4.4;

contract Mortal {
	function Mortal() payable {}
	
	function kill(address beneficiary) {
		selfdestruct(beneficiary);
	}
}