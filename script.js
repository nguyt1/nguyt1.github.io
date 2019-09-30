$(document).ready(function() {
            $("#test").click(function(event){
               $.getJSON('ibc_ip_and_port_ranges.json',function(data){
                 console.log(data);
                 var output = '<br>';  
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
});
