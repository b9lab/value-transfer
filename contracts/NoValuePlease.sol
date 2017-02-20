pragma solidity ^0.4.4;

contract NoValuePlease {
    function NoValuePlease() payable {
        if (msg.value > 0) throw;
    }
}