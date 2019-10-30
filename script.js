var debug = true; // If set to true, program will print the time interval that the websocket stays in CONNECTING state
var debug_detail = false; // If set to true, program will print the time inverval in CONNECTING state for each polling cycle 
var json_file = 'ibc_ip_and_port_ranges.json'; // change this to name of json data file containing required ip addresses, ports numbers
var ports = "";
var ports_list= [];

const poll_interval = 20; // check websocket status every poll_interval in msec
const reachable_timer = 300; // if websocket in CONNECTING for less than this value, then infer that the port is reachable 
const unreachable_timer = 2000; // if websocket in CONNECTING for more than this value, then infer that the port is unreachable
const CONNECTING = 0;
const REACHABLE = 1;
const UNREACHABLE = 2;
const UNKNOWN = 3;

function prepare_ports() {		 
	if (ports.search(",") > 0) { // list of ports separated by comma
		ports_list = ports.split(","); 
	}	
	else if (ports.search("-") > 0) { // range of ports 
		var firstport = parseInt(ports.split("-")[0]); // range of ports, start
		var lastport = parseInt(ports.split("-")[1]); // range of ports, end
		var a = 0;
		for (var i = firstport; i<=lastport; i++) {
			ports_list[a] = firstport + a;
			a++;
		}
	}	
	else ports_list = ports.split(); // single port
}

function check_ps_ws(socket, initial_time) {
	var interval = (new Date).getTime() - initial_time;
	if (debug_detail) {
		document.getElementById('error').innerHTML  += 'Testing reachability to ' + socket.url + ' ---> time in CONNECTING state is:'+ interval +' ms<br>';
	}
	if(socket.readyState === socket.CONNECTING) {
		if(interval > unreachable_timer) {
			if (debug) {
				return interval;
			}
			else {
				return UNREACHABLE;
			}	
		}
		else {
			return CONNECTING;		
		}
	}
	else {
		if (debug) {
			return interval;
		}
		else {
			if(interval < reachable_timer) {
				return REACHABLE;
			}
			else {
				return UNKNOWN;
			}
		}	
	}
}

function scanWebSocket(url,period) {
	let start_time_ws = (new Date).getTime();
	let ws_scan = new WebSocket("wss://" + url); 
	var checkCondition = function(resolve,reject) {
		var result = check_ps_ws(ws_scan, start_time_ws);
		if (result === CONNECTING) {
			setTimeout(checkCondition, period, resolve, reject);
		}	
		else {
			resolve(result);
		}
	}		
	return new Promise(checkCondition);
}
	
$(document).ready(function()  {
	$("#test").click(function(event) {
		document.getElementById('log').innerHTML = 'Results:<br>';
		document.getElementById('error').innerHTML = 'Errors/Debugs:<br>';
		$.getJSON(json_file,function(data) {
			console.log(data);
			data.forEach(function(record) { // For each IBC service record, do the followings
				// check if json record have a TCP port field
				if (typeof record.tcpPorts == "undefined") {
					document.getElementById('error').innerHTML += 'Error: service record missing TCP port <br>';
				}
				// check if json record has an IP address array field
				else if (typeof record.ip_ranges == "undefined") {
					document.getElementById('error').innerHTML += 'Error: service record missing IP field <br>';
				}
				// valid json record, start testing reachability to the given service
				else {
				hosts_list = record.ip_ranges;
					// For each host in the service record
					hosts_list.forEach(function(host) {
						ports = record.tcpPorts;
						prepare_ports();
						// for each port, test reachability to host:port
						ports_list.forEach(function(port) {						
							scanWebSocket(host+":"+port, poll_interval).then(function(result) {
								if (debug) {
									document.getElementById('error').innerHTML  += 'Testing reachability to '+host+':'+port+' ---> time in CONNECTING state is:'+result+' ms<br>';
								}
								switch (result) {
									case UNREACHABLE:
										document.getElementById('log').innerHTML  += host+':'+port+' is UNREACHABLE<br>';
										break;
									case REACHABLE:
										document.getElementById('log').innerHTML  += host+':'+port+' is REACHABLE<br>';
										break;
									case UNKNOWN:
										document.getElementById('log').innerHTML  += host+':'+port+' reachability is UNKNOWN<br>';
										break;
								}
							});
						});	
							
					});
				}
			});
		});
	});
});
