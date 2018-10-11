<?php 
include 'common.inc.php';

if (!isset($_REQUEST["docencia"])) {
      echo "Invalid request!";
      return;
   }
   $db = getDB();  
   $query = "UPDATE ch SET docencia='" . $_REQUEST["docencia"]. "', atividades='" . $_REQUEST["atividades"]. "' WHERE id=(SELECT currentid from static where id=1 LIMIT 1)";
   $result = mysql_query($query);
   mysql_free_result($result);
   mysql_close($db);
?> 
