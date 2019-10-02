var output;
var json_file = 'ibc_ip_and_port_ranges.json'; // change this to match json data file containing required urls, ip addresses, ports number 

// start of codes copied from https://github.com/mattulm/offense/blob/master/docs/web-files/js-recon.html
    var scan_type=1;
    var ip;
    var start_port;
    var end_port;
    var start_ip=[];
    var end_ip=[];
    var port;
    var blocked_ports = [0,1,7,9,11,13,15,17,19,20,21,22,23,25,37,42,43,53,77,79,87,95,101,102,103,104,109,110,111,113,115,117,119,123,135,139,143,179,389,465,512,513,514,515,526,530,531,532,540,556,563,587,601,636,993,995,2049,4045,6000];
    var ws;
    var xhr;
    var start_time;
    var current_port=0;
    var current_ip=[];
    var open_port_max=300;
    var closed_port_max=2000;
    var ps_open_ports=[];
    var ps_closed_ports=[];
    var ps_timeout_ports=[];
    var ns_hosts_up=[];
    var network_address=[192,168,0,1];
    
    function scan_ports()
    {
        scan_type=1;
        ip = document.getElementById('ip').value;
        start_port = document.getElementById('start_port').value;
        end_port = document.getElementById('end_port').value;
        if(!(is_valid_ip(ip.split(".")) && is_valid_port(start_port) && is_valid_port(end_port) && (end_port > start_port)))
        {
            alert("Invalid IP and port values entered");
            return;
        }
        current_port=0;
        ps_open_ports=[];
        ps_closed_ports=[];
        ps_timeout_ports=[];
        reset_scan_out();
        document.getElementById('log').innerHTML += "----------------<br><b>Scan Log:</b><br>";
        if(document.port_scan.protocol[0].checked)
        {
            setTimeout("scan_ports_xhr()",1);
        }
        else
        {
            setTimeout("scan_ports_ws()",1);
        }
    }
    
    function scan_ports_ws()
    {
        if(init_port_ps())
        {
            return;
        }
        if(is_blocked(current_port))
        {
           log(current_port + "  - blocked port");
           setTimeout("scan_ports_ws()",1);
           return;
        }
        start_time = (new Date).getTime();
        try
        {
            ws = new WebSocket("ws://" + ip + ":" + current_port);
            setTimeout("check_ps_ws()",5);
        }
        catch(err)
        {
            document.getElementById('result').innerHTML += "<b>Scan stopped. Exception: " + err + "</b>";
            return;
        }
    }
    
    function check_ps_ws()
    {
        var interval = (new Date).getTime() - start_time;
        if(ws.readyState == 0)
        {
            if(interval > closed_port_max)
            {
                log(current_port + " - time exceeded");
                ps_timeout_ports.push(current_port);
                setTimeout("scan_ports_ws()",1);
            }
            else
            {
                setTimeout("check_ps_ws()",5);
            }
        }
        else
        {
            if(interval < open_port_max)
            {
                log(current_port + " - open");
                ps_open_ports.push(current_port);
            }
            else
            {
                log(current_port + " - closed");
                ps_closed_ports.push(current_port);
            }
            setTimeout("scan_ports_ws()",1);
        }
    }
    
    function scan_ports_xhr()
    {
        if(init_port_ps())
        {
            return;
        }
        if(is_blocked(current_port))
        {
           log(current_port + "  - blocked port");
           setTimeout("scan_ports_xhr()",1);
           return;
        }
        start_time = (new Date).getTime();
        try
        {
            xhr = new XMLHttpRequest();
            xhr.open('GET', "http://" + ip + ":" + current_port);
            xhr.send();
            setTimeout("check_ps_xhr()",5);
        }
        catch(err)
        {
            document.getElementById('result').innerHTML += "<b>Scan stopped. Exception: " + err + "</b>";
            return;
        }
    }
    
    function check_ps_xhr()
    {
        var interval = (new Date).getTime() - start_time;
        if(xhr.readyState == 1)
        {
            if(interval > closed_port_max)
            {
                log(current_port + " - time exceeded");
                ps_timeout_ports.push(current_port);
                setTimeout("scan_ports_xhr()",1);
            }
            else
            {
                setTimeout("check_ps_xhr()",5);
            }
        }
        else
        {
            if(interval < open_port_max)
            {
                log(current_port + " - open");
                ps_open_ports.push(current_port);
            }
            else
            {
                log(current_port + " - closed");
                ps_closed_ports.push(current_port);
            }
            setTimeout("scan_ports_xhr()",1);
        }
    }
    
    function init_port_ps()
    {
        if(current_port == 0)
        {
            current_port = start_port;
        }
        else if(current_port == end_port)
        {
            results_ps();
            return true;
        }
        else
        {
            current_port++;
        }
        return false;
    }
    
    function results_ps()
    {
        document.getElementById('result').innerHTML = "<br><b>Open Ports:</b><br>" + ps_open_ports + "<br><br><b>Closed/Blocked Ports:</b><br>" + ps_closed_ports + "<br><br><b>Filtered/Application Type 3&4 Ports:</b><br>" + ps_timeout_ports + "<br><br>";
    }

    
    function is_blocked(port_no)
    {
        for(var i=0;i<blocked_ports.length;i++)
        {
            if(blocked_ports[i] == port_no)
            {
                return true;
            }
        }
        return false;
    }
    
    function is_valid_ip(v_ip)
    {
        if(((v_ip[0] > 0) && (v_ip[0] <= 223)) &&((v_ip[1] >= 0) && (v_ip[1] <= 255)) && ((v_ip[2] >= 0) && (v_ip[2] <= 255)) && ((v_ip[3] > 0) && (v_ip[3] < 255)))
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    
    function is_valid_port(v_port)
    {
        if(v_port > 0 && v_port < 65536)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    
    function increment_ip(inc_ip)
    {
        inc_ip[3]++;
        for(var i=3;i>=0;i--)
        {
            if(inc_ip[i] == 255)
            {
                inc_ip[i] = 0;
                inc_ip[i-1]++;
            }
        }
        return inc_ip;
    }
    
    function log(to_log)
    {
        document.getElementById('log').innerHTML += to_log + ", ";
    }
    
    function reset_scan_out()
    {
        document.getElementById('result').innerHTML = "";
        document.getElementById('log').innerHTML = "";
    }
    
// end of code copied from https://github.com/mattulm/offense/blob/master/docs/web-files/js-recon.html

	function prepare_ports()
	{
		if (ports == 'default') // Default ports to scan
		{
			// nmap most used ports to scan + some new ports
			for ( var i=0; i<default_ports.length; i++)
			{
				ports_list[i] = default_ports[i];
			}

		} else if (ports == 'top')	// Top-ports according to Fyodor's research
		{
			// nmap most used ports to scan + some new ports
			for ( var i=0; i<top_ports.length; i++)
			{
				ports_list[i] = top_ports[i];
			}

		} else 
		{ // Custom ports provided to scan
			if (ports.search(",") > 0) ports_list = ports.split(","); // list of ports
			else if (ports.search("-") > 0) 
			{
				var firstport = parseInt(ports.split("-")[0]); // range of ports, start
				var lastport = parseInt(ports.split("-")[1]); // range of ports, end
				var a = 0;
				for (var i = firstport; i<=lastport; i++)
				{
					ports_list[a] = firstport + a;
					a++;
				}
			} else ports_list = ports.split(); // single port
		}
	}

$(document).ready(function() {
            $("#test").click(function(event){                                     
                         $.getJSON(json_file,function(data){
                                     console.log(data);
                                     output = '<br>'; 
				     // for each json record representing an IBC service type
                                     $.each(data, function(i,val){
					         // For each service record, do the followings
                                                 output += 'Checking reachability for service: ' + val.serviceName + '<br>';
					         // check if json record have a TCP port field
                                                 if (typeof val.tcpPorts == "undefined") {
                                                             output += 'Error: service record missing TCP port' + '<br>';
                                                 } 
					         // check if json record has either an URL or an IP address array field
                                                 else if ((typeof val.urls == "undefined") && (typeof val.ip_ranges == "undefined")) {
                                                             output += 'Error: service record missing both URL and IP field' + '<br>';
                                                 }
					         // valid json record, start testing reachability to the given service
                                                 else {
							     if (typeof val.urls !== "undefined") {
                                                                         hosts_list = val.urls;
                                                             }
                                                             else {
                                                                         hosts_list = val.ip_ranges;
                                                             }
							     prepare_ports(); // convert port string to array of port
							     // For each host in the service record
							     $.each(hosts_list, function(j, host) {
								     ports = val.tcpPorts;
								     prepare_ports();
								     // for each port, test reachability to host:port
								     $.each(ports_list, function(k,port) {
									     output += 'Connecting to ' + host + ':' + port + ', ';
								//	     start_time_cors = (new Date).getTime();
								//	     cors_scan(host,port);
									     start_time_ws = (new Date).getTime();
								             websocket_scan(host,port);
									     switch (port_status_ws) {
										     case 1:
											     output += 'Port state = CLOSED' + '<br>';
											     break;
										     case 2:
											     output += 'Port state = OPEN' + '<br>';
											     break;
										     case 3:
											     output += 'Port state = TIMEOUT' + '<br>';
											     break;
										     case 4:
											     output += 'Port state = BLOCKED' + '<br>';
											     break;
									     };		     
						                     });
						             });
                                                 };
                                                 output += '<br>';
                                     });
                                     $('#log').html(output);
                         });
            });
});
