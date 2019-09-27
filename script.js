$(document).ready(function() {
            $("#driver").click(function(event){
               $.getJSON('ibc_ip_and_port_ranges.json',function(data){
                 console.log(data);
                 var output = '<ul>';  
                 $.each(data, function(key,val){
                  output += '<li>'+ val.serviceName + <li> + val.urls + '</li>' + val.tcpPorts + '<li>';
                 });
                 output += '</ul>';
                 $('#update').html(output);
               });
            });
});
