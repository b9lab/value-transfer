contract NoValuePlease {
	function NoValuePlease() {
		if (msg.value > 0) throw;
	}
	
	function () {
		if (msg.value > 0) throw;
	}
}