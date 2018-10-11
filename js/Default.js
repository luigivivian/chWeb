
var db = new DB();
var util = new UTIL();
$(document).ready(function() {



    $('<table><tbody><tr></tr><tr></tr></tbody></table>').appendTo('td.h');
    $('table thead th').addClass('ui-widget-header');

    $('.repeater').height($(window).height() - 70);

    db.loadJSON(['getjson.php'], jsonLoaded);


    $('#clipboard').droppable({
        hoverClass: 'ui-state-highlight',
        drop: function(event, ui) {
            var i = $(event.toElement).attr('data-i');
            var dch = db.docencia[i];
            var profAnt = dch.professor;
            $(this).removeClass('fugue-clipboard-empty').addClass('fugue-clipboard');
            $(this).attr('data-i', i);
            dch.h = dch.professor = null;
            refresh(profAnt, dch.curso, dch.nivel);
        }
    }).addClass('fugue-clipboard-empty');
});

function jsonLoaded() {
    db.docencia.sort(ordena);

    //TESTANDO JSON para criar novo curso
    // myObj = {
    //     "campus":"cu",
    //     "deslocamento":30,
    //     "niveis": {
    //         "II": {"ccusto": 500, "turma": 999},
    //         "III": {"ccusto": 420, "turma": 450},
    //         "IV": {"ccusto": 660, "turma": 420}
    //     },
    //     "nome": "O Baguio é loco caraio"
    // }
    // //adicionando novo curso no json de cursos
    // db.cursos.CUSAO = myObj;


    console.log(db.cursos);
    var $list = $('#profSelect');
    $list.append(new Option('(Todos)', '0'));
    var vio = JSLINQ(Object.keys(db.professores)).OrderBy(function(o) { return (db.professores[o].noprint ? '|' /*para irem pro final*/ : '') + db.professores[o].nome }).ToArray();
    for (var i in vio) {
        var m = +vio[i];
        var prof = db.professores[m];
        $list.append(new Option(prof.nome, m));
        $('#profTemplate').clone(true).attr('id', 'p' + m).attr('matr', m).appendTo('#prof .repeater');
        prof.indisponibilidade = db.indisponibilidade[m];
        drawProfessor(m);
    }
    $('option:eq(1)', $list).attr('selected', 'selected');
    $list.chosen().change(professorSelecionado);
    //$('#disciplinadialog_prof').html($('#profSelect').html()); Ainda não está no dialogo

    $('#profTemplate').remove();

    $list = $('#cursoSelect');
    $list.append(new Option('(Todos)', '0'));
    for (var c in db.cursos) {
        var curso = db.cursos[c];
        $list.append(new Option(c, c));
        for (var n in curso.niveis) {
            $('#cursoTemplate').clone(true).attr('id', c + '_' + n).attr('data-curso', c).appendTo('#curso .repeater');
            drawCurso(c, n);
        }
    }
    $('option:eq(1)', $list).attr('selected', 'selected');
    $('#nivelSelect').chosen().change(showCursoNivel);
    $list.chosen().change(cursoSelecionado);
    $('#cursoTemplate').remove();

    // TO DO
    //$list = $('#disciplinadialog_disc');
    //for (var d in db.disciplinas) {
    //    $list.append(new Option(d + " - " + db.disciplinas[d].nome, d));
    //}
    setupEvents();

    $('#topo h1').text('Semestre ' + db.metadata.descr);
    professorSelecionado();
    cursoSelecionado();
    $('#splash').remove();
    $('#work').show();
}

// 4:'Todo o turno', -2:'Antes do intervalo', 2: 'Após o intervalo'
function configHorario(e, q) {
    var i = $(e.currentTarget).attr('data-i');
    var dc = db.docencia[i];
    if (q == 4)
        delete dc.q; // Default value. Save json space
    else
        dc.q = q;

    if (dc.professor) refresh(dc.professor, dc.curso, dc.nivel);
}

var descrPeriodicidade = { 'A': 'Todo o semestre', 'Q': 'Quinzenal', 'P': 'Primeiro Bimestre', 'S': 'Segundo Bimestre' };

function configPeriodicidade(e, p) {
    var i = $(e.currentTarget).attr('data-i');
    var dc = db.docencia[i];
    if (p == 'A')
        delete dc.periodicidade; // Default value. Save json space
    else
        dc.periodicidade = p;

    if (dc.professor) refresh(dc.professor, dc.curso, dc.nivel);
}


function professorSelecionado() {
    var matr = $('#profSelect').val();
    if (matr !== '0') {
        $('#prof .repeater').children().hide();
        $('#p' + matr).show();
    } else $('#prof .repeater').children().show();
}

function drawProfessor(matr) {
    var prof = db.professores[matr];

    prof.totais = { "DOC_GR": 0, "DOC_POS": 0, "DESLOC": 0, "TOTAL": 0 };
    var $profDiv = $('#p' + matr);
    if (prof.noprint) $profDiv.addClass('noprint');
    $('h2', $profDiv).text(prof.nome);
    $('.matrProf', $profDiv).text(matr);
    $('.foneProf', $profDiv).text(prof.cel || '');
    $('.mailProf', $profDiv).html(strFormat('<a href="{0}">{0}</a>', prof.mail));
    $('.ctpsProf', $profDiv).text(prof.ctps || '?');
    $('.horariosProfessorTable tbody tr td.h table tr', $profDiv).empty();
    var $discProfTbl = $('.disciplinasProfessorTable tbody', $profDiv).empty();
    var codLetra = 65;
    for (var d in prof.indisponibilidade)
        $('.horariosProfessorTable tbody tr td[data-h=' + prof.indisponibilidade[d] + ']', $profDiv).addClass('indisp');

    for (var d in db.docencia) {
        var chDisc = db.docencia[d];
        if (chDisc.professor == matr) {
            var letra = String.fromCharCode(codLetra++);
            if (codLetra == 91) codLetra = 97;

            var o = detalhesDiscProf(chDisc);
            var s = strFormat('<tr data-i="{0}"><td>{1}</td><td>{2}</td><td>{3}</td><td>{4}</td><td>{5}</td><td>{6}</td><td>{7}</td><td>{8}</td></tr>', d, letra, o.nomedisc, o.grupo, o.banca, o.tp, o.ncurso, o.nivel, o.obs);
            $(s).appendTo($discProfTbl).addClass((chDisc.compartilhamento && o.eletiva) ? "noprint" : "");

            var tp = 0;
            if (!chDisc.compartilhamento) tp = chDisc.ct + chDisc.cp;
            prof.totais['TOTAL'] += tp;
            if (o.detalheDisc.pos)
                prof.totais['DOC_POS'] += tp;
            else
                prof.totais['DOC_GR'] += tp;
            prof.totais['DESLOC'] += arredonda(tp * prof.desloc * db.cursos[chDisc.curso].deslocamento * o.presencialidade);
            if (chDisc.h) {
                var rs = (chDisc.q === 2) ? ':not(:first-child)' : ':first-child';
                var $newtd = $(formatTD(d, letra, chDisc)).addClass((chDisc.compartilhamento && o.eletiva) ? "noprint" : "");
                $('.horariosProfessorTable tbody tr td[data-h=' + chDisc.h + '] table tr' + rs, $profDiv).append($newtd).parent().addClass("dirty");
            }
        }
    }
    // $('.horariosProfessorTable tbody tr td.h table tr:empty', $profDiv).append('<td></td>');
    $('.horariosProfessorTable tbody tr td[data-h] table tbody.dirty', $profDiv).each(function() { ajustaColspan($(this)) });

    drawAtividadesProfessor($profDiv, matr);
}

function ajustaColspan($t) {
    var $rows = $t.removeClass('dirty').children();
    var ntoda = $('td[rowspan]', $rows[0]).size();
    var nantes = $rows[0].cells.length - ntoda;
    var ndepois = $rows[1].cells.length;
    var p = nantes * ndepois;
    if (!p) return;
    var cs = p / nantes;
    if (cs > 1) $('td', $rows[0]).attr('colspan', cs);
    //   $('td', $rows[0]).html("<pre> ntoda:" + ntoda + " nantes:" +nantes + " ndepois:" + ndepois + " cs:" + cs +"</pre>");
    cs = p / ndepois;
    if (cs > 1) $('td', $rows[1]).attr('colspan', cs);
    //   $('td', $rows[1]).html("<pre> ntoda:" + ntoda + " nantes:" +nantes + " ndepois:" + ndepois + " cs:" + cs +"</pre>");
}

// Adaptado de http://rosettacode.org/wiki/Least_common_multiple
function mmc(m, n) {
    var lcm = (n == m || n == 1) ? m : (m == 1 ? n : 0);
    if (lcm == 0) {
        var mm = m,
            nn = n;
        while (mm != nn) {
            while (mm < nn) { mm += m; }
            while (nn < mm) { nn += n; }
        }
        lcm = mm;
    }
    return lcm;
}

function detalhesDiscProf(chDisc) {
    var o = {};
    o.detalheDisc = db.disciplinas[chDisc.disciplina];
    o.presencialidade = chDisc.sp ? 1 - chDisc.sp : 1;
    o.eletiva = o.detalheDisc.eletiva;
    o.obs = (chDisc.obs || '') + ((chDisc.periodicidade && chDisc.periodicidade != 'A') ? ' ' + descrPeriodicidade[chDisc.periodicidade] : '') + ((o.presencialidade != 1) ? ' ' + (chDisc.sp * 100) + '% EAD' : '');
    o.nomedisc = chDisc.disciplina + "-" + o.detalheDisc.nome + (o.eletiva ? ' <b>(ELETIVA)</b>' : '');
    o.tp = ((chDisc.ct) ? chDisc.ct + 'T' : '') + ((chDisc.cp) ? chDisc.cp + 'P' : '');
    o.ncurso = chDisc.curso + ' (' + db.cursos[chDisc.curso].niveis[chDisc.nivel].ccusto + ')';
    o.grupo = chDisc.grupo;
    o.banca = chDisc.banca || '';
    o.nivel = chDisc.nivel;
    o.nomeProf = chDisc.professor ? db.professores[chDisc.professor].nome : '';
    return o;
}

var ativTipoDescr = {
    "DOC_GR": "docência graduação",
    "ORI_P_G": "orientação graduação",
    "ORI_T_G": "Não usado",
    "DOC_POS": "docência strito sensu",
    "ORI_P_P": "orientação strito sensu",
    "ORI_T_P": "Não usado",
    "PES": "pesquisa",
    "EXT": "extensão",
    "ACA": "acadêmica",
    "DESLOC": "deslocamento",
    "ADM": "administrativo"
};

function drawAtividadesProfessor($profDiv, matr) {
    var prof = db.professores[matr];
    var ativs = db.atividades[matr];
    var $tb = $('.atividadesProfessorTable', $profDiv);

    $tb.show();
    $('em.diagona-new', $tb).off("click").on("click", function() { showAtivDialog(matr); });
    var $body = $tb.children('tbody').empty();

    prof.totais['TOTDOCENCIA'] = prof.totais['TOTAL'];
    prof.totais['TOTAL'] += prof.totais['DESLOC'];
    if (!ativs || ativs.length == 0)
        $('<tr><td colspan="5" style="text-align: center;">Nenhuma atividade cadastrada</td></tr>').appendTo($body);
    else
        for (var i in ativs) {
            var ich = ativs[i].ch;
            $(strFormat('<tr><td><em class="diagona10px diagona-edit" onclick="showAtivDialog({4}, {5});" title="Editar"></em><em class="diagona10px diagona-delete" onclick="deleteAtiv({4}, {5});" title="Excluir"></em></td><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td></tr>', ativs[i].ccusto, ativs[i].descricao + ((ativs[i].tipo) ? " (" + ativTipoDescr[ativs[i].tipo] + ")" : ""), ativs[i].aprov, ativs[i].ch, matr, i)).appendTo($body);
            prof.totais['TOTAL'] += ich;

            if (ativs[i].tipo) {
                prof.totais[ativs[i].tipo] = (prof.totais[ativs[i].tipo] || 0) + ich;
                if (ativs[i].tipo === "DOC_GR" || ativs[i].tipo === "DOC_POS" || ativs[i].tipo === "ORI_P_G" || ativs[i].tipo === "ORI_P_P")
                    prof.totais['TOTDOCENCIA'] += ich;
            }
        }

    for (var t in prof.totais) {
        if (ativTipoDescr[t] && +prof.totais[t] > 0)
            $(strFormat('<tr><td colspan="4">{0}</td><td>{1}</td></tr>', 'Total ' + ativTipoDescr[t], prof.totais[t])).appendTo($body);
    }

    $('.ativDocencia', $profDiv).text(prof.totais['TOTDOCENCIA']);
    $('.ativTotal', $profDiv).text(prof.totais['TOTAL']);
    $('.ativCTPS', $profDiv).text(prof.ctps);
    var dif = arredonda(prof.totais['TOTAL'] - prof.ctps);
    $('.ativDif', $profDiv).text(dif).css('background-color', (dif === 0) ? '' : '#FFBEAE');
}

function deleteAtiv(matr, i) {
    if (confirm('Excluir esta atividade?\nEsta ação não poderá ser revertida!')) {
        db.atividades[matr].splice(i, 1);
        if (db.atividades[matr].length === 0) {
            delete db.atividades[matr];
        }
        drawProfessor(matr);
    }
}

function showAtivDialog(matr, i) {
    var ativ = {};
    if (typeof i === 'undefined') { // add new
        $('#ativdialog_op').val('N');
        $('#ativdialog_ccusto').val('');
        $('#ativdialog_ativ').val('');
        $('#ativdialog_chdistr').val('');
        $('#ativdialog_chaprov').val('');
        $('#ativdialog_tipo').val(0);
    } else { // edit
        $('#ativdialog_op').val('E');
        ativ = db.atividades[matr][i];
        $('#ativdialog_ccusto').val(ativ.ccusto);
        $('#ativdialog_ativ').val(ativ.descricao);
        $('#ativdialog_chdistr').val(ativ.ch);
        $('#ativdialog_chaprov').val(ativ.aprov);
        $('#ativdialog_tipo').val(ativ.tipo);
    }

    $("#ativdialog").dialog({
        modal: true,
        draggable: true,
        resizable: false,
        position: { my: "center", at: "center", of: window },
        width: 600,
        title: (typeof(i) !== 'undefined') ? "Editar atividade" : "Nova Atividade",
        buttons: [{
                type: "submit",
                form: "ativform",
                text: "Salvar",
                click: $.noop
            },
            {
                text: "Cancelar",
                click: function() {
                    $(this).dialog("close");
                }
            }
        ]
    });

    $("#ativform").one('submit', function() {
        ativ.ccusto = $('#ativdialog_ccusto').val() || '';
        ativ.descricao = tiraAcentos($('#ativdialog_ativ').val());
        ativ.ch = +$('#ativdialog_chdistr').val();
        ativ.aprov = $('#ativdialog_chaprov').val();
        ativ.tipo = $('#ativdialog_tipo').val();
        if ($('#ativdialog_op').val() === 'N') { // add new    
            if (!db.atividades[matr]) { // first
                db.atividades[matr] = [ativ];
            } else
                db.atividades[matr].push(ativ);
        }

        $("#ativdialog").dialog("close");
        drawProfessor(matr);
    });
}


function showDiscDialog(i) {
    var chDisc = {};
    if (typeof i === 'undefined') { // add new
        $('#disciplinadialog_grupo').val('');
        $('#disciplinadialog_banca').val('');
        $('#disciplinadialog_ct').val('');
        $('#disciplinadialog_cp').val('');
        $('#disciplinadialog_sp').val(0);

        $('#disciplinadialog_sala').val('');
        $('#disciplinadialog_obs').val('');
        $('#disciplinadialog_compartilhamento').prop('checked', false);
    } else { // edit
        chDisc = db.docencia[i];
        $('#disciplinadialog_grupo').val(chDisc.grupo);
        $('#disciplinadialog_banca').val(chDisc.banca);
        $('#disciplinadialog_ct').val(chDisc.ct);
        $('#disciplinadialog_cp').val(chDisc.cp);
        $('#disciplinadialog_sp').val(!!chDisc.sp ? chDisc.sp : 0.0);

        $('#disciplinadialog_sala').val(chDisc.sala);
        $('#disciplinadialog_obs').val(chDisc.obs);
        $('#disciplinadialog_compartilhamento').prop('checked', !!chDisc.compartilhamento);
    }

    $("#disciplinadialog").dialog({
        modal: true,
        draggable: true,
        resizable: false,
        position: { my: "center", at: "center", of: window },
        width: 800,
        title: "Dados da disciplina   #" + i,
        buttons: [
            //{
            //    type: "submit",
            //    form: "ativform",
            //    text: "Inserir cópia",
            //    click: $.noop
            //},
            {
                type: "submit",
                form: "disciplinaform",
                text: "Salvar",
                click: $.noop
            },
            {
                text: "Cancelar",
                click: function() {
                    $(this).dialog("close");
                }
            }
        ]
    });

    $("#disciplinaform").one('submit', function() {
        chDisc.grupo = $('#disciplinadialog_grupo').val();
        chDisc.banca = $('#disciplinadialog_banca').val();
        chDisc.ct = +$('#disciplinadialog_ct').val();
        chDisc.cp = +$('#disciplinadialog_cp').val();
        if ($('#disciplinadialog_sp').val() > 0) chDisc.sp = +$('#disciplinadialog_sp').val();
        else delete chDisc.sp;

        chDisc.sala = tiraAcentos($('#disciplinadialog_sala').val());
        chDisc.obs = tiraAcentos($('#disciplinadialog_obs').val());
        if ($('#disciplinadialog_compartilhamento').is(':checked')) chDisc.compartilhamento = 1;
        else delete chDisc.compartilhamento;

        $("#disciplinadialog").dialog("close");
        refresh(chDisc.professor, chDisc.curso, chDisc.nivel);
    });
}

function cursoSelecionado() {
    var $nlist = $('#nivelSelect').html('');
    var cod = $('#cursoSelect').val();
    $nlist.append(new Option('(Todos)', '0'));

    if (cod !== '0') {
        var niveis = db.cursos[cod].niveis;
        for (var n in niveis) {
            $nlist.append(new Option(n + ' (' + niveis[n].ccusto + ')', n));
        }
        $('option:eq(1)', $nlist).attr('selected', 'selected');
        showCursoNivel();
    } else $('#curso .repeater').children().show();

    $nlist.trigger('liszt:updated');
}

function showCursoNivel() {
    var curso = $('#cursoSelect').val();
    var nivel = $('#nivelSelect').val();
    var e = '#' + curso + '_' + nivel;
    if (curso !== '0' && nivel === '0') e = '#curso .repeater [data-curso=' + curso + ']';
    $('#curso .repeater').children().hide();
    $(e).show();
}

function drawCurso(cod, nivel) {
    var curso = db.cursos[cod];
    var $cursoNivelDiv = $('#' + cod + '_' + nivel);
    $('h2', $cursoNivelDiv).text(curso.nome);
    $('.campusCurso', $cursoNivelDiv).text(curso.campus);
    $('.nivelCurso', $cursoNivelDiv).text(nivel);
    $('.turmaCurso', $cursoNivelDiv).text(curso.niveis[nivel].turma);
    $('.ccustoCurso', $cursoNivelDiv).text(curso.niveis[nivel].ccusto);
    $('.horariosCursoTable tbody tr td.h table tr', $cursoNivelDiv).empty();

    var $discCursoTbl = $('.disciplinasCursoTable tbody', $cursoNivelDiv).empty();
    var codLetra = 65;
    for (var d in db.docencia) {

        var chDisc = db.docencia[d];
        if (chDisc.curso == cod && chDisc.nivel == nivel) {
            var letra = String.fromCharCode(codLetra++);
            if (codLetra == 91) codLetra = 97;

            var o = detalhesDiscProf(chDisc);
            var s = strFormat('<tr data-i="{0}" {1}><td><em class="diagona10px diagona-edit" onclick="showDiscDialog({0});" title="Editar"></em><em class="diagona10px diagona-delete" onclick="alert(\'Coming soon...\');"" title="Excluir" style="display:none;"></em></td><td>{2}</td><td>{3}</td><td>{4}</td><td>{5}</td><td>{6}</td><td>{7}</td><td>{8}</td></tr>', d, o.nomeProf === '' ? 'class="indef"' : '', letra, o.nomedisc, o.grupo, o.banca, o.tp, o.nomeProf, o.obs);

            $(s).appendTo($discCursoTbl);
            if (chDisc.h) {
                var rs = ':first-child';
                if (chDisc.q === 2) rs = ':not(:first-child)';
                $('.horariosCursoTable tbody tr td[data-h=' + chDisc.h + '] table tr' + rs, $cursoNivelDiv).append(formatTD(d, letra, chDisc)).parent().addClass("dirty");;
            }
        }
    }
    $('.horariosCursoTable tbody tr td[data-h] table tbody.dirty', $cursoNivelDiv).each(function() { ajustaColspan($(this)) });
}

function formatTD(i, letra, chDisc) {
    return strFormat('<td {3}><div class="alocado" data-i="{0}"><b>{1}</b><ins>&nbsp;{2}&nbsp;</ins></div></td>', i, letra, ((chDisc.lci) ? 'LCI' : '') + (chDisc.sala || ''), (!chDisc.q || chDisc.q === 4) ? 'rowspan="2"' : '');
}

var contextMenuitems = [{
        label: 'Todo o turno',
        icon: 'fugue-application-dock-180',
        action: function(e) { configHorario(e, 4) }
    },
    {
        label: 'Antes do intervalo',
        icon: 'fugue-application-dock-090',
        action: function(e) { configHorario(e, -2) }
    },
    {
        label: 'Após o intervalo',
        icon: 'fugue-application-dock-270',
        action: function(e) { configHorario(e, 2) }
    },
    null, // divider
    {
        label: 'Todo o semestre',
        icon: 'fugue-calendar-select-month',
        action: function(e) { configPeriodicidade(e, 'A') }
    },
    {
        label: 'Quinzenal',
        icon: 'fugue-calendar-select-days',
        action: function(e) { configPeriodicidade(e, 'Q') }
    },
    {
        label: 'Primeiro Bimestre',
        icon: 'fugue-calendar-previous',
        action: function(e) { configPeriodicidade(e, 'P') }
    },
    {
        label: 'Segundo Bimestre',
        icon: 'fugue-calendar-next ',
        action: function(e) { configPeriodicidade(e, 'S') }
    },
    null,
    {
        label: 'Editar',
        icon: 'fugue-pencil',
        action: function(e) {
            var i = $(e.currentTarget).attr('data-i');
            showDiscDialog(i);
        }
    },
    {
        label: 'Excluir',
        icon: 'fugue-minus-circle',
        action: function(e) {
            if (confirm('Excluir este horario?')) {
                var i = $(e.currentTarget).attr('data-i');
                var dch = db.docencia[i];
                var profAnt = dch.professor;
                dch.h = dch.q = dch.periodicidade = dch.professor = null;
                refresh(profAnt, dch.curso, dch.nivel);
            }
        }
    }
];


function setupEvents($c, $p) {
    if (typeof $c === 'undefined') $c = $('#curso .repeater');
    if (typeof $p === 'undefined') $p = $('#prof .repeater');

    var dragInfo = {
        appendTo: 'body',
        cursor: 'move',
        cursorAt: { left: 40, top: 12 },
        helper: function(event) {
            var i = this.attributes['data-i'].value;
            return $(strFormat('<div class="ui-widget-content drag" data-i="{0}">{1} ({2})</div>', i, db.docencia[i].disciplina, db.docencia[i].grupo));
        },
        revert: 'invalid'
    };

    $('.disciplinasCursoTable tr', $c).draggable(dragInfo);

    $('.horariosCursoTable tr div[data-i]', $c).on('mousedown', function(event) {
        if (event.which != 1) return;
        var i = $(this).attr('data-i');
        var $sel = $('#profSelect');
        if ($sel.val() != db.docencia[i].professor) {
            $sel.val(db.docencia[i].professor);
            $sel.trigger('liszt:updated');
            professorSelecionado();
        }
        blink(i);
    });

    $('.horariosProfessorTable tr div[data-i]', $p).on('mousedown', function(event) {
        if (event.which != 1) return;
        var i = $(this).attr('data-i');
        var $csel = $('#cursoSelect');
        var $nsel = $('#nivelSelect');
        var flag = 0;
        if ($csel.val() != db.docencia[i].curso) {
            $csel.val(db.docencia[i].curso);
            $csel.trigger('liszt:updated');
            cursoSelecionado();
            flag = 1;
        }
        if ($nsel.val() != db.docencia[i].nivel) {
            $nsel.val(db.docencia[i].nivel);
            $nsel.trigger('liszt:updated');
            flag = 1;
        }
        if (flag) showCursoNivel();
        blink(i);
    });

    $('#clipboard').draggable(dragInfo);

    $('.horariosProfessorTable .alocado', $p).draggable(dragInfo).contextPopup({
        title: 'Horário',
        items: contextMenuitems
    });

    $('.horariosProfessorTable td.h:not(.indisp)', $p).droppable({
        hoverClass: 'ui-state-highlight',
        drop: function(event, ui) {
            var i = $(event.toElement).attr('data-i');
            if (i == $('#clipboard').attr('data-i')) {
                $('#clipboard').addClass('fugue-clipboard-empty').removeClass('fugue-clipboard');
                $('#clipboard').attr('data-i', '');
            }

            var dch = db.docencia[i];
            dch.h = $(this).attr('data-h');
            var oldProf = dch.professor;
            dch.professor = $(this).parent().parent().parent().parent().attr('matr');
            if (oldProf == dch.professor) oldProf = null; // para não atualizar duas vezes na função
            refresh(dch.professor, dch.curso, dch.nivel, oldProf);
        }
    });
}

function scrollTo(p, id) {
    var $e = $(p + ' .repeater').scrollTop(0);
    var t = $(id).offset().top - 70;
    $e.animate({ scrollTop: t }, 'fast');
}

function toggle(p1, p2, _this) {
    $(_this).toggleClass('fugue-application-split');
    if ($(p2).is(':visible')) {
        $(p2).hide();
        $(p1).css('width', '100%');
    } else {
        $(p2).show();
        $(p1).css('width', '');
    }
}

function blink(i) {
    $('[data-i=' + i + ']').animate({ opacity: 0.1 }, 100)
        .animate({ opacity: 1 }, 100)
        .animate({ opacity: 0.1 }, 100)
        .animate({ opacity: 1 }, 100);
}

function arredonda(n) {
    return Math.round(n * 10) / 10;
}

var nt = { 'm': '0', 't': '1', 'n': '2' };

function ordena(a, b) {
    // Primeiro por dia/turno
    var ah = a.h || '9n';
    var bh = b.h || '9n';
    ah = ah.replace(ah[1], nt[ah[1]]);
    bh = bh.replace(bh[1], nt[bh[1]]);
    if (ah > bh) return 1;
    if (ah < bh) return -1;

    // Por horário no turno
    var aq = a.q || -4;
    if (aq == 4) aq = -4;
    var bq = b.q || -4;
    if (bq == 4) bq = -4;
    if (aq > bq) return 1;
    if (aq < bq) return -1;

    // Por horário no turno
    var at = a.periodicidade || 'A';
    var bt = b.periodicidade || 'A';
    if (at > bt) return 1;
    if (at < bt) return -1;

    //Eletivas por último
    if ((db.disciplinas[a.disciplina].eletiva || 0) > (db.disciplinas[b.disciplina].eletiva || 0)) return 1;
    if ((db.disciplinas[a.disciplina].eletiva || 0) < (db.disciplinas[b.disciplina].eletiva || 0)) return -1;

    // Disciplina
    if (a.disciplina > b.disciplina) return 1;
    if (a.disciplina < b.disciplina) return -1;

    // Grupo
    if (a.grupo > b.grupo) return 1;
    if (a.grupo < b.grupo) return -1;

    return 0;
}

function refresh(prof, curso, nivel, oldProf) {
    setTimeout(function() {
        if (oldProf) drawProfessor(oldProf);
        if (prof) drawProfessor(prof);
        if (curso) drawCurso(curso, nivel);
        setupEvents($('#' + curso + '_' + nivel), $('#p' + prof));
    }, 100);
}

function skipOption(select, backward) {
    var $s = $(select);
    var val;
    if (backward)
        val = $('option:selected', $s).prev('option').val();
    else
        val = $('option:selected', $s).next('option').val();

    if (val && val !== "0")
        $s.val(val).change().trigger('liszt:updated');
}

// Adaptado de http:/ / www.ogenial.com.br / javascript - funcao - remover - acentos
function tiraAcentos(texto) {
    var chrEspeciais = "áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ";
    var chrNormais = "aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC";
    for (var i = 0; i < chrEspeciais.length; i++)
        texto = texto.replace(chrEspeciais[i], chrNormais[i]);

    return texto;
}


///////////
function propstr(v) {
    return (typeof(v) == "number") ? v.toLocaleString() : v;
}

function exportaobj(tab) {
    // List all attributes
    var keys = [];
    for (var o in tab) {
        var obj = tab[o];
        for (var key in obj)
            if (obj.hasOwnProperty(key) && keys.indexOf(key) === -1) keys.push(key);
    }
    // Output header row (collumn names)
    var s = 'key\t';
    for (var i in keys)
        s += (keys[i] + '\t');
    s += '\n';

    // Output table data
    for (var o in tab) {
        var obj = tab[o];
        s += (o + '\t');
        for (var i in keys)
            s += (obj.hasOwnProperty(keys[i]) ? propstr(obj[keys[i]]) : 'null') + '\t';
        s += '\n';
    }
    return s
}

function exportatab(tab) {
    // List all attributes
    var keys = [];
    for (var o in tab) {
        var obj = tab[o];
        for (var key in obj)
            if (obj.hasOwnProperty(key) && keys.indexOf(key) === -1) keys.push(key);
    }
    // Output header row (collumn names)
    var s = '';
    for (var i in keys)
        s += (keys[i] + '\t');
    s += '\n';

    // Output table data
    for (var o in tab) {
        var obj = tab[o];
        for (var i in keys)
            s += (obj.hasOwnProperty(keys[i]) ? propstr(obj[keys[i]]) : 'null') + '\t';
        s += '\n';

    }
    return s
}

function exportaPPCHD() {
    // List all attributes
    var keys = Object.getOwnPropertyNames(ativTipoDescr);

    // Output header row (collumn names)
    var s = 'professor\t';
    for (var i in keys)
        s += (keys[i] + '\t');
    s += '\n';

    // Output table data
    var vio = JSLINQ(Object.keys(db.professores)).Where(function(o) { return !db.professores[o].noprint }).OrderBy(function(o) { return db.professores[o].nome }).ToArray();
    for (var i in vio) {
        var pk = +vio[i];
        var p = db.professores[pk];
        if (p.noprint) continue;
        var t = p.totais;
        s += p.nome + '\t';
        for (var i in keys)
            s += (!!t && t.hasOwnProperty(keys[i]) ? propstr(t[keys[i]]) : '0') + '\t';
        s += '\n';
    }
    alert('Copie o conteúdo e recarregue a página');
    return s;
}

// From: http://jsfiddle.net/joquery/9KYaQ/
function strFormat() {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];

    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }

    return theString;
}