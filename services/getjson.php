<?php
  include 'common.inc.php';

  header('Access-Control-Allow-Origin: *');
	header('Content-Type: application/json; charset=iso-8859-1');

	$db = getDB();
  echo '{ ';
	$query = "select * from ch where id=(SELECT currentid from static where id=1 LIMIT 1) LIMIT 1";
	$result = mysql_query($query);
	while ($row = mysql_fetch_object($result)) {
		echo '"metadata": {"descr": "' , $row->descr , '"},';
		echo '"docencia": ' , $row->docencia , ',';
		echo '"atividades": ' , $row->atividades , ',';
		echo '"indisponibilidade": ' , $row->indisponibilidade , ',';
		echo '"cursos": ' , $row->cursos , ',';;
	}
	mysql_free_result($result);

  $query = "select * from static where id=1 LIMIT 1";
	$result = mysql_query($query);
	while ($row = mysql_fetch_object($result)) {
		echo '"professores": ' , $row->professores , ',';
		echo '"disciplinas": ' , $row->disciplinas;
	}
	mysql_free_result($result);

  echo  '}';
	mysql_close($db);
?>
