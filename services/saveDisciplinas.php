<?php
/**
 * Created by PhpStorm.
 * User: luigi
 * Date: 10/10/18
 * Time: 13:44
 */

include 'common.inc.php';

if (!isset($_REQUEST["disciplinas"])) {
    echo "Invalid request!";
    return;
}
$db = getDB();
$query = "UPDATE static SET disciplinas='" . $_REQUEST["disciplinas"]. "'";
$result = mysql_query($query);
mysql_free_result($result);
mysql_close($db);


?>