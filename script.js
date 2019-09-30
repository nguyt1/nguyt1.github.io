var output;
var json_file_name = 'ibc_ip_and_port_ranges.json';

function read_json_file()
{
            $.getJSON('ibc_ip_and_port_ranges.json',function(data){});
}

$(document).ready(function() {
            $("#test").click(function(event){
                        read_json_file();
                        console.log(data);
                 output = '<br>';  
                 $.each(data, function(key,val){
                  output += 'Service: ' + val.serviceName + '<br>';
                  if (typeof val.urls !== "undefined")
                  {
                   output += 'URLS: ' + val.urls + '<br>';
                  }
                  if (typeof val.ip_ranges !== "undefined")
                  {            
                   output += 'IP Addresses: ' + val.ip_ranges + '<br>';
                  }            
                  output += 'TCP Ports: ' + val.tcpPorts + '<br>';
                 });
                 output += '<br>';
                 $('#log').html(output);
            });
});
