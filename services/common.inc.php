<?php 
            
  function getDB(){
    //$h = 'mysql.upf.br';
    //$u = 'chweb';
    //$p = 'cHw3b';

    //if(strpos(strtoupper($_SERVER["HTTP_HOST"]), 'LOCALHOST') !== false){
      $h = 'localhost';
      $u = 'root';
      $p = 'admin';
    //}
    $db = mysql_connect($h, $u, $p) or die("Error in mysql_connect");
    mysql_select_db('chweb', $db) or die("Error in mysql_select_db");
    return $db;
  }
  
?>
