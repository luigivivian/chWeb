function DB() {
    this.jsonLoadPending = 0;

    this.save = function() {
        // Avoid saving deleted itens
        var d = [];
        for (var i in this.docencia){
            if (this.docencia[i]){
                d.push(this.docencia[i]);
            }
        }

        $.post("services/savejson.php", { docencia: JSON.stringify(d), atividades: JSON.stringify(this.atividades) }).success(function() { alert('Salvou!'); }).fail(function() { alert('Falhou!'); });
    }

    this.saveCurso = function() {
        //novo obj curso
        var nivel = util.getNivel();
        var nomeCurso = $('#nomeCurso').val();
        var deslocamento = $('#deslocamentoCurso').val();
        var campusCurso = $('#campusCurso').val();
        var n;
        var n = ['NULL','I', 'II', 'III', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
        var objCurso = {
            "campus": campusCurso,
            "deslocamento": deslocamento,
            "niveis": {
             //   "I": {"ccusto": 500, "turma": 10},
            //    "II": {"ccusto": 855, "turma": 120},
             //   "III": {"ccusto": 1500, "turma": 130}
            },
            "nome": nomeCurso
        }

        for (var i = 1; i <= nivel; i++){
            var nivelNome = n[i];
            objCurso.niveis[nivelNome] = {"ccusto": $("#custoN"+ i).val(), "turma": $("#turmaN"+ i).val()}
        }

        var nomeDoCurso = nomeCurso;
        this.cursos[nomeDoCurso] = objCurso;
        console.log(objCurso);

        $.post("services/saveCurso.php",{
            cursos: JSON.stringify(this.cursos)
        }).success(function() {
            alert("salvou");
        }).fail(function (){
            alert("falha ao salvar");
        });
    }


    this.loadJSON = function(names, onComplete) {
        for (var i in names) {
            var fileName = 'services/' + names[i];
            this.jsonLoadPending++;
            var self = this;
            $.getJSON(fileName).done(function(data) {
                $.extend(self, data);
                if (!--self.jsonLoadPending){
                    //console.log(data);
                    onComplete();
                }
            });
        }
    }

    this.saveDisciplina = function () {
        var nome = $('#nomeDisciplina').val();
        var eletiva = $('#eletivaDisciplina').is(":checked")
        var pos = $('#posDisciplina').is(":checked")
        var abrev = $('#abrevDisciplina').val();
        eletiva ? eletiva = 1 : eletiva = 0;
        pos ? pos = 1 : pos = 0;
            this.disciplinas[abrev] = {
            eletiva: eletiva,
            nome: nome,
            pos: pos
        }

         $.post("services/saveDisciplinas.php",{
             disciplinas: JSON.stringify(this.disciplinas)
         }).success(function() {
             alert("salvou");
         }).fail(function (){
             alert("falha ao salvar");
         });
    }

    this.teste = function() {
        this.docencia.push(
            {
                banca: "777777",
                cp: 0,
                ct: 8,
                curso: "CAC",
                disciplina: "TTT",
                grupo: "T",
                h: null,
                nivel: "I",
                obs: "",
                periodicidade: null,
                professor: null,
                q: null,
                sala: "420"
            }
        );
        var d = [];
        for (var i in this.docencia){
            if (this.docencia[i]){
                d.push(this.docencia[i]);
            }
        }
        console.log(d);
        console.log(this.docencia);
         $.post("services/saveDocencia.php",{
             docencia: JSON.stringify(d)
         }).success(function() {
             alert("salvou");
             console.log(d);
         }).fail(function (){
             alert("falha ao salvar");
         });
    }

}