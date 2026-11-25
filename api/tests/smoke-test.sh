#!/usr/bin/env bash
# Teste de integração da API do Agendei (usa curl; precisa do banco com a migração aplicada
# e de 3 contas: admin, cliente e outro cliente, com a senha abaixo).
#   BASE=http://localhost/agendei/api ./smoke-test.sh
# ATENÇÃO: cria e apaga registros (agendamentos/serviços de teste). Use um banco de DESENVOLVIMENTO.
BASE=${BASE:-http://localhost/agendei/api}
PASS_=${PASS_:-senha1234}
ADMIN=${ADMIN:-admin@teste.com}; CLIENT=${CLIENT:-maria@teste.com}; OTHER=${OTHER:-outro@teste.com}
STORAGE=${STORAGE:-$(cd "$(dirname "$0")/../.." && pwd)/storage}
TMP=$(mktemp -d); ok=0; fail=0
j() { php -r '$d=json_decode(stream_get_contents(STDIN),true); $p=explode(".",$argv[1]); foreach($p as $k){ if(!is_array($d)||!array_key_exists($k,$d)){echo "";exit;} $d=$d[$k]; } echo is_scalar($d)?$d:json_encode($d);' "$1"; }
check() { # descricao esperado obtido
  if [ "$2" == "$3" ]; then ok=$((ok+1)); echo "  PASS  $1"; else fail=$((fail+1)); echo "  FAIL  $1 (esperado: '$2' obtido: '$3')"; fi; }
code() { curl -s -o "$TMP/body" -w "%{http_code}" "$@"; }
login() { curl -s -X POST "$BASE/users/$2" -d "email=$1&password=$PASS_" | j data.token; }
TA=$(login $ADMIN login-admin); TC=$(login $CLIENT login); TO=$(login $OTHER login)
HA="Authorization: Bearer $TA"; HC="Authorization: Bearer $TC"; HO="Authorization: Bearer $TO"

php -r '
 $mk=function($f,$w,$h,$fn){$i=imagecreatetruecolor($w,$h);imagefill($i,0,0,imagecolorallocate($i,200,80,120));$fn($i,$f);};
 $mk($argv[1]."/a.png",200,200,"imagepng"); $mk($argv[1]."/b.jpg",300,200,"imagejpeg"); $mk($argv[1]."/c.png",120,120,"imagepng");
 file_put_contents($argv[1]."/fake.png","<?php echo 1; ?>"); file_put_contents($argv[1]."/shell.php","<?php system(\$_GET[0]); ?>");
 file_put_contents($argv[1]."/big.png", str_repeat("A", 6*1024*1024));
 file_put_contents($argv[1]."/gif.png", base64_decode("R0lGODlhAQABAAAAACwAAAAAAQABAAA="));
' "$TMP"

echo "== Autenticação / permissões"
check "login cliente gera token" "1" "$([ -n "$TC" ] && echo 1)"
check "rota admin sem token -> 401" 401 "$(code $BASE/dashboard/admin)"
check "rota admin com token de cliente -> 401" 401 "$(code $BASE/dashboard/admin -H "$HC")"
check "dashboard admin com admin -> 200" 200 "$(code $BASE/dashboard/admin -H "$HA")"

echo "== Agendamentos"
D=$(date -d "+5 days" +%F); PAST=$(date -d "-2 days" +%F)
c=$(code -X POST $BASE/appointments/insert -H "$HC" -d "service_id=1&appointment_date=$D&appointment_time=10:00"); check "cria agendamento válido -> 201" 201 $c; AID=$(j data.id <"$TMP/body")
check "retorna nome do serviço" "Corte Feminino" "$(j data.service_name <"$TMP/body")"
check "duplicado (mesmo horário) -> 409" 409 "$(code -X POST $BASE/appointments/insert -H "$HC" -d "service_id=1&appointment_date=$D&appointment_time=10:00")"
check "sobreposto do mesmo cliente (10:30) -> 409" 409 "$(code -X POST $BASE/appointments/insert -H "$HC" -d "service_id=2&appointment_date=$D&appointment_time=10:30")"
check "outro cliente no horário lotado (1 profissional) -> 409" 409 "$(code -X POST $BASE/appointments/insert -H "$HO" -d "service_id=1&appointment_date=$D&appointment_time=10:00")"
check "data passada -> 400" 400 "$(code -X POST $BASE/appointments/insert -H "$HC" -d "service_id=1&appointment_date=$PAST&appointment_time=10:00")"
check "campos obrigatórios ausentes -> 400" 400 "$(code -X POST $BASE/appointments/insert -H "$HC" -d "service_id=1")"
check "serviço inexistente -> 400" 400 "$(code -X POST $BASE/appointments/insert -H "$HC" -d "service_id=9999&appointment_date=$D&appointment_time=11:00")"
check "fora do expediente (08:00) -> 409" 409 "$(code -X POST $BASE/appointments/insert -H "$HC" -d "service_id=1&appointment_date=$D&appointment_time=08:00")"
check "horário quebrado (10:10) -> 409" 409 "$(code -X POST $BASE/appointments/insert -H "$HC" -d "service_id=1&appointment_date=$D&appointment_time=11:10")"
check "sem token -> 401" 401 "$(code -X POST $BASE/appointments/insert -d "service_id=1&appointment_date=$D&appointment_time=12:00")"
code "$BASE/appointments/availability?service_id=1&date=$D" -H "$HC" >/dev/null
check "disponibilidade marca 10:00 como indisponível" "busy" "$(php -r '$d=json_decode(file_get_contents($argv[1]),true);foreach($d["data"]["slots"] as $s) if($s["time"]=="10:00") echo $s["available"]?"free":"busy";' $TMP/body)"
check "disponibilidade com data passada -> 400" 400 "$(code "$BASE/appointments/availability?service_id=1&date=$PAST" -H "$HC")"
c=$(code "$BASE/appointments/list" -H "$HC"); check "cliente lista os próprios -> 200" 200 $c
check "cliente só vê os próprios (outro cliente vê 0)" 0 "$(code "$BASE/appointments/list" -H "$HO" >/dev/null; php -r 'echo count(json_decode(file_get_contents($argv[1]),true)["data"]);' $TMP/body)"
check "outro cliente NÃO cancela agendamento alheio -> 404" 404 "$(code -X PUT $BASE/appointments/cancel/$AID -H "$HO")"
check "cliente NÃO usa rota admin de update -> 401" 401 "$(code -X PUT $BASE/appointments/$AID -H "$HC" -d "status=completed")"
check "admin filtra por status -> 200" 200 "$(code "$BASE/appointments/list?status=pending&client=maria" -H "$HA")"
check "admin: filtro retorna o agendamento" "1" "$(php -r 'echo count(json_decode(file_get_contents($argv[1]),true)["data"])>=1?1:0;' $TMP/body)"
check "admin filtro de status inválido -> 400" 400 "$(code "$BASE/appointments/list?status=xxx" -H "$HA")"
check "admin altera status -> 200" 200 "$(code -X PUT $BASE/appointments/$AID -H "$HA" -d "status=confirmed")"
check "admin status inválido -> 400" 400 "$(code -X PUT $BASE/appointments/$AID -H "$HA" -d "status=foo")"
check "cliente cancela o próprio -> 200" 200 "$(code -X PUT $BASE/appointments/cancel/$AID -H "$HC")"
check "cancelar de novo -> 409" 409 "$(code -X PUT $BASE/appointments/cancel/$AID -H "$HC")"
check "horário liberado após cancelamento (outro cliente agenda) -> 201" 201 "$(code -X POST $BASE/appointments/insert -H "$HO" -d "service_id=1&appointment_date=$D&appointment_time=10:00")"
OID=$(j data.id <"$TMP/body")
# cancelamento com menos de 2h de antecedência (inserido direto no banco)
SOON=$(mysql -N -uroot agendei -e "INSERT INTO appointments (user_id,service_id,appointment_time,appointment_date,status) SELECT id,1,'$(TZ=America/Sao_Paulo date -d '+30 minutes' +%H:%M:00)','$(TZ=America/Sao_Paulo date +%F)','confirmed' FROM users WHERE email='$CLIENT'; SELECT LAST_INSERT_ID();" 2>/dev/null)
[ -n "$SOON" ] && check "cancelar com <2h de antecedência -> 409" 409 "$(code -X PUT $BASE/appointments/cancel/$SOON -H "$HC")"

echo "== Perfil / foto do usuário"
check "foto sem token -> 401" 401 "$(code -X POST $BASE/users/photo -F photo=@$TMP/a.png)"
check "foto sem arquivo -> 400" 400 "$(code -X POST $BASE/users/photo -H "$HC")"
check "foto: arquivo PHP disfarçado de PNG -> 400" 400 "$(code -X POST $BASE/users/photo -H "$HC" -F "photo=@$TMP/fake.png;type=image/png")"
check "foto: shell.php -> 400" 400 "$(code -X POST $BASE/users/photo -H "$HC" -F "photo=@$TMP/shell.php;type=image/jpeg")"
check "foto: GIF renomeado .png -> 400" 400 "$(code -X POST $BASE/users/photo -H "$HC" -F "photo=@$TMP/gif.png;type=image/png")"
check "foto: arquivo > 2MB -> 400" 400 "$(code -X POST $BASE/users/photo -H "$HC" -F "photo=@$TMP/big.png;type=image/png")"
check "foto PNG válida -> 200" 200 "$(code -X POST $BASE/users/photo -H "$HC" -F "photo=@$TMP/a.png" -F "user_id=1")"
P1=$(j data.photo <"$TMP/body"); U1=$(j data.photo_url <"$TMP/body")
check "arquivo gravado em storage/" 1 "$([ -f "$STORAGE/$P1" ] && echo 1 || echo 0)"
check "caminho salvo é relativo" "uploads/users/" "${P1:0:14}"
check "URL pública da foto responde 200" 200 "$(code "$U1")"
check "/users/me devolve photo_url" "$U1" "$(code $BASE/users/me -H "$HC" >/dev/null; j data.photo_url <"$TMP/body")"
check "campo user_id do formulário é ignorado (outro usuário sem foto)" "null" "$(code $BASE/users/me -H "$HO" >/dev/null; j data.photo <"$TMP/body")"
check "troca de foto JPG -> 200" 200 "$(code -X POST $BASE/users/photo -H "$HC" -F "photo=@$TMP/b.jpg")"
P2=$(j data.photo <"$TMP/body")
check "foto anterior apagada do disco" 0 "$([ -f "$STORAGE/$P1" ] && echo 1 || echo 0)"
check "nova foto existe no disco" 1 "$([ -f "$STORAGE/$P2" ] && echo 1 || echo 0)"
check "banco guarda a nova foto" "$P2" "$(mysql -N -uroot agendei -e "select photo from users where email='$CLIENT'")"
echo '<?php echo "pwned";' > "$STORAGE/uploads/users/evil.php"
check "PHP em storage/ não executa (403/404)" 1 "$([ "$(code "http://localhost/agendei/storage/uploads/users/evil.php")" != 200 ] && echo 1 || echo 0)"; rm -f "$STORAGE/uploads/users/evil.php"
check "listagem do diretório bloqueada" 1 "$([ "$(code "http://localhost/agendei/storage/uploads/users/")" != 200 ] && echo 1 || echo 0)"
check "PUT /users/update altera nome -> 200" 200 "$(code -X PUT $BASE/users/update -H "$HC" -d "name=Maria+Souza+Lima&email=$CLIENT")"
check "nome persistido" "Maria Souza Lima" "$(code $BASE/users/me -H "$HC" >/dev/null; j data.name <"$TMP/body")"
check "e-mail duplicado -> 400" 400 "$(code -X PUT $BASE/users/update -H "$HC" -d "email=$OTHER")"
check "e-mail inválido -> 400" 400 "$(code -X PUT $BASE/users/update -H "$HC" -d "email=xx")"
check "update não altera foto (campo photo ignorado)" "$P2" "$(code -X PUT $BASE/users/update -H "$HC" -d "photo=../../etc/passwd" >/dev/null; mysql -N -uroot agendei -e "select photo from users where email='$CLIENT'")"
check "troca de senha com senha atual errada -> 400" 400 "$(code -X PUT $BASE/users/update-password -H "$HC" -d "current_password=errada&new_password=novasenha123")"

echo "== Usuários (admin)"
EM="novo$RANDOM@teste.com"
check "admin cria usuário -> 201" 201 "$(code -X POST $BASE/users/create -H "$HA" -d "name=Novo+Teste&email=$EM&password=12345678&type_id=2")"; NID=$(j data.id <"$TMP/body")
check "cliente NÃO cria usuário -> 401" 401 "$(code -X POST $BASE/users/create -H "$HC" -d "name=X&email=x$RANDOM@t.com&password=12345678&type_id=2")"
check "admin edita usuário -> 200" 200 "$(code -X PUT $BASE/users/manage/$NID -H "$HA" -d "name=Novo+Editado&email=$EM&type_id=3")"
check "admin consulta usuário -> 200" 200 "$(code $BASE/users/list/$NID -H "$HA")"
check "admin desativa usuário -> 200" 200 "$(code -X DELETE $BASE/users/$NID -H "$HA")"
check "usuário desativado não loga" 401 "$(code -X POST $BASE/users/login -d "email=$EM&password=12345678")"
check "admin reativa usuário -> 200" 200 "$(code -X PUT $BASE/users/manage/$NID -H "$HA" -d "name=Novo+Editado&email=$EM&type_id=3&active=1")"
ADMID=$(mysql -N -uroot agendei -e "select id from users where email='$ADMIN'")
check "admin NÃO desativa conta de admin -> 403" 403 "$(code -X DELETE $BASE/users/$ADMID -H "$HA")"
mysql -uroot agendei -e "delete from users where id=$NID"

echo "== Serviços e galeria"
check "admin cria serviço -> 201" 201 "$(code -X POST $BASE/services/insert -H "$HA" -d "services_type_id=1&name=Teste+Galeria&description=desc&duration=30&price=10")"; SID=$(j data.id <"$TMP/body")
check "listar galeria vazia -> 200 e lista vazia" "[]" "$(code $BASE/services/$SID/images >/dev/null; j data <"$TMP/body")"
check "upload sem token -> 401" 401 "$(code -X POST $BASE/services/$SID/images -F "images[]=@$TMP/a.png")"
check "upload com token de cliente -> 401" 401 "$(code -X POST $BASE/services/$SID/images -H "$HC" -F "images[]=@$TMP/a.png")"
check "upload sem arquivo -> 400" 400 "$(code -X POST $BASE/services/$SID/images -H "$HA")"
check "upload em serviço inexistente -> 404" 404 "$(code -X POST $BASE/services/99999/images -H "$HA" -F "images[]=@$TMP/a.png")"
check "upload de 2 imagens -> 201" 201 "$(code -X POST $BASE/services/$SID/images -H "$HA" -F "images[]=@$TMP/a.png" -F "images[]=@$TMP/b.jpg")"
check "2 imagens salvas" 2 "$(php -r 'echo count(json_decode(file_get_contents($argv[1]),true)["data"]["saved"]);' $TMP/body)"
IMG1=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["data"]["saved"][0]["id"];' $TMP/body)
IMG2=$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["data"]["saved"][1]["id"];' $TMP/body)
check "galeria lista 2 imagens" 2 "$(code $BASE/services/$SID/images >/dev/null; php -r 'echo count(json_decode(file_get_contents($argv[1]),true)["data"]);' $TMP/body)"
check "URL pública da imagem responde 200" 200 "$(code "$(php -r 'echo json_decode(file_get_contents($argv[1]),true)["data"][0]["image_url"];' $TMP/body)")"
check "adicionar 3ª imagem mantém as anteriores -> 201" 201 "$(code -X POST $BASE/services/$SID/images -H "$HA" -F "images[]=@$TMP/c.png")"
check "agora são 3" 3 "$(code $BASE/services/$SID/images >/dev/null; php -r 'echo count(json_decode(file_get_contents($argv[1]),true)["data"]);' $TMP/body)"
check "upload misto: válida + inválida -> 201 com 1 falha" "1/1" "$(code -X POST $BASE/services/$SID/images -H "$HA" -F "images[]=@$TMP/c.png" -F "images[]=@$TMP/fake.png;type=image/png" >/dev/null; php -r '$d=json_decode(file_get_contents($argv[1]),true)["data"]; echo count($d["saved"])."/".count($d["failed"]);' $TMP/body)"
check "upload só inválido -> 400" 400 "$(code -X POST $BASE/services/$SID/images -H "$HA" -F "images[]=@$TMP/fake.png;type=image/png")"
check "upload > 5MB -> 400" 400 "$(code -X POST $BASE/services/$SID/images -H "$HA" -F "images[]=@$TMP/big.png;type=image/png")"
PATH1=$(mysql -N -uroot agendei -e "select image_path from service_images where id=$IMG1")
SID2=$(mysql -N -uroot agendei -e "select id from services where id<>$SID order by id limit 1")
check "remover imagem usando OUTRO serviço -> 404" 404 "$(code -X DELETE $BASE/services/$SID2/images/$IMG1 -H "$HA")"
check "imagem continua no banco após tentativa inválida" 1 "$(mysql -N -uroot agendei -e "select count(*) from service_images where id=$IMG1")"
check "remover imagem sem token -> 401" 401 "$(code -X DELETE $BASE/services/$SID/images/$IMG1)"
check "remover imagem inexistente -> 404" 404 "$(code -X DELETE $BASE/services/$SID/images/999999 -H "$HA")"
check "remove só a imagem 1 -> 200" 200 "$(code -X DELETE $BASE/services/$SID/images/$IMG1 -H "$HA")"
check "arquivo da imagem 1 apagado do disco" 0 "$([ -f "$STORAGE/$PATH1" ] && echo 1 || echo 0)"
check "demais imagens continuam (3 restantes)" 3 "$(mysql -N -uroot agendei -e "select count(*) from service_images where service_id=$SID")"
check "imagem 2 ainda existe no disco" 1 "$([ -f "$STORAGE/$(mysql -N -uroot agendei -e "select image_path from service_images where id=$IMG2")" ] && echo 1 || echo 0)"
check "GET /services/list inclui cover_url" 1 "$(code $BASE/services/list >/dev/null; php -r '$d=json_decode(file_get_contents($argv[1]),true)["data"]; foreach($d as $s) if($s["id"]==$argv[2]) echo $s["cover_url"]?1:0;' $TMP/body $SID)"
check "GET /services/list/{id} inclui images" 3 "$(code $BASE/services/list/$SID >/dev/null; php -r 'echo count(json_decode(file_get_contents($argv[1]),true)["data"]["images"]);' $TMP/body)"
FILES=$(mysql -N -uroot agendei -e "select image_path from service_images where service_id=$SID")
check "excluir serviço sem token -> 401" 401 "$(code -X DELETE $BASE/services/delete/$SID)"
check "excluir serviço com agendamento -> 409" 409 "$(code -X DELETE $BASE/services/delete/1 -H "$HA")"
check "excluir serviço de teste -> 200" 200 "$(code -X DELETE $BASE/services/delete/$SID -H "$HA")"
gone=1; for f in $FILES; do [ -f "$STORAGE/$f" ] && gone=0; done
check "arquivos do serviço excluído removidos do disco" 1 $gone
check "registros de imagem removidos (cascade)" 0 "$(mysql -N -uroot agendei -e "select count(*) from service_images where service_id=$SID")"
check "excluir de novo -> 404" 404 "$(code -X DELETE $BASE/services/delete/$SID -H "$HA")"

echo "== Dashboard admin"
code $BASE/dashboard/admin -H "$HA" >/dev/null
for k in total_users total_services total_appointments appointments_today upcoming_appointments completed_appointments cancelled_appointments; do
  check "dashboard.counts.$k presente" 1 "$(j data.counts.$k <"$TMP/body" | grep -qE '^[0-9]+$' && echo 1 || echo 0)"; done

# limpeza dos agendamentos de teste
mysql -uroot agendei -e "delete from appointments where id in (${AID:-0},${OID:-0},${SOON:-0})" 2>/dev/null
rm -rf "$TMP"
echo; echo "RESULTADO: $ok passaram, $fail falharam"; [ $fail -eq 0 ]
