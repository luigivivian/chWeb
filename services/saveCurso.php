<?php
/**
 * Created by PhpStorm.
 * User: luigi
 * Date: 28/09/18
 * Time: 20:59
 */

include 'common.inc.php';

if (!isset($_REQUEST["cursos"])) {
    echo "Invalid request!";
    return;
}
$db = getDB();
$query = "UPDATE ch SET cursos='" . $_REQUEST["cursos"]. "' WHERE id=(SELECT currentid from static where id=1 LIMIT 1)";
$result = mysql_query($query);
mysql_free_result($result);
mysql_close($db);


?>