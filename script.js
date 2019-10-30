var debug = false; // if set to true, program will print the time interval that the websocket stays in CONNECTING state
var debug_detail = false; // if set to true, program will print the time inverval in CONNECTING state for each polling cycle 
var json_file = 'ibc_ip_and_port_ranges.json'; // change this to name of json data file containing required ip addresses, ports numbers
var ports_str = "";
var ports_array= [];
var IPs_str = "";
var IPs_array= [];

const poll_interval = 50; // check websocket status every poll_interval in msec
const reachable_timer = 2000; // if websocket in CONNECTING for less than this value, then infer that the port is reachable 
const unreachable_timer = 6000; // if websocket in CONNECTING for more than this value, then infer that the port is unreachable
const CONNECTING = 0;
const REACHABLE = 1;
const UNREACHABLE = 2;
const UNKNOWN = 3;

function prepare_ports() {		 
	if (ports_str.search(",") > 0) { // list of ports separated by comma
		ports_array = ports_str.split(","); 
	}	
	else if (ports_str.search("-") > 0) { // range of ports 
		var firstport = parseInt(ports_str.split("-")[0]); // range of ports, start
		var lastport = parseInt(ports_str.split("-")[1]); // range of ports, end
		var a = 0;
		for (var i = firstport; i<=lastport; i++) {
			ports_array[a] = firstport + a;
			a++;
		}
	}	
	else ports_array = ports_str.split(); // single port
}

function prepare_IPs() {
	let data = IPs_str;
	const ips = data.split(','); // put all IP fields into an array
	// Use the built in forEach function to iterate through the array
	ips.forEach(ip => {
	  // This regular expression will match the potential extremities of the range
	  const regexp = /[0-9]+\.[0-9]+\.[0-9]+\.\[(.*)\-(.*)\]/;
	  const match = regexp.exec(ip);

	  // If it's a range
	  if (match && match.length && match[1] && match[2]) {
	      // Iterate through the extremities and add the IP to the IPs_array
	      for (let i = parseInt(match[1]); i <= parseInt(match[2]); i ++) {
		IPs_array.push(ip.match(/[0-9]+\.[0-9]+\.[0-9]+\./i)[0] + i);
	      }
	  } else { // If it is a single IP
	    // Add to the results
	    IPs_array.push(ip);
	  }
	});	
}

function check_ps_ws(socket, initial_time) {
	let interval = (new Date).getTime() - initial_time;
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
//	ws_scan.onerror = function(event) {
//		document.getElementById('error').innerHTML += 'WebSocket error observed: ' + event + '<br>'; 
//	}
	let checkCondition = function(resolve,reject) {
		let result = check_ps_ws(ws_scan, start_time_ws);
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
		document.getElementById('log').innerHTML = '<p style="text-decoration:underline;">Results:</p>';
		document.getElementById('error').innerHTML = '<p style="text-decoration:underline;">Errors/Debugs:</p>';
		$.getJSON(json_file,function(data) {
			console.log(data);
			data.forEach(function(record) { // For each IBC service record, do the followings
				// check if json record have a TCP port field
				if (typeof record.tcpPorts == "undefined") {
					document.getElementById('error').innerHTML += 'Error: service record missing TCP port <br>';
				}
				// check if json record has an IP address array field
				else if (typeof record.ipAddresses == "undefined") {
					document.getElementById('error').innerHTML += 'Error: service record missing IP field <br>';
				}
				// valid json record, start testing reachability to the given service
				else {
					IPs_str = record.ipAddresses;
					prepare_IPs();
					ports_str = record.tcpPorts;
					prepare_ports();
					// For each IP address and port in the service record
					IPs_array.forEach(function(host) {
						ports_array.forEach(function(port) {						
							scanWebSocket(host+":"+port, poll_interval).then(function(result) {
								if (debug) {
									document.getElementById('error').innerHTML  += 'Testing reachability to '+host+':'+port+' ---> time in CONNECTING state is:'+result+' ms<br>';
								};
								switch (result) {
									case UNREACHABLE:
										document.getElementById('log').innerHTML  += host+':'+port+' is <font color="red">UNREACHABLE</font><br>';
										break;
									case REACHABLE:
										document.getElementById('log').innerHTML  += host+':'+port+' is <font color="green">REACHABLE</font><br>';
										break;
									case UNKNOWN:
										document.getElementById('log').innerHTML  += host+':'+port+' reachability is <font color="orange">UNKNOWN</font><br>';
										break;
									default:
										document.getElementById('log').innerHTML  += host+':'+port+' time in CONNECTING state is '+result+' msec<br>';
										break;
								};
							});
						});	
							
					});
				}
			});
		});
	});
});
