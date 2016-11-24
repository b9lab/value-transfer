pragma solidity ^0.4.4;

contract NoValuePlease {
    function NoValuePlease() {
        if (msg.value > 0) throw;
    }
}